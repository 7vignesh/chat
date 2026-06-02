#!/bin/bash
# Pull the latest code, reinstall deps, rebuild the frontend, and restart the app.
# Usage (on the EC2 instance, from the repo root):  bash deploy/update.sh
#
# Options:
#   --skip-deps    Skip npm install steps (faster if deps haven't changed)
#   --rollback     Revert to the previous commit and restart
set -e

APP_NAME="chat"
HEALTH_URL="http://localhost:${PORT:-5001}/api/health"
HEALTH_TIMEOUT=15  # seconds to wait for health check

# --- Parse flags ---
SKIP_DEPS=false
ROLLBACK=false
for arg in "$@"; do
  case $arg in
    --skip-deps) SKIP_DEPS=true ;;
    --rollback)  ROLLBACK=true ;;
  esac
done

# --- Rollback mode ---
if [ "$ROLLBACK" = true ]; then
  echo "==> Rolling back to previous commit"
  git reset --hard HEAD~1
  echo "==> Rebuilding frontend"
  npm run build --prefix frontend
  echo "==> Restarting app via PM2"
  pm2 restart "$APP_NAME"
  echo "==> Rollback complete. Current commit:"
  git log --oneline -1
  exit 0
fi

# --- Normal deploy ---
echo "==> Saving current commit hash for rollback"
PREV_COMMIT=$(git rev-parse HEAD)

echo "==> Pulling latest code"
git pull

echo "==> New commit:"
git log --oneline -1

if [ "$SKIP_DEPS" = false ]; then
  echo "==> Installing backend dependencies"
  npm ci --prefix backend --omit=dev

  echo "==> Installing frontend dependencies"
  npm ci --prefix frontend
fi

echo "==> Building frontend"
npm run build --prefix frontend

echo "==> Gracefully reloading app via PM2"
pm2 reload "$APP_NAME"

echo "==> Waiting for health check..."
HEALTHY=false
for i in $(seq 1 $HEALTH_TIMEOUT); do
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  sleep 1
done

if [ "$HEALTHY" = true ]; then
  echo "==> Health check passed. Deploy successful!"
  pm2 logs "$APP_NAME" --lines 10 --nostream
else
  echo "==> Health check FAILED after ${HEALTH_TIMEOUT}s. Rolling back..."
  git reset --hard "$PREV_COMMIT"
  npm run build --prefix frontend
  pm2 restart "$APP_NAME"
  echo "==> Rolled back to $PREV_COMMIT"
  pm2 logs "$APP_NAME" --lines 20 --nostream
  exit 1
fi
