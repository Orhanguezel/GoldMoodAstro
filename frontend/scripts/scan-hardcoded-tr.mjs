import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * GoldMoodAstro — Hardcoded Turkish Scanner (i18n §v2-SCOPE-EXT)
 *
 * "İngilizce çalışmayan yerler" kök neden envanteri: frontend bileşenlerinde
 * i18n'e bağlı OLMAYAN, koda gömülü Türkçe UI metinlerini bulur.
 *
 * Strateji:
 *  - YÜKSEK güven: Türkçe'ye özgü karakter içeren string/JSX-text
 *    (ı ğ ş ö ç İ Ğ Ü Ş Ö Ç) — İngilizce'de pratikte sıfır yanlış pozitif.
 *  - DÜŞÜK güven: ASCII-only Türkçe stopword (Kaydet/Sil/Ekle...) — ayrı raporlanır.
 *  - UI bağlamı önceliklendirilir; import/className/key/url/comment hariç.
 *
 * Kullanım:
 *   node scripts/scan-hardcoded-tr.mjs            # özet + exit kodu (CI guard)
 *   node scripts/scan-hardcoded-tr.mjs --report   # doc/raporlar/'a md rapor
 *   node scripts/scan-hardcoded-tr.mjs --update-baseline
 */

const TR_CHARS = /[ığüşöçİĞÜŞÖÇ]/;
// ASCII-only Türkçe UI kelimeleri (düşük güven, kelime sınırı eşleşmesi)
const TR_ASCII_WORDS = /\b(Kaydet|Kaydedildi|Sil|Silindi|Ekle|Eklendi|Gonder|Iptal|Ara|Yukle|Duzenle|Kapat|Geri|Ileri|Evet|Hayir|Basarili|Hata|Zorunlu|Secin|Devam|Vazgec|Onayla|Guncelle|Olustur|Listele|Detay|Ayarlar|Cikis|Giris|Hesap|Sifre|Kullanici|Randevu|Danisman|Odeme|Yorum|Bildirim)\b/;

const cwd = process.cwd();
const frontendRoot = path.basename(cwd) === 'frontend' ? cwd : path.join(cwd, 'frontend');
const projectRoot = path.basename(frontendRoot) === 'frontend' ? path.dirname(frontendRoot) : cwd;
const baselinePath = path.join(frontendRoot, 'scripts/hardcoded-tr-baseline.json');
const reportPath = path.join(projectRoot, 'doc/raporlar/hardcoded-tr-inventory.md');
const shouldUpdateBaseline = process.argv.includes('--update-baseline');
const shouldWriteReport = process.argv.includes('--report');

const IGNORE_PATTERNS = [
  /\.test\.tsx?$/, /\.spec\.tsx?$/,
  /\/scripts\//,
  /integrations\/shared\/legal\.ts$/,   // legal düz metin (customPages'e taşınacak, ayrı iş)
];

