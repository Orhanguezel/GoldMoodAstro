import 'server-only';

import { fetchSetting } from '@/i18n/server';
import { getBrandServer } from '@/lib/brand.server';
import { safeJson, safeStr } from '@/integrations/shared';
import type { CompanyFacts } from '@/components/seo/trustFaq';

/** SSS/künye metinleri için marka + işletici bilgisi (DB: brand.*, company_brand). */
export async function getCompanyFacts(): Promise<CompanyFacts> {
  const [brand, row] = await Promise.all([
    getBrandServer(),
    fetchSetting('company_brand', '*', { revalidate: 300 }),
  ]);
  const company = safeJson<Record<string, unknown>>((row as any)?.value, {});
  return {
    brand: safeStr(brand.name) || safeStr(company.name) || 'GoldMoodAstro',
    legalName: safeStr(company.legal_name) || undefined,
    city: safeStr(company.address_locality) || undefined,
  };
}
