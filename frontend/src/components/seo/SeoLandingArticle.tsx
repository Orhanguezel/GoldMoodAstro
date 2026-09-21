import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import LandingIntro from '@/components/common/LandingIntro';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { getLanding, landingLocale, LANDING_UI, type LandingKey } from './seo-landing-content';
import { fetchCustomPagePublicByLandingKey } from '@/seo/server';
import { localizedPath } from '@/integrations/shared';
import { toLocalizedPublicPath, type PublicLocale } from '@/i18n/localizedRoutes';
import TopicConnections from './TopicConnections';

const REVIEW_DATE = '2026-09-21T00:00:00.000Z';

function editorialCopy(locale: string) {
  if (locale === 'tr') {
    return { name: 'GoldMoodAstro Editoryal Ekibi', reviewed: 'Son gözden geçirme: 21 Eylül 2026', policy: 'Editoryal politika', method: 'Yöntem' };
  }
  if (locale === 'de') {
    return { name: 'GoldMoodAstro Redaktion', reviewed: 'Zuletzt geprüft: 21. September 2026', policy: 'Redaktionsrichtlinie', method: 'Methodik' };
  }
  return { name: 'GoldMoodAstro Editorial Team', reviewed: 'Last reviewed: September 21, 2026', policy: 'Editorial policy', method: 'Methodology' };
}

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
  const publicLocale = (locale === 'en' || locale === 'de' ? locale : 'tr') as PublicLocale;
  const logicalPath = type === 'yukselen-burc' ? '/yukselen-burc-hesaplayici' : `/${type}`;
  const pageUrl = `${siteUrl}/${publicLocale}${toLocalizedPublicPath(publicLocale, logicalPath)}`;
  const aboutUrl = `${siteUrl}${localizedPath(locale, '/about', 'tr')}`;
  const editorialPolicyUrl = localizedPath(locale, '/editorial-policy', 'tr');
  const image = data.image.startsWith('http') ? data.image : `${siteUrl}${data.image}`;
  const editorial = editorialCopy(locale);

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
            dateModified: REVIEW_DATE,
            author: { name: editorial.name, url: aboutUrl },
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
          inShortLabel={ui.inShort}
        />
      )}
      <FaqAccordion items={data.faq} title={`${data.eyebrow} ${ui.questions}`} eyebrow={ui.faqEyebrow} />
      <TopicConnections type={type} locale={locale} />
      <AuthorBio
        name={editorial.name}
        title={data.authorTitle}
        bio={`${data.title} ${ui.bioSuffix}`}
        expertise={data.expertise}
      />
      <div className="mx-auto mt-3 flex max-w-[var(--gm-w-content)] flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-(--gm-text-muted)">
        <time dateTime={REVIEW_DATE}>{editorial.reviewed}</time>
        <span aria-hidden="true">·</span>
        <a href={editorialPolicyUrl} className="underline-offset-4 hover:text-(--gm-gold) hover:underline">{editorial.policy}</a>
        <span aria-hidden="true">·</span>
        <a href={localizedPath(locale, '/about', 'tr')} className="underline-offset-4 hover:text-(--gm-gold) hover:underline">{editorial.method}</a>
      </div>
    </>
  );
}
