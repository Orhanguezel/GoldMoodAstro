import type { Metadata } from 'next';
import Banner from '@/layout/banner/Breadcrum';
import PageContainer from '@/components/common/PageContainer';
import { buildMetadataFromSeo, fetchCustomPagePublicBySlug, fetchSeoObject } from '@/seo/server';
import { excerpt, safeStr } from '@/integrations/shared';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

function contentHtml(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = JSON.parse(trimmed) as { html?: unknown };
    if (typeof parsed?.html === 'string') return parsed.html;
  } catch {
    // Plain HTML content is also supported.
  }
  return trimmed;
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [seo, page] = await Promise.all([
    fetchSeoObject(locale),
    fetchCustomPagePublicBySlug({ slug, locale }),
  ]);
  const base = await buildMetadataFromSeo(seo, { locale, pathname: `/legal/${slug}` });
  const title = safeStr(page?.meta_title) || safeStr(page?.title) || titleFromSlug(slug);
  const description = excerpt(
    safeStr(page?.meta_description) || safeStr(page?.summary) || contentHtml(page?.content) || title,
    180,
  );

  return {
    ...base,
    title,
    description,
    openGraph: {
      ...(base.openGraph || {}),
      title,
      description,
    },
  };
}

export default async function LegalCustomPage({ params }: Props) {
  const { locale, slug } = await params;
  const page = await fetchCustomPagePublicBySlug({ slug, locale });
  const title = safeStr(page?.title) || titleFromSlug(slug);
  const html = contentHtml(page?.content);

  return (
    <>
      <Banner title={title} />
      <PageContainer className="bg-(--gm-bg) text-(--gm-text)" verticalPadding="large">
        <article className="mx-auto max-w-[var(--gm-w-readable)] rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface)/70 p-6 shadow-(--gm-shadow-soft) md:p-10">
          {html ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-(--gm-text) prose-p:text-(--gm-text-dim) prose-li:text-(--gm-text-dim) prose-strong:text-(--gm-gold)"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="font-serif text-lg italic text-(--gm-text-dim)">
              Bu sayfanın içeriği hazırlanıyor.
            </p>
          )}
        </article>
      </PageContainer>
    </>
  );
}
