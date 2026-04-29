#!/usr/bin/env bash
# GoldMoodAstro — Expo/EAS mobile build readiness
#
# EAS build başlatmadan önce local repo tarafındaki kritik dosya ve ayarları
# kontrol eder. Apple/Google console erişimini doğrulamaz.
#
#   ./deploy/check-mobile-build.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/mobile/app"
FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }
warn() { printf '   \033[1;33m!\033[0m %s\n' "$*"; }

require_file() {
  local path="$1"
  local label="$2"
  if [[ -s "$path" ]]; then
    ok "$label"
  else
    fail "$label eksik veya boş: $path"
  fi
}

require_grep() {
  local pattern="$1"
  local path="$2"
  local label="$3"
  if grep -q "$pattern" "$path"; then
    ok "$label"
  else
    fail "$label bulunamadı: $pattern"
  fi
}

say "Expo config files"
require_file "$APP/app.json" "app.json var"
require_file "$APP/eas.json" "eas.json var"
require_file "$APP/package.json" "package.json var"
require_file "$APP/google-services.json" "Android google-services.json var"

say "Assets"
require_file "$APP/assets/icon.png" "icon.png var"
require_file "$APP/assets/splash.png" "splash.png var"
require_file "$APP/assets/notification-icon.png" "notification-icon.png var"
require_file "$APP/assets/favicon.png" "favicon.png var"

say "Bundle identifiers"
require_grep '"bundleIdentifier"[[:space:]]*:[[:space:]]*"com.goldmoodastro.app"' "$APP/app.json" "iOS bundleIdentifier doğru"
require_grep '"package"[[:space:]]*:[[:space:]]*"com.goldmoodastro.app"' "$APP/app.json" "Android package doğru"
require_grep '"usesAppleSignIn"[[:space:]]*:[[:space:]]*true' "$APP/app.json" "Apple Sign In flag açık"
require_grep '"googleServicesFile"[[:space:]]*:[[:space:]]*"./google-services.json"' "$APP/app.json" "Google services path doğru"

say "EAS profiles"
require_grep '"preview"' "$APP/eas.json" "preview profile var"
require_grep '"production"' "$APP/eas.json" "production profile var"
require_grep 'https://goldmoodastro.com/api/v1' "$APP/eas.json" "production API URL doğru"
require_grep '"projectId"[[:space:]]*:' "$APP/app.json" "EAS projectId var"
require_grep '"owner"[[:space:]]*:[[:space:]]*"orhanguezel"' "$APP/app.json" "Expo owner doğru"

say "Package scripts"
require_grep '"build:android"[[:space:]]*:' "$APP/package.json" "Android build script var"
require_grep '"build:ios"[[:space:]]*:' "$APP/package.json" "iOS build script var"
require_grep '"lint"[[:space:]]*:' "$APP/package.json" "lint script var"

say "TypeScript"
if (cd "$APP" && bun run lint); then
  ok "mobile TypeScript/lint geçti"
else
  fail "mobile TypeScript/lint başarısız"
fi

say "EAS CLI"
if command -v eas >/dev/null 2>&1; then
  ok "eas CLI PATH içinde"
elif command -v bunx >/dev/null 2>&1; then
  warn "eas CLI global değil; bunx eas build komutlarıyla çalıştırılabilir"
else
  fail "eas CLI veya bunx bulunamadı"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Mobile build readiness geçti"
else
  fail "Mobile build readiness eksiklerle bitti"
fi

exit "$FAILED"
