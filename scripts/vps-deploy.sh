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

# --- TEK DEPLOY KILIDI -----------------------------------------
# CI deploy'u ile elle SSH deploy'u ayni anda calisabiliyor (workflow'daki
# concurrency grubu yalnız CI kosularini serilestirir, elle calistirmayi degil).
# Iki `next build` ayni .next dizinine yazinca Next gecici manifest dosyasini
# bulamayip patliyor ("ENOENT ... _buildManifest.js.tmp.*"); 2026-08-17'de bu
# yarisin sonunda admin_panel build'siz kalip 502'ye dustu, frontend de eski
# build'le calismaya devam etti. Kilit bunu yapisal olarak imkansiz kilar.
LOCK=/var/lock/goldmoodastro-deploy.lock
exec 9>"$LOCK"
if ! flock -w 1800 9; then
  echo "HATA: baska bir deploy 30 dakikadir surüyor — kilit alinamadi."
  exit 1
fi
echo "Deploy kilidi alindi (pid $$)"

# --- Next'in ürettiği dosyaları baştan geri al -----------------
# next-env.d.ts + tsconfig.json build SONRASI restore'a rağmen çalışma
# sırasında yeniden kirlenebiliyor (2026-08-20: admin_panel dosyaları restore'a
# rağmen yine değişmiş bulundu, deploy kilitlendi). Bunlar deterministik
# üretilmiş dosyalar — deploy başında güvenle geri alınır. Elle yapılmış BAŞKA
# her değişiklik aşağıdaki temizlik kontrolünü yine de durdurur.
for d in admin_panel frontend; do
  for gen in "next-env.d.ts" "tsconfig.json"; do
    git ls-files --error-unmatch "$d/$gen" >/dev/null 2>&1 \
      && git checkout -- "$d/$gen" 2>/dev/null || true
  done
done

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

