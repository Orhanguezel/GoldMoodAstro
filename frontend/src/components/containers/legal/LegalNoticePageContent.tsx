'use client';

import React, { useMemo } from 'react';
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import {
  pickFirstPublished,
  CMS_FALLBACK_CSS,
  downgradeH1ToH2,
  extractHtmlFromAny,
} from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';

const LegalNoticePageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_legal_notice', locale as any);
  const { ui: uiX } = useUiSection('ui_extra' as any);
  const isTr = locale === 'tr';

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'legal_notice',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo(() => pickFirstPublished((data as any)?.items), [data]);

  const title = useMemo(() => {
    const t = String((page as any)?.title ?? '').trim();
    return (
      t ||
      String(ui('ui_legal_notice_fallback_title', 'Legal Notice') || '').trim() ||
      'Legal Notice'
    );
  }, [page, ui]);

  const html = useMemo(() => {
    const raw = extractHtmlFromAny(page);
    const safe = raw ? downgradeH1ToH2(raw) : '';
    return safe;
  }, [page]);

  return (
    <div className="relative overflow-hidden">
      {/* Background Decor - Spiritual/Celestial Theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-(--gm-gold)/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-(--gm-primary)/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {isLoading && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-12 bg-(--gm-surface) rounded-2xl w-1/3 animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 bg-(--gm-surface) rounded w-full animate-pulse" />
              <div className="h-4 bg-(--gm-surface) rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-(--gm-surface) rounded w-4/6 animate-pulse" />
            </div>
          </div>
        )}

        {!isLoading && (isError || !page) && (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div
              className="inline-block bg-(--gm-surface) border border-(--gm-border-soft) text-(--gm-text-dim) px-8 py-4 rounded-2xl font-serif italic"
              role="alert"
            >
              {ui('ui_legal_notice_empty', 'Content is not ready yet.')}
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <div className="max-w-4xl mx-auto">
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
                {ui('ui_legal_notice_empty_text', 'This section content will be added soon.')}
              </div>
            )}

            <footer className="mt-16 text-center">
              <p className="text-(--gm-muted) text-sm font-light">
                {uiX('ui_extra_b4_last_updated', 'Last updated:')} {new Date().toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
              </p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalNoticePageContent;
