#!/usr/bin/env bash
# GoldMoodAstro — Firebase FCM readiness kontrolü
#
# Secret değerleri yazdırmaz. Backend Firebase Admin wiring, mobil cihaz
# token kaydı ve local credentials durumunu kontrol eder.
#
#   ./deploy/check-firebase.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }
warn() { printf '   \033[1;33m!\033[0m %s\n' "$*"; }

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
if [[ -f "$CRED" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CRED"; set +a
  ok ".secrets/credentials.env bulundu"
  require_var FIREBASE_PROJECT_ID
  require_var FIREBASE_CLIENT_EMAIL
  require_var FIREBASE_PRIVATE_KEY

  if [[ -n "${FIREBASE_PRIVATE_KEY:-}" && "$FIREBASE_PRIVATE_KEY" == *"BEGIN PRIVATE KEY"* ]]; then
    ok "FIREBASE_PRIVATE_KEY formatı service account private key gibi"
  elif [[ -n "${FIREBASE_PRIVATE_KEY:-}" ]]; then
    warn "FIREBASE_PRIVATE_KEY dolu ama BEGIN PRIVATE KEY içermiyor"
  fi
else
  fail "$CRED bulunamadı"
fi

say "Backend wiring"
require_grep '"firebase-admin"' "$ROOT/backend/package.json" "backend firebase-admin dependency"
require_grep 'FIREBASE_PROJECT_ID=' "$ROOT/backend/.env.example" "backend env example Firebase project id"
require_grep 'FIREBASE_CLIENT_EMAIL=' "$ROOT/backend/.env.example" "backend env example Firebase client email"
require_grep 'FIREBASE_PRIVATE_KEY=' "$ROOT/backend/.env.example" "backend env example Firebase private key"
require_grep 'register-token' "$ROOT/backend/src/modules/firebase/router.ts" "register-token route"
require_grep 'registerFcmTokenBodySchema' "$ROOT/backend/src/modules/firebase/controller.ts" "register-token validation"
require_grep 'fcm_token' "$ROOT/backend/src/db/sql/001_auth_schema.sql" "users.fcm_token schema"
require_grep 'sendPushNotification' "$ROOT/backend/src/modules/firebase/service.ts" "Firebase send service"
require_grep 'registerBookingReminderCron' "$ROOT/backend/src/index.ts" "booking reminder cron registered"

say "Mobile wiring"
require_grep '"expo-notifications"' "$ROOT/mobile/app/package.json" "mobile expo-notifications dependency"
require_grep 'getDevicePushTokenAsync' "$ROOT/mobile/app/src/lib/notifications.ts" "mobile direct device token alıyor"
require_grep '/push/register-token' "$ROOT/mobile/app/src/lib/api.ts" "mobile register-token endpoint"
require_grep '{ token: fcm_token }' "$ROOT/mobile/app/src/lib/api.ts" "mobile token body backend ile uyumlu"
if [[ -f "$ROOT/mobile/app/google-services.json" ]]; then
  ok "mobile/app/google-services.json mevcut"
else
  warn "mobile/app/google-services.json yok; Android FCM build için yerel olarak eklenmeli"
fi
if [[ -f "$ROOT/mobile/app/GoogleService-Info.plist" ]]; then
  ok "mobile/app/GoogleService-Info.plist mevcut"
else
  warn "mobile/app/GoogleService-Info.plist yok; iOS Firebase push için yerel olarak eklenmeli"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Firebase FCM readiness geçti"
else
  fail "Firebase FCM readiness eksiklerle bitti"
fi

exit "$FAILED"
