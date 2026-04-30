'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import { safeStr, toCdnSrc, excerpt } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const FALLBACK_BLOG_POSTS = {
  tr: [
    {
      id: 'fallback-blog-1',
      title: 'Doğum Haritası Nedir, İlk Bakışta Neler Anlatır?',
      slug: 'dogum-haritasi-nedir',
      summary: 'Doğum haritasının temel anlamını ve ilk danışmanlıkta hangi göstergelerin birlikte okunduğunu öğrenin.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'Sinastri Uyumu Nasıl Okunur?',
      slug: 'sinastri-uyumu-nasil-okunur',
      summary: 'Sinastri haritasında ilişki uyumu, çekim, iletişim ve duygusal güven göstergeleri nasıl okunur?',
      featured_image: '/img/synastry_chart.png',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'Tarot Açılımında Daha İyi Soru Nasıl Sorulur?',
      slug: 'tarot-acilimi-soru-sorma-rehberi',
      summary: 'Tarot açılımına girmeden önce daha net, etik ve uygulanabilir sorular hazırlamak için kısa rehber.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Numerolojide Hayat Yolu Sayısı Ne Anlatır?',
      slug: 'numeroloji-hayat-yolu-sayisi',
      summary: 'Hayat yolu sayısının numerolojideki yerini, nasıl hesaplandığını ve danışmanlıkta nasıl kullanıldığını öğrenin.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Ay Burcu Duygusal İhtiyaçları Nasıl Gösterir?',
      slug: 'ay-burcu-duygusal-ihtiyaclar',
      summary: 'Ay burcunun duygusal güven, ilişki ritmi ve içsel ihtiyaçlarla bağlantısını keşfedin.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
  en: [
    {
      id: 'fallback-blog-1',
      title: 'What Is a Birth Chart and What Does It Reveal First?',
      slug: 'what-is-a-birth-chart',
      summary: 'A practical introduction to birth charts and the first indicators reviewed in an astrology session.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'How to Read Synastry Compatibility',
      slug: 'how-to-read-synastry-compatibility',
      summary: 'A guide to relationship compatibility through synastry, attraction, communication, and emotional safety.',
      featured_image: '/img/synastry_chart.png',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'How to Ask Better Tarot Questions',
      slug: 'how-to-ask-better-tarot-questions',
      summary: 'A short guide to clearer, ethical, and more useful questions before a tarot reading.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Life Path Number in Numerology',
      slug: 'life-path-number-in-numerology',
      summary: 'Understand what the life path number means, how it is calculated, and how it is used in guidance.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Moon Sign and Emotional Needs',
      slug: 'moon-sign-and-emotional-needs',
      summary: 'Explore how the Moon sign relates to emotional safety, relationship rhythm, and inner needs.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
  de: [
    {
      id: 'fallback-blog-1',
      title: 'Was ist ein Geburtshoroskop und was zeigt es zuerst?',
      slug: 'was-ist-ein-geburtshoroskop',
      summary: 'Eine klare Einführung in Geburtshoroskope und die ersten Faktoren einer astrologischen Beratung.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-30T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-2',
      title: 'Synastrie richtig lesen',
      slug: 'synastrie-richtig-lesen',
      summary: 'Ein Leitfaden zu Synastrie, Beziehungskompatibilität, Anziehung, Kommunikation und emotionaler Sicherheit.',
      featured_image: '/img/synastry_chart.png',
      created_at: '2026-04-23T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-3',
      title: 'Bessere Tarot-Fragen stellen',
      slug: 'bessere-tarot-fragen-stellen',
      summary: 'Ein kurzer Leitfaden für klare, ethische und nützliche Fragen vor einer Tarot Beratung.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-16T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-4',
      title: 'Lebenswegzahl in der Numerologie',
      slug: 'lebenswegzahl-numerologie',
      summary: 'Erfahren Sie, was die Lebenswegzahl bedeutet, wie sie berechnet wird und wie sie in Beratungen genutzt wird.',
      featured_image: '/img/natal_chart.png',
      created_at: '2026-04-09T09:00:00.000Z',
    },
    {
      id: 'fallback-blog-5',
      title: 'Mondzeichen und emotionale Bedürfnisse',
      slug: 'mondzeichen-und-emotionale-beduerfnisse',
      summary: 'Entdecken Sie, wie das Mondzeichen mit emotionaler Sicherheit, Beziehungsrhythmus und inneren Bedürfnissen verbunden ist.',
      featured_image: '/img/daily_reading.png',
      created_at: '2026-04-02T09:00:00.000Z',
    },
  ],
};

const BLOG_IMAGE_FALLBACKS: Record<string, string> = {
  '/img/numerology_chart.png': '/img/natal_chart.png',
  '/img/moon_phase.png': '/img/daily_reading.png',
  '/img/retrograde_guide.png': '/img/synastry_chart.png',
  '/img/consultant_session.png': '/support_ai.webp',
  '/img/ritual_journal.png': '/img/daily_reading.png',
};

function normalizeBlogImage(src: string): string {
  return BLOG_IMAGE_FALLBACKS[src] || src;
}

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

  const renderedItems = useMemo(() => {
    if (items.length > 0) return items;
    return FALLBACK_BLOG_POSTS[locale as keyof typeof FALLBACK_BLOG_POSTS] ?? FALLBACK_BLOG_POSTS.en;
  }, [items, locale]);

  const blogListHref = useMemo(() => localizePath(locale, '/blog'), [locale]);

  const readMore = t('ui_blog_read_more',
    locale === 'de' ? 'Weiterlesen' : locale === 'tr' ? 'Devamini oku' : 'Read more'
  );

  return (
    <section className="bg-[var(--gm-bg)] min-h-screen relative" style={{ padding: '3rem 4% 7rem' }}>
      {/* Tema-aware accent glow — her preset'te primary rengi parlatır */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-50"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 18%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-[1300px] mx-auto relative">
        {/* Hero header — eyebrow + lead */}
        <header className="text-center mb-14 md:mb-20">
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.32em] uppercase text-[var(--gm-primary)] mb-4">
            {t('ui_blog_eyebrow', locale === 'tr' ? 'GoldMoodAstro Günlüğü' : locale === 'de' ? 'GoldMoodAstro Tagebuch' : 'GoldMoodAstro Journal')}
          </p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-[var(--gm-text)] max-w-3xl mx-auto mb-5">
            {t(
              'ui_blog_hero_title',
              locale === 'tr'
                ? 'Astroloji, tarot ve numeroloji üzerine derinlikli yazılar'
                : locale === 'de'
                  ? 'Tiefgehende Beiträge zu Astrologie, Tarot und Numerologie'
                  : 'In-depth articles on astrology, tarot and numerology',
            )}
          </h1>
          <p className="text-base md:text-lg text-[var(--gm-text-dim)] max-w-2xl mx-auto leading-relaxed font-serif italic">
            {t(
              'ui_blog_hero_lead',
              locale === 'tr'
                ? 'Uzman danışmanlardan ipuçları, rehberler ve sembolik bir dilden farkındalık notları.'
                : locale === 'de'
                  ? 'Tipps, Anleitungen und reflektierende Notizen unserer Expertenberater.'
                  : 'Tips, guides and reflective notes from our expert consultants.',
            )}
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
            <span className="text-[var(--gm-primary)] text-xs">✦</span>
            <span className="h-px w-12 bg-[var(--gm-primary)]/40" />
          </div>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden">
                <div className="h-56 bg-[var(--gm-bg-deep)] animate-pulse" />
                <div className="p-7 space-y-4">
                  <div className="h-5 bg-[var(--gm-bg-deep)] rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-full animate-pulse" />
                  <div className="h-4 bg-[var(--gm-bg-deep)] rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && renderedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderedItems.map((post: any, i: number) => {
              const title = safeStr(post.title) || t('ui_blog_untitled', 'Untitled');
              const summary = excerpt(safeStr(post.summary) || safeStr(post.content_html) || '', 120);
              const slug = safeStr(post.slug);
              const href = slug ? localizePath(locale, `/blog/${slug}`) : blogListHref;
              const imgRaw = normalizeBlogImage(safeStr(post.featured_image));
              const imgSrc = imgRaw ? toCdnSrc(imgRaw, 600, 400, 'fill') || imgRaw : '';
              const dateStr = post.created_at
                ? new Date(post.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '';

              return (
                <article
                  key={String(post.id ?? slug)}
                  className={`group bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] rounded-2xl overflow-hidden transition-all duration-500 hover:border-[var(--gm-primary)]/40 hover:shadow-[var(--gm-shadow-card)] hover:-translate-y-1 flex flex-col reveal reveal-delay-${(i % 3) + 1}`}
                >
                  {/* Image */}
                  <Link href={href} className="relative h-56 overflow-hidden bg-[var(--gm-bg-deep)] block no-underline">
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
                      <div className="flex items-center justify-center h-full text-[var(--gm-muted)] text-sm">(No image)</div>
                    )}
                    {/* Mor gradient overlay — tema-aware (her preset'te primary tonunda) */}
                    <div
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--gm-primary) 35%, transparent) 0%, transparent 60%)',
                      }}
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex flex-col grow p-7">
                    {dateStr && (
                      <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--gm-muted)] mb-3">{dateStr}</p>
                    )}

                    <h2 className="font-serif text-xl font-light leading-[1.3] mb-3 text-[var(--gm-text)] group-hover:text-[var(--gm-primary)] transition-colors">
                      <Link href={href} className="no-underline">{title}</Link>
                    </h2>

                    {summary && (
                      <p className="text-[0.9rem] text-[var(--gm-text-dim)] font-light leading-[1.7] mb-5 grow">{summary}</p>
                    )}

                    <div className="pt-4 border-t border-[var(--gm-border-soft)] mt-auto">
                      <Link
                        href={href}
                        className="text-[0.78rem] tracking-[0.15em] uppercase text-[var(--gm-primary)] hover:text-[var(--gm-primary-dark)] transition-colors inline-flex items-center gap-2 no-underline font-bold"
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
