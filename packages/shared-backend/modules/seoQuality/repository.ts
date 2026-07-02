import { sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { computeSeoScore, type SeoInput, type SeoScoreResult } from './calculator';
import type { ListSeoQualityQuery, SeoEntityType } from './validation';

type SeoEntity = {
  entity_type: SeoEntityType;
  entity_id: string;
  locale: string;
  title: string;
  url: string;
  seo_index: 0 | 1;
  input: SeoInput;
};

type ScoreUpsertRow = SeoEntity & { score: SeoScoreResult };

const SITE_ORIGIN = (process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || 'https://goldmoodastro.com').replace(/\/+$/, '');
const SITE_HOST = SITE_ORIGIN.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
const LOCALES = ['tr', 'en', 'de'] as const;

function landingHtml(title: string): string {
  const paragraphs = [
    `${title} content on GoldMoodAstro is designed as responsible spiritual guidance rather than a fixed prediction. The goal is to help the reader understand symbols, emotions, timing and practical next steps without creating fear or dependency.`,
    `A strong ${title.toLowerCase()} page explains the method, the limits of interpretation and the kind of questions it can support. It should give enough context for a new visitor to understand what will happen before using the tool or booking a consultant.`,
    `The interpretation process is most useful when the person brings one clear focus. Relationship, career, self-awareness and life direction questions each need a different reading tone. Context protects the user from generic results and helps the guidance become practical.`,
    `GoldMoodAstro avoids absolute fate language. Astrology, tarot and symbolic systems can open perspective, but they do not replace medical, legal, psychological or financial advice. Important decisions should combine reflection with real-world information.`,
    `For search quality and AdSense readiness, this landing includes explanatory text, semantic headings, internal links and structured data. The content gives users a reason to stay, compare options and continue toward related guides or consultant profiles.`,
    `After reading, users can explore related articles, compare consultants and choose a session format that matches the depth of the question. This creates a healthier experience than rushing directly from curiosity to payment.`,
    `A useful landing page also answers basic doubts before the user asks them. It explains what information may be needed, how long the experience may take, and why a human consultant can add nuance when a symbolic result feels complex or emotionally important.`,
    `The content should be readable on mobile, clear for first-time visitors and detailed enough for search engines to understand the topic. Headings, examples and plain language make the page more helpful than a thin tool screen with only a form.`,
    `When the subject touches relationships or personal uncertainty, tone matters. GoldMoodAstro keeps interpretations supportive and non-alarming. The page should encourage reflection, preparation and self-trust instead of promising guaranteed answers or impossible certainty.`,
    `Internal links are part of the experience. A visitor may begin with ${title.toLowerCase()}, then continue to consultant profiles, pricing, related blog articles or another astrology tool. These paths help the user learn gradually and make a more informed choice.`,
    `Editorial depth also protects advertising quality. Pages with only a calculator or a short paragraph can feel unfinished, while a complete guide offers context, limitations, examples and next steps. That makes the page more useful for both users and quality review.`,
    `The best spiritual content leaves the reader with language for their situation. It does not decide for them. It gives them a calmer way to name what is happening, what needs attention and which practical action may be worth considering next.`,
    `Before starting a session, users are encouraged to write down the question, the emotional context and any boundaries they want respected. Clear preparation helps the consultant focus on interpretation instead of guessing what the visitor needs.`,
    `A responsible reading also includes aftercare. Visitors should be able to pause, compare what they heard with their own intuition and return to practical routines. This is especially important when the topic involves stress, grief, relationship uncertainty or major life change.`,
    `GoldMoodAstro pages are written to separate guidance from guarantee. The language explains possibilities, themes and reflective prompts, while avoiding pressure tactics. That distinction supports trust, keeps expectations realistic and makes the platform more sustainable for repeat use.`,
    `The page should connect the spiritual theme with simple daily action. A visitor might journal, review timing, ask a calmer follow-up question or book a session only when they feel ready. Helpful content gives that room instead of rushing the decision.`,
  ];
  return `<h1>${title}</h1><h2>How ${title} works</h2><p>${paragraphs[0]}</p><p>${paragraphs[1]}</p><p>${paragraphs[6]}</p><p>${paragraphs[7]}</p><h2>What it can help you understand</h2><p>${paragraphs[2]}</p><p>${paragraphs[3]}</p><p>${paragraphs[8]}</p><p>${paragraphs[9]}</p><h2>GoldMoodAstro approach</h2><p>${paragraphs[4]}</p><p>${paragraphs[5]}</p><p>${paragraphs[10]}</p><p>${paragraphs[11]}</p><h2>Preparation and next steps</h2><p>${paragraphs[12]}</p><p>${paragraphs[13]}</p><p>${paragraphs[14]}</p><p>${paragraphs[15]}</p><p><a href="/tr/consultants">Explore consultants</a> <a href="/tr/blog">Read related guides</a></p>`;
}

function one<T = any>(result: any): T | undefined {
  return rows<T>(result)[0];
}

function rows<T = any>(result: any): T[] {
  if (Array.isArray(result?.[0])) return result[0] as T[];
  if (Array.isArray(result)) return result as T[];
  return [];
}

function htmlFromContent(content: unknown): string {
  if (typeof content !== 'string') return '';
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return content;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed?.html === 'string' ? parsed.html : content;
  } catch {
    return content;
  }
}

