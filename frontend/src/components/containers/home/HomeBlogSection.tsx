'use client';
// =============================================================
// FILE: src/components/containers/home/HomeBlogSection.tsx
//
// Ana sayfa blog bölümü — YALNIZ admin panelinde "Ana sayfa" anahtarı açılmış
// (custom_pages.featured = 1) ve YAYINDA olan yazıları gösterir.
//
// Onaylı yazı yoksa bölüm hiç render edilmez (boş başlık bırakmaz) — ana sayfa
// bölümlerinin ortak davranışı bu.
// =============================================================
import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, UserRound } from 'lucide-react';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/public/custom_pages.endpoints';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

interface Props {
  locale?: string;
  config?: { limit?: number } | null;
}

function formatDate(locale: string, value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tag = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US';
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export default function HomeBlogSection({ locale: localeProp, config }: Props) {
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale || 'tr';
  const { ui } = useUiSection('ui_home' as any, locale);
  const limit = Number(config?.limit ?? 3);

  const { data, isLoading } = useListCustomPagesPublicQuery({
    module_key: 'blog',
    locale,
    default_locale: locale,
    is_published: true,
    featured: true,
    sort: 'created_at',
    orderDir: 'desc',
    limit,
  });

  const posts = (data?.items ?? []).slice(0, limit);
  if (!isLoading && posts.length === 0) return null;

  return (
    <section id="blog" className="py-24 bg-(--gm-bg)">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <span className="font-display text-[10px] tracking-[0.5em] text-(--gm-gold-deep) uppercase mb-4 block">
            {ui('ui_home_blog_label', 'Yazılar')}
          </span>
          <h2 className="font-display text-3xl md:text-5xl text-(--gm-text) mb-6">
            {ui('ui_home_blog_title_a', 'Astroloji')}{' '}
            <span className="text-(--gm-gold)">{ui('ui_home_blog_title_b', 'Günlüğü')}</span>
          </h2>
          <p className="font-serif italic text-(--gm-text-dim) max-w-2xl mx-auto">
            {ui('ui_home_blog_desc', 'Danışmanlarımızın kaleminden gökyüzü, semboller ve kendini tanıma üzerine yazılar.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? [1, 2, 3].slice(0, limit).map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface)/20 animate-pulse"
                />
              ))
            : posts.map((post) => {
                const cover = post.featured_image_effective_url || post.featured_image || post.image_url || '';
                const href = localizePath(locale, `/blog/${post.slug}`);
                const dateStr = formatDate(locale, post.created_at || post.updated_at);
                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-(--gm-shadow-soft) transition-all hover:border-(--gm-gold)/40"
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={post.featured_image_alt || post.title || ''}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-48 w-full bg-(--gm-bg-deep)" />
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      {dateStr ? (
                        <span className="mb-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-(--gm-muted)">
                          <CalendarDays className="size-3.5" />
                          {dateStr}
                        </span>
                      ) : null}
                      {/* Yazar: adı ve küçük fotoğrafı. Yazarı olmayan yazıda
                          editoryal ekip yazılır — satır hiç kaybolmasın diye,
                          aksi halde kartlar arasında hizasızlık oluşuyor. */}
                      <span className="mb-3 inline-flex items-center gap-2 text-xs text-(--gm-text-dim)">
                        {post.author?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.author.avatar_url}
                            alt=""
                            className="size-7 shrink-0 rounded-full border border-(--gm-border-soft) object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-(--gm-border-soft) bg-(--gm-bg-deep) text-(--gm-gold)">
                            <UserRound className="size-3.5" />
                          </span>
                        )}
                        <span className="truncate">
                          {post.author?.full_name ||
                            ui('ui_home_blog_editorial', 'GoldMoodAstro Editoryal Ekibi')}
                        </span>
                      </span>
                      <h3 className="font-serif text-xl leading-snug text-(--gm-text) transition-colors group-hover:text-(--gm-gold)">
                        {post.title}
                      </h3>
                      {post.summary ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-(--gm-text-dim)">
                          {post.summary}
                        </p>
                      ) : null}
                      <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-(--gm-gold)">
                        {ui('ui_home_blog_read', 'Yazıyı oku')}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href={localizePath(locale, '/blog')}
            className="inline-flex items-center gap-3 rounded-full border border-(--gm-border-soft) px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-(--gm-text) transition-colors hover:border-(--gm-gold)/40 hover:text-(--gm-gold)"
          >
            {ui('ui_home_blog_all', 'Tüm yazılar')}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