# Next app'i TEMIZ build eder + tamamlandigini DOGRULAR. Kapasite baskisinda (server
# RAM sinirli) build worker'i dusup bir route'u atlayabiliyor: exit 0 doner AMA .next
# eksik kalir (BUILD_ID yok veya bir route'un manifest'i yok) -> silinmeyen sayfalar da
# 500. Bu yuzden BUILD_ID yoksa BIR KEZ daha temiz dener; yine yoksa hata dondurur
# (rollback tetiklenir). Ayrica route SILINDIGINDE incremental cache bozulmasin diye
# her build oncesi rm -rf .next. (bkz memory next_route_delete_clean_build)
# Kullanim: build_next <dizin> [pm2_surec_adi]
build_next() {
  local d="$1"
  local tmp=".next-build"
  cd "$ROOT/$d" && { bun install --frozen-lockfile || bun install; } || return 1

  # GECICI DIZINE BUILD + TAKAS. Dogrudan .next'e build etmek calisan uygulamanin
  # altindan dosyalari cekiyordu: `rm -rf .next` sonrasi app ayakta kaliyor ama
  # route manifest'leri yok -> "client reference manifest ... does not exist" ve
  # o route'lar 500. Pencere kucuk degil: reload ancak TUM app'ler build edildikten
  # sonra geliyor, yani admin, frontend build'i boyunca da bozuk kaliyor
  # (2026-08-18: /admin/stripe-events, /admin/storage, /admin/service-categories).
  # Takas mv ile yapildigi icin kesinti ~1 saniye.
  rm -rf "$tmp" && NEXT_DIST_DIR="$tmp" bun run build
  if [ ! -f "$ROOT/$d/$tmp/BUILD_ID" ]; then
    echo "UYARI: $d eksik build ($tmp/BUILD_ID yok) — temiz rebuild tekrar deneniyor"
    ( cd "$ROOT/$d" && rm -rf "$tmp" && NEXT_DIST_DIR="$tmp" bun run build )
  fi
  if [ ! -f "$ROOT/$d/$tmp/BUILD_ID" ]; then
    echo "HATA: $d build TAMAMLANAMADI ($tmp/BUILD_ID yok) — kapasite/bellek bak"
    rm -rf "$tmp"
    return 1
  fi
  # Turbopack chunk adi noktayla biterse "<ad>..js" olur; Next static handler ".."yi
  # path-traversal sanip 404 doner -> o chunk'a referans veren TUM sayfalar tarayicida
  # ChunkLoadError. Dosya diskte durdugu icin "bayat chunk" gibi gorunur. Her build'de
  # kura; bu yuzden build sonrasi otomatik duzeltiyoruz.
  bash "$ROOT/scripts/fix-dotdot-chunks.sh" "$ROOT/$d" "$tmp" || { rm -rf "$tmp"; return 1; }

  # ESKI CHUNK'LARI KORU. Takas anında eski build'in static chunk'lari kaybolur;
  # o sirada acik olan sekmeler (ve CDN/tarayici onbellegindeki eski HTML) hala
  # ESKI chunk adlarini ister -> 404 + "MIME text/plain" + ChunkLoadError
  # (2026-08-18'de admin/orders'ta tam bu goruldu). Eski chunk'lari yeni static
  # dizinine kopyalayarak in-flight sekmeleri ayakta tutuyoruz. -n: ayni adli
  # yeni dosyanin uzerine YAZMAZ. Tek nesil tutuluyor, birikmiyor.
  if [ -d .next-prev/static/chunks ]; then
    mkdir -p "$tmp/static/chunks"
    cp -rn .next-prev/static/chunks/. "$tmp/static/chunks/" 2>/dev/null || true
  fi

  # Takas: yeni build yerine gecer, eskisi bir sonraki deploy'a kadar saklanir.
  rm -rf .next-prev
  [ -d .next ] && mv .next .next-prev
  mv "$tmp" .next

  # TAKAS ILE RESTART BITISIK OLMALI. reload_all sonda calisirsa eski surec,
  # takastan sonra dakikalarca (diger app'lerin build suresi boyunca) ESKI HTML
  # servis etmeye devam eder; o HTML artik .next'te olmayan chunk'lari ister.
  # Bu yuzden her app kendi takasindan hemen sonra yeniden baslatiliyor.
  if [ -n "${2:-}" ]; then
    pm2 reload "$2" >/dev/null 2>&1 || pm2 restart "$2" >/dev/null 2>&1 || true
    echo "  $d takas edildi ve $2 yeniden baslatildi"
  fi

  # Next, build sirasinda next-env.d.ts ve tsconfig.json'i AKTIF distDir'e gore
  # yeniden yazar. Gecici dizine build ettigimiz icin bu iki izlenen dosya
  # ".next-build" referansiyla degisiyor ve prod repo'su kirli kaliyor; bir
  # sonraki deploy'un `git pull --ff-only` adimi o yuzden kilitlenir
  # (bkz memory prod_repo_dirty_blocks_deploy). Uretilmis dosyalar, geri al.
  # TEK TEK geri al: `git checkout -- a b` iceride biri izlenmiyorsa KOMUTUN
  # TAMAMI duser ve digeri de geri alinmaz. frontend/next-env.d.ts izlenmiyor,
  # admin_panel/next-env.d.ts izleniyor — ilk denemede frontend/tsconfig.json
  # tam bu yuzden kirli kaldi (2026-08-18 prod'da goruldu).
  for gen in "next-env.d.ts" "tsconfig.json"; do
    git -C "$ROOT" ls-files --error-unmatch "$d/$gen" >/dev/null 2>&1 \
      && git -C "$ROOT" checkout -- "$d/$gen" 2>/dev/null || true
  done
}

build_all() {
  # Backend tsc (googleapis) V8 varsayilan ~2GB heap limitini asip OOM
  # (code 134) veriyordu → SSH oturumu dusuyor, deploy patliyordu.
  # Sorun toplam RAM degil V8 heap; --max-old-space-size ile cozuluyor
  # (bkz memory deploy_backend_tsc_oom, 2026-07-31 dogrulandi).
  cd "$ROOT/backend" && { bun install --frozen-lockfile || bun install; } && NODE_OPTIONS=--max-old-space-size=3072 bun run build || return 1
  build_next admin_panel goldmoodastro-admin    || return 1
  build_next frontend    goldmoodastro-frontend || return 1
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
  if build_all; then
    reload_all || true
  else
    # ONEMLI: build basarisizken pm2 reload ETME. Calisan surum ayakta ve saglam
    # (build artik gecici dizine gidiyor, .next'e dokunulmuyor); reload etmek
    # yalnizca riski artirir. Servisleri oldugu gibi birak, insan baksin.
    echo "HATA: geri donus build'i de basarisiz — pm2 RELOAD EDILMEDI."
    echo "Servisler mevcut haliyle birakildi; sunucuda elle build gerekiyor:"
    echo "  cd $ROOT/admin_panel && rm -rf .next && bun run build && pm2 restart goldmoodastro-admin"
  fi
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
