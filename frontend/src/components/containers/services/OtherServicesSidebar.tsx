'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';
import { type ServiceDto, safeStr } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

export type OtherServicesSidebarProps = {
  currentSlug?: string;
  limit?: number;
  className?: string;
};

export default function OtherServicesSidebar({
  currentSlug,
  limit = 8,
  className = '',
}: OtherServicesSidebarProps) {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_services', locale as any);

  const { data, isLoading } = useListServicesPublicQuery({
    limit,
    order: 'display_order.asc,created_at.desc',
    locale,
  } as any);

  const items = useMemo(() => {
    const raw = ((data as any)?.items ?? []) as ServiceDto[];
    const curr = safeStr(currentSlug);

    return raw
      .filter((s: any) => {
        const sSlug = safeStr(s?.slug);
        if (!curr) return true;
        if (!sSlug) return true;
        return sSlug !== curr;
      })
      .slice(0, limit);
  }, [data, currentSlug, limit]);

  const listHref = useMemo(() => localizePath(locale, '/services'), [locale]);

  if (!isLoading && items.length === 0) return null;

  return (
    <aside
      className={`bg-bg-secondary p-6 shadow-soft border border-border-light ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-6 border-b border-border-light pb-2">
        <h3 className="text-xl font-light font-serif text-text-primary">
          {ui('ui_services_other_title', 'Other services')}
        </h3>
        <Link
          href={listHref}
          className="text-xs font-normal uppercase tracking-[0.15em] text-brand-primary hover:underline"
        >
          {ui('ui_services_view_all', 'View all')}
        </Link>
      </div>

      <ul className="space-y-3">
        {isLoading
          ? Array.from({ length: Math.min(6, limit) }).map((_, i) => (
              <li key={i} className="h-4 bg-bg-card-hover rounded animate-pulse" />
            ))
          : items.map((s: any) => {
              const slug = safeStr(s?.slug);
              const title =
                safeStr(s?.name) ||
                safeStr((s as any)?.title) ||
                ui('ui_services_placeholder_title', 'Service');
              const href = slug
                ? localizePath(locale, `/services/${encodeURIComponent(slug)}`)
                : listHref;

              return (
                <li key={safeStr(s?.id) || slug || title}>
                  <Link
                    href={href}
                    className="group flex items-start justify-between gap-3 text-sm text-text-primary hover:text-brand-primary transition-colors"
                  >
                    <span className="font-medium leading-snug">{title}</span>
                    <span className="text-text-muted group-hover:text-brand-primary transition-colors">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
      </ul>
    </aside>
  );
}
