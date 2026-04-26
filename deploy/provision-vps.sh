#!/usr/bin/env bash
# GoldMoodAstro — VPS one-time provisioning
# Lokalden çalıştırılır. Idempotent — tekrar çalıştırılabilir.
#
#   ./deploy/provision-vps.sh
#
# Önkoşullar:
#   - .secrets/credentials.env mevcut (DB & VPS bilgileri)
#   - SSH alias 'goldmoodastro' çalışır durumda (key auth)
#   - DNS A kayıtları yayılmış: goldmoodastro.com (+ www, .com.tr, .info,
#     .online ve isteğe bağlı admin.) → 76.13.146.44
#
set -euo pipefail

# ─── 0. Yol & credentials ──────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadı"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

remote() { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"; }
remote_sh() { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -s'; }

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()  { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
warn(){ printf '   \033[1;33m⚠\033[0m %s\n' "$*"; }

# ─── 1. SSH erişim doğrulaması ────────────────────────────────────────────────
say "1/10 SSH erişim testi"
remote 'echo OK' >/dev/null
ok "SSH OK ($SSH_TARGET)"

# ─── 2. Repo'yu VPS'e gönder ──────────────────────────────────────────────────
say "2/10 Repo → /var/www/goldmoodastro/"
remote 'mkdir -p /var/www/goldmoodastro'
rsync -avz --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='dist/' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.secrets/' \
  --exclude='uploads/' \
  --exclude='backend/uploads/' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "$SSH_TARGET:/var/www/goldmoodastro/"
ok "Repo senkronize edildi"

# ─── 3. Sistem paketleri ──────────────────────────────────────────────────────
say "3/10 Sistem paketleri (apt)"
remote_sh <<'BASH'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get -y -qq upgrade
apt-get install -y -qq \
  curl wget git ufw build-essential ca-certificates rsync unzip \
  nginx libnginx-mod-brotli \
  mysql-server \
  certbot python3-certbot-nginx \
  nodejs npm
echo "  → $(nginx -v 2>&1)"
echo "  → mysql $(mysql --version | awk '{print $3}')"
echo "  → node $(node --version)"
BASH
ok "Sistem paketleri kuruldu"

# ─── 4. Bun + PM2 ─────────────────────────────────────────────────────────────
say "4/10 Bun + PM2"
remote_sh <<'BASH'
set -euo pipefail
if ! [[ -x /root/.bun/bin/bun ]]; then
  curl -fsSL https://bun.sh/install | bash
fi
ln -sf /root/.bun/bin/bun /usr/local/bin/bun
echo "  → $(/usr/local/bin/bun --version) (bun)"
if ! command -v pm2 >/dev/null; then
  npm install -g pm2 >/dev/null
fi
echo "  → $(pm2 --version) (pm2)"
BASH
ok "Bun + PM2 hazır"

# ─── 5. Firewall ──────────────────────────────────────────────────────────────
say "5/10 UFW (22, 80, 443)"
remote_sh <<'BASH'
set -euo pipefail
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
yes | ufw --force enable >/dev/null
ufw status | head -10
BASH
ok "Firewall aktif"

# ─── 6. MySQL: DB + user ──────────────────────────────────────────────────────
say "6/10 MySQL (DB + user)"
remote_sh <<BASH
set -euo pipefail
# Ubuntu 24.04: root → unix_socket auth (root shell'inden parolasız erişim)
mysql --protocol=socket -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${PROD_DB_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS \\\`${PROD_DB_NAME}\\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${PROD_DB_USER}'@'localhost' IDENTIFIED BY '${PROD_DB_PASSWORD}';
ALTER USER '${PROD_DB_USER}'@'localhost' IDENTIFIED BY '${PROD_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \\\`${PROD_DB_NAME}\\\`.* TO '${PROD_DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "  → DB '${PROD_DB_NAME}' + user '${PROD_DB_USER}' hazır"
BASH
ok "MySQL hazır"

# ─── 7. Klasör yapısı + nginx snippets ────────────────────────────────────────
say "7/10 /var/www klasörleri + nginx snippets"
remote_sh <<'BASH'
set -euo pipefail
mkdir -p /var/www/goldmoodastro/backend/uploads
mkdir -p /var/www/certbot/.well-known/acme-challenge
chown -R www-data:www-data /var/www/goldmoodastro/backend/uploads /var/www/certbot
mkdir -p /etc/nginx/snippets
ln -sf /var/www/goldmoodastro/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
ln -sf /var/www/goldmoodastro/nginx/performance.conf      /etc/nginx/snippets/performance.conf
BASH
ok "Klasörler + snippets hazır"

# ─── 8. backend/.env (prod) ───────────────────────────────────────────────────
say "8/10 backend/.env (prod)"
remote_sh <<EOF
set -euo pipefail
cat > /var/www/goldmoodastro/backend/.env <<'ENV'
NODE_ENV=production
PORT=8094
APP_NAME=GoldMoodAstro

# ─── Database ───
DB_HOST=${PROD_DB_HOST}
DB_PORT=${PROD_DB_PORT}
DB_USER=${PROD_DB_USER}
DB_PASSWORD=${PROD_DB_PASSWORD}
DB_NAME=${PROD_DB_NAME}

# ─── Auth ───
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# ─── Storage (cloudinary'e geçince değiştir) ───
STORAGE_DRIVER=local
LOCAL_STORAGE_ROOT=/var/www/goldmoodastro/backend/uploads
LOCAL_STORAGE_BASE_URL=/uploads

CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

# ─── Mail / SMTP ───
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
MAIL_FROM=${MAIL_FROM}
SMTP_SECURE=true

# ─── Google OAuth ───
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# ─── Agora ───
AGORA_APP_ID=${AGORA_APP_ID}
AGORA_APP_CERTIFICATE=${AGORA_APP_CERTIFICATE}

# ─── Firebase FCM ───
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}

# ─── Iyzipay ───
IYZIPAY_API_KEY=${IYZIPAY_API_KEY}
IYZIPAY_SECRET_KEY=${IYZIPAY_SECRET_KEY}
IYZIPAY_BASE_URL=${IYZIPAY_BASE_URL}

# ─── URLs ───
FRONTEND_URL=https://www.goldmoodastro.com
CORS_ORIGIN=https://www.goldmoodastro.com,https://goldmoodastro.com,https://admin.goldmoodastro.com
PUBLIC_URL=https://www.goldmoodastro.com
BACKEND_URL=https://www.goldmoodastro.com

# ─── Seeder ───
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ─── Audit ───
AUDIT_RETENTION_DAYS=90
AUDIT_RETENTION_CLEANUP_MINUTES=360
ENV
chmod 600 /var/www/goldmoodastro/backend/.env
echo "  → backend/.env yazıldı"
EOF
ok "backend/.env hazır"

# ─── 9. SSL (Let's Encrypt) ───────────────────────────────────────────────────
say "9/10 SSL — DNS doğrulama + certbot"

# Ana domain + alternatifler için DNS resolve kontrol
DOMAINS=(goldmoodastro.com www.goldmoodastro.com
         goldmoodastro.com.tr www.goldmoodastro.com.tr
         goldmoodastro.info www.goldmoodastro.info
         goldmoodastro.online www.goldmoodastro.online)

# admin.goldmoodastro.com — DNS varsa dahil et
if dig +short A admin.goldmoodastro.com @8.8.8.8 | grep -q "${VPS_HOST}"; then
  DOMAINS+=(admin.goldmoodastro.com)
  ok "admin.goldmoodastro.com DNS hazır → SSL'e dahil edilecek"
else
  warn "admin.goldmoodastro.com DNS henüz yayılmamış → SSL'e DAHİL EDİLMİYOR"
  warn "  (DNS eklenince: certbot --expand --webroot ... ile sonradan ekleyebilirsin)"
fi

# Eksik DNS kontrolü
echo "  DNS resolve testi:"
MISSING=0
for d in "${DOMAINS[@]}"; do
  ip=$(dig +short A "$d" @8.8.8.8 | tail -1)
  if [[ "$ip" == "$VPS_HOST" ]]; then
    printf "    \033[1;32m✓\033[0m %-40s %s\n" "$d" "$ip"
  else
    printf "    \033[1;31m✗\033[0m %-40s %s\n" "$d" "${ip:-no-record}"
    MISSING=$((MISSING+1))
  fi
done
[[ $MISSING -eq 0 ]] || { echo "❌ $MISSING domain çözünmüyor — DNS yayılmasını bekle"; exit 1; }

CERT_ARGS=""
for d in "${DOMAINS[@]}"; do CERT_ARGS+=" -d $d"; done

# 9a. Initial nginx (HTTP-only — webroot challenge için)
remote_sh <<'BASH'
set -euo pipefail
# default site'ı kaldır
rm -f /etc/nginx/sites-enabled/default
# minimal HTTP config — sadece challenge için
cat > /etc/nginx/sites-available/goldmoodastro-bootstrap.conf <<'NGINX'
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 200 "ok\n"; add_header Content-Type text/plain; }
}
NGINX
ln -sf /etc/nginx/sites-available/goldmoodastro-bootstrap.conf /etc/nginx/sites-enabled/goldmoodastro-bootstrap.conf
nginx -t
systemctl reload nginx
BASH

# 9b. Certificate
remote_sh <<EOF
set -euo pipefail
certbot certonly --webroot -w /var/www/certbot \\
  --non-interactive --agree-tos --no-eff-email \\
  -m ${ADMIN_EMAIL} \\
  --keep-until-expiring \\
  $CERT_ARGS
[[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] || \\
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/src/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \\
    -o /etc/letsencrypt/options-ssl-nginx.conf
[[ -f /etc/letsencrypt/ssl-dhparams.pem ]] || \\
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
EOF
ok "Sertifikalar alındı"

# 9c. Final nginx config
remote_sh <<'BASH'
set -euo pipefail
rm -f /etc/nginx/sites-enabled/goldmoodastro-bootstrap.conf
ln -sf /var/www/goldmoodastro/nginx/goldmoodastro.conf /etc/nginx/sites-enabled/goldmoodastro.conf
nginx -t
systemctl reload nginx
echo "  → nginx reload OK"
BASH
ok "Nginx final config aktif"

# ─── 10. PM2 startup ──────────────────────────────────────────────────────────
say "10/10 PM2 systemd startup"
remote_sh <<'BASH'
set -euo pipefail
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save || true
BASH
ok "PM2 startup ayarlandı"

echo
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Provisioning tamamlandı."
echo
echo "Şimdi uygulamayı deploy etmek için:"
echo "    ./deploy/deploy.sh"
echo
echo "Sonraki adımlar:"
echo "  - 3rd-party credentials (Cloudinary, SMTP, Agora, Firebase, Iyzipay, "
echo "    Google OAuth) → .secrets/credentials.env'i doldur, sonra:"
echo "      ./deploy/sync-env.sh    # backend/.env'i VPS'te yenile"
echo "  - Root parolasını rotate et (manuel) ve PasswordAuthentication=no yap"
echo "═══════════════════════════════════════════════════════════════════════"
