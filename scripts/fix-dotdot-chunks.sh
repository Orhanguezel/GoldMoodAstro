#!/usr/bin/env bash
# Turbopack chunk adlarını rastgele üretir ve alfabede '.' de var. Ad tam olarak nokta
# ile biterse dosya "<ad>..js" olur. Next'in static dosya handler'ı URL path'inde ".."
# görünce path-traversal sanıp 404 döner → o chunk ASLA servis edilemez. Chunk paylaşımlı
# ise ona referans veren tüm sayfalar tarayıcıda ChunkLoadError ile patlar (dosya diskte
# durduğu için "bayat chunk" sanılır; rebuild dışında belirti vermez).
#
# Bu script build'den sonra çalışır: bozuk adlı chunk'ları AYNI UZUNLUKTA güvenli isme
# çevirir ve .next içindeki tüm referansları günceller. Uzunluk korunur çünkü .rsc Flight
# payload'larında satır uzunluğu ön ekleri var — bir byte kayması payload'u bozar.
#
# Kullanım: scripts/fix-dotdot-chunks.sh <app_dizini>   (ör. admin_panel)
set -euo pipefail

app_dir="${1:?kullanim: fix-dotdot-chunks.sh <app_dizini> [dist_dizin_adi]}"
# 2. argüman: build çıktısının dizin adı (varsayılan .next). Deploy geçici bir
# dizine build edip sonra takas ettiği için burada da parametreli olmalı.
next_dir="$app_dir/${2:-.next}"
chunks_dir="$next_dir/static/chunks"

[ -d "$chunks_dir" ] || { echo "[fix-dotdot] $chunks_dir yok, atlandi"; exit 0; }

mapfile -t bad < <(find "$chunks_dir" -maxdepth 1 -type f -name '*..*' -printf '%f\n' | sort)

if [ "${#bad[@]}" -eq 0 ]; then
  echo "[fix-dotdot] $app_dir: cift noktali chunk yok"
  exit 0
fi

echo "[fix-dotdot] $app_dir: ${#bad[@]} bozuk chunk bulundu"

for old in "${bad[@]}"; do
  # Her ".." → "x." : nokta sayısı ve toplam uzunluk aynı kalır, ".." kalmaz.
  new="${old//../x.}"
  if [ "${#old}" -ne "${#new}" ]; then
    echo "[fix-dotdot] HATA: uzunluk degisti ($old -> $new), atlandi"
    continue
  fi
  if [ -e "$chunks_dir/$new" ]; then
    echo "[fix-dotdot] HATA: hedef zaten var ($new), atlandi"
    continue
  fi

  mv "$chunks_dir/$old" "$chunks_dir/$new"

  # Referanslar: build manifest'leri, RSC payload'ları, prerender HTML'leri.
  export OLD="$old" NEW="$new"
  refs="$(grep -rl --binary-files=text -F -- "$OLD" "$next_dir" 2>/dev/null | wc -l || true)"
  grep -rlZ --binary-files=text -F -- "$OLD" "$next_dir" 2>/dev/null \
    | xargs -0 -r perl -pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' || true
  echo "[fix-dotdot]   $old -> $new  ($refs referans dosyasi guncellendi)"
done

remaining="$(find "$chunks_dir" -maxdepth 1 -type f -name '*..*' | wc -l)"
if [ "$remaining" -ne 0 ]; then
  echo "[fix-dotdot] HATA: hala $remaining bozuk chunk var"
  exit 1
fi
echo "[fix-dotdot] $app_dir: tamam"
