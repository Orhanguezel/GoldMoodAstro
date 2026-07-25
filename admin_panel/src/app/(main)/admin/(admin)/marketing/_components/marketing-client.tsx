'use client';

// =============================================================
// FILE: marketing-client.tsx
// Pazarlama & Dönüşüm — birinci-taraf (kendi DB) metrikleri.
// Pixel/GA tahmini + izne bağlı ölçer; buradaki veriler kesindir.
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  RefreshCcw,
  Users,
  CalendarCheck,
  Wallet,
  TrendingUp,
  ExternalLink,
  Star,
  Mic,
  Video,
  ArrowDownRight,
} from 'lucide-react';

import { useGetMarketingDashboardAdminQuery } from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const GOLD = '#D4AF37';
const PLUM = '#9B6FD9';

const fmtTRY = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtNum = (n: number) => new Intl.NumberFormat('tr-TR').format(Number(n) || 0);

const PIXEL_ID = '1350932683810586';
const FB_PAGE_ID = '1354790577707171';

const QUICK_LINKS: Array<{ label: string; desc: string; href: string }> = [
  {
    label: 'Meta Events Manager',
    desc: 'Pixel olayları, dönüşüm, test',
    href: `https://business.facebook.com/events_manager2/list/dataset/${PIXEL_ID}`,
  },
  {
    label: 'Meta Business Suite',
    desc: 'Facebook + Instagram yönetim',
    href: 'https://business.facebook.com/latest/home',
  },
  {
    label: 'Google Analytics (GA4)',
    desc: 'Trafik, oturum, kaynak',
    href: 'https://analytics.google.com/',
  },
  {
    label: 'Google Ads',
    desc: 'Google Etiketi (AW) + dönüşüm',
    href: 'https://ads.google.com/aw/overview',
  },
  {
    label: 'Search Console',
    desc: 'Arama performansı, indeksleme',
    href: 'https://search.google.com/search-console',
  },
  {
    label: 'Instagram',
    desc: '@goldmood_astro',
    href: 'https://www.instagram.com/goldmood_astro',
  },
  {
    label: 'Facebook Sayfa',
    desc: 'GoldMood Astro',
    href: `https://www.facebook.com/${FB_PAGE_ID}`,
  },
];

const RANGES = [
  { days: 7, label: '7 Gün' },
  { days: 30, label: '30 Gün' },
  { days: 90, label: '90 Gün' },
];

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[24px] bg-gm-surface/30 border border-gm-border-soft p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">
          {label}
        </span>
        <Icon className="size-4 text-gm-gold" />
      </div>
      <div className="font-serif text-3xl text-gm-text leading-none">{value}</div>
      {sub ? <div className="text-[11px] text-gm-muted">{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold border-b border-gm-border-soft pb-3 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
      {children}
    </h3>
  );
}

