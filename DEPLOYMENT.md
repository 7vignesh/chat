# Deploying the Chat App to AWS — Free Tier ($0) Manual Runbook

This guide deploys the app on a **single EC2 instance** running Node (served behind
Nginx), using **MongoDB Atlas** (free tier) and **Cloudinary** (free tier). It costs
**$0** within the AWS Free Tier (first 12 months) and uses a **free DuckDNS domain**
so we can still get real HTTPS — no paid domain or Route 53 required.

> The app is wired for **same-origin** deployment: the backend serves the React build,
> so the browser, API, and WebSocket all share one domain. That keeps cookies and CORS simple.

---

## Cost summary (how this stays at $0)

| Component | Choice | Cost |
|-----------|--------|------|
| Compute | EC2 `t2.micro` or `t3.micro` (free tier: 750 hrs/month) | $0* |
| Storage | EBS gp3, keep <= 30 GB (free tier: 30 GB) | $0* |
| Public IP | Use the instance's auto-assigned public IP, **not** an Elastic IP | $0** |
| Database | MongoDB Atlas M0 shared cluster | $0 |
| Images | Cloudinary free tier | $0 |
| DNS + HTTPS | DuckDNS (free subdomain) + Let's Encrypt | $0 |

\* Free for the first 12 months, one instance only. Stop/terminate before the 12 months end.
\** A *running* instance's public IP is free. An **Elastic IP is billed when not attached**,
   so we skip it. Trade-off: the public IP changes if you stop/start the instance — just
   update the DuckDNS record when it does.

> Set a **Billing alarm** (Step 9) so you're emailed if anything ever exceeds $0.

---

## Prerequisites

1. **MongoDB Atlas** free cluster — copy the `mongodb+srv://...` connection string.
2. **Cloudinary** account — cloud name, API key, API secret.
3. **AWS account** with an IAM admin user + AWS CLI configured (`aws configure`).
4. A **DuckDNS** account (sign in with GitHub/Google at https://www.duckdns.org) — create
   a free subdomain like `mychatapp.duckdns.org` and note your DuckDNS **token**.
5. A strong JWT secret:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

---

## Step 1 — IAM (don't use root)

1. AWS Console → IAM → Users → create user `admin` with **AdministratorAccess**.
2. Create an access key (CLI) and run `aws configure` locally.
3. Enable MFA on root and on `admin`.
4. Verify: `aws sts get-caller-identity`

---

## Step 2 — Networking

For learning you can build a custom VPC, but the **default VPC** is free and works fine.
Either way you need a **security group**:

EC2 → Security Groups → Create `chat-sg`:
- Inbound:
  - SSH (22) — source **My IP** only
  - HTTP (80) — source `0.0.0.0/0`
  - HTTPS (443) — source `0.0.0.0/0`
- Outbound: leave default (all) — needed to reach Atlas and Cloudinary.

> Do **not** open port 5001. Node stays internal; only Nginx is public.

---

## Step 3 — Launch EC2 (free tier)

EC2 → Launch instance:
- Name: `chat-server`
- AMI: **Amazon Linux 2023**
- Instance type: **t2.micro** or **t3.micro** (whichever shows "Free tier eligible")
- Key pair: create `chat-key`, download the `.pem`
- Network: default VPC, **enable auto-assign public IP**, security group `chat-sg`
- Storage: 8–20 GiB gp3 (stay under 30 GB total)
- Launch.

Note the instance's **public IPv4 address** (we are intentionally not using an Elastic IP).

---

## Step 4 — Connect via SSH

Windows PowerShell:
```powershell
icacls "chat-key.pem" /inheritance:r
icacls "chat-key.pem" /grant:r "$($env:USERNAME):(R)"
ssh -i "chat-key.pem" ec2-user@<public-ip>
```

---

## Step 5 — Provision + deploy the app

```bash
# clone
cd /home/ec2-user
git clone <your-repo-url> chat
cd chat

# one-time provisioning (installs node, nginx, pm2, swap)
bash deploy/setup.sh

# backend env
cp backend/.env.example backend/.env
nano backend/.env        # fill in real values (see below), then chmod 600
chmod 600 backend/.env

# install + build
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix frontend

# start with PM2
pm2 start ecosystem.config.cjs
pm2 startup       # run the sudo command it prints
pm2 save

# verify Node is up before wiring nginx
curl http://localhost:5001/api/health
```

`backend/.env` should contain:
```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/chat
JWT_SECRET=<your generated secret>
CLIENT_URL=https://YOUR_SUBDOMAIN.duckdns.org
COOKIE_SAMESITE=strict
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## Step 6 — DuckDNS (free domain)

1. At https://www.duckdns.org create a subdomain, e.g. `mychatapp`.
2. Point it at your EC2 **public IP** (paste the IP into the DuckDNS "current ip" box and Update).
3. (Recommended) Auto-update the IP from the instance so it self-heals after a stop/start:
   ```bash
   mkdir -p ~/duckdns
   echo 'echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -' > ~/duckdns/duck.sh
   chmod 700 ~/duckdns/duck.sh
   ( crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1" ) | crontab -
   ~/duckdns/duck.sh && cat ~/duckdns/duck.log   # should print "OK"
   ```

---

## Step 7 — Nginx reverse proxy

```bash
# edit the provided config to use your DuckDNS domain
sed -i 's/YOUR_SUBDOMAIN.duckdns.org/mychatapp.duckdns.org/g' deploy/nginx.conf
sudo cp deploy/nginx.conf /etc/nginx/conf.d/chat.conf
sudo nginx -t
sudo systemctl enable --now nginx
```
Now `http://mychatapp.duckdns.org` should serve the app.

---

## Step 8 — Free HTTPS (Let's Encrypt)

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mychatapp.duckdns.org
sudo certbot renew --dry-run     # confirm auto-renewal works
```
Certbot adds the 443 server block automatically. Visit
`https://mychatapp.duckdns.org`, sign up, send a message, refresh — the session should
persist (confirms the `trust proxy` + secure-cookie config is working end to end).

---

## Step 9 — Billing alarm (stay at $0)

1. Root account → Billing → enable "Receive Billing Alerts".
2. CloudWatch (region **us-east-1**) → Alarms → Create alarm → metric
   **Billing → Total Estimated Charge** → threshold **> $0.50** → notify your email (SNS).

This emails you the moment anything starts costing money.

---

## Step 10 — Lock down Atlas

MongoDB Atlas → Network Access → remove `0.0.0.0/0`, add only your EC2 public IP.
(If the IP changes after a stop/start, update this entry too.)

---

## Updating the app later

```bash
cd /home/ec2-user/chat
bash deploy/update.sh
```

---

## Operational notes

- **Single instance**: this is a single point of failure, and Socket.io's online-user map
  is in-memory. Fine for learning. Scaling out needs a load balancer with sticky sessions
  plus a Redis adapter (not free).
- **Public IP changes on stop/start** (since we skip the Elastic IP). Re-point DuckDNS
  if you stop the instance. The cron job in Step 6 handles this automatically if the box
  is running.
- **Run `npm audit`** in `backend/` and `frontend/` and review before applying fixes.
- **Free-tier expiry**: the EC2/EBS free allowance lasts 12 months. Terminate the instance
  before then (or sooner when you're done) to guarantee $0.

---

## Teardown (when you're finished)

1. Terminate the EC2 instance (EC2 → Instances → Terminate).
2. Delete leftover EBS volumes/snapshots if any remain.
3. If you created a custom VPC/IGW, delete those too.
4. DuckDNS and Atlas are free — leave or delete as you like.
