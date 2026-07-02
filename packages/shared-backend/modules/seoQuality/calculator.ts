import { countInternalLinks, extractHeadings, extractImages, wordCount } from './htmlAnalyze';

export type SeoInput = {
  meta_title?: string | null;
  meta_description?: string | null;
  slug?: string | null;
  html: string;
  featured_image?: string | null;
  hasSchema: boolean;
  siteHost: string;
  canonicalOk?: boolean;
  noindex?: boolean;
  inSitemap?: boolean;
};

export type SeoBreakdownItem = {
  key: string;
  label: string;
  got: number;
  max: number;
  ok: boolean;
  hint?: string;
};

export type SeoScoreResult = {
  meta: number;
  content: number;
  heading: number;
  media: number;
  schema: number;
  link: number;
  overall: number;
  word_count: number;
  heading_count: number;
  image_count: number;
  has_meta_title: boolean;
  has_meta_description: boolean;
  has_h1: boolean;
  has_schema: boolean;
  is_thin_content: boolean;
  adsense_ready: boolean;
  index_ready: boolean;
  breakdown: SeoBreakdownItem[];
};

const STOP_WORDS = new Set(['ve', 'veya', 'ile', 'icin', 'için', 'bir', 'the', 'and', 'or', 'to', 'of']);

function len(s?: string | null): number {
  return String(s ?? '').trim().length;
}

function cleanSlugOk(slug?: string | null): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!/^[a-z0-9-]{3,}$/.test(s)) return false;
  const parts = s.split('-').filter(Boolean);
  if (parts.length === 0) return false;
  const stopCount = parts.filter((p) => STOP_WORDS.has(p)).length;
  return stopCount / parts.length < 0.6;
}

function headingOrderOk(levels: number[]): boolean {
  if (levels.length === 0) return false;
  let previous = 0;
  for (const level of levels) {
    if (previous > 0 && level > previous + 1) return false;
    previous = level;
  }
  return levels[0] === 1;
}

export function computeSeoScore(input: SeoInput): SeoScoreResult {
  const titleLen = len(input.meta_title);
  const descLen = len(input.meta_description);
  const hasMetaTitle = titleLen > 0;
  const hasMetaDescription = descLen > 0;
  const titleLenOk = titleLen >= 30 && titleLen <= 60;
  const descLenOk = descLen >= 120 && descLen <= 160;
  const slugOk = cleanSlugOk(input.slug);

  const meta = (hasMetaTitle ? 4 : 0) + (titleLenOk ? 6 : 0) + (hasMetaDescription ? 4 : 0) + (descLenOk ? 6 : 0) + (slugOk ? 5 : 0);

  const wc = wordCount(input.html);
  const content = wc < 300 ? 0 : wc < 600 ? 15 : wc < 1000 ? 25 : 30;

  const headings = extractHeadings(input.html);
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const hasH1 = h1Count === 1;
  const headingOk = headingOrderOk(headings.map((h) => h.level));
  const heading = (hasH1 ? 5 : 0) + (h2Count >= 2 ? 5 : 0) + (headingOk ? 5 : 0);

  const images = extractImages(input.html);
  const allImagesHaveAlt = images.every((img) => Boolean(img.alt?.trim()));
  const media = (input.featured_image ? 7 : 0) + (allImagesHaveAlt ? 8 : 0);

  const schema = input.hasSchema ? 10 : 0;
  const internalLinks = countInternalLinks(input.html, input.siteHost);
  const indexableOk = input.canonicalOk !== false && input.noindex !== true && input.inSitemap !== false;
  const link = (internalLinks >= 2 ? 2 : 0) + (indexableOk ? 3 : 0);
  const overall = Math.min(100, meta + content + heading + media + schema + link);
  const isThin = wc < 300;

  const breakdown: SeoBreakdownItem[] = [
    {
      key: 'meta',
      label: 'Meta tamlığı',
      got: meta,
      max: 25,
      ok: meta >= 20,
      hint: meta >= 20 ? undefined : `title ${titleLen} karakter, description ${descLen} karakter; hedef title 30-60, description 120-160.`,
    },
    {
      key: 'content',
      label: 'İçerik derinliği',
      got: content,
      max: 30,
      ok: content >= 25,
      hint: content >= 25 ? undefined : `${wc} kelime bulundu; en az 600 kelime, ideal 1000+ hedefleyin.`,
    },
    {
      key: 'heading',
      label: 'Başlık hiyerarşisi',
      got: heading,
      max: 15,
      ok: heading === 15,
      hint: heading === 15 ? undefined : `H1 sayısı ${h1Count}, H2 sayısı ${h2Count}; tam 1 H1 ve en az 2 H2 kullanın.`,
    },
    {
      key: 'media',
      label: 'Medya ve erişilebilirlik',
      got: media,
      max: 15,
      ok: media === 15,
      hint: media === 15 ? undefined : `featured_image ${input.featured_image ? 'var' : 'yok'}, alt eksik görsel sayısı ${images.filter((img) => !img.alt?.trim()).length}.`,
    },
    {
      key: 'schema',
      label: 'Yapısal veri',
      got: schema,
      max: 10,
      ok: schema === 10,
      hint: schema === 10 ? undefined : 'Bu sayfa tipi için JSON-LD schema render edildiğini doğrulayın.',
    },
    {
      key: 'link',
      label: 'İç link ve indexlenebilirlik',
      got: link,
      max: 5,
      ok: link === 5,
      hint: link === 5 ? undefined : `${internalLinks} iç link bulundu; en az 2 iç link ve canonical/sitemap/noindex uyumu gerekli.`,
    },
  ];

  return {
    meta,
    content,
    heading,
    media,
    schema,
    link,
    overall,
    word_count: wc,
    heading_count: headings.length,
    image_count: images.length,
    has_meta_title: hasMetaTitle,
    has_meta_description: hasMetaDescription,
    has_h1: hasH1,
    has_schema: input.hasSchema,
    is_thin_content: isThin,
    adsense_ready: wc >= 300 && hasMetaDescription && hasH1 && !isThin,
    index_ready: overall >= 50,
    breakdown,
  };
}
