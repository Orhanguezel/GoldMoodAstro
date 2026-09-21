'use client';

import React from 'react';
import { useListConsultantsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useUiSection } from '@/i18n';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/15 ${className ?? ''}`} />;
}

interface Props {
  locale?: string;
}

export default function HeroStats({ locale = 'tr' }: Props) {
  const { ui } = useUiSection('ui_extra' as any);

  const { data: consultants = [], isLoading } = useListConsultantsPublicQuery({ limit: 100, locale });
  const approved = consultants.filter((c) => c.approval_status === 'approved');

  const totalSessions = approved.reduce((sum, c) => sum + (c.total_sessions ?? 0), 0);
  const consultantCount = approved.length;
  const reviewCount = approved.reduce((sum, c) => sum + Number(c.rating_count || 0), 0);
  const avgRating = reviewCount > 0
    ? (approved.reduce((sum, c) => sum + parseFloat(c.rating_avg || '0') * Number(c.rating_count || 0), 0) / reviewCount).toFixed(1)
    : null;

  const stats = [
    {
      val: totalSessions > 0 ? `${totalSessions > 999 ? Math.floor(totalSessions / 100) / 10 + 'K' : totalSessions}+` : null,
      label: ui('ui_extra_b3_hero_stat_sessions', locale === 'tr' ? 'Tamamlanan Seans' : 'Sessions Completed'),
    },
    {
      val: consultantCount > 0 ? `${consultantCount}+` : null,
      label: ui('ui_extra_b3_hero_stat_consultants', locale === 'tr' ? 'Uzman Danışman' : 'Expert Consultants'),
    },
    {
      val: avgRating ? `${avgRating}★` : null,
      label: ui('ui_extra_b3_hero_stat_rating', locale === 'tr' ? 'Ortalama Puan' : 'Average Rating'),
    },
  ].filter((stat) => isLoading || stat.val !== null);

  if (!isLoading && stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map(({ val, label }) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-white/6 px-5 py-3 backdrop-blur-md min-w-[100px]"
        >
          {isLoading ? (
            <Skeleton className="h-6 w-12 mb-1" />
          ) : (
            <span className="font-display text-xl font-semibold text-amber-400">{val}</span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</span>
        </div>
      ))}
    </div>
  );
}