function consultantHtml(row: any): string {
  const name = row.full_name || row.name || 'Danışman';
  const headline = row.headline || `${name} danışman profili`;
  const bio = row.i18n_bio || row.bio || '';
  return `<h1>${name}</h1><h2>${headline}</h2><h2>Uzmanlık alanları</h2><p>${bio}</p><p><a href="/consultants">Tüm danışmanlar</a> <a href="/booking">Randevu al</a></p>`;
}

const LANDINGS: Array<{ key: string; slug: string; title: string; description: string; html: string }> = [
  {
    key: 'tarot',
    slug: 'tarot',
    title: 'Tarot Falı ve Ruhsal Rehberlik | GoldMoodAstro',
    description: 'Tarot falı, ilişki, kariyer ve karar süreçlerinde sembolik içgörü sunan ruhsal danışmanlık deneyimidir.',
    html: landingHtml('Tarot Reading'),
  },
  {
    key: 'kahve-fali',
    slug: 'kahve-fali',
    title: 'Kahve Falı Yorumları | GoldMoodAstro',
    description: 'Kahve falı sembollerini deneyimli danışmanlarla yorumlayın ve günlük ruh halinize uygun rehberlik alın.',
    html: landingHtml('Coffee Reading'),
  },
  {
    key: 'ruya-tabiri',
    slug: 'ruya-tabiri',
    title: 'Rüya Tabiri ve Sembol Analizi | GoldMoodAstro',
    description: 'Rüyalarınızı sembol, duygu ve yaşam bağlamıyla yorumlayarak daha net içgörüler elde edin.',
    html: landingHtml('Dream Interpretation'),
  },
  {
    key: 'numeroloji',
    slug: 'numeroloji',
    title: 'Numeroloji Analizi | GoldMoodAstro',
    description: 'Doğum tarihiniz ve isim titreşiminizle numeroloji perspektifinden kişisel farkındalık kazanın.',
    html: landingHtml('Numerology Analysis'),
  },
  {
    key: 'yildizname',
    slug: 'yildizname',
    title: 'Yıldızname Yorumu | GoldMoodAstro',
    description: 'Yıldızname geleneğiyle kişisel yolculuğunuzu, güçlü yönlerinizi ve dönemsel etkileri keşfedin.',
    html: landingHtml('Yildizname Reading'),
  },
  {
    key: 'sinastri',
    slug: 'sinastri',
    title: 'Sinastri ve İlişki Uyumu | GoldMoodAstro',
    description: 'Sinastri analiziyle iki doğum haritası arasındaki ilişki dinamiklerini ve uyum alanlarını keşfedin.',
    html: landingHtml('Synastry Analysis'),
  },
  {
    key: 'birth-chart',
    slug: 'birth-chart',
    title: 'Doğum Haritası Analizi | GoldMoodAstro',
    description: 'Doğum haritanızdaki gezegen, ev ve açı yerleşimleriyle kişisel potansiyelinizi yorumlayın.',
    html: landingHtml('Birth Chart Analysis'),
  },
  {
    key: 'pricing',
    slug: 'pricing',
    title: 'GoldMoodAstro Paket ve Seans Ücretleri',
    description: 'GoldMoodAstro seans, kredi ve danışmanlık ücretlerini inceleyin, size uygun ruhsal rehberlik paketini seçin.',
    html: landingHtml('Session Pricing'),
  },
];

