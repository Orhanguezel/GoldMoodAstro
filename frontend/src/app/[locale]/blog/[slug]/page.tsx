import React from 'react';
import type { Metadata } from 'next';
import Banner from '@/layout/banner/Breadcrum';
import { CMS_FALLBACK_CSS, downgradeH1ToH2, extractHtmlFromAny, safeStr, titleFromSlug, excerpt } from '@/integrations/shared';
import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchCustomPagePublicBySlug } from '@/seo/server';
import { fetchCustomPagesPublicByModule } from '@/seo/serverPageData';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import BlogShareBar from '@/components/containers/blog/BlogShareBar';
import BlogRelatedPosts from '@/components/containers/blog/BlogRelatedPosts';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = (await params) as { locale: string; slug: string };
  const locale = safeStr(p?.locale) || 'de';
  const slug = safeStr(p?.slug);

  const pathname = normPath(`/blog/${slug || ''}`);

  const [seo, page] = await Promise.all([
    fetchSeoObject(locale),
    slug ? fetchCustomPagePublicBySlug({ slug, locale }) : Promise.resolve(null),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname });

  const pageTitle =
    safeStr(page?.meta_title) || safeStr(page?.title) || titleFromSlug(slug, 'Blog Detail');

  const rawDesc =
    safeStr(page?.meta_description) ||
    safeStr(page?.summary) ||
    safeStr(page?.content_html) ||
    safeStr((page as any)?.content) ||
    '';
  const pageDescription = rawDesc ? excerpt(rawDesc, 180) : '';

  const imageRaw =
    safeStr(page?.featured_image) ||
    (Array.isArray((page as any)?.images) ? safeStr((page as any).images[0]) : '');

  const baseUrl = base.metadataBase?.toString() || '';
  const imageAbs = imageRaw ? absUrlJoin(baseUrl, imageRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(imageAbs ? { images: [{ url: imageAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(imageAbs ? { images: [imageAbs] } : {}),
    },
  };
}

import PageContainer from '@/components/common/PageContainer';

export default async function BlogDetailsPage({ params }: PageProps) {
  const p = (await params) as { locale: string; slug: string };
  const locale = safeStr(p?.locale) || 'tr';
  const slug = safeStr(p?.slug);
  const [page, allPosts] = await Promise.all([
    slug ? fetchCustomPagePublicBySlug({ slug, locale }) : Promise.resolve(null),
    fetchCustomPagesPublicByModule({ moduleKey: 'blog', locale, limit: 7 }).catch(() => []),
  ]);
  // Aynı yazıyı listeden çıkar, en fazla 5 tane göster.
  const relatedPosts = (Array.isArray(allPosts) ? allPosts : [])
    .filter((post) => safeStr(post?.slug) && safeStr(post?.slug) !== slug)
    .slice(0, 5);
  const title = safeStr(page?.title) || titleFromSlug(slug, 'Blog Detail');
  const html = page ? downgradeH1ToH2(extractHtmlFromAny(page)) : '';
  const description = excerpt(
    safeStr(page?.summary) || html || title,
    180,
  );
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/blog/${encodeURIComponent(slug)}`;
  const image = safeStr(page?.featured_image) || (Array.isArray(page?.images) ? safeStr(page.images[0]) : '');
  const faqItems = locale === 'tr'
    ? [
        {
          question: 'Bu içerik nasıl hazırlanır?',
          answer: 'GoldMoodAstro blog içerikleri editoryal inceleme, konu araştırması ve sorumlu ruhsal rehberlik ilkeleriyle hazırlanır.',
        },
        {
          question: 'Bu yazı kişisel danışmanlığın yerine geçer mi?',
          answer: 'Hayır. Blog yazıları genel bilgi sağlar; kişisel harita, ilişki veya yaşam soruları için uzman danışmanlık daha uygundur.',
        },
      ]
    : [
        {
          question: 'How is this content prepared?',
          answer: 'GoldMoodAstro blog content is prepared with editorial review, topic research and spiritual guidance principles.',
        },
        {
          question: 'Does this article replace a personal consultation?',
          answer: 'No. Blog articles provide general information; expert consultation is better for personal chart, relationship or life questions.',
        },
      ];

  return (
    <>
      <JsonLd
        id="blog-article"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: 'Blog', item: `${siteUrl}/${locale}/blog` },
            { name: title, item: pageUrl },
          ]),
          articleSchema({
            headline: title,
            description,
            image: image ? absUrlJoin(siteUrl, image) : undefined,
            datePublished: page?.created_at || '2026-04-30T00:00:00.000Z',
            dateModified: page?.updated_at || page?.created_at || '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(faqItems),
        ])}
      />
      <Banner title={title} />

      <PageContainer className="bg-(--gm-bg) text-(--gm-text)" verticalPadding="large">
        {image ? (
          <div className="max-w-6xl mx-auto mb-12">
            <div className="aspect-video w-full overflow-hidden rounded-[2rem] border border-(--gm-border-soft) shadow-(--gm-shadow-card) bg-(--gm-bg-deep)">
              {/* Server component: plain <img> — next/image optimizer + SVG/cache
                  sorunlarını bypass eder; admin'de çalışan yöntemle aynı. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={absUrlJoin(siteUrl, image)}
                alt={safeStr(page?.featured_image_alt) || title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        ) : null}

        {/* İçerik solda, sağda sabit (sticky) sidebar: paylaş + diğer yazılar */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
          <div className="min-w-0 space-y-12">
            <div>
              <style>{CMS_FALLBACK_CSS}</style>
              {html ? (
                <article
                  data-speakable
                  className="prose prose-lg max-w-none bg-(--gm-surface) p-8 md:p-14 rounded-[2rem] shadow-(--gm-shadow-card) border border-(--gm-border-soft) cms-html prose-headings:font-serif prose-headings:font-light prose-headings:text-(--gm-text) prose-a:text-(--gm-primary) prose-p:text-(--gm-text-dim) prose-p:font-light prose-p:text-base prose-p:leading-[1.8] prose-li:text-(--gm-text-dim) prose-li:font-light prose-li:text-base prose-li:leading-[1.8] prose-p:mb-6 prose-strong:text-(--gm-text)"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 text-center text-(--gm-text-dim)">
                  Blog yazısı bulunamadı.
                </div>
              )}
            </div>

            <FaqAccordion
              items={faqItems}
              title={locale === 'tr' ? 'Bu Yazı Hakkında Sorular' : 'Questions About This Article'}
            />

            <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-7 md:p-10 shadow-(--gm-shadow-soft)">
              <AuthorBio
                name="GoldMoodAstro Editoryal Ekibi"
                title={locale === 'tr' ? 'Astroloji ve ruhsal rehberlik editörleri' : 'Spiritual guidance and astrology editors'}
                bio={locale === 'tr'
                  ? 'GoldMoodAstro editörleri astroloji, tarot, numeroloji ve ruhsal farkındalık konularını açık, sorumlu ve pratik bir dille hazırlar.'
                  : 'GoldMoodAstro editors prepare astrology, tarot, numerology and spiritual awareness topics in clear, responsible and practical language.'}
                expertise={locale === 'tr' ? ['Astroloji', 'Tarot', 'Numeroloji', 'Ruhsal Farkındalık'] : ['Astrology', 'Tarot', 'Numerology', 'Spiritual Awareness']}
              />
            </div>
          </div>

          {/* Sağ sidebar — masaüstünde sabit kalır (sticky) */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-6">
            <BlogShareBar url={pageUrl} title={title} locale={locale} />
            <BlogRelatedPosts posts={relatedPosts} locale={locale} />
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
