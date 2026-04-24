'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// RTK
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';

// Helpers

import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import {
  safeStr,
  SERVICE_FALLBACK_IMG,excerpt,toCdnSrc,
  type ServiceCardVM,
} from '@/integrations/shared';

// Components
import { ServiceIcon } from '@/components/common/ServiceIcon';
import { IconArrowRight } from '@/components/ui/icons';

const Service: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useListServicesPublicQuery({
    locale,
    limit: 12, // More items for the main page
    order: 'display_order.asc',
  } as any, { skip: !mounted });

  const cards = useMemo<ServiceCardVM[]>(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];

    const mapped = items.map((s: any) => {
      const imgBase =
        safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);

      const title = safeStr(s?.title) || safeStr(s?.name) || ui('ui_services_placeholder_title', 'Our service');

      const rawSummary = safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);

      const summary = rawSummary
        ? excerpt(rawSummary, 150)
        : ui('ui_services_placeholder_summary', 'Description coming soon.');

      let src = SERVICE_FALLBACK_IMG;
      if (imgBase) {
        src = toCdnSrc(imgBase, 640, 420, 'fill') || imgBase;
      }

      return {
        id: safeStr(s?.id) || safeStr(s?.slug) || Math.random().toString(36).slice(2),
        title,
        summary,
        slug: safeStr(s?.slug),
        src,
      };
    });

    if (!mapped.length && !isLoading) {
      return new Array(3).fill(0).map((_, i) => ({
        id: `ph-${i + 1}`,
        title: ui('ui_services_placeholder_title', 'Service'),
        summary: ui('ui_services_placeholder_summary', 'Coming soon.'),
        slug: '',
        src: SERVICE_FALLBACK_IMG,
      }));
    }

    return mapped;
  }, [data, ui, isLoading]);

  return (
    <div className="bg-bg-primary relative py-20 lg:py-32 min-h-screen">
       {/* Decor */}
      <div className="absolute top-0 right-0 w-1/4 h-full bg-bg-card/50 skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="inline-block py-1 px-3 bg-bg-card-hover text-text-primary text-xs font-normal uppercase tracking-[0.2em] mb-4">
                 {ui('ui_services_subprefix', 'Königs Massage')} {ui('ui_services_sublabel', 'Services')}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-light text-text-primary leading-tight mb-6">
              {ui('ui_services_title', 'Our Treatments')}
            </h2>
            <p className="text-text-secondary text-lg">
                Discover our range of professional massage therapies designed to help you relax, recover, and rejuvenate.
            </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up">
        {(!mounted || (isLoading && cards.length === 0)) ? (
                 Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex w-full flex-col bg-bg-card border border-border-light overflow-hidden h-112.5">
                        <div className="h-56 bg-bg-card-hover animate-pulse" />
                        <div className="p-8 space-y-4">
                            <div className="h-6 bg-bg-card-hover rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-bg-card-hover rounded w-full animate-pulse" />
                            <div className="h-4 bg-bg-card-hover rounded w-5/6 animate-pulse" />
                        </div>
                    </div>
                 ))
            ) : (
                cards.map((it) => {
                    const href = it.slug
                    ? localizePath(locale, `/services/${encodeURIComponent(it.slug)}`)
                    : localizePath(locale, '/service');

                    return (
                    <div className="group bg-bg-card overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 border border-border-light hover:border-border-medium flex flex-col" key={it.id}>
                        <div className="relative h-64 overflow-hidden bg-bg-card-hover">
                             <Image 
                                src={it.src} 
                                alt={it.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            <div className="absolute top-4 right-4 bg-bg-card/90 backdrop-blur p-2 rounded-full text-brand-primary shadow-sm z-20 transform transition-transform group-hover:scale-110">
                                <ServiceIcon label={it.title} size={24} />
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <h3 className="text-2xl font-serif font-light mb-3 text-text-primary group-hover:text-brand-primary transition-colors">
                                <Link href={href} className="focus:outline-none">
                                    <span className="absolute inset-0 z-0" />
                                    {it.title}
                                </Link>
                            </h3>
                            <p className="text-text-secondary mb-6 line-clamp-3 leading-relaxed flex-1">
                                {it.summary}
                            </p>
                            
                            <div className="pt-4 border-t border-border-light flex justify-between items-center text-text-primary group-hover:text-brand-primary transition-colors mt-auto">
                                <span className="text-sm font-normal uppercase tracking-[0.15em]r">
                                    {ui('ui_services_btn_detail', 'Details')}
                                </span>
                                <IconArrowRight className="transform group-hover:translate-x-1 transition-transform" size={18} />
                            </div>
                        </div>
                    </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};

export default Service;
