import React from 'react';
import Banner from '@/layout/banner/Breadcrum';
import PageContainer from '@/components/common/PageContainer';
import { fetchCustomPagesPublicByModule } from '@/seo/serverPageData';
import {
  CMS_FALLBACK_CSS,
  downgradeH1ToH2,
  extractHtmlFromAny,
  pickFirstPublished,
} from '@/integrations/shared';

type LegalCmsPageProps = {
  locale: string;
  moduleKey: string;
  fallbackTitle: string;
  emptyText?: string;
};

export default async function LegalCmsPage({
  locale,
  moduleKey,
  fallbackTitle,
  emptyText = 'Content is not ready yet.',
}: LegalCmsPageProps) {
  const pages = await fetchCustomPagesPublicByModule({ moduleKey, locale, limit: 10 });
  const page = pickFirstPublished(pages);
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
          </div>
        </div>
      </PageContainer>
    </>
  );
}
