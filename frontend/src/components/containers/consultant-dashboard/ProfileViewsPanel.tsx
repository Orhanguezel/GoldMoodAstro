'use client';

import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, Loader2, Calendar } from 'lucide-react';
import { useGetMyConsultantProfileViewsQuery } from '@/integrations/rtk/private/consultant_self.endpoints';

type RangeOption = { label: string; days: number };

const RANGE_OPTIONS: RangeOption[] = [
  { label: '30 Gün', days: 30 },
  { label: '90 Gün', days: 90 },
  { label: '180 Gün', days: 180 },
  { label: '365 Gün', days: 365 },
];

function formatMonthDay(date: string) {
  try {
    return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  } catch {
    return date;
  }
}

export default function ProfileViewsPanel() {
  const [selectedDays, setSelectedDays] = useState(30);

  const { data: views = [], isLoading, isError } = useGetMyConsultantProfileViewsQuery(
    { range: `${selectedDays}d` },
    { skip: false }
  );

  // C7: Tracking instrumentation — refresh stats when panel is mounted
  useEffect(() => {
    // Silently ping the backend to refresh cached profile-view data.
    // This is a best-effort request; errors are intentionally swallowed.
    fetch('/api/v1/me/consultant/profile-views/refresh', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => { /* backend may not exist yet; safe to ignore */ });
  }, []);

  const totalViews = views.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(1, ...views.map((d) => d.count));

  // Peak day
  const peakDay = views.reduce<{ date: string; count: number } | null>((best, d) => {
    if (!best || d.count > best.count) return d;
    return best;
  }, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
            Profil Görüntülemelerim
          </span>
          <h2 className="font-serif text-2xl text-(--gm-text) mt-0.5">Profil Analitik</h2>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-(--gm-surface) border border-(--gm-border-soft)">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setSelectedDays(opt.days)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                selectedDays === opt.days
                  ? 'bg-(--gm-gold) text-(--gm-bg-deep)'
                  : 'text-(--gm-text) opacity-50 hover:opacity-80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-(--gm-gold)" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-70">
              Toplam Görüntülenme
            </span>
          </div>
          <div className="font-serif text-3xl text-(--gm-text)">{totalViews.toLocaleString('tr-TR')}</div>
          <div className="text-[11px] text-(--gm-text) opacity-40 mt-1">Son {selectedDays} gün</div>
        </div>

        <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-(--gm-gold)" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-70">
              Günlük Ortalama
            </span>
          </div>
          <div className="font-serif text-3xl text-(--gm-text)">
            {views.length > 0 ? (totalViews / views.length).toFixed(1) : '0'}
          </div>
          <div className="text-[11px] text-(--gm-text) opacity-40 mt-1">görüntülenme / gün</div>
        </div>

        <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-(--gm-gold)" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-70">
              En Yoğun Gün
            </span>
          </div>
          <div className="font-serif text-3xl text-(--gm-text)">{peakDay?.count ?? 0}</div>
          <div className="text-[11px] text-(--gm-text) opacity-40 mt-1">
            {peakDay ? formatMonthDay(peakDay.date) : '—'}
          </div>
        </div>
      </div>

      {/* Line Chart (SVG) */}
      <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-70">
            Günlük Görüntülenme Grafiği
          </span>
          {isLoading && <Loader2 className="w-4 h-4 text-(--gm-gold) animate-spin" />}
        </div>

        {isError ? (
          <div className="py-16 text-center">
            <Eye className="w-10 h-10 text-(--gm-text) opacity-20 mx-auto mb-3" />
            <p className="text-sm text-(--gm-text) opacity-40 font-serif italic">
              Görüntülenme verisi yüklenemedi. Backend endpoint yakında eklenecek.
            </p>
          </div>
        ) : views.length === 0 ? (
          <div className="py-16 text-center">
            <Eye className="w-10 h-10 text-(--gm-text) opacity-20 mx-auto mb-3" />
            <p className="text-sm text-(--gm-text) opacity-40 font-serif italic">
              Henüz görüntülenme verisi yok. Profiliniz ziyaret edildikçe burada görünecek.
            </p>
          </div>
        ) : (
          <SvgLineChart data={views} maxCount={maxCount} />
        )}
      </div>
    </div>
  );
}

function SvgLineChart({
  data,
  maxCount,
}: {
  data: Array<{ date: string; count: number }>;
  maxCount: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 800;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;
  const points = data.map((d, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + chartH - (d.count / maxCount) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${PAD.top + chartH} L${points[0].x},${PAD.top + chartH} Z`;

  // Show every Nth label to avoid crowding
  const step = Math.ceil(data.length / 8);

  return (
    <div className="relative overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 300 }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gm-gold)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gm-gold)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = PAD.top + pct * chartH;
          const val = Math.round(maxCount * (1 - pct));
          return (
            <g key={pct}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--gm-border-soft)" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--gm-text)" opacity="0.35">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#viewsGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--gm-gold)" strokeWidth="2" strokeLinejoin="round" />

        {/* Data points + labels */}
        {points.map((p, i) => (
          <g key={p.date} onMouseEnter={() => setHovered(i)}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 5 : 3}
              fill={hovered === i ? 'var(--gm-gold)' : 'var(--gm-surface)'}
              stroke="var(--gm-gold)"
              strokeWidth="2"
              style={{ transition: 'r 0.15s' }}
            />
            {/* Tooltip */}
            {hovered === i && (
              <g>
                <rect
                  x={Math.min(p.x - 28, W - PAD.right - 60)}
                  y={p.y - 34}
                  width={56}
                  height={20}
                  rx={6}
                  fill="var(--gm-surface)"
                  stroke="var(--gm-gold)"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(p.x - 28, W - PAD.right - 60) + 28}
                  y={p.y - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="var(--gm-gold)"
                >
                  {p.count}
                </text>
              </g>
            )}
            {/* X axis label */}
            {i % step === 0 && (
              <text
                x={p.x}
                y={H - 4}
                textAnchor="middle"
                fontSize="8"
                fill="var(--gm-text)"
                opacity="0.4"
              >
                {formatMonthDay(p.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
