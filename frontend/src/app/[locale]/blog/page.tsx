import Link from 'next/link';
import Banner from '@/layout/banner/Breadcrum';
import PageContainer from '@/components/common/PageContainer';
import PublicBanner from '@/components/common/public/Banner';
import Feedback from '@/components/containers/feedback/Feedback';
import { fetchCustomPagesPublicByModule } from '@/seo/serverPageData';
import { excerpt, extractHtmlFromAny, localizePath, safeStr, toCdnSrc } from '@/integrations/shared';

type Props = {
  params: Promise<{ locale: string }>;
};

const COPY = {
  tr: {
    title: 'Blog',
    eyebrow: 'GoldMoodAstro Günlüğü',
    heroTitle: 'Astroloji, tarot ve numeroloji üzerine derin rehberler',
    heroLead: 'Uzman danışmanlık deneyimine hazırlanmanız için sorumlu, anlaşılır ve pratik yazılar.',
    readMore: 'Devamını oku',
    empty: 'Henüz yayınlanmış blog yazısı yok.',
  },
  en: {
    title: 'Blog',
    eyebrow: 'GoldMoodAstro Journal',
    heroTitle: 'In-depth articles on astrology, tarot and numerology',
    heroLead: 'Responsible, clear and practical writing to help you prepare for expert guidance.',
    readMore: 'Read more',
    empty: 'No blog posts have been published yet.',
  },
  de: {
    title: 'Blog',
    eyebrow: 'GoldMoodAstro Journal',
    heroTitle: 'Ausführliche Artikel zu Astrologie, Tarot und Numerologie',
    heroLead: 'Verantwortliche, klare und praktische Texte zur Vorbereitung auf Beratung.',
    readMore: 'Weiterlesen',
    empty: 'Noch keine Blogbeiträge veröffentlicht.',
  },
} as const;

function copyFor(locale: string) {
  if (locale === 'tr' || locale === 'de') return COPY[locale];
  return COPY.en;
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

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const copy = copyFor(locale);
  const posts = await fetchCustomPagesPublicByModule({ moduleKey: 'blog', locale, limit: 20 });

  return (
    <>
      <Banner title={copy.title} />
      <PageContainer className="bg-(--gm-bg) min-h-[50vh]" verticalPadding="large">
        <div className="space-y-16">
          <section className="relative" style={{ padding: '3rem 4% 7rem' }}>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-50"
              style={{
                background:
                  'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 18%, transparent) 0%, transparent 70%)',
              }}
            />

            <div className="max-w-[1300px] mx-auto relative">
              <header className="text-center mb-14 md:mb-20">
                <p className="text-[10px] md:text-[11px] font-bold tracking-[0.32em] uppercase text-(--gm-primary) mb-4">
                  {copy.eyebrow}
                </p>
                <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-(--gm-text) max-w-3xl mx-auto mb-5">
                  {copy.heroTitle}
                </h1>
                <p className="text-base md:text-lg text-(--gm-text-dim) max-w-2xl mx-auto leading-relaxed font-serif italic">
                  {copy.heroLead}
                </p>
              </header>

              {posts.length === 0 ? (
                <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-10 text-center text-(--gm-text-dim)">
                  {copy.empty}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => {
                    const title = safeStr(post.title) || copy.title;
                    const slug = safeStr(post.slug);
                    const href = slug ? localizePath(locale, `/blog/${slug}`) : localizePath(locale, '/blog');
                    const html = extractHtmlFromAny(post);
                    const summary = excerpt(safeStr(post.summary) || html, 140);
                    const imgRaw = safeStr(post.featured_image) || (Array.isArray(post.images) ? safeStr(post.images[0]) : '');
                    const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
                    const dateStr = formatDate(locale, post.updated_at || post.created_at);

                    return (
                      <article
                        key={post.id || slug}
                        className="group bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl overflow-hidden transition-all duration-500 hover:border-(--gm-primary)/40 hover:shadow-(--gm-shadow-card) hover:-translate-y-1 flex flex-col"
                      >
                        <Link href={href} className="relative h-56 overflow-hidden bg-(--gm-bg-deep) block no-underline">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-(--gm-muted) text-sm">
                              GoldMoodAstro
                            </div>
                          )}
                        </Link>

                        <div className="flex flex-col grow p-7">
                          {dateStr && (
                            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-(--gm-muted) mb-3">
                              {dateStr}
                            </p>
                          )}
                          <h2 className="font-serif text-xl font-light leading-[1.3] mb-3 text-(--gm-text) group-hover:text-(--gm-primary) transition-colors">
                            <Link href={href} className="no-underline">{title}</Link>
                          </h2>
                          {summary && (
                            <p className="text-[0.9rem] text-(--gm-text-dim) font-light leading-[1.7] mb-5 grow">
                              {summary}
                            </p>
                          )}
                          <div className="pt-4 border-t border-(--gm-border-soft) mt-auto">
                            <Link
                              href={href}
                              className="text-[0.78rem] tracking-[0.15em] uppercase text-(--gm-primary) hover:text-(--gm-primary-dark) transition-colors inline-flex items-center gap-2 no-underline font-bold"
                            >
                              {copy.readMore}
                              <span className="sr-only">: {title}</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <PublicBanner placement="blog_inline" variant="slim" count={1} dismissable />
          <Feedback />
        </div>
      </PageContainer>
    </>
  );
}
