#!/usr/bin/env bash
# GoldMoodAstro — public API/web smoke tests
#
# Secrets gerektirmeyen prod/staging kontrollerini yapar. Auth, ödeme, push ve
# görüşme testleri için gerçek kullanıcı/provider credential gerekir.
#
#   ./deploy/smoke-test.sh
#   API_BASE=https://staging.example.com/api FRONTEND_BASE=https://staging.example.com ./deploy/smoke-test.sh

set -euo pipefail

API_BASE="${API_BASE:-https://goldmoodastro.com/api}"
FRONTEND_BASE="${FRONTEND_BASE:-https://www.goldmoodastro.com}"
ADMIN_BASE="${ADMIN_BASE:-https://admin.goldmoodastro.com}"
API_V1="$API_BASE/v1"

FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }

http_ok() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /tmp/goldmoodastro-smoke.out -w '%{http_code}' --max-time 20 "$url" || true)"
  if [[ "$code" =~ ^2|3 ]]; then
    ok "$label ($code)"
  else
    fail "$label ($code) — $url"
    if [[ -s /tmp/goldmoodastro-smoke.out ]]; then
      sed -n '1,8p' /tmp/goldmoodastro-smoke.out | sed 's/^/      /'
    fi
  fi
}

json_has() {
  local label="$1"
  local url="$2"
  local pattern="$3"
  local body
  body="$(curl -fsS --max-time 20 "$url" || true)"
  if grep -q "$pattern" <<<"$body"; then
    ok "$label"
  else
    fail "$label — beklenen pattern bulunamadı: $pattern"
  fi
}

say "Core endpoints"
json_has "API health" "$API_BASE/health" '"ok"'
http_ok "Frontend home" "$FRONTEND_BASE"
http_ok "Admin app" "$ADMIN_BASE"

say "Public API"
json_has "Design tokens public" "$API_V1/site_settings/design_tokens" 'brand_primary'
json_has "Default locale public" "$API_V1/site_settings/default-locale" 'tr'
http_ok "Consultants list" "$API_V1/consultants"
http_ok "Reviews public list" "$API_V1/reviews?is_approved=1&limit=1"
http_ok "Banners public list" "$API_V1/banners?placement=home_hero"

say "SEO/content pages"
http_ok "Burçlar" "$FRONTEND_BASE/tr/burclar"
http_ok "Burcunu öğren" "$FRONTEND_BASE/tr/burcunu-ogren"
http_ok "Ünlüler ve burçları" "$FRONTEND_BASE/tr/unluler-ve-burclari"
http_ok "Tarot" "$FRONTEND_BASE/tr/tarot"
http_ok "Kahve falı" "$FRONTEND_BASE/tr/kahve-fali"

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Smoke test geçti"
else
  fail "Smoke test başarısız"
fi

exit "$FAILED"
