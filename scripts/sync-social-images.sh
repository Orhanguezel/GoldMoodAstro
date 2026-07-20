#!/usr/bin/env bash
# GoldMoodAstro — sosyal medya gorsellerini DOGRULA + SUNUCUYA TASI + CANLIDA KONTROL ET.
#
# NEDEN VAR: `deploy/deploy.sh` rsync'te `backend/uploads/` HARIC tutuyor (satir 52) —
# kullanici yuklemeleri deploy'da silinmesin diye bilincli bir karar. Yani gorseller
# normal deploy ile sunucuya GITMEZ; ayrica tasinmalari gerekir. Codex gorselleri lokale
# uretiyor, bu adim atlaninca canlida 404 kaliyor ve sosyal medya motoru o gunleri atliyor.
# Ilk iki teslimatta bu iki kez yasandi.
#
# Kullanim (repo kokunden):
#   ./scripts/sync-social-images.sh            # dogrula + tasi + kontrol
#   ./scripts/sync-social-images.sh --check    # sadece dogrula, tasima
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadi"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a
KEY="${SSH_KEY/#\~/$HOME}"
SITE="${PUBLIC_SITE_URL:-https://goldmoodastro.com}"
CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

cd "$ROOT/backend/uploads"

echo "==> 1) Yerel dogrulama (olcu + okunabilirlik)"
python3 - <<'PY'
from PIL import Image
import glob, sys, os
bad = []
files = sorted(glob.glob("topics/*.png") + glob.glob("symbols/**/*.png", recursive=True))
for p in files:
    try:
        im = Image.open(p); im.load()
    except Exception as e:
        bad.append((p, f"acilamadi: {e}")); continue
    if im.size != (1024, 1024):
        bad.append((p, f"olcu {im.size}"))
print(f"   {len(files)} gorsel tarandi, {len(bad)} sorunlu")
for p, why in bad:
    print(f"   ❌ {p} — {why}")
sys.exit(1 if bad else 0)
PY

echo "==> 2) Slug eslesmesi (DB ile)"
python3 - <<PY
import json, os, urllib.request, sys
def api(path):
    with urllib.request.urlopen("$SITE/api" + path, timeout=25) as r:
        return json.load(r)["data"]
for setname, path in (("coffee", "/coffee/symbols?locale=tr"), ("dream", "/dreams/symbols?locale=tr")):
    d = "symbols/" + setname
    if not os.path.isdir(d):
        print(f"   {setname}: klasor yok, atlandi"); continue
    slugs = {x["slug"] for x in api(path)}
    have = {f[:-4] for f in os.listdir(d) if f.endswith(".png")}
    orphan = sorted(have - slugs)
    print(f"   {setname}: {len(have)}/{len(slugs)} uretilmis" + (f"  ⚠️ DB'de olmayan: {orphan}" if orphan else "  ✅"))
    if orphan:
        print("      (bu dosyalar motorda ASLA kullanilmaz — slug DB ile birebir olmali)")
PY

if [[ $CHECK_ONLY == 1 ]]; then echo "==> --check: tasima yapilmadi"; exit 0; fi

echo "==> 3) Sunucuya tasi"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_HOST" \
  "mkdir -p /var/www/goldmoodastro/backend/uploads/{topics,symbols}" </dev/null
rsync -az -e "ssh -i $KEY" topics/ "$VPS_USER@$VPS_HOST:/var/www/goldmoodastro/backend/uploads/topics/"
rsync -az -e "ssh -i $KEY" symbols/ "$VPS_USER@$VPS_HOST:/var/www/goldmoodastro/backend/uploads/symbols/"
echo "   gonderildi"

echo "==> 4) Canlida dogrula"
fail=0; total=0
while IFS= read -r f; do
  total=$((total+1))
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "$SITE/uploads/$f")
  [[ "$code" == "200" ]] || { echo "   ❌ $code /uploads/$f"; fail=$((fail+1)); }
done < <(find topics symbols -name '*.png' | sed 's|^\./||')
echo "   $((total-fail))/$total canlida erisilebilir"
[[ $fail -eq 0 ]] || exit 1

echo "==> ✅ Tamam. Motoru calistir:"
echo "   cd ../ekosistem-sosyal-medya/backend && bun run scripts/goldmood-monthly-content.ts --dry --days 21"
