'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  useGetServiceBySlugPublicQuery,
  useListServiceImagesPublicQuery,
  useGetSiteSettingByKeyQuery,
} from '@/integrations/rtk/hooks';

import { safeStr, toCdnSrc} from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

import ImageLightboxModal from '@/components/common/public/ImageLightboxModal';
import OtherServicesSidebar from '@/components/containers/services/OtherServicesSidebar';

type ServiceDetailProps = {
  forcedSlug?: string;
  hideBackLink?: boolean;
};

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function parseContentBlocks(text: string): ContentBlock[] {
  const normalized = safeStr(text).replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks = normalized.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
  const blocks: ContentBlock[] = [];

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    if (lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'list', items: lines.map((line) => line.replace(/^- /, '').trim()).filter(Boolean) });
      continue;
    }

    if (lines.length === 1 && /^(dauer|duration|sure|süre)\b/i.test(lines[0])) {
      blocks.push({ type: 'heading', text: lines[0] });
      continue;
    }

    if (/^##\s+/.test(lines[0])) {
      blocks.push({ type: 'heading', text: lines[0].replace(/^##\s+/, '').trim() });
      if (lines.slice(1).length) {
        blocks.push({ type: 'paragraph', text: lines.slice(1).join(' ') });
      }
      continue;
    }

    blocks.push({ type: 'paragraph', text: lines.join(' ') });
  }

  return blocks;
}

export default function ServiceDetail({ forcedSlug, hideBackLink = false }: ServiceDetailProps) {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const params = useParams<{ slug?: string | string[] }>();
  const slug = useMemo(() => {
    if (safeStr(forcedSlug)) return safeStr(forcedSlug);
    const v = params?.slug;
    return Array.isArray(v) ? safeStr(v[0]) : safeStr(v);
  }, [forcedSlug, params]);

  const servicesHref = useMemo(() => localizePath(locale, '/services'), [locale]);
  const appointmentHref = useMemo(() => {
    const base = localizePath(locale, '/appointment');
    if (!slug) return base;
    return `${base}?service=${encodeURIComponent(slug)}`;
  }, [locale, slug]);

  const { data: defaultLocaleRow } = useGetSiteSettingByKeyQuery({ key: 'default_locale' } as any);
  const defaultLocale = safeStr((defaultLocaleRow as any)?.value) || 'de';

  const { data: service, isLoading } = useGetServiceBySlugPublicQuery(
    { slug, locale, default_locale: defaultLocale } as any,
    { skip: !slug },
  );

  const serviceId = safeStr((service as any)?.id);

  const { data: images } = useListServiceImagesPublicQuery(
    { serviceId, locale, default_locale: defaultLocale } as any,
    { skip: !serviceId },
  );

  const title = safeStr((service as any)?.name);

  const hero = useMemo(() => {
    const featured =
      safeStr((service as any)?.featured_image_url) ||
      safeStr((service as any)?.image_url) ||
      safeStr((service as any)?.featured_image);

    if (featured) return featured;

    const first = images?.[0]?.image_url;
    return safeStr(first);
  }, [service, images]);

  const gallery = useMemo(() => {
    const arr = [];

    if (hero) arr.push(hero);

    (images || []).forEach((i: any) => {
      if (i?.image_url) arr.push(i.image_url);
    });

    return Array.from(new Set(arr));
  }, [hero, images]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const heroSrc = gallery[idx] || hero;
  const rawContent = useMemo(() => {
    // Try content first (new schema), then description (legacy)
    const raw = (service as any)?.content || (service as any)?.description || '';
    if (!raw) return '';
    const str = safeStr(raw);
    // content might be JSON string like '{"html":"<h2>..."}'
    if (typeof str === 'string' && str.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        return safeStr(parsed?.html) || str;
      } catch { /* not JSON */ }
    }
    return str;
  }, [service]);

  const contentBlocks = useMemo(
    () => parseContentBlocks(rawContent),
    [rawContent],
  );

  if (!slug || isLoading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (!service) {
    return <div className="py-20 text-center">Not found</div>;
  }

  const summaryText = safeStr((service as any)?.summary);
  const details = [
    { label: ui('ui_services_type_label', 'Behandlung'), value: 'Energetische Entspannungsmassage' },
    { label: ui('ui_services_duration_label', locale === 'de' ? 'Dauer' : locale === 'tr' ? 'Sure' : 'Duration'), value: locale === 'de' ? 'Mind. 120 Min.' : locale === 'tr' ? 'En az 120 dk.' : 'At least 120 min.' },
    { label: ui('ui_services_location_label', locale === 'de' ? 'Ort' : locale === 'tr' ? 'Konum' : 'Location'), value: locale === 'de' ? 'Hausbesuch' : locale === 'tr' ? 'Ev ziyareti' : 'Home visit' },
    { label: ui('ui_services_area_label', locale === 'de' ? 'Gebiet' : locale === 'tr' ? 'Bolge' : 'Area'), value: 'Bonn & Umgebung' },
  ];

  return (
    <>
      <section className="bg-bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* SIDEBAR (LEFT) */}
            <div className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 space-y-8">
                <OtherServicesSidebar currentSlug={slug} />

                <div className="bg-bg-secondary p-6 shadow-soft border border-border-light">
                  <h3 className="text-xl font-serif font-light mb-6 border-b border-border-light pb-2">
                    {ui('ui_services_sidebar_info_title', 'Service details')}
                  </h3>

                  {details.length ? (
                    <dl className="space-y-4 text-sm">
                      {details.map((d) => (
                        <div key={d.label} className="flex items-start justify-between gap-4">
                          <dt className="text-text-muted font-semibold">{d.label}</dt>
                          <dd className="text-text-primary font-medium text-right">{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-text-muted">
                      {ui('ui_services_details_empty', 'No details yet.')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN */}
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                {hideBackLink ? <div /> : (
                  <Link
                    href={servicesHref}
                    className="inline-flex text-sm font-normal uppercase tracking-[0.15em] text-text-muted hover:text-brand-primary"
                  >
                    ← {ui('ui_services_back_to_list', 'Back')}
                  </Link>
                )}

                <Link
                  href={appointmentHref}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-primary text-white text-sm font-normal uppercase tracking-[0.15em] hover:bg-brand-hover transition-colors"
                >
                  {ui('ui_services_cta_request_quote', 'Book appointment')}
                </Link>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-6">
                {title}
              </h1>

              {/* HERO BLOG STYLE */}
              {heroSrc && (
                <div className="mb-8 overflow-hidden shadow-medium bg-bg-card-hover">
                  <div
                    className="aspect-video relative cursor-pointer"
                    onClick={() => setOpen(true)}
                  >
                    <Image
                      src={toCdnSrc(heroSrc, 1600, 900, 'fit') || heroSrc}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* THUMBS BLOG STYLE */}
              {gallery.length > 1 && (
                <div className="flex gap-2 mb-8">
                  {gallery.map((g, i) => (
                    <button
                      key={g}
                      onClick={() => {
                        setIdx(i);
                        setOpen(true);
                      }}
                      className={`w-24 h-16 relative rounded-md overflow-hidden border ${
                        i === idx ? 'border-brand-primary' : 'border-transparent opacity-70'
                      }`}
                    >
                      <Image src={g} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* CONTENT BLOG STYLE */}
              <div className="bg-bg-secondary p-8 md:p-10 shadow-soft border border-border-light">
                <div className="space-y-6">
                  {contentBlocks.length ? contentBlocks.map((block, blockIndex) => {
                    if (block.type === 'heading') {
                      return (
                        <h2
                          key={`block-${blockIndex}`}
                          className="text-2xl font-serif font-light text-text-primary pt-2"
                        >
                          {block.text}
                        </h2>
                      );
                    }

                    if (block.type === 'list') {
                      return (
                        <ul
                          key={`block-${blockIndex}`}
                          className="space-y-3 rounded-xl bg-bg-card/70 p-5 text-base leading-7 text-text-primary"
                        >
                          {block.items.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                              <span className="mt-2 size-2 rounded-full bg-brand-primary" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p
                        key={`block-${blockIndex}`}
                        className="text-base leading-8 text-text-primary"
                      >
                        {block.text}
                      </p>
                    );
                  }) : (
                    <div className="text-base leading-8 text-text-secondary prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: rawContent }} />
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <ImageLightboxModal
        open={open}
        onClose={() => setOpen(false)}
        images={gallery.map((g) => ({ raw: g, thumb: g }))}
        index={idx}
        onIndexChange={setIdx}
        title={title}
      />
    </>
  );
}
