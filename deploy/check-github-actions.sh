#!/usr/bin/env bash
# GoldMoodAstro — GitHub Actions readiness kontrolü
#
# Secret değerlerini okuyamaz/yazdırmaz; sadece gerekli secret isimlerinin repo
# üzerinde tanımlı olup olmadığını kontrol eder.
#
#   GH_REPO=owner/repo ./deploy/check-github-actions.sh
#   ./deploy/check-github-actions.sh owner/repo

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOW="$ROOT/.github/workflows/main.yml"
REPO="${1:-${GH_REPO:-}}"
FAILED=0

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '   \033[1;31m✗\033[0m %s\n' "$*"; FAILED=1; }
warn() { printf '   \033[1;33m!\033[0m %s\n' "$*"; }

say "Workflow file"
if [[ -f "$WORKFLOW" ]]; then
  ok ".github/workflows/main.yml var"
else
  fail ".github/workflows/main.yml bulunamadı"
fi

REQUIRED_SECRETS=()
while IFS= read -r secret; do
  REQUIRED_SECRETS+=("$secret")
done < <(grep -oE 'secrets\.[A-Z0-9_]+' "$WORKFLOW" | sed 's/secrets\.//' | sort -u)

if [[ "${#REQUIRED_SECRETS[@]}" -eq 0 ]]; then
  fail "Workflow içinde secrets.* referansı bulunamadı"
else
  ok "Workflow secret referansları: ${REQUIRED_SECRETS[*]}"
fi

say "GitHub CLI"
if ! command -v gh >/dev/null 2>&1; then
  fail "gh CLI bulunamadı"
  exit 1
fi
ok "gh CLI bulundu"

if ! gh auth status >/dev/null 2>&1; then
  fail "gh auth login yapılmamış veya token yetkisiz"
  exit 1
fi
ok "gh auth status başarılı"

if [[ -z "$REPO" ]]; then
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
  fi
fi

if [[ -z "$REPO" ]]; then
  fail "Repo belirlenemedi. GH_REPO=owner/repo ./deploy/check-github-actions.sh şeklinde çalıştır"
  exit 1
fi
ok "Repo: $REPO"

say "Actions secrets"
SECRET_LIST="$(gh secret list --repo "$REPO" --json name -q '.[].name' 2>/dev/null || true)"
if [[ -z "$SECRET_LIST" ]]; then
  fail "Secret listesi alınamadı veya repo üzerinde secret yok"
else
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -qx "$secret" <<<"$SECRET_LIST"; then
      ok "$secret tanımlı"
    else
      fail "$secret eksik"
    fi
  done
fi

say "Recent workflow runs"
if gh run list --repo "$REPO" --workflow "GoldMoodAstro Deploy" --limit 3 >/tmp/goldmoodastro-gh-runs.txt 2>/dev/null; then
  sed 's/^/   /' /tmp/goldmoodastro-gh-runs.txt
else
  warn "Son workflow run listesi alınamadı"
fi

echo
if [[ "$FAILED" -eq 0 ]]; then
  ok "GitHub Actions readiness geçti"
else
  fail "GitHub Actions readiness eksiklerle bitti"
fi

exit "$FAILED"
