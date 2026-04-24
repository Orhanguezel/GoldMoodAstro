'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { safeStr, toCdnSrc, excerpt } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const BlogPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_blog', locale as any);
  const t = useCallback((k: string, fb: string) => ui(k, fb), [ui]);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog', sort: 'created_at', order: 'desc', locale, limit: 12,
  } as any);

  const items = useMemo(() => {
    const raw = (data as any)?.items ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const readMore = t('ui_blog_read_more',
    locale === 'de' ? 'Weiterlesen' : locale === 'tr' ? 'Devamini oku' : 'Read more'
  );

  return (
    <section className="bg-bg-primary min-h-screen" style={{ padding: '3rem 4% 7rem' }}>
      <div className="max-w-[1300px] mx-auto">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-card border border-border-light overflow-hidden">
                <div className="h-56 bg-bg-card-hover animate-pulse" />
                <div className="p-7 space-y-4">
                  <div className="h-5 bg-bg-card-hover rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-bg-card-hover rounded w-full animate-pulse" />
                  <div className="h-4 bg-bg-card-hover rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">{t('ui_blog_empty', 'No blog posts found.')}</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((post: any, i: number) => {
              const title = safeStr(post.title) || t('ui_blog_untitled', 'Untitled');
              const summary = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 120);
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${slug}`) : blogListHref;
              const imgRaw = safeStr(post.featured_image);
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
              const dateStr = post.created_at
                ? new Date(post.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

              return (
                <article
                  key={String(post.id ?? slug)}
                  className={`group bg-bg-card border border-border-light overflow-hidden transition-all duration-500 hover:border-border-hover flex flex-col reveal reveal-delay-${(i % 3) + 1}`}
                >
                  {/* Image */}
                  <Link href={href} className="relative h-56 overflow-hidden bg-bg-card-hover block no-underline">
                    {imgSrc ? (
                      <Image
                        src={imgSrc as any}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-muted text-sm">(No image)</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  </Link>

                  {/* Content */}
                  <div className="flex flex-col grow p-7">
                    {dateStr && (
                      <p className="text-[0.7rem] tracking-[0.2em] uppercase text-text-muted mb-3">{dateStr}</p>
                    )}

                    <h3 className="font-serif text-xl font-light leading-[1.3] mb-3 text-text-primary group-hover:text-brand-primary transition-colors">
                      <Link href={href} className="no-underline">{title}</Link>
                    </h3>

                    {summary && (
                      <p className="text-[0.9rem] text-text-secondary font-light leading-[1.7] mb-5 grow">{summary}</p>
                    )}

                    <div className="pt-4 border-t border-border-light mt-auto">
                      <Link
                        href={href}
                        className="text-[0.78rem] tracking-[0.15em] uppercase text-brand-primary hover:text-brand-hover transition-colors inline-flex items-center gap-2 no-underline"
                      >
                        {readMore}
                        <span className="sr-only">: {title}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          className="transition-transform group-hover:translate-x-1">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
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
  );
};

export default BlogPageContent;
