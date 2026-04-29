#!/usr/bin/env bash
# GoldMoodAstro — Kahve falı Anthropic/PUBLIC_URL readiness kontrolü
#
# Secret değerleri yazdırmaz. Coffee vision akışının ihtiyaç duyduğu
# ANTHROPIC_API_KEY, PUBLIC_URL ve /uploads erişim wiring'ini kontrol eder.
#
#   ./deploy/check-coffee-llm.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
FAILED=0

# shellcheck disable=SC1091
source "$ROOT/deploy/load-local-env.sh"

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
    fail "$label eksik"
  fi
}

say "Local credentials"
if [[ -f "$CRED" ]]; then
  load_local_env "$ROOT"
  ok ".secrets/credentials.env bulundu"
  if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
    ok "ANTHROPIC_API_KEY dolu"
  else
    fail "ANTHROPIC_API_KEY boş/eksik"
  fi
else
  fail "$CRED bulunamadı"
fi

say "Env sync"
require_grep 'ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}' "$ROOT/deploy/sync-env.sh" "sync-env Anthropic key yazar"
require_grep 'PUBLIC_URL=https://goldmoodastro.com' "$ROOT/deploy/sync-env.sh" "sync-env PUBLIC_URL non-www yazar"
require_grep 'ANTHROPIC_API_KEY=' "$ROOT/backend/.env.example" "backend env example Anthropic key"
require_grep 'PUBLIC_URL=' "$ROOT/backend/.env.example" "backend env example PUBLIC_URL"

say "Coffee/LLM wiring"
require_grep 'buildAnthropicImagePart' "$ROOT/packages/shared-backend/modules/llm/provider.ts" "Anthropic image URL builder"
require_grep "source: { type: 'url'" "$ROOT/packages/shared-backend/modules/llm/provider.ts" "Anthropic http(s) image source"
require_grep 'process.env.ANTHROPIC_API_KEY' "$ROOT/packages/shared-backend/modules/llm/provider.ts" "LLM provider Anthropic env okuyor"
require_grep 'process.env.PUBLIC_URL' "$ROOT/packages/shared-backend/modules/coffee/controller.ts" "Coffee controller PUBLIC_URL okuyor"
require_grep 'toAbsoluteUrl' "$ROOT/packages/shared-backend/modules/coffee/controller.ts" "Coffee görsel URL absolute dönüşümü"
require_grep '/coffee/read' "$ROOT/packages/shared-backend/modules/coffee/router.ts" "Coffee read endpoint"
require_grep 'coffee_symbol_detection' "$ROOT/backend/src/db/sql/099_horoscope_prompts_seed.sql" "Coffee vision prompt seed"
require_grep 'coffee_interpretation' "$ROOT/backend/src/db/sql/099_horoscope_prompts_seed.sql" "Coffee interpretation prompt seed"

say "Uploads public path"
require_grep 'LOCAL_STORAGE_BASE_URL=/uploads' "$ROOT/deploy/sync-env.sh" "backend local storage public base"
require_grep '/uploads/:path\\*' "$ROOT/frontend/next.config.js" "frontend /uploads rewrite"

if curl -fsS --max-time 15 "https://goldmoodastro.com/api/health" >/dev/null 2>&1; then
  ok "prod API health erişilebilir"
else
  warn "prod API health erişilemedi; PUBLIC_URL canlı erişimi ayrıca kontrol edilmeli"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "Coffee LLM readiness geçti"
else
  fail "Coffee LLM readiness eksiklerle bitti"
fi

exit "$FAILED"
