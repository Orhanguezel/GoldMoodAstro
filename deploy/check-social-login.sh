#!/usr/bin/env bash
# GoldMoodAstro — social login config readiness
#
# Facebook/Google/Apple için repo ve local credentials tarafındaki eksikleri
# secret değeri yazdırmadan kontrol eder. Provider console ayarlarını API ile
# doğrulamaz; o adım manuel yapılır.
#
#   ./deploy/check-social-login.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }
warn() { printf '   \033[1;33m!\033[0m %s\n' "$*"; }

require_grep() {
  local pattern="$1"
  local path="$2"
  local label="$3"
  if grep -q "$pattern" "$path"; then
    ok "$label"
  else
    fail "$label eksik: $pattern"
  fi
}

require_local_var() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    ok "$name local credentials içinde dolu"
  else
    warn "$name local credentials içinde boş/eksik"
  fi
}

say "Repo config"
require_grep 'NEXT_PUBLIC_FACEBOOK_APP_ID=' "$ROOT/frontend/.env.example" "frontend Facebook public env template"
require_grep 'FACEBOOK_APP_ID=' "$ROOT/backend/.env.example" "backend Facebook app id env template"
require_grep 'FACEBOOK_APP_SECRET=' "$ROOT/backend/.env.example" "backend Facebook secret env template"
require_grep 'NEXT_PUBLIC_GOOGLE_CLIENT_ID=' "$ROOT/frontend/.env.example" "frontend Google public env template"
require_grep 'NEXT_PUBLIC_APPLE_CLIENT_ID=' "$ROOT/frontend/.env.example" "frontend Apple public env template"
require_grep 'NEXT_PUBLIC_APPLE_REDIRECT_URI=' "$ROOT/frontend/.env.example" "frontend Apple redirect env template"
require_grep 'GOOGLE_CLIENT_ID=' "$ROOT/backend/.env.example" "backend Google client env template"
require_grep 'APPLE_CLIENT_ID=' "$ROOT/backend/.env.example" "backend Apple client env template"
require_grep 'FACEBOOK_APP_ID=${FACEBOOK_APP_ID}' "$ROOT/deploy/sync-env.sh" "sync-env Facebook app id yazar"
require_grep 'APPLE_CLIENT_ID=${APPLE_CLIENT_ID}' "$ROOT/deploy/sync-env.sh" "sync-env Apple client id yazar"

say "Code paths"
require_grep 'NEXT_PUBLIC_FACEBOOK_APP_ID' "$ROOT/frontend/src/components/auth/SocialLoginButtons.tsx" "frontend Facebook SDK app id kullanıyor"
require_grep 'NEXT_PUBLIC_APPLE_CLIENT_ID' "$ROOT/frontend/src/components/auth/SocialLoginButtons.tsx" "frontend Apple client id kullanıyor"
require_grep 'AppleID.auth.init' "$ROOT/frontend/src/components/auth/SocialLoginButtons.tsx" "frontend Apple JS init var"
require_grep 'AppleAuthentication.signInAsync' "$ROOT/mobile/app/app/auth/login.tsx" "mobile Apple Sign In var"
require_grep "type: 'facebook'" "$ROOT/frontend/src/components/auth/SocialLoginButtons.tsx" "frontend Facebook social-login event gönderiyor"
require_grep "type: 'apple'" "$ROOT/frontend/src/components/auth/SocialLoginButtons.tsx" "frontend Apple social-login event gönderiyor"
require_grep "type: z.enum(\\['google', 'facebook', 'apple'\\]" "$ROOT/packages/shared-backend/modules/auth/validation.ts" "backend social-login provider validation"
require_grep 'verifyFacebookIdentity' "$ROOT/packages/shared-backend/modules/auth/controller.ts" "backend Facebook token doğrulaması var"
require_grep 'verifyAppleIdentity' "$ROOT/packages/shared-backend/modules/auth/controller.ts" "backend Apple token doğrulaması var"

say "Local credentials"
if [[ -f "$CRED" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CRED"; set +a
  ok ".secrets/credentials.env bulundu"
  require_local_var FACEBOOK_APP_ID
  require_local_var FACEBOOK_APP_SECRET
  require_local_var GOOGLE_CLIENT_ID
  require_local_var GOOGLE_CLIENT_SECRET
  require_local_var APPLE_CLIENT_ID
else
  warn ".secrets/credentials.env yok; local secret kontrolü atlandı"
fi

say "Provider console manual settings"
cat <<'TEXT'
   Facebook Login for Business / Facebook Login:
   - App Domains: goldmoodastro.com
   - Site URL: https://www.goldmoodastro.com
   - Valid OAuth Redirect URIs: SDK popup akışı kullanıldığı için backend callback yok.
     Provider console URI isterse frontend origin/callback kullan:
       https://www.goldmoodastro.com/
       https://goldmoodastro.com/
   - Backend doğrulama endpoint'i:
       POST https://goldmoodastro.com/api/v1/auth/social-login
     Body: { "type": "facebook", "access_token": "..." }

   Apple Sign In:
   - Service ID: com.goldmoodastro.web
   - Bundle ID: com.goldmoodastro.app
   - Backend APPLE_CLIENT_ID ikisini virgülle kabul edebilir:
       APPLE_CLIENT_ID=com.goldmoodastro.web,com.goldmoodastro.app
   - Web Return URL:
       https://goldmoodastro.com/auth/apple/callback
       https://www.goldmoodastro.com/auth/apple/callback
   - Backend doğrulama endpoint'i:
       POST https://goldmoodastro.com/api/v1/auth/social-login
     Body: { "type": "apple", "identity_token": "..." }
TEXT

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Social login repo readiness geçti"
else
  fail "Social login repo readiness eksiklerle bitti"
fi

exit "$FAILED"
