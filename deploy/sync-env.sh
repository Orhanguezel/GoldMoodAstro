#!/usr/bin/env bash
# GoldMoodAstro — VPS backend/.env'i credentials.env'den yenile
# 3rd-party credentials (Cloudinary, SMTP, Iyzipay vs.) güncelendiğinde çalıştır.
#
#   ./deploy/sync-env.sh            # backend/.env yenile + pm2 reload
#   ./deploy/sync-env.sh --no-reload # sadece dosyayı yenile
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadı"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
RELOAD=1
[[ "${1:-}" == "--no-reload" ]] && RELOAD=0

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "bash -s" <<EOF
set -euo pipefail
cat > /var/www/goldmoodastro/backend/.env <<'ENV'
NODE_ENV=production
PORT=8094
APP_NAME=GoldMoodAstro

DB_HOST=${PROD_DB_HOST}
DB_PORT=${PROD_DB_PORT}
DB_USER=${PROD_DB_USER}
DB_PASSWORD=${PROD_DB_PASSWORD}
DB_NAME=${PROD_DB_NAME}

JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

STORAGE_DRIVER=local
LOCAL_STORAGE_ROOT=/var/www/goldmoodastro/backend/uploads
LOCAL_STORAGE_BASE_URL=/uploads

CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
MAIL_FROM=${MAIL_FROM}
SMTP_SECURE=true

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

AGORA_APP_ID=${AGORA_APP_ID}
AGORA_APP_CERTIFICATE=${AGORA_APP_CERTIFICATE}

FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}

IYZIPAY_API_KEY=${IYZIPAY_API_KEY}
IYZIPAY_SECRET_KEY=${IYZIPAY_SECRET_KEY}
IYZIPAY_BASE_URL=${IYZIPAY_BASE_URL}

FRONTEND_URL=https://www.goldmoodastro.com
CORS_ORIGIN=https://www.goldmoodastro.com,https://goldmoodastro.com,https://admin.goldmoodastro.com
PUBLIC_URL=https://www.goldmoodastro.com
BACKEND_URL=https://www.goldmoodastro.com

ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

AUDIT_RETENTION_DAYS=90
AUDIT_RETENTION_CLEANUP_MINUTES=360
ENV
chmod 600 /var/www/goldmoodastro/backend/.env
echo "✓ backend/.env yenilendi"
if [[ "$RELOAD" -eq 1 ]] && pm2 describe goldmoodastro-backend >/dev/null 2>&1; then
  pm2 reload goldmoodastro-backend
  echo "✓ pm2 reload"
fi
EOF
