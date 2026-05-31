#!/bin/bash
# One-time server provisioning for Amazon Linux 2023.
# Run on a fresh EC2 instance:  bash deploy/setup.sh
# (Assumes you have already SSH'd in and cloned the repo.)
set -e

echo "==> Updating system packages"
sudo dnf update -y

echo "==> Installing git and nginx"
sudo dnf install -y git nginx

echo "==> Installing Node.js 20"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

echo "==> Installing PM2 globally"
sudo npm install -g pm2

echo "==> Allowing nginx to proxy to the local app (SELinux)"
sudo setsebool -P httpd_can_network_connect 1 || true

echo "==> Creating a 1GB swap file (helps small instances build the frontend)"
if [ ! -f /swapfile ]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> Versions:"
node -v
npm -v
nginx -v

echo "==> Done. Next steps:"
echo "    1. Create backend/.env (see backend/.env.example)"
echo "    2. npm install --prefix backend && npm install --prefix frontend"
echo "    3. npm run build --prefix frontend"
echo "    4. pm2 start ecosystem.config.cjs && pm2 startup && pm2 save"
echo "    5. Configure nginx (see deploy/nginx.conf) and run certbot"