export default function MarketingClient() {
  const [days, setDays] = React.useState(30);
  const { data, isLoading, isFetching, refetch } = useGetMarketingDashboardAdminQuery({ days });

  const busy = isLoading || isFetching;
  const d = data;

  const funnel = d?.funnel;
  const revenue = d?.revenue;
  const media = d?.mediaSplit ?? { audio: 0, video: 0 };
  const sources = d?.sources ?? [];
  const top = d?.topConsultants ?? [];

  const totalUsers = funnel?.totalUsers ?? 0;
  const withBooking = funnel?.usersWithBooking ?? 0;
  const paid = funnel?.usersPaid ?? 0;

  const mediaData = [
    { name: 'Sesli', value: media.audio ?? 0, color: GOLD },
    { name: 'Görüntülü', value: media.video ?? 0, color: PLUM },
  ].filter((x) => x.value > 0);

  const sourceTotal = sources.reduce((a, s) => a + s.count, 0) || 1;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-gm-text">Pazarlama &amp; Dönüşüm</h1>
          <p className="text-gm-muted font-serif italic opacity-80 text-sm">
            Kendi verimizden kesin ölçüm — ziyaret, randevu, ödeme ve danışman performansı.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-gm-border-soft bg-gm-surface/30 p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${
                  days === r.days
                    ? 'bg-gm-gold text-gm-bg'
                    : 'text-gm-muted hover:text-gm-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase"
          >
            <RefreshCcw className={`mr-2 size-3.5 ${busy ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Hızlı linkler (Part A) */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
            Dış Panolar (Pixel / Analytics / Reklam / Sosyal)
          </CardTitle>
          <CardDescription className="text-gm-muted text-[11px] pt-1">
            Meta Pixel <code className="text-gm-gold">{PIXEL_ID}</code> ve Google Etiketi{' '}
            <code className="text-gm-gold">AW-18346295670</code> canlıda aktif.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-bg-deep/40 px-4 py-3 hover:border-gm-gold/40 hover:bg-gm-surface/30 transition-all"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gm-text truncate">{l.label}</div>
                  <div className="text-[11px] text-gm-muted truncate">{l.desc}</div>
                </div>
                <ExternalLink className="size-4 text-gm-muted group-hover:text-gm-gold shrink-0 ml-2" />
              </a>
            ))}
          </div>

          {/* İç panel — sunucu-log analitiği (audit) */}
          <div className="mt-3">
            <Link
              href="/admin/audit?tab=metrics"
              className="group flex items-center justify-between rounded-2xl border border-gm-gold/25 bg-gm-gold/5 px-4 py-3 hover:border-gm-gold/50 hover:bg-gm-gold/10 transition-all"
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-gm-text truncate">
                  Denetim &amp; Trafik Logları (bu panel)
                </div>
                <div className="text-[11px] text-gm-muted truncate">
                  Sunucu-log trafiği, coğrafya, huni & güvenlik/oturum olayları — izin gerektirmez
                </div>
              </div>
              <TrendingUp className="size-4 text-gm-gold shrink-0 ml-2" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Huni */}
      <div className="space-y-4">
        <SectionTitle>Dönüşüm Hunisi ({days} gün)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Toplam Kullanıcı"
            value={fmtNum(totalUsers)}
            sub={`${fmtNum(funnel?.newUsers ?? 0)} yeni (son ${days} gün)`}
          />
          <MetricCard
            icon={CalendarCheck}
            label="Randevu Alan"
            value={fmtNum(withBooking)}
            sub={`Kullanıcıların %${funnel?.userToBookingRate ?? 0}'i`}
          />
          <MetricCard
            icon={Wallet}
            label="Ödeme Yapan"
            value={fmtNum(paid)}
            sub={`Randevu alanların %${funnel?.bookingToPaidRate ?? 0}'i`}
          />
          <MetricCard
            icon={ArrowDownRight}
            label="Uçtan Uca Dönüşüm"
            value={`%${totalUsers ? Math.round((paid / totalUsers) * 1000) / 10 : 0}`}
            sub="Kullanıcı → ödeme"
          />
        </div>
      </div>

      {/* Gelir + Trend */}
      <div className="space-y-4">
        <SectionTitle>Gelir</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <MetricCard
              icon={TrendingUp}
              label={`Gelir (son ${days} gün)`}
              value={fmtTRY(revenue?.range ?? 0)}
              sub={`Toplam: ${fmtTRY(revenue?.total ?? 0)}`}
            />
            <MetricCard
              icon={Wallet}
              label="Danışmanlık Cirosu"
              value={fmtTRY(revenue?.consultationRevenue ?? 0)}
              sub={`Ort. sipariş: ${fmtTRY(revenue?.avgOrderValue ?? 0)} · ${fmtNum(
                revenue?.paidOrders ?? 0,
              )} ödeme`}
            />
          </div>
          <div className="rounded-[24px] bg-gm-surface/30 border border-gm-border-soft p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted mb-4">
              Günlük Gelir Trendi
            </div>
            {revenue?.trend && revenue.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenue.trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.10)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--gm-muted, #9a8f7a)' }}
                    tickFormatter={(v) => String(v).slice(5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--gm-muted, #9a8f7a)' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip
                    formatter={(v: any) => [fmtTRY(Number(v)), 'Gelir']}
                    contentStyle={{
                      background: '#1c1710',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: GOLD }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#revGold)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gm-muted text-sm">
                {busy ? 'Yükleniyor…' : 'Bu dönemde ödeme kaydı yok.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kaynak + Medya */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle>Kayıt Kaynağı</SectionTitle>
          <div className="rounded-[24px] bg-gm-surface/30 border border-gm-border-soft p-6 space-y-4">
            {sources.length === 0 ? (
              <div className="text-gm-muted text-sm py-6 text-center">Veri yok.</div>
            ) : (
              sources.map((s) => {
                const pct = Math.round((s.count / sourceTotal) * 100);
                const label = s.key === 'google' ? 'Google ile giriş' : 'E-posta / şifre';
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gm-text">{label}</span>
                      <span className="text-gm-muted">
                        {fmtNum(s.count)} · %{pct}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gm-bg-deep overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gm-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle>Görüşme Tipi</SectionTitle>
          <div className="rounded-[24px] bg-gm-surface/30 border border-gm-border-soft p-6">
            {mediaData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={mediaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                    >
                      {mediaData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, n: any) => [fmtNum(Number(v)), n]}
                      contentStyle={{
                        background: '#1c1710',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="size-4" style={{ color: GOLD }} />
                    <span className="text-gm-text">Sesli</span>
                    <span className="text-gm-muted">{fmtNum(media.audio ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="size-4" style={{ color: PLUM }} />
                    <span className="text-gm-text">Görüntülü</span>
                    <span className="text-gm-muted">{fmtNum(media.video ?? 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-gm-muted text-sm">
                Randevu kaydı yok.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top danışmanlar */}
      <div className="space-y-4">
        <SectionTitle>En İyi Danışmanlar</SectionTitle>
        <div className="rounded-[24px] bg-gm-surface/30 border border-gm-border-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.15em] text-gm-muted border-b border-gm-border-soft">
                  <th className="text-left font-bold px-6 py-4">Danışman</th>
                  <th className="text-right font-bold px-6 py-4">Randevu</th>
                  <th className="text-right font-bold px-6 py-4">Ciro</th>
                  <th className="text-right font-bold px-6 py-4">Puan</th>
                </tr>
              </thead>
              <tbody>
                {top.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gm-muted">
                      {busy ? 'Yükleniyor…' : 'Danışman verisi yok.'}
                    </td>
                  </tr>
                ) : (
                  top.map((c, i) => (
                    <tr
                      key={c.id}
                      className="border-b border-gm-border-soft/50 last:border-0 hover:bg-gm-surface/20"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold size-6 p-0 flex items-center justify-center rounded-full text-[10px] font-bold"
                          >
                            {i + 1}
                          </Badge>
                          <span className="text-gm-text font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gm-text tabular-nums">
                        {fmtNum(c.bookings)}
                      </td>
                      <td className="px-6 py-4 text-right text-gm-text tabular-nums">
                        {fmtTRY(c.revenue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-gm-muted tabular-nums">
                          <Star className="size-3.5 text-gm-gold" fill={GOLD} />
                          {c.rating ? c.rating.toFixed(1) : '—'}
                          {c.ratingCount ? (
                            <span className="text-gm-muted/60">({c.ratingCount})</span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gm-muted/70 text-center pt-2">
        Bu veriler platform veritabanından gerçek zamanlı hesaplanır — çerez izni gerektirmez, kesindir.
        Pixel/GA rakamları reklam atıfı içindir ve izne bağlı olduğu için daha düşük görünebilir.
      </p>
    </div>
  );
}
