import Banner from '@/layout/banner/Breadcrum';
import PageContainer from '@/components/common/PageContainer';
import Feedback from '@/components/containers/feedback/Feedback';
import JsonLd from '@/seo/JsonLd';
import { faqPage } from '@/seo/jsonld';
import { fetchCustomPagesPublicByModule } from '@/seo/serverPageData';
import {
  CMS_FALLBACK_CSS,
  downgradeH1ToH2,
  extractHtmlFromAny,
  pickFirstPublished,
  stripHtml,
} from '@/integrations/shared';

type FaqPageProps = {
  params: Promise<{ locale: string }>;
};

type FaqQuestion = {
  question: string;
  answer: string;
};

const FALLBACK = {
  tr: {
    title: 'Sık Sorulan Sorular',
    intro: 'GoldMoodAstro kullanımı, ödeme, randevu ve danışman seçimi hakkında temel yanıtlar.',
    empty: 'Sık sorulan sorular yakında eklenecek.',
    footer: 'Aradığınız yanıt yoksa bize ulaşın.',
    updated: 'Son güncelleme',
  },
  en: {
    title: 'Frequently Asked Questions',
    intro: 'Essential answers about GoldMoodAstro usage, payments, bookings and consultant selection.',
    empty: 'Frequently asked questions will be added soon.',
    footer: 'Contact us if you cannot find your answer.',
    updated: 'Last updated',
  },
  de: {
    title: 'Häufige Fragen',
    intro: 'Wichtige Antworten zu GoldMoodAstro, Zahlungen, Terminen und Beraterauswahl.',
    empty: 'Häufige Fragen werden bald ergänzt.',
    footer: 'Kontaktiere uns, wenn deine Antwort fehlt.',
    updated: 'Zuletzt aktualisiert',
  },
} as const;

function copyFor(locale: string) {
  if (locale === 'tr' || locale === 'de') return FALLBACK[locale];
  return FALLBACK.en;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFaqQuestions(html: string): FaqQuestion[] {
  const out: FaqQuestion[] = [];
  const re = /<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi;

  for (const match of html.matchAll(re)) {
    const question = decodeEntities(stripHtml(match[1] ?? ''));
    const answer = decodeEntities(stripHtml(match[2] ?? ''));
    if (question && answer) out.push({ question, answer });
  }

  return out;
}

function formatDate(locale: string, value?: string | Date | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export default async function FaqsPage({ params }: FaqPageProps) {
  const { locale } = await params;
  const copy = copyFor(locale);
  const pages = await fetchCustomPagesPublicByModule({ moduleKey: 'faq', locale, limit: 5 });
  const page = pickFirstPublished(pages);
  const title = String(page?.title || copy.title).trim();
  const html = page ? downgradeH1ToH2(extractHtmlFromAny(page)) : '';
  const questions = extractFaqQuestions(html);
  const schema = questions.length ? faqPage(questions) : null;
  const updatedLabel = formatDate(locale, page?.updated_at);

  return (
    <>
      {schema && <JsonLd data={schema} id="faq-page" />}
      {/* Sayfanin kendi hero h1'i var; banner basligi gosterilirse ayni metin
          breadcrumb + h1 + CMS basligi olarak uc kez tekrarlaniyor ve iki h1 olusuyor. */}
      <Banner title={title} showTitle={false} />
      <PageContainer pad="large" className="bg-(--gm-bg) min-h-[50vh]">
        <div className="container mx-auto">
          <header className="text-center mb-14 max-w-3xl mx-auto">
            <span className="text-(--gm-gold) font-bold text-[10px] md:text-xs uppercase tracking-[0.32em] block mb-5">
              GoldMoodAstro
            </span>
            <h1 className="font-serif text-4xl md:text-6xl text-(--gm-text) mb-8 leading-tight">
              {title}
            </h1>
            <p className="text-(--gm-text-dim) text-lg leading-relaxed font-serif italic opacity-80">
              {page?.summary || copy.intro}
            </p>
          </header>

          <div className="max-w-4xl mx-auto">
            <style>{CMS_FALLBACK_CSS}</style>
            {html ? (
              <article
                className="prose prose-lg max-w-none bg-(--gm-surface) p-8 md:p-16 rounded-[2rem] shadow-(--gm-shadow-card) border border-(--gm-border-soft) cms-html prose-headings:font-serif prose-headings:font-light prose-headings:text-(--gm-text) prose-a:text-(--gm-primary) prose-p:text-(--gm-text-dim) prose-p:font-light prose-p:text-base prose-p:leading-[1.8] prose-li:text-(--gm-text-dim) prose-li:font-light prose-li:text-base prose-li:leading-[1.8] prose-p:mb-6 prose-strong:text-(--gm-text)"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div
                className="bg-(--gm-surface) border border-(--gm-border-soft) text-(--gm-text-dim) px-8 py-6 rounded-2xl text-center italic font-serif"
                role="alert"
              >
                {copy.empty}
              </div>
            )}

            {copy.footer && (
              <aside className="text-center mt-12 bg-(--gm-surface) p-8 md:p-10 rounded-[2rem] border border-(--gm-border-soft) shadow-(--gm-shadow-soft)">
                <p className="text-(--gm-text) text-lg font-serif italic mb-0 opacity-80">
                  {copy.footer}
                </p>
              </aside>
            )}

            {updatedLabel && (
              <footer className="mt-12 text-center">
                <p className="text-(--gm-muted) text-sm font-light">
                  {copy.updated}: {updatedLabel}
                </p>
              </footer>
            )}
          </div>

          <div className="mt-20">
            <Feedback />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
