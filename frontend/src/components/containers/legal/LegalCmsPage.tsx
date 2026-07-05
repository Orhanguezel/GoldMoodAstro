import React from 'react';
import Banner from '@/layout/banner/Breadcrum';
import PageContainer from '@/components/common/PageContainer';
import { fetchCustomPagesPublicByModule } from '@/seo/serverPageData';
import {
  CMS_FALLBACK_CSS,
  downgradeH1ToH2,
  extractHtmlFromAny,
  pickFirstPublished,
  safeJson,
  safeStr,
} from '@/integrations/shared';
import { fetchSetting } from '@/i18n/server';

type LegalCmsPageProps = {
  locale: string;
  moduleKey: string;
  fallbackTitle: string;
  emptyText?: string;
};

type CompanyBrand = Partial<{
  name: string;
  legal_name: string;
  mersis: string;
  tax_office: string;
  tax_no: string;
  trade_registry: string;
  address: string;
  phone: string;
  email: string;
}>;

function companyValue(row: Awaited<ReturnType<typeof fetchSetting>>): CompanyBrand {
  return safeJson<CompanyBrand>((row as any)?.value, {});
}

export default async function LegalCmsPage({
  locale,
  moduleKey,
  fallbackTitle,
  emptyText = 'Content is not ready yet.',
}: LegalCmsPageProps) {
  const [pages, companyRow] = await Promise.all([
    fetchCustomPagesPublicByModule({ moduleKey, locale, limit: 10 }),
    fetchSetting('company_brand', '*', { revalidate: 300 }),
  ]);
  const page = pickFirstPublished(pages);
  const company = companyValue(companyRow);
  const title = String(page?.title || fallbackTitle).trim();
  const html = page ? downgradeH1ToH2(extractHtmlFromAny(page)) : '';
  const updatedAt = page?.updated_at ? new Date(page.updated_at) : null;
  const updatedLabel = updatedAt && !Number.isNaN(updatedAt.getTime())
    ? updatedAt.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')
    : null;

  return (
    <>
      <Banner title={title} />
      <PageContainer width="readable" pad="large" className="bg-(--gm-bg) min-h-[50vh]">
        <div className="relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
            <style>{CMS_FALLBACK_CSS}</style>
            {html ? (
              <article
                className="prose prose-lg max-w-none bg-(--gm-surface) p-8 md:p-20 rounded-[2rem] shadow-(--gm-shadow-card) border border-(--gm-border-soft) cms-html prose-headings:font-serif prose-headings:font-light prose-headings:text-(--gm-text) prose-a:text-(--gm-primary) prose-p:text-(--gm-text-dim) prose-p:font-light prose-p:text-base prose-p:leading-[1.8] prose-li:text-(--gm-text-dim) prose-li:font-light prose-li:text-base prose-li:leading-[1.8] prose-ul:mb-6 prose-ol:mb-6 prose-p:mb-6 prose-strong:text-(--gm-text) prose-em:text-(--gm-primary)/80"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="bg-(--gm-surface) border border-(--gm-border-soft) text-(--gm-text-dim) px-8 py-6 rounded-2xl text-center italic font-serif"
                role="alert"
              >
                {emptyText}
              </div>
            )}
            {updatedLabel && (
              <footer className="mt-16 text-center">
                <p className="text-(--gm-muted) text-sm font-light">
                  Last updated: {updatedLabel}
                </p>
              </footer>
            )}
            {safeStr(company.legal_name || company.name) && (
              <aside className="mt-10 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 text-sm leading-relaxed text-(--gm-text-dim) shadow-(--gm-shadow-soft)">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-(--gm-gold-dim)">
                  {locale === 'tr' ? 'Yasal Künye' : 'Legal Company Details'}
                </p>
                <h2 className="mt-3 font-serif text-2xl text-(--gm-text)">
                  {safeStr(company.legal_name || company.name)}
                </h2>
                <dl className="mt-5 grid gap-4 md:grid-cols-2">
                  {safeStr(company.mersis) && (
                    <div>
                      <dt className="font-bold text-(--gm-text)">MERSİS</dt>
                      <dd className="mt-1">{safeStr(company.mersis)}</dd>
                    </div>
                  )}
                  {safeStr(company.trade_registry) && (
                    <div>
                      <dt className="font-bold text-(--gm-text)">
                        {locale === 'tr' ? 'Ticaret Sicil No' : 'Trade Registry No'}
                      </dt>
                      <dd className="mt-1">{safeStr(company.trade_registry)}</dd>
                    </div>
                  )}
                  {safeStr(company.tax_office) && (
                    <div>
                      <dt className="font-bold text-(--gm-text)">
                        {locale === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}
                      </dt>
                      <dd className="mt-1">{safeStr(company.tax_office)}</dd>
                    </div>
                  )}
                  {safeStr(company.tax_no) && (
                    <div>
                      <dt className="font-bold text-(--gm-text)">
                        {locale === 'tr' ? 'Vergi No' : 'Tax No'}
                      </dt>
                      <dd className="mt-1">{safeStr(company.tax_no)}</dd>
                    </div>
                  )}
                  {safeStr(company.address) && (
                    <div className="md:col-span-2">
                      <dt className="font-bold text-(--gm-text)">
                        {locale === 'tr' ? 'Adres' : 'Address'}
                      </dt>
                      <dd className="mt-1">{safeStr(company.address)}</dd>
                    </div>
                  )}
                  {(safeStr(company.phone) || safeStr(company.email)) && (
                    <div className="md:col-span-2">
                      <dt className="font-bold text-(--gm-text)">
                        {locale === 'tr' ? 'İletişim' : 'Contact'}
                      </dt>
                      <dd className="mt-1">
                        {[safeStr(company.phone), safeStr(company.email)].filter(Boolean).join(' · ')}
                      </dd>
                    </div>
                  )}
                </dl>
              </aside>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
