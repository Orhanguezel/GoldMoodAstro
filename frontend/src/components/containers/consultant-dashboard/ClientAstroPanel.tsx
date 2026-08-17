'use client';
// =============================================================
// FILE: src/components/containers/consultant-dashboard/ClientAstroPanel.tsx
//
// Danışman sohbet ederken danışanın PROFİLİNE KAYITLI verilerini görür:
// doğum haritası (güneş/ay/yükselen), yıldızname (ebced + menzil), numeroloji.
//
// Bunlar bir kez hesaplanıp değişmeyen verilerdir; danışman her seansta
// yeniden sormak zorunda kalmasın diye buraya taşındı (2026-08-17 talebi).
//
// Erişim backend'de fail-closed: yalnız bu danışmanla randevusu / sesli mesajı /
// sohbeti olan danışanın verisi döner. Kayıt yoksa panel "kayıt yok" der —
// böylece danışman veri olmadığını da bilir, boşluğa bakmaz.
// =============================================================
import React from 'react';
import { CalendarDays, ChevronDown, Hash, Moon, Sparkles, Sun, User } from 'lucide-react';

import { useGetClientAstroProfileQuery } from '@/integrations/rtk/private/consultant_self.endpoints';
import { useUiSection } from '@/i18n';

interface Props {
  userId: string | null | undefined;
  locale?: string;
  /** Varsayılan kapalı: sohbet akışını bastırmasın. */
  defaultOpen?: boolean;
}

const SIGN_LABELS_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

function signLabel(sign?: string | null, locale?: string): string {
  if (!sign) return '—';
  const key = String(sign).toLowerCase();
  if ((locale ?? 'tr').startsWith('tr')) return SIGN_LABELS_TR[key] ?? sign;
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 px-4 py-3">
      <span className="mt-0.5 text-(--gm-gold)">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--gm-muted)">{label}</div>
        <div className="mt-0.5 text-sm text-(--gm-text)">{value}</div>
      </div>
    </div>
  );
}

export default function ClientAstroPanel({ userId, locale, defaultOpen = false }: Props) {
  const { ui } = useUiSection('ui_dashboard' as any, locale);
  const [open, setOpen] = React.useState(defaultOpen);

  const { data, isLoading, isError } = useGetClientAstroProfileQuery(userId as string, {
    skip: !userId || !open,
  });

  if (!userId) return null;

  const numbers = (data?.numerology?.calculation_data ?? {}) as Record<string, unknown>;
  const lifePath = numbers.life_path ?? numbers.lifePath;

  return (
    <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface)">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-(--gm-text)">
          <Sparkles className="size-4 text-(--gm-gold)" />
          {ui('ui_dashboard_client_astro_title', 'Danışanın kayıtlı bilgileri')}
        </span>
        <ChevronDown
          className={`size-4 text-(--gm-muted) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="border-t border-(--gm-border-soft) px-5 py-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-(--gm-bg-deep)/40" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-(--gm-muted)">
              {ui('ui_dashboard_client_astro_error', 'Bilgiler getirilemedi.')}
            </p>
          ) : !data?.has_any ? (
            <p className="text-sm leading-relaxed text-(--gm-muted)">
              {ui(
                'ui_dashboard_client_astro_empty',
                'Bu danışan henüz doğum haritası, yıldızname veya numeroloji kaydı oluşturmamış.',
              )}
            </p>
          ) : (
            <div className="space-y-6">
              {data.birth_chart ? (
                <section>
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim)">
                    {ui('ui_dashboard_client_astro_chart', 'Doğum Haritası')}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Row
                      icon={<Sun className="size-4" />}
                      label={ui('ui_dashboard_client_astro_sun', 'Güneş')}
                      value={signLabel(data.birth_chart.sun_sign, locale)}
                    />
                    <Row
                      icon={<Moon className="size-4" />}
                      label={ui('ui_dashboard_client_astro_moon', 'Ay')}
                      value={signLabel(data.birth_chart.moon_sign, locale)}
                    />
                    <Row
                      icon={<Sparkles className="size-4" />}
                      label={ui('ui_dashboard_client_astro_asc', 'Yükselen')}
                      value={signLabel(data.birth_chart.ascendant_sign, locale)}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[11px] text-(--gm-muted)">
                    <CalendarDays className="size-3.5" />
                    {[data.birth_chart.dob, data.birth_chart.tob, data.birth_chart.pob_label]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </section>
              ) : null}

              {data.yildizname ? (
                <section>
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim)">
                    {ui('ui_dashboard_client_astro_yildizname', 'Yıldızname')}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row
                      icon={<Hash className="size-4" />}
                      label={ui('ui_dashboard_client_astro_ebced', 'Ebced')}
                      value={data.yildizname.ebced_total ?? '—'}
                    />
                    <Row
                      icon={<Moon className="size-4" />}
                      label={ui('ui_dashboard_client_astro_menzil', 'Menzil')}
                      value={`${data.yildizname.menzil_no ?? '—'} · ${data.yildizname.menzil_name_tr ?? ''}`}
                    />
                  </div>
                  {data.yildizname.menzil_summary ? (
                    <p className="mt-3 text-[12px] italic leading-relaxed text-(--gm-text-dim)">
                      {data.yildizname.menzil_summary}
                    </p>
                  ) : null}
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-(--gm-muted)">
                    <User className="size-3.5" />
                    {[data.yildizname.name, data.yildizname.mother_name, data.yildizname.birth_year]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </section>
              ) : null}

              {data.numerology ? (
                <section>
                  <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim)">
                    {ui('ui_dashboard_client_astro_numerology', 'Numeroloji')}
                  </h4>
                  <Row
                    icon={<Hash className="size-4" />}
                    label={ui('ui_dashboard_client_astro_lifepath', 'Yaşam Yolu')}
                    value={lifePath != null ? String(lifePath) : '—'}
                  />
                </section>
              ) : null}

              <p className="text-[10px] leading-relaxed text-(--gm-muted)">
                {ui(
                  'ui_dashboard_client_astro_privacy',
                  'Bu bilgiler danışanın kendi oluşturduğu kayıtlardır ve yalnız danışmanlık amacıyla gösterilir.',
                )}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
