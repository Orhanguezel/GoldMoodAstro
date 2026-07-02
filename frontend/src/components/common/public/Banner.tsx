'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Info, Image as ImageIcon } from 'lucide-react';
import { useListBannersQuery, useTrackBannerClickMutation } from '@/integrations/rtk/public/banners.endpoints';
import { BannerPlacement, getMultiLang } from '@/types/common';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';

/** Banner visual variants:
 *  - hero: 21/9 large top banner
 *  - slim: 6/1 thin in-content banner
 *  - card: 16/9 balanced banner for sidebar/blog
 */
type Variant = 'hero' | 'slim' | 'card';

interface BannerProps {
  placement: BannerPlacement;
  className?: string;
  count?: number;
  variant?: Variant;
  /** When true, the X button can dismiss it and localStorage remembers it. */
  dismissable?: boolean;
}

const ASPECTS: Record<Variant, string> = {
  hero: 'aspect-21/9 sm:aspect-3/1',
  slim: 'aspect-6/1 sm:aspect-8/1',
  card: 'aspect-16/9',
};

const PADDINGS: Record<Variant, string> = {
  hero: 'p-6 sm:p-10',
  slim: 'p-4 sm:p-6',
  card: 'p-5 sm:p-7',
};

const TITLE_SIZES: Record<Variant, string> = {
  hero: 'text-2xl sm:text-3xl',
  slim: 'text-base sm:text-lg',
  card: 'text-xl sm:text-2xl',
};

export default function Banner({
  placement,
  className,
  count = 1,
  variant = 'hero',
  dismissable = false,
}: BannerProps) {
  const { locale } = useParams();
  const { data: banners, isLoading } = useListBannersQuery({
    placement,
    locale: locale as string,
  });
  const [trackClick] = useTrackBannerClickMutation();
  const { user } = useAuthStore();

  // Dismiss state stored per placement in localStorage.
  const dismissKey = `banner-dismissed:${placement}`;
  const [dismissed, setDismissed] = React.useState(false);
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});
  React.useEffect(() => {
    if (!dismissable) return;
    if (typeof window === 'undefined') return;
    setDismissed(window.localStorage.getItem(dismissKey) === '1');
  }, [dismissKey, dismissable]);

  // Premium gating - FAZ 41 T41-3: pro users do not see ads.
  const isPremium = user?.is_premium === true;
  if (isPremium) return null;

  if (isLoading || !banners || banners.length === 0 || dismissed) return null;

  const items = banners.slice(0, count);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(dismissKey, '1');
    }
    setDismissed(true);
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {items.map((banner) => {
        const title = (banner as any).title || getMultiLang(
          { tr: banner.title_tr || '', en: banner.title_en || '' },
          locale as string,
        );
        const subtitle = (banner as any).subtitle || getMultiLang(
          { tr: banner.subtitle_tr || '', en: banner.subtitle_en || '' },
          locale as string,
        );
        const cta = (banner as any).cta_label || getMultiLang(
          { tr: banner.cta_label_tr || '', en: banner.cta_label_en || '' },
          locale as string,
        );

        const isSlim = variant === 'slim';
        const imageFailed = failedImages[banner.id] || !banner.image_url;

        const content = (
          <div
            key={banner.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-sm transition-all hover:shadow-md',
            )}
            onClick={() => trackClick(banner.id)}
          >
            <div className={cn('relative w-full', ASPECTS[variant])}>
              {imageFailed ? (
                <div className="flex h-full w-full items-center justify-end bg-linear-to-br from-(--gm-bg-deep) via-(--gm-surface) to-(--gm-primary)/30 pr-10 text-(--gm-gold)/45">
                  <ImageIcon className="size-14" />
                </div>
              ) : (
                <Image
                  src={banner.image_url}
                  alt={title || banner.code}
                  fill
                  sizes={
                    variant === 'hero'
                      ? '(max-width: 768px) 100vw, 1200px'
                      : variant === 'slim'
                        ? '(max-width: 768px) 100vw, 900px'
                        : '(max-width: 768px) 100vw, 480px'
                  }
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setFailedImages((prev) => ({ ...prev, [banner.id]: true }))}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-r from-(--gm-bg)/85 via-(--gm-bg)/35 to-transparent" />
            </div>

            {(title || subtitle || (cta && banner.link_url)) && (
              <div
                className={cn(
                  'absolute inset-y-0 left-0 flex flex-col justify-center',
                  isSlim ? 'max-w-[70%]' : 'max-w-[60%]',
                  PADDINGS[variant],
                )}
              >
                {title && (
                  <h3 className={cn('font-display leading-tight text-(--gm-text)', TITLE_SIZES[variant])}>
                    {title}
                  </h3>
                )}
                {subtitle && !isSlim && (
                  <p className="mt-2 font-serif italic text-sm text-(--gm-text-dim) sm:text-base">
                    {subtitle}
                  </p>
                )}
                {subtitle && isSlim && (
                  <p className="mt-1 text-xs text-(--gm-text-dim) sm:text-sm line-clamp-1">
                    {subtitle}
                  </p>
                )}
                {cta && banner.link_url && (
                  <span
                    className={cn(
                      'inline-flex w-fit items-center gap-2 rounded-full border border-(--gm-gold) bg-(--gm-gold) font-semibold uppercase tracking-[0.18em] text-(--gm-bg-deep) transition-colors group-hover:bg-(--gm-gold-deep) group-hover:text-(--gm-bg)',
                      isSlim ? 'mt-2 px-3 py-1 text-[10px]' : 'mt-5 px-5 py-2 text-xs',
                    )}
                  >
                    {cta}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            )}

            {/* Ad indicator for transparency. */}
            <span
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-(--gm-bg-deep)/60 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-(--gm-bg) backdrop-blur-sm"
              aria-label="reklam"
              title="Reklam"
            >
              <Info size={9} />
              Reklam
            </span>

            {/* Dismiss (X) */}
            {dismissable && (
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close banner"
                className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-(--gm-bg-deep)/60 text-(--gm-bg) backdrop-blur-sm transition-colors hover:bg-(--gm-bg-deep)/85"
              >
                <X size={12} />
              </button>
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
