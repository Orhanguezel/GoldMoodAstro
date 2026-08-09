#!/usr/bin/env bash
# =============================================================================
# Canlı site sağlık kontrolü — TAZE (cache'siz) istekle gerçek durumu ölçer.
# Kullanıcı cache'den çalıştığı için hatayı göremiyor; bu script CI'da periyodik
# çalışıp bir şey kırılırsa (non-zero exit) Telegram + GitHub bildirimi tetikler.
#
# ÇİFT GEÇİŞ (retry): GitHub runner ile VPS arasında aralıklı ağ blip'leri
# (tüm check'ler '000' = bağlantı kurulamadı) FALSE-POSITIVE alarm üretiyordu.
# Artık ilk geçişte hata olursa bir süre bekleyip TEKRAR dener; sadece İKİ
# geçişte de hata varsa alarm verir. Geçici blip elenir, gerçek kesinti yakalanır.
#
# Lokal: bash scripts/site-health-check.sh
# =============================================================================
set -uo pipefail

BASE="${HEALTH_BASE_URL:-https://goldmoodastro.com}"
RETRY_WAIT="${HEALTH_RETRY_WAIT:-45}"

nc() { echo "nc=$$-$RANDOM-$(od -An -N4 -tu4 </dev/urandom 2>/dev/null | tr -d ' ')"; }
# Cache-buster'i dogru ayiricyla ekle (URL'de zaten ? varsa &).
bust() { local u="$1"; case "$u" in *\?*) echo "${BASE}${u}&$(nc)";; *) echo "${BASE}${u}?$(nc)";; esac; }

fails=0

check_code() { # url  expected_final_code  label
  local url="$1" want="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 25 -H "Cache-Control: no-cache" "$(bust "$url")")
  if [ "$code" != "$want" ]; then
    echo "FAIL [$label] ${url} -> ${code} (beklenen ${want})"; fails=$((fails+1))
  else
    echo "ok   [$label] ${url} -> ${code}"
  fi
}

check_content() { # url  min_bytes  label
  local url="$1" min="$2" label="$3"
  local body len err
  body=$(curl -s --max-time 25 -H "Cache-Control: no-cache" "$(bust "$url")")
  len=${#body}
  err=$(printf '%s' "$body" | grep -oiE "Application error|Internal Server Error|something went wrong|__next_error__|This page could not be found" | head -1)
  if [ -n "$err" ]; then
    echo "FAIL [$label] ${url} -> icerik hatasi: ${err}"; fails=$((fails+1))
  elif [ "$len" -lt "$min" ]; then
    echo "FAIL [$label] ${url} -> icerik cok kisa (${len}B < ${min}B)"; fails=$((fails+1))
  else
    echo "ok   [$label] ${url} -> ${len}B, temiz"
  fi
}

run_all() {
  fails=0
  echo "== Sağlık kontrolü: ${BASE} =="

  # 1) Ana sayfalar — dolu içerik + hata belirteci yok
  check_content "/tr" 40000 "home-tr"
  check_content "/en" 40000 "home-en"
  check_content "/de" 40000 "home-de"

  # 2) Kritik rotalar — final 200 (locale slug 308->200 dahil, -L takip eder)
  for r in /tr/burclar /tr/tarot /tr/numeroloji /tr/consultants /tr/pricing /tr/birth-chart /tr/sinastri /tr/about; do
    check_code "$r" 200 "route"
  done

  # 3) API sağlık + frontend'in fresh yüklemede çağırdığı uçlar
  check_code "/api/health" 200 "api"
  check_code "/api/site_settings/company_brand" 200 "api"
  check_code "/api/menu_items?location=header&is_active=true&locale=tr&nested=true" 200 "api"
  check_code "/api/consultants" 200 "api"

  # 4) Ana sayfanın referans verdiği TÜM _next/static chunk'ları yükleniyor mu
  #    (deploy sonrası HTML/chunk uyumsuzluğu = ChunkLoadError = kırık site)
  local home
  home=$(curl -s --max-time 25 -H "Cache-Control: no-cache" "$(bust /tr)")
  local assets broken=0
  mapfile -t assets < <(printf '%s' "$home" | grep -oE '/_next/static/[^"'"'"' ]+\.(js|css)' | sort -u)
  for a in "${assets[@]}"; do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${BASE}${a}")
    [ "$code" != "200" ] && { echo "FAIL [chunk] ${a} -> ${code}"; broken=$((broken+1)); }
  done
  if [ "$broken" -gt 0 ]; then
    echo "FAIL [chunks] ${broken}/${#assets[@]} static asset kirik (ChunkLoadError riski)"; fails=$((fails+1))
  else
    echo "ok   [chunks] ${#assets[@]}/${#assets[@]} static asset yukleniyor"
  fi

  echo "== Sonuç: ${fails} hata =="
}

# --- Çift geçiş: ilk geçişte hata varsa bekle + tekrar; ikisi de fail ederse alarm ---
run_all
if [ "$fails" -eq 0 ]; then
  exit 0
fi

echo ""
echo ">> İlk geçişte ${fails} hata. Geçici ağ blip'i olabilir; ${RETRY_WAIT}s bekleyip TEKRAR deneniyor..."
sleep "$RETRY_WAIT"
echo ""

run_all
if [ "$fails" -eq 0 ]; then
  echo ">> İkinci geçiş temiz — ilk hata GEÇİCİYDİ (runner↔VPS ağ blip'i). Alarm YOK."
  exit 0
fi

echo ">> İkinci geçiş de ${fails} hata — kalıcı sorun, alarm veriliyor."
exit 1
