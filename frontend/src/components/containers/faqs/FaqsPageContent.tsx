// =============================================================
// FILE: src/components/containers/faqs/FaqsPageContent.tsx
// GoldMoodAstro – Full FAQs Page Content [FINAL]
// - Tailwind v4 Semantic Tokens
// - Standard Accordion
// =============================================================

'use client';

import React, { useMemo, useState, useEffect, useId, useCallback } from 'react';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'] });

import { useListFaqsQuery } from '@/integrations/rtk/hooks';
import type { FaqDto } from '@/integrations/shared';
import { normalizeFaq, safeStr } from '@/integrations/shared';
import { faqPage } from '@/seo/jsonld';
import JsonLd from '@/seo/JsonLd';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';

const FaqsPageContent: React.FC = () => {
  const uid = useId();
  const locale = useLocaleShort();

  const { ui } = useUiSection('ui_faqs', locale as any);
  const t = useCallback((key: string, fallback: string) => ui(key, fallback), [ui]);

  // UI Strings
  const kickerPrefix = safeStr(t('ui_faqs_kicker_prefix', 'GoldMoodAstro'));
  const kickerLabel = safeStr(t('ui_faqs_kicker_label', 'Frequently Asked Questions'));

  const titlePrefix = safeStr(t('ui_faqs_page_title_prefix', 'Common'));
  const titleMark = safeStr(t('ui_faqs_page_title_mark', 'Questions'));

  const intro = safeStr(
    t(
      'ui_faqs_intro',
      'Find answers about GoldMoodAstro consulting sessions, booking flow and general platform usage.',
    ),
  );

  const emptyText = safeStr(t('ui_faqs_empty', 'There are no FAQs to display at the moment.'));
  const untitled = safeStr(t('ui_faqs_untitled', 'Untitled question'));
  const noAnswer = safeStr(
    t('ui_faqs_no_answer', 'No answer has been provided for this question yet.'),
  );
  const footerNote = safeStr(
    t(
      'ui_faqs_footer_note',
      'If you cannot find the answer you are looking for, please contact us.',
    ),
  );

  const { data = [], isLoading } = useListFaqsQuery(
    {
      is_active: 1,
      sort: 'display_order',
      orderDir: 'asc',
      limit: 200,
      locale,
    } as any,
    { skip: !locale },
  );

  const faqs = useMemo(() => {
    const list = (Array.isArray(data) ? data : []) as FaqDto[];

    return list
      .map((dto) => normalizeFaq(dto))
      .filter((f) => !!f && !!f.is_active)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        const ac = safeStr(a.created_at);
        const bc = safeStr(b.created_at);
        return ac.localeCompare(bc);
      });
  }, [data]);

  const hasFaqs = faqs.length > 0;

  // FAQPage JSON-LD schema
  const faqSchema = useMemo(() => {
    if (!hasFaqs) return null;
    return faqPage(
      faqs.map((f) => ({
        question: safeStr(f.question) || '',
        answer: safeStr(f.answer) || '',
      })),
    );
  }, [faqs, hasFaqs]);

  // open state (first item auto-open)
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFaqs) {
      setOpenId(null);
      return;
    }
    if (openId == null) setOpenId(safeStr(faqs[0]?.id) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFaqs, faqs]); // run only when list changes

  return (
    <div className="flex flex-col">
      {faqSchema && <JsonLd data={faqSchema} id="faq-page" />}
      <div className="container mx-auto">
        {/* HEADER */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <span className="text-(--gm-gold) font-bold text-[10px] md:text-xs uppercase tracking-[0.32em] block mb-5">
            <span>{kickerPrefix}</span> {kickerLabel}
          </span>

          <h1 className={`${cinzel.className} text-4xl md:text-6xl text-(--gm-text) mb-8 leading-tight`}>
            {titlePrefix}{' '}
            <span className="text-(--gm-gold)">
              {titleMark}
            </span>
          </h1>

          {intro && <p className="text-(--gm-text-dim) text-lg leading-relaxed font-serif italic opacity-80">{intro}</p>}
        </div>

        {/* ACCORDION */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* EMPTY */}
            {!isLoading && !hasFaqs && (
              <div className="bg-(--gm-surface) p-12 rounded-[2.5rem] shadow-(--gm-shadow-soft) text-center border border-(--gm-border-soft)">
                <p className="text-(--gm-muted) italic">{emptyText}</p>
              </div>
            )}

            {/* LOADING */}
            {isLoading && (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-(--gm-surface) p-8 border border-(--gm-border-soft) rounded-[2.5rem] shadow-(--gm-shadow-soft) animate-pulse"
                  >
                    <div className="h-7 bg-(--gm-bg-deep) rounded-xl w-2/3 mb-6" />
                    <div className="h-4 bg-(--gm-bg-deep) rounded-lg w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* ITEMS */}
            {faqs.map((faq, idx) => {
              const id = safeStr(faq.id) || `${uid}-${idx}`;
              const isOpen = openId === id;

              const headingId = `faqHeading-${id}`;
              const panelId = `faqCollapse-${id}`;

              const q = safeStr(faq.question) || untitled;
              const a = safeStr(faq.answer);

              return (
                <div
                  className={`bg-(--gm-surface) border border-(--gm-border-soft) rounded-[2.5rem] shadow-(--gm-shadow-soft) overflow-hidden transition-all duration-500 hover:shadow-(--gm-shadow-card) ${isOpen ? 'ring-1 ring-(--gm-gold)/20' : ''}`}
                  key={id}
                >
                  <h2>
                    <button
                      type="button"
                      className={`w-full text-left px-8 md:px-12 py-7 flex justify-between items-center transition-all ${
                        isOpen ? 'text-(--gm-gold)' : 'text-(--gm-text) hover:text-(--gm-gold)'
                      }`}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      id={headingId}
                      onClick={() => setOpenId((prev) => (prev === id ? null : id))}
                    >
                      <span className={`${cinzel.className} text-xl md:text-2xl leading-snug`}>{q}</span>
                      <span
                        className={`ml-6 transform transition-all duration-500 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-(--gm-bg-deep) ${isOpen ? 'rotate-180 bg-(--gm-gold) text-(--gm-bg-deep)' : 'text-(--gm-muted)'}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </span>
                    </button>
                  </h2>

                  <div
                    id={panelId}
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    aria-labelledby={headingId}
                  >
                    <div className="px-8 md:px-12 pb-10 pt-2 text-(--gm-text-dim) text-lg leading-[1.8] font-serif border-t border-(--gm-border-soft)/50">
                      {a ? (
                        <div
                          className="prose prose-rose max-w-none opacity-90"
                          dangerouslySetInnerHTML={{ __html: a }}
                        />
                      ) : (
                        <p className="text-(--gm-muted) italic text-sm">{noAnswer}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {footerNote && (
            <div className="text-center mt-16 bg-(--gm-surface) p-8 md:p-12 rounded-[2.5rem] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-(--gm-gold)/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-(--gm-text) text-lg font-serif italic mb-0 opacity-80 group-hover:opacity-100 transition-opacity">{footerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaqsPageContent;
