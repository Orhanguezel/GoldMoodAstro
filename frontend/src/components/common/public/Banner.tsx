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
            className="group relative overflow-hidden rounded-xl border border-gm-border-soft bg-gm-surface shadow-gm-shadow-soft transition-all hover:shadow-gm-shadow-card"
            onClick={() => trackClick(banner.id)}
          >
            <div className="aspect-[21/9] w-full sm:aspect-[3/1]">
              <img 
                src={banner.image_url} 
                alt={title || banner.code} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gm-bg/80 via-transparent to-transparent" />
            </div>
            
            {(title || subtitle) && (
              <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                {title && <h3 className="font-display text-xl text-gm-text sm:text-2xl">{title}</h3>}
                {subtitle && <p className="mt-1 text-sm text-gm-text-dim sm:text-base">{subtitle}</p>}
                {cta && banner.link_url && (
                  <div className="mt-3 inline-flex items-center rounded-full bg-gm-primary px-4 py-1.5 text-sm font-medium text-white shadow-gm-shadow-glow hover:bg-gm-primary-dark transition-colors">
                    {cta}
                  </div>
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
