import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import LandingIntro from '@/components/common/LandingIntro';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { getLanding, landingLocale, LANDING_UI, type LandingKey } from './seo-landing-content';
import { fetchCustomPagePublicByLandingKey } from '@/seo/server';

export default async function SeoLandingArticle({ type, locale }: { type: LandingKey; locale: string }) {
  const fallback = getLanding(type, locale);
  const page = await fetchCustomPagePublicByLandingKey({ landingKey: type, locale });
  const hasDbContent = Boolean(page?.content_html?.trim());
  const data = {
    ...fallback,
    title: page?.title || fallback.title,
    description: page?.meta_description || fallback.description,
    summary: page?.summary || fallback.summary,
    image: page?.featured_image_effective_url || page?.featured_image || page?.image_url || fallback.image,
    slug: type,
  };
  const ui = LANDING_UI[landingLocale(locale)];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/${type}`;
  const image = data.image.startsWith('http') ? data.image : `${siteUrl}${data.image}`;

  return (
    <>
      <JsonLd
        id={`${type}-seo-schema`}
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: data.title, item: pageUrl },
          ]),
          articleSchema({
            headline: data.title,
            description: data.description,
            image,
            datePublished: '2026-07-02T00:00:00.000Z',
            dateModified: '2026-07-02T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(data.faq),
        ])}
      />
      {hasDbContent ? (
        <article
          className="prose prose-invert prose-brand mx-auto max-w-[var(--gm-w-content)]"
          data-speakable
          dangerouslySetInnerHTML={{ __html: page!.content_html }}
        />
      ) : (
        <LandingIntro
          eyebrow={data.eyebrow}
          title={data.title}
          lead={data.lead}
          summary={data.summary}
          sections={data.sections}
          showHeader={false}
        />
      )}
      <FaqAccordion items={data.faq} title={`${data.eyebrow} ${ui.questions}`} />
      <AuthorBio
        name="GoldMoodAstro Editorial Team"
        title={data.authorTitle}
        bio={`${data.title} ${ui.bioSuffix}`}
        expertise={data.expertise}
      />
    </>
  );
}
