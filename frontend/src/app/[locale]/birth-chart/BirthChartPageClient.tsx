'use client';

import { useMemo, useState } from 'react';
import BirthChartForm from '@/components/containers/birth-chart/BirthChartForm';
import type { BirthChart, NatalChart, PlanetKey, PlanetPlacement } from '@/types/common';

const PLANET_ORDER: PlanetKey[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç',
  taurus: 'Boğa',
  gemini: 'İkizler',
  cancer: 'Yengeç',
  leo: 'Aslan',
  virgo: 'Başak',
  libra: 'Terazi',
  scorpio: 'Akrep',
  sagittarius: 'Yay',
  capricorn: 'Oğlak',
  aquarius: 'Kova',
  pisces: 'Balık',
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
    <div className="mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 360 360" className="h-full w-full">
        <circle cx="180" cy="180" r="164" fill="var(--gm-bg-deep)" stroke="var(--gm-border)" />
        <circle cx="180" cy="180" r="132" fill="none" stroke="var(--gm-border-soft)" />
        <circle cx="180" cy="180" r="84" fill="none" stroke="var(--gm-border-soft)" />

        {Array.from({ length: 12 }).map((_, i) => {
          const longitude = i * 30;
          const a = point(longitude, 84);
          const b = point(longitude, 164);
          const label = point(longitude + 15, 148);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--gm-border-soft)" />
              <text x={label.x} y={label.y + 7} textAnchor="middle" className="fill-[var(--gm-gold)] text-[20px]">
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {chart.aspects.slice(0, 22).map((aspect, i) => {
          const a = chart.planets[aspect.planet_a];
          const b = chart.planets[aspect.planet_b];
          if (!a || !b) return null;
          const p1 = point(a.longitude, 76);
          const p2 = point(b.longitude, 76);
          const stroke =
            aspect.type === 'trine' || aspect.type === 'sextile' ? 'var(--gm-success)' : 'var(--gm-gold-dim)';
          return (
            <line
              key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={stroke}
              strokeOpacity="0.42"
            />
          );
        })}

        {planets.map((planet, i) => {
          const p = point(planet.longitude, 110 + (i % 2) * 12);
          return (
            <text
              key={planet.key}
              x={p.x}
              y={p.y + 8}
              textAnchor="middle"
              className="fill-[var(--gm-text)] text-[24px]"
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
  const [chart, setChart] = useState<BirthChart | null>(null);

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        {!chart ? (
          <>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="section-label mb-6">Gökyüzü Rehberi</span>
              <h1 className="mb-6 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-[var(--gm-text)]">
                Doğum Haritası Hesaplama
              </h1>
              <p className="text-lg font-light leading-relaxed text-[var(--gm-text-dim)]">
                Doğduğunuz anın gezegen konumlarını, ev yerleşimlerini ve temel açılarını hesaplayın.
              </p>
            </div>
            <BirthChartForm onSuccess={setChart} />
          </>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:items-start">
            <aside className="rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6">
              <span className="section-label mb-4">Analiz Sonucu</span>
              <h2 className="mb-3 font-serif text-3xl text-[var(--gm-text)]">{chart.name}</h2>
              <p className="text-sm text-[var(--gm-text-dim)]">{chart.pob_label}</p>
              <p className="mt-1 text-sm text-[var(--gm-muted)]">
                {chart.dob} · {String(chart.tob).slice(0, 5)}
              </p>
              <button
                type="button"
                onClick={() => setChart(null)}
                className="mt-8 text-left font-display text-[11px] uppercase tracking-[0.2em] text-[var(--gm-gold)] transition-colors hover:text-[var(--gm-gold-light)]"
              >
                Yeni hesaplama yap
              </button>
              <div className="mt-8 rounded-sm border border-[var(--gm-border-soft)] p-4">
                <p className="text-sm leading-relaxed text-[var(--gm-text-dim)]">
                  Detaylı yorum ve kayıtlı harita geçmişi için hesap oluşturabilirsiniz.
                </p>
              </div>
            </aside>

            <section className="rounded-sm border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-4 md:p-8">
              <ChartWheel chart={chart.chart_data} />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {PLANET_ORDER.map((key) => {
                  const planet = chart.chart_data.planets[key];
                  if (!planet) return null;
                  return (
                    <div key={key} className="flex items-center gap-4 border-b border-[var(--gm-border-soft)] py-3">
                      <span className="w-8 text-center font-serif text-2xl text-[var(--gm-gold)]">{planet.symbol}</span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--gm-text)]">{planet.name}</div>
                        <div className="text-xs text-[var(--gm-text-dim)]">
                          {SIGN_LABELS[planet.sign] ?? planet.sign_label} · {formatDegree(planet)} · {planet.house}. ev
                          {planet.retrograde ? ' · Retro' : ''}
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
