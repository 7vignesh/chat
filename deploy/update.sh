#!/bin/bash
# Pull the latest code, reinstall deps, rebuild the frontend, and restart the app.
# Usage (on the EC2 instance, from the repo root):  bash deploy/update.sh
set -e

echo "==> Pulling latest code"
git pull

echo "==> Installing backend dependencies"
npm install --prefix backend

echo "==> Installing frontend dependencies"
npm install --prefix frontend

echo "==> Building frontend"
npm run build --prefix frontend

echo "==> Restarting app via PM2"
pm2 restart chat

echo "==> Done. Recent logs:"
pm2 logs chat --lines 20 --nostream
