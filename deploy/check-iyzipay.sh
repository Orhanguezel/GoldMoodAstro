#!/usr/bin/env bash
# GoldMoodAstro — Iyzipay readiness kontrolü
#
# Secret değerleri yazdırmaz. Local credentials, env isimleri, callback pathleri
# ve sandbox API erişimini kontrol eder.
#
#   ./deploy/check-iyzipay.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
FAILED=0

# shellcheck disable=SC1091
source "$ROOT/deploy/load-local-env.sh"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }

require_var() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    ok "$name dolu"
  else
    fail "$name boş/eksik"
  fi
}

require_grep() {
  local pattern="$1"
  local path="$2"
  local label="$3"
  if grep -q "$pattern" "$path"; then
    ok "$label"
  else
    fail "$label eksik"
  fi
}

say "Local credentials"
if [[ ! -f "$CRED" ]]; then
  fail "$CRED bulunamadı"
  exit 1
fi

load_local_env "$ROOT"
require_var IYZIPAY_API_KEY
require_var IYZIPAY_SECRET_KEY
require_var IYZIPAY_BASE_URL

say "Repo wiring"
require_grep 'IYZIPAY_API_KEY' "$ROOT/backend/.env.example" "backend env example Iyzipay api key"
require_grep 'IYZIPAY_SECRET_KEY' "$ROOT/backend/.env.example" "backend env example Iyzipay secret"
require_grep 'IYZIPAY_API_KEY' "$ROOT/packages/shared-backend/modules/orders/controller.ts" "orders controller IYZIPAY env okuyor"
require_grep 'IYZIPAY_API_KEY' "$ROOT/packages/shared-backend/modules/credits/controller.ts" "credits controller IYZIPAY env okuyor"
require_grep '/api/v1/orders/iyzico/callback' "$ROOT/packages/shared-backend/modules/orders/controller.ts" "orders callback /api/v1 path"
require_grep '/api/v1/credits/iyzico/callback' "$ROOT/packages/shared-backend/modules/credits/controller.ts" "credits callback /api/v1 path"

say "Sandbox API"
if [[ -n "${IYZIPAY_BASE_URL:-}" ]]; then
  if curl -fsS --max-time 15 "$IYZIPAY_BASE_URL" >/dev/null 2>&1; then
    ok "Iyzipay base URL erişilebilir"
  else
    # Sandbox root 403/404 dönebilir; DNS/TLS çalışıyorsa yine de bağlantı vardır.
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$IYZIPAY_BASE_URL" || true)"
    if [[ "$code" =~ ^(403|404|405)$ ]]; then
      ok "Iyzipay base URL erişilebilir (HTTP $code)"
    else
      fail "Iyzipay base URL erişilemedi (HTTP ${code:-000})"
    fi
  fi
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Iyzipay readiness geçti"
else
  fail "Iyzipay readiness eksiklerle bitti"
fi

exit "$FAILED"
