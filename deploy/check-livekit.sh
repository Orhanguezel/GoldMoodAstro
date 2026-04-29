#!/usr/bin/env bash
# GoldMoodAstro — LiveKit readiness kontrolü
#
# Secret değerleri yazdırmaz. Local credentials, backend/mobile dependency,
# route kayıtları ve LiveKit Cloud room API erişimini kontrol eder.
#
#   ./deploy/check-livekit.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
FAILED=0

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

# shellcheck disable=SC1090
set -a; source "$CRED"; set +a
require_var LIVEKIT_URL
require_var LIVEKIT_API_KEY
require_var LIVEKIT_API_SECRET

say "Repo wiring"
require_grep 'livekit-server-sdk' "$ROOT/backend/package.json" "backend livekit-server-sdk dependency"
require_grep '@livekit/react-native' "$ROOT/mobile/app/package.json" "mobile @livekit/react-native dependency"
require_grep '@livekit/react-native-webrtc' "$ROOT/mobile/app/package.json" "mobile webrtc dependency"
require_grep '/token' "$ROOT/backend/src/modules/livekit/router.ts" "backend token route"
require_grep 'livekitApi.getToken' "$ROOT/mobile/app/src/lib/livekit.ts" "mobile token helper"

say "LiveKit Cloud API"
if (
  cd "$ROOT/backend"
  LIVEKIT_URL="$LIVEKIT_URL" LIVEKIT_API_KEY="$LIVEKIT_API_KEY" LIVEKIT_API_SECRET="$LIVEKIT_API_SECRET" \
    bun --eval '
      import { RoomServiceClient } from "livekit-server-sdk";
      const url = String(process.env.LIVEKIT_URL || "").replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
      const key = String(process.env.LIVEKIT_API_KEY || "");
      const secret = String(process.env.LIVEKIT_API_SECRET || "");
      const client = new RoomServiceClient(url, key, secret);
      const rooms = await client.listRooms();
      console.log(`rooms=${rooms.length}`);
    '
); then
  ok "LiveKit Cloud API erişimi başarılı"
else
  fail "LiveKit Cloud API erişimi başarısız"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "LiveKit readiness geçti"
else
  fail "LiveKit readiness eksiklerle bitti"
fi

exit "$FAILED"
