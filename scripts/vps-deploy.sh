#!/usr/bin/env bash
# =============================================================================
# VPS deploy — sunucuda git pull → build → pm2 reload → sağlık kontrolü.
# CI (.github/workflows/main.yml) bu dosyayı `ssh ... 'bash -s' < scripts/vps-deploy.sh`
# ile çalıştırır (bağlantı timeout'unda retry eden native-ssh adımı). Elle deploy
# için de aynısı kullanılabilir: `ssh goldmoodastro 'bash -s' < scripts/vps-deploy.sh`.
#
# NOT: Sunucu bu script'i git pull ile günceller; yani her çalıştırmada BİR ÖNCEKİ
# sürümü çalışır (script kararlı olduğu için sorun değil). Davranış değiştirirken
# önce commit'le, sonraki deploy yeni sürümü kullanır.
# =============================================================================
set -euo pipefail
ROOT=/var/www/goldmoodastro
cd "$ROOT"

# --- Çalışma ağacı temiz mi? -----------------------------------
# Git tabanlı dağıtımda sunucuda yerel değişiklik OLMAMALI.
# Sessizce `git checkout .` yapmıyoruz: birinin elle yaptığı bir
# düzeltmeyi habersiz silmek, kırık deploy'dan daha kötüdür.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "HATA: sunucuda commit'lenmemis degisiklik var:"
  git status --short --untracked-files=no
  echo "Once bunlari commit'le ya da stash'le, sonra tekrar deploy et."
  exit 1
fi

PREV="$(git rev-parse HEAD)"
echo "Onceki surum: $PREV"

build_all() {
  # Backend tsc (googleapis) V8 varsayilan ~2GB heap limitini asip OOM
  # (code 134) veriyordu → SSH oturumu dusuyor, deploy patliyordu.
  # Sorun toplam RAM degil V8 heap; --max-old-space-size ile cozuluyor
  # (bkz memory deploy_backend_tsc_oom, 2026-07-31 dogrulandi).
  cd "$ROOT/backend"     && { bun install --frozen-lockfile || bun install; } && NODE_OPTIONS=--max-old-space-size=3072 bun run build
  # Next .next TEMİZ build: route dizini SİLİNDİĞİNDE incremental build bozuk manifest
  # birakiyor ("client reference manifest does not exist" → silinmeyen sayfalar da 500).
  # rm -rf .next ile her deploy temiz uretir (bkz memory next_route_delete_clean_build).
  cd "$ROOT/admin_panel" && { bun install --frozen-lockfile || bun install; } && rm -rf .next && bun run build
  cd "$ROOT/frontend"    && { bun install --frozen-lockfile || bun install; } && rm -rf .next && bun run build
  cd "$ROOT"
}

reload_all() {
  pm2 reload goldmoodastro-backend  || pm2 start "$ROOT/backend/ecosystem.config.cjs"     --only goldmoodastro-backend
  pm2 reload goldmoodastro-admin    || pm2 start "$ROOT/admin_panel/ecosystem.config.cjs" --only goldmoodastro-admin
  pm2 reload goldmoodastro-frontend || pm2 start "$ROOT/frontend/ecosystem.config.cjs"    --only goldmoodastro-frontend
  pm2 save
}

# Sağlık: backend /api/health, frontend /tr, admin kök
# (admin 307 döndürür — login yönlendirmesi, sağlıklı sayılır).
health_ok() {
  for i in 1 2 3 4 5; do
    ok=1
    curl -fsS -o /dev/null --max-time 10 http://127.0.0.1:8094/api/health || ok=0
    curl -fsS -o /dev/null --max-time 10 http://127.0.0.1:3095/tr        || ok=0
    curl -s  -o /dev/null --max-time 10 -w '%{http_code}' http://127.0.0.1:3094 \
      | grep -qE '^(200|301|302|307|308)$' || ok=0
    [ "$ok" = "1" ] && return 0
    sleep 3
  done
  return 1
}

rollback() {
  echo "$1 — onceki surume donuluyor ($PREV)"
  git reset --hard "$PREV"
  build_all || echo "UYARI: geri donus build'i de basarisiz"
  reload_all || true
  exit 1
}

# --- Dağıtım ----------------------------------------------------
# Sunucu main'i takip eder (tek branch).
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Sunucu branch: $BRANCH"
git pull --ff-only
echo "Yeni surum: $(git rev-parse HEAD)"

build_all  || rollback "BUILD BASARISIZ"
reload_all
health_ok  || rollback "SAGLIK KONTROLU BASARISIZ"

echo "Dagitim tamam: $(git rev-parse --short HEAD)"
pm2 list | grep goldmood || true
