#!/usr/bin/env bash
# GoldMoodAstro — push notification campaign readiness kontrolü
#
# Secret değerleri yazdırmaz. Kampanya preset tablosu, backend admin endpointleri
# ve admin panel gönderim ekranını kontrol eder.
#
#   ./deploy/check-push-campaigns.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }

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

say "Database seeds"
require_grep 'CREATE TABLE IF NOT EXISTS push_campaigns' "$ROOT/backend/src/db/sql/101_push_campaigns_schema.sql" "push_campaigns tablosu"
require_grep 'daily_horoscope_morning' "$ROOT/backend/src/db/sql/101_push_campaigns_schema.sql" "günlük burç kampanyası seed"
require_grep 'birth_chart_resume' "$ROOT/backend/src/db/sql/101_push_campaigns_schema.sql" "doğum haritası kampanyası seed"
require_grep 'first_session_offer' "$ROOT/backend/src/db/sql/101_push_campaigns_schema.sql" "ilk seans kampanyası seed"

say "Backend admin API"
require_grep 'registerFirebaseAdmin' "$ROOT/backend/src/routes/goldmood.ts" "Firebase admin route register"
require_grep '/push/campaigns' "$ROOT/backend/src/modules/firebase/admin.routes.ts" "campaign list route"
require_grep '/push/campaigns/:slug/send' "$ROOT/backend/src/modules/firebase/admin.routes.ts" "campaign send route"
require_grep 'queryTargetUsers' "$ROOT/backend/src/modules/firebase/admin.controller.ts" "segment hedefleme"
require_grep 'sendPushNotification' "$ROOT/backend/src/modules/firebase/admin.controller.ts" "FCM gönderimi"
require_grep 'createInAppNotification' "$ROOT/backend/src/modules/firebase/admin.controller.ts" "in-app notification persist"

say "Admin panel"
require_grep 'useListPushCampaignsQuery' "$ROOT/admin_panel/src/app/(main)/admin/(admin)/notifications/send/page.tsx" "kampanya listesi kullanılıyor"
require_grep 'useSendPushCampaignMutation' "$ROOT/admin_panel/src/app/(main)/admin/(admin)/notifications/send/page.tsx" "kampanya gönderim mutation"
require_grep '/admin/push/campaigns' "$ROOT/admin_panel/src/integrations/endpoints/admin/notifications_admin.endpoints.ts" "admin campaign endpoint"
require_grep '/admin/notifications/send' "$ROOT/admin_panel/src/app/(main)/admin/(admin)/notifications/_components/admin-notifications-client.tsx" "bildirim sayfasından gönderim linki"

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Push campaign readiness geçti"
else
  fail "Push campaign readiness eksiklerle bitti"
fi

exit "$FAILED"