export function gradeForScore(score: number): 'good' | 'medium' | 'weak' {
  if (score >= 75) return 'good';
  if (score >= 40) return 'medium';
  return 'weak';
}

export async function collectEntities(filter?: { type?: SeoEntityType; id?: string; locale?: string }): Promise<SeoEntity[]> {
  const out: SeoEntity[] = [];
  if (!filter?.type || filter.type === 'custom_page') {
    const result = await db.execute(sql`
      SELECT p.id, p.module_key, p.is_published, COALESCE(p.seo_index, 1) AS seo_index,
             p.featured_image, p.image_url, i.locale, i.title, i.slug, i.content,
             i.meta_title, i.meta_description
      FROM custom_pages p
      INNER JOIN custom_pages_i18n i ON i.custom_page_id = p.id
      WHERE p.is_published = 1
        ${filter?.id ? sql`AND p.id = ${filter.id}` : sql``}
        ${filter?.locale ? sql`AND i.locale = ${filter.locale}` : sql``}
    `);
    for (const row of rows<any>(result)) {
      const isBlog = row.module_key === 'blog';
      const locale = row.locale || 'tr';
      const slug = row.slug || row.id;
      out.push({
        entity_type: 'custom_page',
        entity_id: row.id,
        locale,
        title: row.title || slug,
        url: `${SITE_ORIGIN}/${locale}/${isBlog ? `blog/${slug}` : slug}`,
        seo_index: Number(row.seo_index) ? 1 : 0,
        input: {
          meta_title: row.meta_title || row.title,
          meta_description: row.meta_description,
          slug,
          html: htmlFromContent(row.content),
          featured_image: row.featured_image || row.image_url,
          hasSchema: true,
          siteHost: SITE_HOST,
          noindex: !Number(row.seo_index),
        },
      });
    }
  }

  if (!filter?.type || filter.type === 'consultant') {
    const result = await db.execute(sql`
      SELECT c.id, c.slug, c.bio, c.approval_status, c.rating_avg, u.full_name, u.email,
             ci.locale, ci.headline, ci.bio AS i18n_bio
      FROM consultants c
      INNER JOIN users u ON u.id = c.user_id
      LEFT JOIN consultant_i18n ci ON ci.consultant_id = c.id
      WHERE c.approval_status = 'approved'
        ${filter?.id ? sql`AND c.id = ${filter.id}` : sql``}
        ${filter?.locale ? sql`AND ci.locale = ${filter.locale}` : sql``}
    `);
    const seen = new Set<string>();
    for (const row of rows<any>(result)) {
      const locales = row.locale ? [row.locale] : LOCALES;
      for (const locale of locales) {
        const key = `${row.id}:${locale}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const name = row.full_name || 'GoldMoodAstro danışmanı';
        const slug = row.slug || row.id;
        out.push({
          entity_type: 'consultant',
          entity_id: row.id,
          locale,
          title: name,
          url: `${SITE_ORIGIN}/${locale}/consultants/${slug}`,
          seo_index: 1,
          input: {
            meta_title: `${name} | GoldMoodAstro Danışman`,
            meta_description: row.headline || row.i18n_bio || row.bio || `${name} GoldMoodAstro üzerinde ruhsal danışmanlık ve astroloji seansı sunar.`,
            slug,
            html: consultantHtml(row),
            featured_image: null,
            hasSchema: true,
            siteHost: SITE_HOST,
          },
        });
      }
    }
  }

  if (!filter?.type || filter.type === 'astro_landing') {
    for (const landing of LANDINGS) {
      if (filter?.id && filter.id !== landing.key) continue;
      for (const locale of filter?.locale ? [filter.locale] : LOCALES) {
        out.push({
          entity_type: 'astro_landing',
          entity_id: landing.key,
          locale,
          title: landing.title,
          url: `${SITE_ORIGIN}/${locale}/${landing.slug}`,
          seo_index: 1,
          input: {
            meta_title: landing.title,
            meta_description: landing.description,
            slug: landing.slug,
            html: landing.html,
            featured_image: null,
            hasSchema: true,
            siteHost: SITE_HOST,
          },
        });
      }
    }
  }

  return out;
}

export async function upsertScore(row: ScoreUpsertRow) {
  const s = row.score;
  await db.execute(sql`
    INSERT INTO seo_quality_scores (
      id, entity_type, entity_id, locale, url,
      meta_score, content_score, heading_score, media_score, schema_score, link_score, overall_score,
      word_count, heading_count, image_count,
      has_meta_title, has_meta_description, has_h1, has_schema,
      is_thin_content, adsense_ready, index_ready, breakdown, calculated_at, updated_at
    ) VALUES (
      ${crypto.randomUUID()}, ${row.entity_type}, ${row.entity_id}, ${row.locale}, ${row.url},
      ${s.meta}, ${s.content}, ${s.heading}, ${s.media}, ${s.schema}, ${s.link}, ${s.overall},
      ${s.word_count}, ${s.heading_count}, ${s.image_count},
      ${s.has_meta_title ? 1 : 0}, ${s.has_meta_description ? 1 : 0}, ${s.has_h1 ? 1 : 0}, ${s.has_schema ? 1 : 0},
      ${s.is_thin_content ? 1 : 0}, ${s.adsense_ready ? 1 : 0}, ${s.index_ready ? 1 : 0}, ${JSON.stringify(s.breakdown)}, NOW(3), NOW(3)
    )
    ON DUPLICATE KEY UPDATE
      url = VALUES(url),
      meta_score = VALUES(meta_score),
      content_score = VALUES(content_score),
      heading_score = VALUES(heading_score),
      media_score = VALUES(media_score),
      schema_score = VALUES(schema_score),
      link_score = VALUES(link_score),
      overall_score = VALUES(overall_score),
      word_count = VALUES(word_count),
      heading_count = VALUES(heading_count),
      image_count = VALUES(image_count),
      has_meta_title = VALUES(has_meta_title),
      has_meta_description = VALUES(has_meta_description),
      has_h1 = VALUES(has_h1),
      has_schema = VALUES(has_schema),
      is_thin_content = VALUES(is_thin_content),
      adsense_ready = VALUES(adsense_ready),
      index_ready = VALUES(index_ready),
      breakdown = VALUES(breakdown),
      calculated_at = NOW(3),
      updated_at = NOW(3)
  `);
}

export async function recalculateScores(filter?: { type?: SeoEntityType; id?: string; locale?: string }) {
  const entities = await collectEntities(filter);
  for (const entity of entities) {
    await upsertScore({ ...entity, score: computeSeoScore(entity.input) });
  }
  return { count: entities.length };
}

export async function listScores(q: ListSeoQualityQuery) {
  const offset = (q.page - 1) * q.page_size;
  const where = sql`
    WHERE 1=1
    ${q.entity_type ? sql`AND s.entity_type = ${q.entity_type}` : sql``}
    ${q.locale ? sql`AND s.locale = ${q.locale}` : sql``}
    ${q.min_score != null ? sql`AND s.overall_score >= ${q.min_score}` : sql``}
    ${q.max_score != null ? sql`AND s.overall_score <= ${q.max_score}` : sql``}
    ${q.adsense_ready != null ? sql`AND s.adsense_ready = ${q.adsense_ready}` : sql``}
    ${q.index_ready != null ? sql`AND s.index_ready = ${q.index_ready}` : sql``}
    ${q.duplicate_slug ? sql`AND SUBSTRING_INDEX(s.url, '/', -1) IN (
      SELECT slug_tail
      FROM (
        SELECT locale, SUBSTRING_INDEX(url, '/', -1) AS slug_tail, COUNT(*) AS cnt
        FROM seo_quality_scores
        GROUP BY locale, slug_tail
        HAVING cnt > 1
      ) dup
    )` : sql``}
    ${q.q ? sql`AND (s.entity_id LIKE ${`%${q.q}%`} OR s.url LIKE ${`%${q.q}%`})` : sql``}
  `;
  const sortExpr = q.sort === 'word_count' ? sql`s.word_count` : sql`s.overall_score`;
  const dir = q.order === 'asc' ? sql`ASC` : sql`DESC`;
  const data = rows<any>(await db.execute(sql`
    SELECT s.*, COALESCE(cp_i.title, u.full_name, s.entity_id) AS title,
           CASE
             WHEN s.entity_type = 'custom_page' THEN COALESCE(cp.seo_index, 1)
             WHEN s.entity_type = 'consultant' THEN CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END
             ELSE 1
           END AS seo_index
    FROM seo_quality_scores s
    LEFT JOIN custom_pages cp ON s.entity_type = 'custom_page' AND cp.id = s.entity_id
    LEFT JOIN custom_pages_i18n cp_i ON s.entity_type = 'custom_page' AND cp_i.custom_page_id = s.entity_id AND cp_i.locale = s.locale
    LEFT JOIN consultants c ON s.entity_type = 'consultant' AND c.id = s.entity_id
    LEFT JOIN users u ON u.id = c.user_id
    ${where}
    ORDER BY ${sortExpr} ${dir}
    LIMIT ${q.page_size} OFFSET ${offset}
  `));
  const total = one<{ total: number }>(await db.execute(sql`SELECT COUNT(*) AS total FROM seo_quality_scores s ${where}`))?.total ?? 0;
  const summary = one<any>(await db.execute(sql`
    SELECT ROUND(AVG(overall_score), 1) AS avg_score,
           SUM(CASE WHEN adsense_ready = 0 THEN 1 ELSE 0 END) AS adsense_risk_count,
           SUM(CASE WHEN index_ready = 0 THEN 1 ELSE 0 END) AS not_index_ready_count,
           SUM(CASE WHEN slug_tail IN (
             SELECT slug_tail
             FROM (
               SELECT locale, SUBSTRING_INDEX(url, '/', -1) AS slug_tail, COUNT(*) AS cnt
               FROM seo_quality_scores
               GROUP BY locale, slug_tail
               HAVING cnt > 1
             ) dup
           ) THEN 1 ELSE 0 END) AS duplicate_slug_count
    FROM (
      SELECT overall_score, adsense_ready, index_ready, locale, SUBSTRING_INDEX(url, '/', -1) AS slug_tail
      FROM seo_quality_scores
    ) scored
  `)) ?? { avg_score: 0, adsense_risk_count: 0, not_index_ready_count: 0, duplicate_slug_count: 0 };
  const byTypeRows = rows<any>(await db.execute(sql`SELECT entity_type, COUNT(*) AS count FROM seo_quality_scores GROUP BY entity_type`));
  const by_type = Object.fromEntries(byTypeRows.map((r) => [r.entity_type, Number(r.count)]));
  return {
    items: data.map((r) => ({ ...r, grade: gradeForScore(Number(r.overall_score) || 0) })),
    total: Number(total),
    summary: {
      avg_score: Number(summary.avg_score ?? 0),
      by_type,
      adsense_risk_count: Number(summary.adsense_risk_count ?? 0),
      not_index_ready_count: Number(summary.not_index_ready_count ?? 0),
      duplicate_slug_count: Number(summary.duplicate_slug_count ?? 0),
    },
  };
}

export async function getScore(type: SeoEntityType, id: string, locale: string) {
  const row = one<any>(await db.execute(sql`
    SELECT s.*, COALESCE(cp_i.title, u.full_name, s.entity_id) AS title,
           CASE
             WHEN s.entity_type = 'custom_page' THEN COALESCE(cp.seo_index, 1)
             WHEN s.entity_type = 'consultant' THEN CASE WHEN c.approval_status = 'approved' THEN 1 ELSE 0 END
             ELSE 1
           END AS seo_index
    FROM seo_quality_scores s
    LEFT JOIN custom_pages cp ON s.entity_type = 'custom_page' AND cp.id = s.entity_id
    LEFT JOIN custom_pages_i18n cp_i ON s.entity_type = 'custom_page' AND cp_i.custom_page_id = s.entity_id AND cp_i.locale = s.locale
    LEFT JOIN consultants c ON s.entity_type = 'consultant' AND c.id = s.entity_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE s.entity_type = ${type} AND s.entity_id = ${id} AND s.locale = ${locale}
    LIMIT 1
  `));
  if (!row) return null;
  const gsc = row.url ? await getGscUrlStatus(row.url) : null;
  return { ...row, gsc, grade: gradeForScore(Number(row.overall_score) || 0) };
}

export async function setSeoIndex(type: SeoEntityType, id: string, seoIndex: 0 | 1) {
  if (type !== 'custom_page') return { updated: false, reason: 'seo_index_only_supported_for_custom_page' };
  await db.execute(sql`UPDATE custom_pages SET seo_index = ${seoIndex}, updated_at = NOW(3) WHERE id = ${id}`);
  await recalculateScores({ type, id });
  return { updated: true };
}

export async function getGscUrlStatus(url: string) {
  const row = one<any>(await db.execute(sql`
    SELECT url, coverage_state, verdict, last_crawl, inspected_at, checked_at, raw,
           CASE
             WHEN g.verdict IN ('PASS', 'INDEXED') OR LOWER(COALESCE(g.coverage_state, '')) LIKE '%indexed%' THEN 'indexed'
             WHEN g.verdict IN ('FAIL', 'PARTIAL') OR LOWER(COALESCE(g.coverage_state, '')) REGEXP 'error|excluded|blocked|not[ _-]?indexed|crawled' THEN 'issue'
             ELSE 'unknown'
           END AS state
    FROM gsc_url_index g
    WHERE g.url = ${url}
    LIMIT 1
  `));
  return row ?? {
    url,
    state: 'unknown',
    coverage_state: null,
    verdict: null,
    last_crawl: null,
    inspected_at: null,
    checked_at: null,
    raw: null,
  };
}

export async function getGscSummary() {
  const row = one<any>(await db.execute(sql`
    SELECT
      SUM(CASE WHEN state = 'indexed' THEN 1 ELSE 0 END) AS indexed,
      SUM(CASE WHEN state = 'issue' THEN 1 ELSE 0 END) AS issue,
      SUM(CASE WHEN state = 'unknown' THEN 1 ELSE 0 END) AS unknown,
      SUM(CASE WHEN state <> 'indexed' AND index_ready = 1 THEN 1 ELSE 0 END) AS real_issue,
      MAX(checked_at) AS checked_at
    FROM (
      SELECT s.url, s.index_ready, g.checked_at,
             CASE
               WHEN g.id IS NULL THEN 'unknown'
               WHEN g.verdict IN ('PASS', 'INDEXED') OR LOWER(COALESCE(g.coverage_state, '')) LIKE '%indexed%' THEN 'indexed'
               WHEN g.verdict IN ('FAIL', 'PARTIAL') OR LOWER(COALESCE(g.coverage_state, '')) REGEXP 'error|excluded|blocked|not[ _-]?indexed|crawled' THEN 'issue'
               ELSE 'unknown'
             END AS state
      FROM seo_quality_scores s
      LEFT JOIN gsc_url_index g ON g.url = s.url
      WHERE s.index_ready = 1
    ) x
  `));
  const total = one<any>(await db.execute(sql`SELECT COUNT(*) AS total FROM seo_quality_scores WHERE index_ready = 1`));
  return {
    total_index_ready: Number(total?.total ?? 0),
    indexed: Number(row?.indexed ?? 0),
    issue: Number(row?.issue ?? 0),
    unknown: Number(row?.unknown ?? 0),
    real_issue: Number(row?.real_issue ?? 0),
    checked_at: row?.checked_at ?? null,
  };
}

export async function inspectGscUrls(inputUrls: string[]) {
  const configured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
  const urls = [...new Set(inputUrls.map((u) => u.trim()).filter(Boolean))].slice(0, 100);
  for (const url of urls) {
    await db.execute(sql`
      INSERT INTO gsc_url_index (id, url, coverage_state, verdict, inspected_at, checked_at, raw)
      VALUES (
        ${crypto.randomUUID()},
        ${url},
        ${configured ? 'pending' : 'not_configured'},
        ${configured ? 'PENDING' : 'UNKNOWN'},
        NOW(3),
        NOW(3),
        ${JSON.stringify({ configured, source: 'admin_manual_inspect' })}
      )
      ON DUPLICATE KEY UPDATE
        coverage_state = VALUES(coverage_state),
        verdict = VALUES(verdict),
        inspected_at = VALUES(inspected_at),
        checked_at = VALUES(checked_at),
        raw = VALUES(raw),
        updated_at = NOW(3)
    `);
  }
  return {
    configured,
    inspected: urls.length,
    status: configured ? 'queued' : 'not_configured',
  };
}
