'use client';

import * as React from 'react';
import Link from 'next/link';
import { useListBannersQuery, useTrackBannerClickMutation } from '@/integrations/rtk/public/banners.endpoints';
import { BannerPlacement, getMultiLang } from '@/types/common';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BannerProps {
  placement: BannerPlacement;
  className?: string;
  count?: number;
}

export default function Banner({ placement, className, count = 1 }: BannerProps) {
  const { locale } = useParams();
  const { data: banners, isLoading } = useListBannersQuery({ 
    placement, 
    locale: locale as string 
  });
  const [trackClick] = useTrackBannerClickMutation();

  if (isLoading || !banners || banners.length === 0) return null;

  // Take the first N banners based on count
  const items = banners.slice(0, count);

  return (
    <div className={cn("grid gap-4", className)}>
      {items.map((banner) => {
        const title = getMultiLang({ tr: banner.title_tr || '', en: banner.title_en || '' }, locale as string);
        const subtitle = getMultiLang({ tr: banner.subtitle_tr || '', en: banner.subtitle_en || '' }, locale as string);
        const cta = getMultiLang({ tr: banner.cta_label_tr || '', en: banner.cta_label_en || '' }, locale as string);

        const content = (
          <div
            key={banner.id}
            className="group relative overflow-hidden rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-sm transition-all hover:shadow-md"
            onClick={() => trackClick(banner.id)}
          >
            <div className="relative aspect-21/9 w-full sm:aspect-3/1">
              <img
                src={banner.image_url}
                alt={title || banner.code}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Soldan sağa kararma — metin okunabilirliği için */}
              <div className="absolute inset-0 bg-linear-to-r from-(--gm-bg)/85 via-(--gm-bg)/45 to-transparent" />
            </div>

            {(title || subtitle || (cta && banner.link_url)) && (
              <div className="absolute inset-y-0 left-0 flex max-w-[60%] flex-col justify-center p-6 sm:p-10">
                {title && (
                  <h3 className="font-display text-2xl leading-tight text-(--gm-text) sm:text-3xl">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-2 font-serif italic text-sm text-(--gm-text-dim) sm:text-base">
                    {subtitle}
                  </p>
                )}
                {cta && banner.link_url && (
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-(--gm-gold) bg-(--gm-gold) px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--gm-bg-deep) transition-colors group-hover:bg-(--gm-gold-deep) group-hover:text-white">
                    {cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            )}
          </div>
        );

        if (banner.link_url) {
          return (
            <Link key={banner.id} href={banner.link_url} className="block">
              {content}
            </Link>
          );
        }

        return content;
      })}
    </div>
  );
}
