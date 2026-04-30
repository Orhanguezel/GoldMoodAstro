const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
const key = String(process.env.INDEXNOW_KEY || process.env.NEXT_PUBLIC_INDEXNOW_KEY || '').trim();

if (!key) {
  console.error('INDEXNOW_KEY is required.');
  process.exit(1);
}

const host = new URL(siteUrl).host;
const keyLocation = `${siteUrl}/${key}.txt`;
const urlList = [
  `${siteUrl}/`,
  `${siteUrl}/tr`,
  `${siteUrl}/tr/consultants`,
  `${siteUrl}/tr/blog`,
  `${siteUrl}/tr/burclar`,
  `${siteUrl}/tr/sinastri`,
  `${siteUrl}/tr/tarot`,
  `${siteUrl}/tr/numeroloji`,
];

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

const body = await response.text();

if (!response.ok) {
  console.error(`IndexNow ping failed: ${response.status} ${response.statusText}`);
  if (body) console.error(body);
  process.exit(1);
}

console.log(`IndexNow ping accepted for ${urlList.length} URLs.`);
