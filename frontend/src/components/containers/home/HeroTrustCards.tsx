'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, Award } from 'lucide-react';
import { useListConsultantsPublicQuery } from '@/integrations/rtk/public/consultants.public.endpoints';
import { useUiSection } from '@/i18n';

/**
 * Onaylı danışman avatar yığını.
 *
 * KURAL: "+N" sayacı YOK — kaç danışman varsa hepsi çizilir (kullanıcı talebi,
 * 2026-08-18). Kart genişliği sabit olduğu için sığdırma boyut + bindirme ile
 * yapılır: sayı arttıkça avatarlar küçülür ve daha çok üst üste biner; tek
 * satıra sığmayacak kadar çoksa alt satıra sarar. Böylece 7 danışmanda da
 * 1000 danışmanda da kart taşmaz ve herkes ayrı ayrı görünür.
 *
 * Genişlik ResizeObserver ile ÖLÇÜLÜR, sabit sayı yazılmaz: kart genişliği
 * (mobil/masaüstü, farklı tema) değişince hesap kendiliğinden düzelir.
 */
function AvatarStack({
  consultants,
  variant = 'verified',
}: {
  consultants: Array<{ id: string; full_name?: string; avatar_url?: string }>;
  /** 'online' = çevrimiçi şeridi: daha küçük, yeşil kenarlık, isim satırı yok. */
  variant?: 'verified' | 'online';
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Vurgu tüm listede dönüyor (ilk 4'te değil) — "tek tek gösterilsin" bu.
  useEffect(() => {
    if (consultants.length < 2 || variant === 'online') return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % consultants.length), 2500);
    return () => clearInterval(id);
  }, [consultants.length, variant]);

  const n = consultants.length;
  if (n === 0) return null;

  const isOnline = variant === 'online';
  const MAX_SIZE = isOnline ? 48 : 80;   // az danışmanda mevcut görünüm korunur
  const MIN_SIZE = 22;   // bunun altında yüz seçilemez; sarmayı tercih ediyoruz
  // Bindirme SABİT DEĞİL: sayı arttıkça avatarlar birbirine daha çok girer.
  // Sabit 0.55 ile 1000 danışmanda kart 1000px'i aşıp hero'yu eziyordu; sabit
  // yüksek bindirme ise az danışmanda yüzleri gereksiz yere kapatıyor.
  // 5 danışman → tek sıra, mevcut görünüm; 200 → ~4 sıra; 1000 → ~17 sıra.
  // Taban 0.15 = eski tasarımın 80px avatarda 12px'lik binmesi (yüzler açık
  // kalır). Sayı arttıkça 0.80'e kadar çıkar; böylece 5 danışmanda ferah,
  // 1000 danışmanda kart hero'yu ezmeyecek kadar derli toplu olur.
  const OVERLAP = Math.min(0.8, Math.max(0.15, 0.15 + (n - 4) * 0.03));
  const W = width || 292;

  // Tek satıra sığması için gereken boyut; sınırlara kırpılır.
  const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, W / (1 + (n - 1) * (1 - OVERLAP))));
  const step = size * (1 - OVERLAP);
  // 1e-6 tolerans: boyut zaten "tek satıra sığsın" diye türetiliyor, ama
  // kayan nokta yuvarlaması (3.998 gibi) son avatarı gereksiz yere alt satıra
  // atıyordu — 5 danışman 4+1 diye sarıyordu.
  const perRow = Math.max(1, Math.floor((W - size) / step + 1e-6) + 1);
  const rows: typeof consultants[] = [];
  for (let i = 0; i < n; i += perRow) rows.push(consultants.slice(i, i + perRow));

  const active = consultants[activeIdx];
  const COLORS = ['#7B5EA7', '#D4AF37', '#5A4E87', '#9B7EC8'];

  return (
    <div ref={wrapRef} className="w-full">
      <div className="flex flex-col" style={{ gap: Math.max(2, size * 0.12) }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center">
            {row.map((c, colIdx) => {
              const i = rowIdx * perRow + colIdx;
              const isActive = i === activeIdx;
              const initials = (c.full_name || 'GM')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  title={c.full_name}
                  className="relative shrink-0 rounded-full overflow-hidden border-2 transition-all duration-500 flex items-center justify-center font-bold text-white"
                  style={{
                    width: size,
                    height: size,
                    marginLeft: colIdx === 0 ? 0 : -(size - step),
                    // Aktif olan en üstte; kalanlar soldan sağa azalan sırada
                    // üst üste binsin ki sıra karışık görünmesin.
                    zIndex: isActive ? row.length + 1 : row.length - colIdx,
                    fontSize: Math.max(8, size * 0.32),
                    borderColor: isOnline
                      ? 'rgba(52,211,153,0.35)'
                      : isActive
                        ? '#D4AF37'
                        : 'rgba(0,0,0,0.4)',
                    transform: !isOnline && isActive ? 'scale(1.15)' : 'scale(1)',
                    background: isOnline ? 'rgba(6,78,59,0.6)' : COLORS[i % COLORS.length],
                    boxShadow: !isOnline && isActive ? '0 0 18px rgba(212,175,55,0.7)' : 'none',
                  }}
                >
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.full_name || 'Consultant'}
                      width={Math.round(size)}
                      height={Math.round(size)}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    initials
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* İsim yığının ALTINDA sabit bir satırda: avatarın altına mutlak
          konumlandırmak çok satırlı dizilimde alt sıranın üstüne biniyordu. */}
      {!isOnline && active?.full_name ? (
        <div className="mt-2 h-4 text-center text-xs font-bold tracking-wide text-amber-300">
          {active.full_name.split(' ')[0]}
        </div>
      ) : null}
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
  const fallback = locale === 'tr'
    ? { verified: 'Onaylı Danışmanlar', profiles: '{count} uzman profil', live: 'Canlı Görüşme', online: '{count} danışman çevrimiçi', soon: 'Yakında müsait' }
    : locale === 'de'
      ? { verified: 'Geprüfte Beratung', profiles: '{count} Fachprofile', live: 'Live-Sitzung', online: '{count} Beratende online', soon: 'Bald verfügbar' }
      : { verified: 'Verified Consultants', profiles: '{count} expert profiles', live: 'Live Session', online: '{count} consultants online', soon: 'Available soon' };

  return (
    <div className="flex flex-col gap-4 w-[340px]">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <Award size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-400">
              {ui('ui_extra_b3_trust_verified_title', fallback.verified)}
            </p>
            <p className="text-xs text-white/55 mt-0.5">
              {isLoading
                ? '...'
                : ui('ui_extra_b3_trust_expert_profiles', fallback.profiles).replace('{count}', String(totalCount))}
            </p>
          </div>
        </div>

        <div className="mb-7 min-h-[92px]">
          {isLoading ? (
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-full" />
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
              {ui('ui_extra_b3_trust_live_session', fallback.live)}
            </p>
            {isLoading ? (
              <Skeleton className="w-24 h-2.5 mt-1" />
            ) : (
              <p className="text-[9px] text-white/40 mt-0.5">
                {onlineCount > 0
                  ? ui('ui_extra_b3_trust_consultants_online', fallback.online).replace('{count}', String(onlineCount))
                  : ui('ui_extra_b3_trust_available_soon', fallback.soon)}
              </p>
            )}
          </div>
        </div>

        {!isLoading && online.length > 0 && (
          /* Burada da "+N" YOK: çevrimiçi kaç danışman varsa hepsi çizilir.
             AvatarStack genişliği ölçüp boyut/bindirmeyi kendisi hesapladığı
             için sayı ne olursa olsun şerit taşmaz. */
          <div className="mt-3">
            <AvatarStack consultants={online} variant="online" />
          </div>
        )}
      </div>
    </div>
  );
}
