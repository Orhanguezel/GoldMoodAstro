// =============================================================
// FILE: src/components/containers/about/AboutPageContent.tsx
// goldmoodastro – About Page Content (SINGLE PAGE) (I18N + SAFE)
// =============================================================

'use client';

import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';

// RTK – Custom Pages Public
import { useListCustomPagesPublicQuery } from '@/integrations/rtk/hooks';
import type { CustomPageDto } from '@/integrations/shared';
import { downgradeH1ToH2, pickPage, toCdnSrc } from '@/integrations/shared';

// Helpers
import { useLocaleShort, useUiSection } from '@/i18n';

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);

  const t = useCallback((key: string, fallback: any) => ui(key, fallback), [ui]);

  const readUi = useCallback(
    (key: string, fallback: any) => {
      const v = t(key, fallback);
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return fallback;
        if (s === key) return fallback;
      }
      return v;
    },
    [t],
  );

  const { data, isLoading, isError } = useListCustomPagesPublicQuery({
    module_key: 'about',
    locale,
    limit: 10,
    sort: 'created_at',
    orderDir: 'asc',
  });

  const page = useMemo<CustomPageDto | null>(
    () => pickPage(data?.items ?? []),
    [data],
  );

  const headerSubtitlePrefix = useMemo(
    () => String(readUi('ui_about_subprefix', 'Energetische Massage') || '').trim() || 'Energetische Massage',
    [readUi],
  );

  const headerSubtitleLabel = useMemo(() => {
    const v = String(readUi('ui_about_sublabel', '') || '').trim();
    return v;
  }, [readUi]);

  const headerTitle = useMemo(() => {
    const v = String(readUi('ui_about_page_title', '') || '').trim();
    if (v) return v;
    if (locale === 'de') return 'Über mich';
    if (locale === 'tr') return 'Hakkımda';
    return 'About';
  }, [readUi, locale]);

  const headerLead = useMemo(() => String(readUi('ui_about_page_lead', '') || '').trim(), [readUi]);

  const html = useMemo(() => {
    const raw = page?.content_html || page?.content || '';
    return raw ? downgradeH1ToH2(raw) : '';
  }, [page]);

  const featuredImageRaw = useMemo(
    () => (page?.featured_image ?? '').trim(),
    [page],
  );

  const imgSrc = useMemo(() => {
    if (!featuredImageRaw) return '';
    const cdn = toCdnSrc(featuredImageRaw, 1200, 800, 'fill');
    return (cdn || featuredImageRaw) as any;
  }, [featuredImageRaw]);

  const imgAlt = useMemo(() => {
    const alt = (page?.featured_image_alt ?? '').trim();
    return alt || 'about image';
  }, [page]);

  const galleryThumbs = useMemo(() => {
    const images = page?.images ?? [];
    const unique = Array.from(new Set(images.filter(Boolean)));
    return unique.filter((x) => x !== featuredImageRaw).slice(0, 3);
  }, [page, featuredImageRaw]);

  return (
    <section className="relative py-16 md:py-24 z-10 bg-bg-primary text-text-primary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4">
            <span className="block text-brand-primary font-normal uppercase tracking-[0.15em] mb-2 text-sm md:text-base">
              <span>{headerSubtitlePrefix}</span>
              {headerSubtitleLabel ? ` ${headerSubtitleLabel}` : null}
            </span>

            <h2 className="text-3xl md:text-4xl font-serif font-light text-text-primary leading-tight">
              {headerTitle}
            </h2>

            {headerLead ? (
              <p className="mt-4 mb-0 text-text-secondary max-w-2xl mx-auto">{headerLead}</p>
            ) : null}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="h-4 bg-bg-card-hover rounded w-full mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-bg-card-hover rounded w-4/5 mb-2.5 animate-pulse" aria-hidden />
            <div className="h-4 bg-bg-card-hover rounded w-3/5 animate-pulse" aria-hidden />
          </div>
        )}

        {/* Empty / Error */}
        {!isLoading && (!page || isError) && (
          <div className="max-w-4xl mx-auto">
            <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50" role="alert">
              {readUi('ui_about_empty', 'Content not found.')}
            </div>
          </div>
        )}

        {!!page && !isLoading && (
          <>
            {/* Hero image — full-width with elegant framing */}
            {imgSrc && (
              <div
                className="mb-12 max-w-5xl mx-auto"
                data-aos="fade-up"
                data-aos-delay={100}
              >
                <div className="relative overflow-hidden shadow-medium bg-bg-secondary border border-border-light">
                  <div className="w-full aspect-16/7 md:aspect-16/6 relative">
                    <Image
                      src={imgSrc}
                      alt={imgAlt}
                      fill
                      className="object-cover"

                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content — centered, readable width */}
            <div
              className="max-w-3xl mx-auto mb-12"
              data-aos="fade-up"
              data-aos-delay={200}
            >
              {html ? (
                <div
                  className="prose prose-lg prose-rose text-text-secondary max-w-none
                    prose-h2:font-serif prose-h2:text-text-primary prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-0 prose-h2:mb-6
                    prose-h3:font-serif prose-h3:text-text-primary prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:mb-5
                    prose-li:leading-relaxed
                    prose-strong:text-text-primary
                    prose-em:text-brand-primary/80
                    prose-a:text-brand-primary"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div>
                  <p className="mb-0">
                    {readUi('ui_about_empty_text', 'Content will be published here.')}
                  </p>
                </div>
              )}
            </div>

            {/* Gallery thumbnails — elegant grid */}
            {galleryThumbs.length > 0 && (
              <div
                className="max-w-5xl mx-auto"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <div className={`grid gap-4 md:gap-6 ${
                  galleryThumbs.length === 1
                    ? 'grid-cols-1 max-w-2xl mx-auto'
                    : galleryThumbs.length === 2
                      ? 'grid-cols-2 max-w-4xl mx-auto'
                      : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {galleryThumbs.map((src, i) => (
                    <div
                      key={src}
                      className={`relative overflow-hidden border border-border-light bg-bg-secondary shadow-soft
                        transition-transform duration-500 hover:scale-[1.02] hover:shadow-medium
                        ${galleryThumbs.length === 3 && i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
                    >
                      <div className="aspect-4/3 relative">
                        <Image
                          src={src}
                          alt={`${imgAlt} ${i + 1}`}
                          fill
                          className="object-cover"
    
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 350px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AboutPageContent;
