const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
const key = String(process.env.INDEXNOW_KEY || process.env.NEXT_PUBLIC_INDEXNOW_KEY || '').trim();
const mode = String(process.argv[2] || 'core').trim();
const isDryRun = process.argv.includes('--dry-run');

const locales = ['tr', 'en', 'de'];
const zodiacSigns = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

function dailyZodiacUrls(): string[] {
  return locales.flatMap((locale) =>
    zodiacSigns.map((sign) => `${siteUrl}/${locale}/burclar/${sign}/bugun`),
  );
}

function coreUrls(): string[] {
  return [
    `${siteUrl}/`,
    `${siteUrl}/tr`,
    `${siteUrl}/tr/consultants`,
    `${siteUrl}/tr/blog`,
    `${siteUrl}/tr/burclar`,
    `${siteUrl}/tr/sinastri`,
    `${siteUrl}/tr/tarot`,
    `${siteUrl}/tr/numeroloji`,
  ];
}

function urlListForMode(): string[] {
  if (mode === 'daily-zodiac') return dailyZodiacUrls();
  if (mode === 'all') return [...coreUrls(), ...dailyZodiacUrls()];
  if (mode === 'core') return coreUrls();

  console.error(`Unknown IndexNow mode: ${mode}`);
  console.error('Usage: bun scripts/indexnow-ping.ts [core|daily-zodiac|all] [--dry-run]');
  process.exit(1);
}

if (!key) {
  console.error('INDEXNOW_KEY is required.');
  process.exit(1);
}

const host = new URL(siteUrl).host;
const keyLocation = `${siteUrl}/${key}.txt`;
const urlList = urlListForMode();
const payload = {
  host,
  key,
  keyLocation,
  urlList,
};

if (isDryRun) {
  console.log(JSON.stringify({ mode, ...payload }, null, 2));
  process.exit(0);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

const body = await response.text();

if (!response.ok) {
  console.error(`IndexNow ping failed: ${response.status} ${response.statusText}`);
  if (body) console.error(body);
  process.exit(1);
}

console.log(`IndexNow ${mode} ping accepted for ${urlList.length} URLs.`);
