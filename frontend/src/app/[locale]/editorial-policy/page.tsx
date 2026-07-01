import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, graph } from '@/seo/jsonld';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'] });

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const COPY = {
  en: {
    title: 'Editorial Policy and Methodology',
    description:
      'How GoldMoodAstro prepares content, uses AI-assisted drafting and applies responsible spiritual guidance methodology.',
    back: 'Back to About',
    sections: [
      { title: 'Content principle', paragraphs: ['GoldMoodAstro content is written to help users ask clearer questions and prepare for consultations, not to give fixed life decisions.', 'We avoid fear-based claims, dependency language and absolute predictions.'] },
      { title: 'AI-assisted transparency', paragraphs: ['Some general educational content may use LLM-assisted drafting to structure topics and improve readability.', 'Drafts are reviewed by the GoldMoodAstro editorial team for responsible language, context and ethical boundaries.'] },
      { title: 'Astrology methodology', paragraphs: ['Birth chart calculations follow a Swiss Ephemeris based technical approach. Planet positions, houses, aspects and rising signs provide the calculation layer.', 'Sun sign pages are general guides; precise interpretation requires birth time, place, Moon, rising sign, houses and aspects.'] },
      { title: 'Tarot and numerology', paragraphs: ['Tarot content is informed by Rider-Waite-Smith symbolism and treats cards as symbolic guidance, not fixed fate.', 'Numerology interprets names and birth dates for self-awareness, not as a replacement for personal decisions.'] },
      { title: 'Review process', paragraphs: ['GoldMoodAstro content is reviewed by the editorial team before publishing.', 'Platform content is general information; one-to-one sessions provide personal context.'] },
    ],
  },
};

function getCopy(_locale: string) {
  return COPY.en;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = getCopy(locale);
  return {
    title: `${copy.title} | GoldMoodAstro`,
    description: copy.description,
  };
}

import PageContainer from '@/components/common/PageContainer';

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const pageUrl = `${SITE_URL}/${locale}/editorial-policy`;

  return (
    <PageContainer width="readable" pad="large">
      <JsonLd
        id="editorial-policy"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
            { name: 'About', item: `${SITE_URL}/${locale}/about` },
            { name: copy.title, item: pageUrl },
          ]),
          articleSchema({
            headline: copy.title,
            description: copy.description,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${SITE_URL}/${locale}/about` },
            publisherId: `${SITE_URL}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />

      <div className="mx-auto max-w-[var(--gm-w-readable)]">
        <Link href={`/${locale}/about`} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-(--gm-gold) hover:text-(--gm-gold-light) transition-colors">
          <span aria-hidden>←</span> {copy.back}
        </Link>
        
        <header data-speakable className="mt-8 mb-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-(--gm-gold) mb-4">
            GoldMoodAstro
          </p>
          <h1 className={`${cinzel.className} text-3xl md:text-5xl text-(--gm-text) mb-8 leading-tight`}>{copy.title}</h1>
          <p className="max-w-[var(--gm-w-narrow)] mx-auto text-lg leading-relaxed text-(--gm-text-dim) font-serif italic opacity-80">{copy.description}</p>
          <div className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-(--gm-gold)/40 to-transparent mx-auto" />
        </header>

        <div className="space-y-8">
          {copy.sections.map((section, idx) => (
            <section key={section.title} className="rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-12 shadow-(--gm-shadow-soft) transition-all hover:shadow-(--gm-shadow-card) hover:border-(--gm-primary)/20">
              <div className="flex items-center gap-5 mb-8">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-(--gm-primary)/10 text-(--gm-primary) flex items-center justify-center font-serif font-bold text-lg">
                  {idx + 1}
                </span>
                <h2 className={`${cinzel.className} text-xl md:text-2xl text-(--gm-text)`}>{section.title}</h2>
              </div>
              <div className="space-y-5">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-(--gm-text-dim) opacity-90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-12 shadow-(--gm-shadow-soft)">
          <AuthorBio
            name="GoldMoodAstro Editorial Team"
            title="Editorial and methodology team"
            bio={copy.description}
            expertise={['Astrology', 'Tarot', 'Numerology', 'Editorial Review']}
            certificates={['Swiss Ephemeris', 'Rider-Waite-Smith']}
          />
        </div>
      </div>
    </PageContainer>
  );
}
