#!/usr/bin/env bash
# GoldMoodAstro — manuel deploy
# Lokalden çalıştırılır. Repo'yu VPS'e gönderir, build eder, pm2 reload yapar.
#
#   ./deploy/deploy.sh                # full deploy (backend + admin + frontend)
#   ./deploy/deploy.sh backend        # sadece backend
#   ./deploy/deploy.sh admin          # sadece admin panel
#   ./deploy/deploy.sh frontend       # sadece frontend
#   ./deploy/deploy.sh --seed         # backend deploy + db:seed:nodrop (ilk kurulumda)
#   ./deploy/deploy.sh --fresh-seed   # backend + DROP+seed (DİKKAT: prod data silinir)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadı"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

remote()    { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"; }
remote_sh() { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -s'; }

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()  { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }

# ─── Argümanlar ───────────────────────────────────────────────────────────────
WHAT="all"
SEED_MODE=""
for arg in "$@"; do
  case "$arg" in
    backend|admin|frontend|all) WHAT="$arg" ;;
    --seed)        SEED_MODE="nodrop" ;;
    --fresh-seed)  SEED_MODE="fresh" ;;
    *) echo "Bilinmeyen argüman: $arg"; exit 2 ;;
  esac
done

# ─── 1. Repo → VPS rsync ──────────────────────────────────────────────────────
say "Repo senkronizasyonu (rsync → /var/www/goldmoodastro)"
rsync -avz --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='dist/' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.secrets/' \
  --exclude='backend/uploads/db_snapshots/' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "$SSH_TARGET:/var/www/goldmoodastro/"
ok "Senkronize edildi"

# ─── 2. Workspaces install ────────────────────────────────────────────────────
say "Bun workspaces install (root)"
remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro
/usr/local/bin/bun install --frozen-lockfile || /usr/local/bin/bun install
BASH
ok "Bağımlılıklar kuruldu"

# ─── 3. Backend ───────────────────────────────────────────────────────────────
if [[ "$WHAT" == "all" || "$WHAT" == "backend" ]]; then
  say "Backend build"
  remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro/backend
rm -rf dist .tsbuildinfo
/usr/local/bin/bun run build
BASH
  ok "Backend build tamam"

  if [[ "$SEED_MODE" == "fresh" ]]; then
    say "DB seed (FRESH — DROP + recreate)"
    remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro/backend
ALLOW_DROP=true /usr/local/bin/bun run db:seed
BASH
    ok "DB fresh seed tamam"
  elif [[ "$SEED_MODE" == "nodrop" ]]; then
    say "DB seed (no-drop)"
    remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro/backend
/usr/local/bin/bun run db:seed:nodrop
BASH
    ok "DB seed tamam"
  fi

  say "PM2 (re)start — backend"
  remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro
# Eski entry'yi sil, ecosystem'dan temiz başlat (interpreter değişikliği vs. için)
pm2 delete goldmoodastro-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs --only goldmoodastro-backend --update-env
pm2 save
sleep 3
ss -ltnp | grep ':8094' || { echo "❌ Backend port 8094 açık değil"; pm2 logs goldmoodastro-backend --lines 40 --nostream; exit 1; }
echo "  → port 8094 OK"
BASH
  ok "Backend çalışıyor"
fi

# ─── 4. Admin Panel ───────────────────────────────────────────────────────────
if [[ "$WHAT" == "all" || "$WHAT" == "admin" ]]; then
  say "Admin panel build"
  remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro/admin_panel
# .env.local Next.js'te .env'i ezer — eski deploylardan kalan v1 URL'leri sızdırır.
rm -f .env.local
# .env ALWAYS overwrite — eski deploy kalıntısı /api/v1 trap'ine düşmemek için.
cat > .env <<'ENV'
PANEL_API_URL=https://www.goldmoodastro.com
NEXT_PUBLIC_API_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_API_BASE_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_MEDIA_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_SOCKET_URL=https://www.goldmoodastro.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://admin.goldmoodastro.com
NEXT_PUBLIC_APP_NAME=GoldMoodAstro Admin
NEXT_PUBLIC_APP_COPYRIGHT=GoldMoodAstro
NEXT_PUBLIC_APP_DESCRIPTION=Yonetim paneli.
ENV
rm -rf .next
NODE_ENV=production /usr/local/bin/bun run build
BASH
  ok "Admin build tamam"

  say "PM2 (re)start — admin"
  remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro
pm2 delete goldmoodastro-admin 2>/dev/null || true
pm2 start ecosystem.config.cjs --only goldmoodastro-admin --update-env
pm2 save
sleep 3
ss -ltnp | grep ':3094' || { echo "❌ Admin port 3094 açık değil"; pm2 logs goldmoodastro-admin --lines 40 --nostream; exit 1; }
echo "  → port 3094 OK"
BASH
  ok "Admin çalışıyor"
fi

# ─── 5. Frontend ──────────────────────────────────────────────────────────────
if [[ "$WHAT" == "all" || "$WHAT" == "frontend" ]]; then
  say "Frontend build"
  remote_sh <<BASH
set -euo pipefail
cd /var/www/goldmoodastro/frontend
# .env.local Next.js'te .env'i ezer — eski deploylardan kalan v1 URL'leri sızdırır.
rm -f .env.local
cat > .env <<'ENV'
NEXT_PUBLIC_API_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_API_BASE_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_MEDIA_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_SOCKET_URL=https://www.goldmoodastro.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.goldmoodastro.com
NEXT_PUBLIC_APP_NAME=GoldMoodAstro
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
NEXT_PUBLIC_FACEBOOK_APP_ID=${FACEBOOK_APP_ID:-}
NEXT_PUBLIC_APPLE_CLIENT_ID=${NEXT_PUBLIC_APPLE_CLIENT_ID:-${APPLE_CLIENT_ID:-com.goldmoodastro.web}}
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://goldmoodastro.com/auth/apple/callback
ENV
rm -rf .next
NODE_ENV=production /usr/local/bin/bun run build
BASH
  ok "Frontend build tamam"

  say "PM2 (re)start — frontend"
  remote_sh <<'BASH'
set -euo pipefail
cd /var/www/goldmoodastro
pm2 delete goldmoodastro-frontend 2>/dev/null || true
pm2 start ecosystem.config.cjs --only goldmoodastro-frontend --update-env
pm2 save
sleep 3
ss -ltnp | grep ':3095' || { echo "❌ Frontend port 3095 açık değil"; pm2 logs goldmoodastro-frontend --lines 40 --nostream; exit 1; }
echo "  → port 3095 OK"
BASH
  ok "Frontend çalışıyor"
fi

# ─── 6. Sonuç ─────────────────────────────────────────────────────────────────
say "PM2 listesi"
remote 'pm2 list' || true

echo
echo "✅ Deploy tamam."
echo "   Frontend:  https://www.goldmoodastro.com"
echo "   Admin:     https://admin.goldmoodastro.com"
echo "   API:       https://www.goldmoodastro.com/api"
