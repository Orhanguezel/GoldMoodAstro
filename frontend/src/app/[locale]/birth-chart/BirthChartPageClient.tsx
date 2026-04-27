'use client';

import { useEffect, useMemo, useState } from 'react';
import BirthChartForm from '@/components/containers/birth-chart/BirthChartForm';
import type { BirthChart, NatalChart, PlanetKey, PlanetPlacement } from '@/types/common';
import { Compass, Sparkles, ChevronLeft, Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  useListMyBirthChartsQuery,
  useDeleteBirthChartMutation,
} from '@/integrations/rtk/public/birth_charts.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import ShareBirthChart from '@/components/common/ShareBirthChart';

const PLANET_ORDER: PlanetKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

function point(longitude: number, radius: number, center = 180) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function formatDegree(p: PlanetPlacement) {
  const degree = Math.floor(p.degree_in_sign);
  const minutes = Math.round((p.degree_in_sign - degree) * 60);
  return `${degree}°${String(minutes).padStart(2, '0')}`;
}

function ChartWheel({ chart }: { chart: NatalChart }) {
  const planets = useMemo(() => PLANET_ORDER.map((key) => chart.planets[key]).filter(Boolean), [chart]);

  return (
    <div className="mx-auto aspect-square w-full max-w-[560px] relative">
      <svg viewBox="0 0 360 360" className="h-full w-full">
        <defs>
          <radialGradient id="wheelGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="var(--gm-bg-deep)" />
            <stop offset="100%" stopColor="var(--gm-surface)" />
          </radialGradient>
        </defs>
        <circle cx="180" cy="180" r="164" fill="url(#wheelGrad)" stroke="var(--gm-gold)" strokeWidth="0.5" />
        <circle cx="180" cy="180" r="132" fill="none" stroke="var(--gm-border-soft)" strokeWidth="0.5" />
        <circle cx="180" cy="180" r="84" fill="none" stroke="var(--gm-border-soft)" strokeWidth="0.5" />

        {Array.from({ length: 12 }).map((_, i) => {
          const longitude = i * 30;
          const a = point(longitude, 84);
          const b = point(longitude, 164);
          const label = point(longitude + 15, 148);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--gm-border-soft)" strokeWidth="0.5" />
              <text x={label.x} y={label.y + 7} textAnchor="middle" className="fill-[var(--gm-gold)] text-[20px] font-serif">
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {chart.aspects.slice(0, 25).map((aspect, i) => {
          const a = chart.planets[aspect.planet_a];
          const b = chart.planets[aspect.planet_b];
          if (!a || !b) return null;
          const p1 = point(a.longitude, 76);
          const p2 = point(b.longitude, 76);
          const stroke = aspect.type === 'trine' || aspect.type === 'sextile' ? 'var(--gm-gold)' : 'var(--gm-text-dim)';
          return (
            <line
              key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={stroke}
              strokeOpacity="0.2"
              strokeWidth="0.5"
            />
          );
        })}

        {planets.map((planet, i) => {
          const p = point(planet.longitude, 110 + (i % 2) * 12);
          return (
            <text
              key={planet.key}
              x={p.x} y={p.y + 8}
              textAnchor="middle"
              className="fill-[var(--gm-text)] text-[24px] font-serif opacity-90"
            >
              {planet.symbol}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function BirthChartPageClient() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'tr';
  const { isAuthenticated } = useAuthStore();
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Login kullanıcı için kayıtlı haritaları çek
  const { data: savedCharts } = useListMyBirthChartsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deleteChart] = useDeleteBirthChartMutation();

  // İlk yüklenmede en son kaydedilmiş haritayı otomatik göster
  useEffect(() => {
    if (!chart && !showForm && savedCharts && savedCharts.length > 0) {
      setChart(savedCharts[0]);
    }
  }, [savedCharts, chart, showForm]);

  async function handleDelete() {
    if (!chart) return;
    if (!confirm('Bu haritayı silmek istediğine emin misin?')) return;
    try {
      await deleteChart(chart.id).unwrap();
      toast.success('Harita silindi');
      setChart(null);
      setShowForm(true);
    } catch {
      toast.error('Silinemedi.');
    }
  }

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        {!chart ? (
          <>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-8 h-px bg-[var(--gm-gold)]" />
                <span className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-[0.2em]">Kozmik Rehber</span>
                <span className="w-8 h-px bg-[var(--gm-gold)]" />
              </div>
              <h1 className="mb-8 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-[var(--gm-text)]">
                Gökyüzündeki İmzanız
              </h1>
              <p className="text-xl font-serif italic text-[var(--gm-text-dim)] leading-relaxed">
                Doğduğunuz anın gezegen konumlarını, ev yerleşimlerini ve temel açılarını keşfederek ruhsal DNA'nızı analiz edin.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <BirthChartForm onSuccess={(c) => { setChart(c); setShowForm(false); }} />
            </div>
          </>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[400px_1fr] lg:items-start">
            <aside className="space-y-8">
              <div className="rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <Compass className="w-12 h-12 text-[var(--gm-gold)] opacity-10" />
                </div>
                
                <h2 className="mb-6 font-serif text-4xl text-[var(--gm-text)] leading-tight">{chart.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[var(--gm-text-dim)]">
                    <MapPin className="w-4 h-4 text-[var(--gm-gold)]" />
                    <span className="text-sm font-medium">{chart.pob_label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--gm-text-dim)]">
                    <Calendar className="w-4 h-4 text-[var(--gm-gold)]" />
                    <span className="text-sm font-medium">{new Date(chart.dob).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--gm-text-dim)]">
                    <Clock className="w-4 h-4 text-[var(--gm-gold)]" />
                    <span className="text-sm font-medium">{String(chart.tob).slice(0, 5)}</span>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[var(--gm-border-soft)] space-y-4">
                  <ShareBirthChart chart={chart} />
                  <button
                    type="button"
                    onClick={() => { setChart(null); setShowForm(true); }}
                    className="flex items-center gap-3 text-[var(--gm-gold)] font-bold text-xs uppercase tracking-widest hover:translate-x-2 transition-transform"
                  >
                    <ChevronLeft className="w-4 h-4" /> Yeni Harita Oluştur
                  </button>
                  {isAuthenticated && (savedCharts?.some((c) => c.id === chart.id) ?? false) && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-3 text-(--gm-text-dim) hover:text-(--gm-error) text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Bu haritayı sil
                    </button>
                  )}
                </div>

                {/* Birden fazla kayıtlı harita varsa hızlı seçim */}
                {isAuthenticated && savedCharts && savedCharts.length > 1 && (
                  <div className="mt-6 pt-6 border-t border-(--gm-border-soft)">
                    <p className="font-display text-[9px] tracking-[0.3em] uppercase text-(--gm-gold-deep) mb-3">
                      Diğer haritalarım
                    </p>
                    <div className="space-y-1.5">
                      {savedCharts.filter((c) => c.id !== chart.id).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setChart(c)}
                          className="block w-full text-left text-sm text-(--gm-text-dim) hover:text-(--gm-gold) transition-colors"
                        >
                          → {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 rounded-3xl bg-[var(--gm-surface-high)] border border-[var(--gm-border-soft)]">
                <h4 className="font-serif text-2xl text-[var(--gm-text)] mb-4">Derin Analiz</h4>
                <p className="text-[var(--gm-text-dim)] text-sm leading-relaxed mb-8">
                  Bu harita sizin gökyüzündeki parmak izinizdir. Gezegenlerin ev yerleşimleri ve birbirleriyle olan açıları hayatınızdaki temel potansiyelleri gösterir.
                </p>
                <Link href={`/${locale}/consultants`} className="btn-premium flex items-center justify-center gap-3 py-4 w-full">
                  Uzman Analizi Al <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </aside>

            <section className="rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gm-gold)] opacity-[0.03] blur-[120px] rounded-full" />
              
              <ChartWheel chart={chart.chart_data} />
              
              <div className="mt-16 grid gap-6 sm:grid-cols-2">
                {PLANET_ORDER.map((key) => {
                  const planet = chart.chart_data.planets[key];
                  if (!planet) return null;
                  return (
                    <div key={key} className="flex items-center gap-6 p-6 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/40 hover:bg-[var(--gm-surface-high)] transition-colors group">
                      <span className="w-12 h-12 rounded-full bg-[var(--gm-surface)] flex items-center justify-center font-serif text-3xl text-[var(--gm-gold)] border border-[var(--gm-border-soft)] group-hover:scale-110 transition-transform">
                        {planet.symbol}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-[var(--gm-text)] uppercase tracking-wider">{planet.name}</span>
                          <span className="text-[10px] text-[var(--gm-gold)] font-bold">{planet.house}. EV</span>
                        </div>
                        <div className="text-xs text-[var(--gm-text-dim)] flex items-center gap-2">
                          <span className="text-[var(--gm-gold)]">{SIGN_LABELS[planet.sign] ?? planet.sign_label}</span>
                          <span className="opacity-30">·</span>
                          <span>{formatDegree(planet)}</span>
                          {planet.retrograde && (
                            <>
                              <span className="opacity-30">·</span>
                              <span className="text-[var(--gm-error)] font-bold">RETRO</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
