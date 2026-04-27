'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCcw, TrendingUp, Users, Calendar, Wallet, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

import { useGetDashboardSummaryAdminQuery } from '@/integrations/hooks';
import type { DashboardRangeKey } from '@/integrations/shared';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAdminSettings } from './admin-settings-provider';

const ROUTE_MAP: Record<string, string> = {
  site_settings: '/admin/site-settings',
  bookings: '/admin/bookings',
  users: '/admin/users',
  consultants: '/admin/consultants',
  support: '/admin/support',
  announcements: '/admin/announcements',
};

const KPI_CHART_CONFIG = {
  revenue_total: { label: 'Gelir', color: '#C9A961' },
} satisfies ChartConfig;

const SERVICE_CHART_CONFIG = {
  bookings_total: { label: 'Randevu', color: '#7B5EA7' },
} satisfies ChartConfig;

const RANGES: DashboardRangeKey[] = ['7d', '30d', '90d'];

function formatMoney(v: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(v || 0);
}

function labelForBucket(v: string): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
}

export default function AdminDashboardClient() {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const page = copy.pages?.dashboard ?? {};
  const { pageMeta } = useAdminSettings();
  const dashboardMeta = pageMeta?.dashboard;

  const [range, setRange] = React.useState<DashboardRangeKey>('30d');
  const q = useGetDashboardSummaryAdminQuery({ range });

  const analytics = q.data;

  const kpis = React.useMemo(() => {
    const totals = analytics?.totals;
    if (!totals) return [];
    return [
      { key: 'revenue_total', label: 'Toplam Ciro', value: formatMoney(totals.revenue_total), icon: Wallet, color: '#C9A961' },
      { key: 'today_bookings', label: 'Bugünkü Randevular', value: String(totals.today_bookings), icon: Calendar, color: '#7B5EA7' },
      { key: 'consultants_active', label: 'Aktif Danışmanlar', value: String(totals.consultants_active), icon: ShieldCheck, color: '#4CAF6E' },
      { key: 'users_total', label: 'Toplam Üye', value: String(totals.users_total), icon: Users, color: '#5B9BD5' },
    ];
  }, [analytics?.totals]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-brand-gold" />
            <span className="text-brand-gold font-bold text-[10px] tracking-[0.2em] uppercase">Genel Bakış</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground leading-tight">Yönetim Paneli</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Platform performansını ve büyüme verilerini anlık takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-full border border-border/50">
          {RANGES.map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                range === key ? 'bg-brand-gold text-brand-ink' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {key === '7d' ? 'Haftalık' : key === '30d' ? 'Aylık' : '3 Aylık'}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-2" />
          <button 
            onClick={() => q.refetch()} 
            disabled={q.isFetching}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <RefreshCcw className={`size-4 ${q.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {q.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[24px]" />
          ))
        ) : (
          kpis.map((item) => (
            <Card key={item.key} className="bg-card border-border/40 rounded-[24px] overflow-hidden relative group hover:border-brand-gold/30 transition-all duration-500">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <item.icon size={64} />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <CardTitle className="text-[10px] font-bold text-muted-foreground tracking-[0.1em] uppercase">{item.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif text-foreground">{item.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-gold" />
              <CardTitle className="font-serif text-2xl">Gelir Grafiği</CardTitle>
            </div>
            <CardDescription className="font-serif italic opacity-70">Seçili dönemdeki toplam ciro değişimi.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {q.isLoading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : analytics?.revenueTrend.length ? (
              <ChartContainer config={KPI_CHART_CONFIG} className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A961" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#C9A961" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickFormatter={labelForBucket} tick={{ fontSize: 10, fill: '#666' }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} tick={{ fontSize: 10, fill: '#666' }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        labelFormatter={(l) => labelForBucket(String(l))} 
                        formatter={(v) => formatMoney(Number(v))} 
                      />} 
                    />
                    <Area type="monotone" dataKey="revenue_total" stroke="#C9A961" strokeWidth={3} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground font-serif italic">Veri bulunamadı.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-4 h-4 text-[#7B5EA7]" />
              <CardTitle className="font-serif text-2xl">Randevu Dağılımı</CardTitle>
            </div>
            <CardDescription className="font-serif italic opacity-70">Hizmet bazlı randevu sayıları.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {q.isLoading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : analytics?.services.length ? (
              <ChartContainer config={SERVICE_CHART_CONFIG} className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.services}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="service_name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => String(l)} />} />
                    <Bar dataKey="bookings_total" fill="#7B5EA7" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-muted-foreground font-serif italic">Veri bulunamadı.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Modules Section */}
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="font-serif text-2xl">Hızlı İşlemler</CardTitle>
            <CardDescription className="font-serif italic opacity-70">Modüllere hızlı erişim.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 grid grid-cols-2 gap-4">
            {Object.entries(ROUTE_MAP).map(([key, href]) => (
              <Link key={key} href={href} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 hover:border-brand-gold/30 hover:bg-muted/40 transition-all group">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-70 group-hover:opacity-100">{key.replace('_', ' ')}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="font-serif text-2xl">Performans Özeti</CardTitle>
            <CardDescription className="font-serif italic opacity-70">Hizmet bazlı ciro verileri.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-4">
            {analytics?.services.length ? analytics.services.map((svc) => (
              <div key={svc.service_id} className="flex items-center justify-between p-4 rounded-2xl border border-border/30 bg-muted/10">
                <div>
                  <div className="font-serif text-lg">{svc.service_name}</div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {svc.bookings_total} Randevu
                  </div>
                </div>
                <div className="text-xl font-serif text-brand-gold">{formatMoney(svc.revenue_total)}</div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground font-serif italic text-center py-8">Yeterli veri yok.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
