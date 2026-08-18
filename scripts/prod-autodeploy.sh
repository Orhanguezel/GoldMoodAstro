#!/usr/bin/env bash
# =============================================================
# PULL TABANLI DEPLOY — sunucu kendi kendini gunceller.
#
# NEDEN: CI deploy'u GitHub runner'dan sunucuya SSH aciyordu. 2026-08-18'de
# runner'lar sunucuya ulasamadi (8 denemenin hepsi "Connection timed out");
# sunucunun kendi guvenlik duvari tamamen acikti (iptables policy ACCEPT, ufw
# inactive, fail2ban yok) — engel saglayicinin ag duvarindaydi, yani repo
# disinda ve bizim kontrolumuz disinda. Deploy'un DISARIDAN gelen bir baglantiya
# bagimli olmasi kirilganligin kendisi.
#
# Bu script sunucuda cron ile calisir, origin/main'i yoklar ve fark varsa
# vps-deploy.sh'i tetikler. Disari acilan port yok, runner IP'sine bagimlilik
# yok. CI deploy'u calismaya devam eder; bu emniyet agi olarak yaninda durur —
# vps-deploy.sh flock ile kilitli oldugu icin ikisi ayni anda calisamaz.
#
# Kurulum (sunucuda bir kez):
#   */3 * * * * /var/www/goldmoodastro/scripts/prod-autodeploy.sh >> /var/log/goldmood-autodeploy.log 2>&1
# =============================================================
set -uo pipefail

ROOT="${ROOT:-/var/www/goldmoodastro}"
cd "$ROOT" || exit 1

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] $*"; }

# ONCE KILIT: baska bir deploy zaten calisiyorsa hicbir sey yapma.
# Bu kontrol kirli-agac kontrolunden ONCE gelmeli — cunku deploy SIRASINDA agac
# gecici olarak kirli goruniyor (Next build next-env.d.ts / tsconfig.json'i
# yeniden yaziyor, temizlik takastan SONRA oluyor). Sira ters oldugunda cron
# her 3 dakikada "calisma agaci kirli — elle temizlenmeli" diye yaniltici alarm
# uretiyordu; oysa surmekte olan deploy zaten temizleyecekti (2026-08-18).
LOCK=/var/lock/goldmoodastro-deploy.lock
exec 9>"$LOCK"
if ! flock -n 9; then
  exit 0   # devam eden deploy var — sessiz cik
fi
flock -u 9   # kilidi birak; vps-deploy.sh kendi kilidini alacak

# Kirli agacta ASLA deploy deneme: `git pull --ff-only` zaten patlar, ama sessiz
# birakmak yerine gorunur kilalim (bkz memory prod_repo_dirty_blocks_deploy).
if [ -n "$(git status --porcelain)" ]; then
  log "ATLANDI: calisma agaci kirli — elle temizlenmeli:"
  git status --porcelain | head -5
  exit 0
fi

git fetch --quiet origin main || { log "fetch basarisiz"; exit 0; }

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0   # guncel — sessiz cik, cron log'unu sismesin
fi

log "yeni surum bulundu: ${LOCAL:0:8} -> ${REMOTE:0:8}, deploy baslatiliyor"
bash "$ROOT/scripts/vps-deploy.sh"
code=$?
log "deploy bitti (exit=$code), surum: $(git rev-parse --short HEAD)"
exit $code
