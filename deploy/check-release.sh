#!/usr/bin/env bash
# GoldMoodAstro — release readiness kontrolü
#
# Gizli değerleri yazdırmaz. Local .secrets/credentials.env, VPS backend/.env,
# PM2 portları ve public endpoint'leri sadece var/yok/başarılı/başarısız olarak raporlar.
#
#   ./deploy/check-release.sh
#   ./deploy/check-release.sh --no-remote   # sadece local credentials kontrolü

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
NO_REMOTE=0
[[ "${1:-}" == "--no-remote" ]] && NO_REMOTE=1

# shellcheck disable=SC1091
source "$ROOT/deploy/load-local-env.sh"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '   \033[1;33m!\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }

FAILED=0

require_local_var() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    ok "$name local credentials içinde dolu"
  else
    fail "$name local credentials içinde boş/eksik"
  fi
}

say "Local credentials"
if [[ ! -f "$CRED" ]]; then
  fail "$CRED bulunamadı"
  exit 1
fi

load_local_env "$ROOT"
ok ".secrets/credentials.env bulundu"

LOCAL_REQUIRED=(
  VPS_HOST VPS_USER SSH_KEY
  PROD_DB_HOST PROD_DB_PORT PROD_DB_USER PROD_DB_PASSWORD PROD_DB_NAME
  JWT_SECRET COOKIE_SECRET
  IYZIPAY_API_KEY IYZIPAY_SECRET_KEY IYZIPAY_BASE_URL
  FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY
  ANTHROPIC_API_KEY
)

for key in "${LOCAL_REQUIRED[@]}"; do
  require_local_var "$key"
done

if [[ "$NO_REMOTE" -eq 1 ]]; then
  [[ "$FAILED" -eq 0 ]] && ok "Local release kontrolü geçti" || fail "Local release kontrolünde eksikler var"
  exit "$FAILED"
fi

SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

say "SSH"
if [[ -f "$SSH_KEY_PATH" ]]; then
  ok "SSH key bulundu"
else
  fail "SSH key bulunamadı: $SSH_KEY_PATH"
  exit 1
fi

if ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'echo SSH_OK' >/dev/null 2>&1; then
  ok "VPS SSH bağlantısı başarılı"
else
  fail "VPS SSH bağlantısı başarısız"
  exit 1
fi

say "VPS backend .env"
REMOTE_ENV_CHECK='
set -euo pipefail
ENV_FILE=/var/www/goldmoodastro/backend/.env
test -f "$ENV_FILE" || { echo "__MISSING_FILE__"; exit 0; }
required=(
  NODE_ENV PORT APP_NAME
  DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME
  JWT_SECRET COOKIE_SECRET
  FRONTEND_URL CORS_ORIGIN PUBLIC_URL BACKEND_URL
  IYZIPAY_API_KEY IYZIPAY_SECRET_KEY IYZIPAY_BASE_URL
  FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY
  ANTHROPIC_API_KEY
)
for key in "${required[@]}"; do
  if grep -Eq "^${key}=.+" "$ENV_FILE"; then
    echo "OK $key"
  else
    echo "MISSING $key"
  fi
done
'

REMOTE_ENV_RESULT="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$REMOTE_ENV_CHECK")"
if grep -q '^__MISSING_FILE__$' <<<"$REMOTE_ENV_RESULT"; then
  fail "/var/www/goldmoodastro/backend/.env VPS üzerinde yok"
else
  while read -r status key; do
    [[ -z "${status:-}" ]] && continue
    if [[ "$status" == "OK" ]]; then
      ok "$key VPS .env içinde dolu"
    else
      fail "$key VPS .env içinde boş/eksik"
    fi
  done <<<"$REMOTE_ENV_RESULT"
fi

say "PM2 ve portlar"
REMOTE_PM2_CHECK='
set -euo pipefail
pm2 describe goldmoodastro-backend >/dev/null 2>&1 && echo "OK pm2_backend" || echo "MISSING pm2_backend"
pm2 describe goldmoodastro-admin >/dev/null 2>&1 && echo "OK pm2_admin" || echo "MISSING pm2_admin"
pm2 describe goldmoodastro-frontend >/dev/null 2>&1 && echo "OK pm2_frontend" || echo "MISSING pm2_frontend"
ss -ltn | grep -q ":8094 " && echo "OK port_8094" || echo "MISSING port_8094"
ss -ltn | grep -q ":3094 " && echo "OK port_3094" || echo "MISSING port_3094"
ss -ltn | grep -q ":3095 " && echo "OK port_3095" || echo "MISSING port_3095"
'
REMOTE_PM2_RESULT="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$REMOTE_PM2_CHECK")"
while read -r status key; do
  [[ -z "${status:-}" ]] && continue
  if [[ "$status" == "OK" ]]; then
    ok "$key hazır"
  else
    fail "$key hazır değil"
  fi
done <<<"$REMOTE_PM2_RESULT"

say "Public smoke tests"
check_url() {
  local url="$1"
  if curl -fsS --max-time 15 "$url" >/dev/null; then
    ok "$url erişilebilir"
  else
    fail "$url erişilemiyor"
  fi
}

check_url "https://goldmoodastro.com/api/health"
check_url "https://www.goldmoodastro.com"
check_url "https://admin.goldmoodastro.com"

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Release readiness kontrolü geçti"
else
  fail "Release readiness kontrolünde eksikler var"
fi

exit "$FAILED"
