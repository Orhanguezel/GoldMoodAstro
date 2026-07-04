/** Custom pages (CMS) HTML çıkarma — frontend extractHtmlFromAny ile uyumlu */

export interface CustomPageRow {
  id: string;
  module_key: string;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  content_html?: string | null;
  is_published?: number | boolean;
  display_order?: number | null;
  order_num?: number | null;
  created_at?: string;
}

function safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function extractHtmlFromPage(page: CustomPageRow | null | undefined): string {
  if (!page) return '';
  const ch = safeStr(page.content_html);
  if (ch) return ch;
  const c = page.content;
  if (!c) return '';
  if (typeof c === 'string') {
    const s = c.trim();
    if (!s) return '';
    if (s.startsWith('{')) {
      try {
        const obj = JSON.parse(s) as { html?: string };
        return safeStr(obj?.html) || s;
      } catch {
        return s;
      }
    }
    return s;
  }
  return '';
}

export function pickPublishedPages(items: CustomPageRow[]): CustomPageRow[] {
  return items.filter((p) => p.is_published === 1 || p.is_published === true);
}

export const LEGAL_CMS_PAGES = [
  { module_key: 'privacy', title: 'Gizlilik Politikası' },
  { module_key: 'terms', title: 'Kullanım Koşulları' },
  { module_key: 'cookies', title: 'Çerez Politikası' },
  { module_key: 'kvkk', title: 'KVKK Aydınlatma Metni' },
  { module_key: 'editorial_policy', title: 'Editoryal Politika' },
  { module_key: 'privacy_notice', title: 'Gizlilik Bildirimi' },
  { module_key: 'legal_notice', title: 'Yasal Uyarı' },
  { module_key: 'distance_sales', title: 'Mesafeli Satış Sözleşmesi' },
  { module_key: 'cancellation_refund', title: 'İptal ve İade Politikası' },
  { module_key: 'pre_information', title: 'Ön Bilgilendirme Formu' },
] as const;

export const LEGAL_CMS_MODULE_KEYS = [
  ...LEGAL_CMS_PAGES.map((p) => p.module_key),
  'privacy_policy',
  'privacy-policy',
  'terms_of_use',
  'terms-of-use',
  'cookie_policy',
  'cookie-policy',
  'editorial-policy',
  'privacy-notice',
  'legal-notice',
  'distance-sales',
  'mesafeli_satis',
  'mesafeli-satis',
  'cancellation-refund',
] as const;

/** Admin customPages — hakkında / SSS */
export const INFO_CMS_PAGES = [
  { module_key: 'about', title: 'Hakkımızda' },
  { module_key: 'faq', title: 'Sık Sorulan Sorular' },
] as const;

export const CONSULTANT_EXPERTISE_OPTIONS = [
  { id: 'astrology', label: 'Astroloji' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'coffee', label: 'Kahve Falı' },
  { id: 'numerology', label: 'Numeroloji' },
  { id: 'birth_chart', label: 'Doğum Haritası' },
  { id: 'dream_interpretation', label: 'Rüya Tabiri' },
  { id: 'relationship_advice', label: 'İlişki Danışmanlığı' },
  { id: 'energy_healing', label: 'Enerji Şifası' },
] as const;
