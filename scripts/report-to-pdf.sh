#!/usr/bin/env bash
# Markdown raporu → GoldMood marka stilinde HTML + PDF.
#
# Kullanım: scripts/report-to-pdf.sh reports/DOSYA.md
# Çıktı:    reports/DOSYA-rapor.html ve reports/DOSYA.pdf
#
# Neden script: reports/ altındaki raporların PDF'leri elle üretilmişti, deseni
# tekrarlanabilir değildi. Yeni rapor yazınca tek komutla aynı görünümde çıksın.
set -euo pipefail

SRC="${1:?kullanim: report-to-pdf.sh <markdown-dosyasi>}"
[ -f "$SRC" ] || { echo "Dosya yok: $SRC"; exit 1; }

BASE="${SRC%.md}"
HTML="${BASE}-rapor.html"
PDF="${BASE}.pdf"
TITLE="$(head -1 "$SRC" | sed 's/^#\s*//')"
CSS="$(mktemp --suffix=.css)"
trap 'rm -f "$CSS"' EXIT

# Marka paleti mevcut raporlarla aynı: krem zemin, mürekkep metin, altın vurgu.
cat > "$CSS" <<'CSSEOF'
@page { size: A4; margin: 16mm 14mm; }
/* pandoc --standalone başlığı ayrıca <header> olarak basıyor; markdown'ın kendi
   H1'i zaten var → başlık iki kez görünüyordu. Metadata <title> için lazım, gizle. */
header#title-block-header { display: none; }
body {
  color: #171324; background: #f7f1e8;
  font-family: "DejaVu Sans", Inter, Arial, sans-serif;
  line-height: 1.55; font-size: 10.5pt; margin: 0;
}
h1 {
  color: #4a2c72; font-size: 22pt; margin: 0 0 4mm;
  border-bottom: 2.5px solid #c9a227; padding-bottom: 3mm;
}
h2 {
  color: #4a2c72; font-size: 14pt; margin: 9mm 0 3mm;
  border-left: 4px solid #c9a227; padding-left: 3mm;
  page-break-after: avoid;
}
h3 { color: #6b4a91; font-size: 11.5pt; margin: 6mm 0 2mm; page-break-after: avoid; }
p, li { orphans: 3; widows: 3; }
strong { color: #3b2159; }
code {
  background: #efe4d4; padding: 1px 4px; border-radius: 3px;
  font-family: "DejaVu Sans Mono", monospace; font-size: 9pt;
}
pre {
  background: #1b1230; color: #f4e8c8; padding: 4mm; border-radius: 6px;
  font-size: 8.5pt; overflow-wrap: break-word; white-space: pre-wrap;
  page-break-inside: avoid;
}
pre code { background: none; color: inherit; padding: 0; }
table {
  border-collapse: collapse; width: 100%; margin: 3mm 0 5mm;
  font-size: 9.5pt; page-break-inside: avoid;
}
th {
  background: #4a2c72; color: #fff8df; text-align: left;
  padding: 2mm 2.5mm; font-weight: 700;
}
td { padding: 2mm 2.5mm; border-bottom: 1px solid #ddd0bb; vertical-align: top; }
tr:nth-child(even) td { background: #f1e7d8; }
blockquote {
  margin: 4mm 0; padding: 3mm 4mm; background: #f1e7d8;
  border-left: 4px solid #c9a227; page-break-inside: avoid;
}
blockquote p { margin: 0; }
hr { border: none; border-top: 1px solid #d6c7ae; margin: 7mm 0; }
a { color: #6b4a91; }
CSSEOF

pandoc "$SRC" \
  --from=gfm --to=html5 --standalone \
  --metadata title="$TITLE" \
  --css="$CSS" \
  --embed-resources \
  -o "$HTML"

weasyprint "$HTML" "$PDF"

echo "HTML: $HTML"
echo "PDF : $PDF ($(du -h "$PDF" | cut -f1))"
