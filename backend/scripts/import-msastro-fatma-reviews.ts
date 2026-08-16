import { createHash } from 'node:crypto';

const API = 'https://api.msastro.co/api/advisor/profile/261429/comments';
const EXPECTED_EXTERNAL_COUNT = 1278;
const output = process.argv[2];
const startPage = Number(process.argv[3] || 1);
const endPage = Number(process.argv[4] || 128);

if (!output) throw new Error('output path is required');

type SourceReview = {
  id: number;
  comment: string;
  rate: number;
  created_at: string;
  service?: { title?: string } | null;
  sender?: { name?: string } | null;
};

const sqlString = (value: string) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
const stableUuid = (namespace: string, id: number) => {
  const hex = createHash('sha256').update(`${namespace}:${id}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};

const reviews: SourceReview[] = [];
for (let page = startPage; page <= endPage;) {
  const response = await fetch(`${API}?page=${page}`, {
    headers: {
      accept: 'application/json',
      origin: 'https://msastro.co',
      referer: 'https://msastro.co/',
      'x-app-version': 'default',
    },
  });
  if (response.status === 429) {
    console.log(`page ${page}: rate limited; waiting 65 seconds`);
    await Bun.sleep(65_000);
    continue;
  }
  if (!response.ok) throw new Error(`page ${page}: HTTP ${response.status}`);
  const payload = await response.json() as { data?: SourceReview[] };
  reviews.push(...(payload.data || []));
  console.log(`page ${page}/${endPage}: ${reviews.length} reviews`);
  page += 1;
  await Bun.sleep(1100);
}

const selected = reviews.slice(0, EXPECTED_EXTERNAL_COUNT);
const lines = selected.flatMap((review) => {
  const reviewId = stableUuid('msastro-review', review.id);
  const translationId = stableUuid('msastro-review-i18n', review.id);
  const createdAt = review.created_at.replace('T', ' ').replace('.000000Z', '');
  const name = review.sender?.name || 'MsAstro danışanı';
  const title = review.service?.title || 'Astroloji danışmanlığı';
  return [
    `INSERT INTO reviews (id,target_type,target_id,name,rating,company,profile_href,is_active,is_approved,is_verified,submitted_locale,created_at,updated_at) VALUES (` +
      `${sqlString(reviewId)},'consultant',@FATMA_CONSULTANT,${sqlString(name)},${Number(review.rate) || 5},'msastro.co',${sqlString(`https://msastro.co/advisor/home#comment-${review.id}`)},1,1,0,'tr',${sqlString(createdAt)},${sqlString(createdAt)}) ` +
      `ON DUPLICATE KEY UPDATE target_id=VALUES(target_id),name=VALUES(name),rating=VALUES(rating),company=VALUES(company),profile_href=VALUES(profile_href),is_active=1,is_approved=1,is_verified=0;`,
    `INSERT INTO review_i18n (id,review_id,locale,title,comment) VALUES (` +
      `${sqlString(translationId)},${sqlString(reviewId)},'tr',${sqlString(title)},${sqlString(review.comment)}) ` +
      `ON DUPLICATE KEY UPDATE title=VALUES(title),comment=VALUES(comment);`,
  ];
});

await Bun.write(output, `${lines.join('\n')}\n`);
console.log(`wrote ${selected.length} reviews to ${output}`);