// Satır UI metni TAŞIMAZ — eler (yanlış pozitif azalt)
const NON_UI_LINE = /^\s*(\/\/|\*|\/\*|import\b|export\s+(type|interface)|from\s+['"]|const\s+\w+\s*=\s*require)/;
const NON_UI_TOKEN = /(className=|class=|key=|data-[\w-]+=|href=|src=|to=|path:|slug|\.svg|\.png|\.webp|https?:\/\/|aria-hidden|role=)/;

// Yüksek-değer UI bağlamları (öncelik işareti)
const UI_CONTEXT = /(toast\.\w+\(|placeholder=|aria-label=|[^a-z]label=|title=|alert\(|confirm\(|\.message\s*=|>\s*[^<{]*[A-ZİĞÜŞÖÇ])/;

function priorityOf(rel) {
  const p = rel.toLowerCase();
  if (/booking|checkout|payment|odeme|\/auth\/|login|register|consultant/.test(p)) return 'P1';
  if (/profile|dashboard|pricing|\/daily|\/me\//.test(p)) return 'P2';
  if (/zodiac|tarot|numeroloji|ruya|kahve|sinastri|yildizname|birth|burc/.test(p)) return 'P2';
  return 'P3';
}

function extractStrings(line) {
  const out = [];
  // '...' "..." `...`
  const re = /'([^'\\]|\\.){2,}'|"([^"\\]|\\.){2,}"|`([^`\\]|\\.){2,}`/g;
  let m;
  while ((m = re.exec(line))) out.push(m[0]);
  // JSX text: >Metin< (kaba)
  const jsx = />([^<>{}\n]{2,})</g;
  while ((m = jsx.exec(line))) out.push(m[1]);
  return out;
}

async function scan() {
  const files = await glob('src/**/*.{ts,tsx}', {
    cwd: frontendRoot,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    absolute: true,
  });

  const perFile = {}; // rel -> { high:[], low:[], priority }
  let high = 0, low = 0;

  for (const abs of files) {
    const rel = path.relative(projectRoot, abs).replace(/\\/g, '/');
    if (IGNORE_PATTERNS.some((re) => re.test(rel))) continue;
    const lines = fs.readFileSync(abs, 'utf8').split('\n');

    lines.forEach((line, i) => {
      if (NON_UI_LINE.test(line)) return;
      const tokens = extractStrings(line);
      if (!tokens.length) return;
      const lineNonUi = NON_UI_TOKEN.test(line);
      for (const tok of tokens) {
        const isHigh = TR_CHARS.test(tok);
        const isLow = !isHigh && TR_ASCII_WORDS.test(tok);
        if (!isHigh && !isLow) continue;
        // className/url içeren token'ı ele (yanlış pozitif)
        if (lineNonUi && !UI_CONTEXT.test(line)) continue;
        const entry = { line: i + 1, text: tok.slice(0, 80).replace(/\s+/g, ' ') };
        perFile[rel] ??= { high: [], low: [], priority: priorityOf(rel) };
        if (isHigh) { perFile[rel].high.push(entry); high++; }
        else { perFile[rel].low.push(entry); low++; }
      }
    });
  }

  const filesArr = Object.entries(perFile)
    .map(([rel, v]) => ({ rel, ...v, count: v.high.length + v.low.length }))
    .sort((a, b) => (a.priority + (1000 - a.count)).localeCompare?.(b.priority) ?? 0)
    .sort((a, b) => a.priority.localeCompare(b.priority) || b.count - a.count);

  const summary = {
    totalFiles: filesArr.length,
    highFindings: high,
    lowFindings: low,
    byPriority: { P1: 0, P2: 0, P3: 0 },
  };
  for (const f of filesArr) summary.byPriority[f.priority] += f.count;

  // Konsol özeti
  console.log(`Hardcoded-TR scan: ${filesArr.length} dosya, ${high} yüksek + ${low} düşük güven bulgu`);
  console.log(`  P1 (booking/consultant/auth/ödeme): ${summary.byPriority.P1}`);
  console.log(`  P2 (profile/dashboard/divination):  ${summary.byPriority.P2}`);
  console.log(`  P3 (diğer):                          ${summary.byPriority.P3}`);

  if (shouldWriteReport) {
    const md = [];
    md.push('# Hardcoded Türkçe Envanteri — i18n §v2-SCOPE-EXT', '');
    md.push(`> Üretildi: \`node scripts/scan-hardcoded-tr.mjs --report\` · ${new Date().toISOString().slice(0, 10)}`);
    md.push(`> Toplam: ${filesArr.length} dosya · ${high} yüksek (Türkçe-karakter) + ${low} düşük (ASCII kelime) güven`, '');
    md.push('Amaç: bu dosyalardaki gömülü Türkçe `ui_*` anahtarına çıkarılacak (TR+EN seed).', '');
    for (const P of ['P1', 'P2', 'P3']) {
      const bucket = filesArr.filter((f) => f.priority === P);
      if (!bucket.length) continue;
      md.push(`## ${P} (${summary.byPriority[P]} bulgu, ${bucket.length} dosya)`, '');
      md.push('| Dosya | Yük. | Düş. | Örnek |', '|---|---|---|---|');
      for (const f of bucket) {
        const sample = (f.high[0] || f.low[0]);
        md.push(`| \`${f.rel}\` | ${f.high.length} | ${f.low.length} | L${sample.line}: ${sample.text.replace(/\|/g, '\\|')} |`);
      }
      md.push('');
    }
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, md.join('\n'));
    console.log(`Rapor: ${path.relative(projectRoot, reportPath)}`);
  }

  const baselineCounts = Object.fromEntries(filesArr.map((f) => [f.rel, f.count]));
  if (shouldUpdateBaseline) {
    fs.writeFileSync(baselinePath, JSON.stringify(baselineCounts, null, 2) + '\n');
    console.log(`Baseline güncellendi: ${path.relative(projectRoot, baselinePath)}`);
    return 0;
  }

  // CI guard: baseline varsa, herhangi bir dosyada artış = fail
  if (fs.existsSync(baselinePath)) {
    const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const regressions = filesArr.filter((f) => f.count > (base[f.rel] ?? 0));
    if (regressions.length) {
      console.error(`\n❌ Hardcoded-TR ARTIŞI (${regressions.length} dosya) — yeni gömülü Türkçe eklenemez:`);
      regressions.forEach((f) => console.error(`  ${f.rel}: ${base[f.rel] ?? 0} → ${f.count}`));
      return 1;
    }
    console.log('✅ Hardcoded-TR guard: baseline aşılmadı (azalma serbest).');
  } else {
    console.log('ℹ️ Baseline yok — `--update-baseline` ile oluştur (ilk envanter).');
  }
  return 0;
}

scan().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1); });
