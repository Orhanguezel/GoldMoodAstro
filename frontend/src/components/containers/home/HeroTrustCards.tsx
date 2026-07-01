'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, Award } from 'lucide-react';
import { useListConsultantsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useUiSection } from '@/i18n';

function AvatarStack({ consultants }: { consultants: Array<{ id: string; full_name?: string; avatar_url?: string }> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const show = consultants.slice(0, 4);
  const remaining = Math.max(0, consultants.length - 4);

  // Rotate highlighted avatar every 2.5s
  useEffect(() => {
    if (show.length < 2) return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % show.length), 2500);
    return () => clearInterval(id);
  }, [show.length]);

  return (
    <div className="flex -space-x-2.5 items-center">
      {show.map((c, i) => {
        const initials = (c.full_name || 'GS')
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        const COLORS = ['#7B5EA7', '#D4AF37', '#5A4E87', '#9B7EC8'];
        const isActive = i === activeIdx;

        return (
          <div
            key={c.id}
            className="relative"
            style={{ zIndex: isActive ? 10 : 4 - i }}
          >
            <div
              className="w-9 h-9 rounded-full border-2 overflow-hidden transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                borderColor: isActive ? '#D4AF37' : 'rgba(0,0,0,0.4)',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                background: COLORS[i % COLORS.length],
                boxShadow: isActive ? `0 0 12px rgba(212,175,55,0.6)` : 'none',
              }}
            >
              {c.avatar_url ? (
                <Image
                  src={c.avatar_url}
                  alt={c.full_name || 'Consultant'}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
            {isActive && c.full_name && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-amber-300 tracking-wide animate-fade-in pointer-events-none">
                {c.full_name.split(' ')[0]}
              </div>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="w-9 h-9 rounded-full border-2 border-black/40 bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60 backdrop-blur-sm">
          +{remaining}
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-white/10 ${className ?? ''}`} />
  );
}

interface Props {
  locale?: string;
}

export default function HeroTrustCards({ locale = 'tr' }: Props) {
  const { ui } = useUiSection('ui_extra' as any);

  const { data: consultants = [], isLoading } = useListConsultantsPublicQuery({
    sort: 'popular',
    limit: 20,
    locale,
  });

  const approved = consultants.filter((c) => c.approval_status === 'approved');
  const online = approved.filter((c) => c.is_available === 1 || c.is_available as unknown as boolean === true);
  const totalCount = approved.length;
  const onlineCount = online.length;

  const avgRating = approved.length > 0
    ? (approved.reduce((sum, c) => sum + parseFloat(c.rating_avg || '0'), 0) / approved.length).toFixed(1)
    : '4.9';

  return (
    <div className="flex flex-col gap-4 w-64">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <Award size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {ui('ui_extra_b3_trust_verified_title', 'Verified Consultants')}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              {isLoading
                ? '...'
                : ui('ui_extra_b3_trust_expert_profiles', '{count} expert profiles').replace('{count}', String(totalCount))}
            </p>
          </div>
        </div>

        <div className="mb-4 min-h-[44px]">
          {isLoading ? (
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-9 h-9 rounded-full" />
              ))}
            </div>
          ) : (
            <AvatarStack consultants={approved} />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
          ))}
          {isLoading ? (
            <Skeleton className="w-10 h-3 ml-1" />
          ) : (
            <span className="text-[10px] text-white/50 ml-1">{avgRating}/5</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-900/30 p-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              {ui('ui_extra_b3_trust_live_session', 'Live Session')}
            </p>
            {isLoading ? (
              <Skeleton className="w-24 h-2.5 mt-1" />
            ) : (
              <p className="text-[9px] text-white/40 mt-0.5">
                {onlineCount > 0
                  ? ui('ui_extra_b3_trust_consultants_online', '{count} consultants online').replace('{count}', String(onlineCount))
                  : ui('ui_extra_b3_trust_available_soon', 'Available soon')}
              </p>
            )}
          </div>
        </div>

        {!isLoading && online.length > 0 && (
          <div className="mt-3 flex -space-x-1.5">
            {online.slice(0, 5).map((c) => {
              const initials = (c.full_name || 'G').split(' ')[0][0].toUpperCase();
              return (
                <div
                  key={c.id}
                  className="w-6 h-6 rounded-full border border-emerald-400/30 overflow-hidden flex items-center justify-center text-[8px] font-bold text-white bg-emerald-800/60"
                  title={c.full_name}
                >
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.full_name || ''}
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    initials
                  )}
                </div>
              );
            })}
            {online.length > 5 && (
              <div className="w-6 h-6 rounded-full border border-emerald-400/30 bg-emerald-800/40 flex items-center justify-center text-[7px] font-bold text-emerald-300">
                +{online.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
