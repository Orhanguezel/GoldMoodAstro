'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
  custom_pages: '/admin/custompage',
  services: '/admin/services',
  faqs: '/admin/faqs',
  menu_items: '/admin/menuitem',
  footer_sections: '/admin/footer-sections',
  newsletter: '/admin/newsletter',
  contacts: '/admin/contacts',
  reviews: '/admin/reviews',
  bookings: '/admin/bookings',
  users: '/admin/users',
  email_templates: '/admin/email-templates',
  notifications: '/admin/notifications',
  storage: '/admin/storage',
  db: '/admin/db',
  audit: '/admin/audit',
  availability: '/admin/availability',
  consultants: '/admin/consultants',
  support: '/admin/support',
  announcements: '/admin/announcements',
};

const KPI_CHART_CONFIG = {
  revenue_total: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const SERVICE_CHART_CONFIG = {
  bookings_total: { label: 'Bookings', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const RANGES: DashboardRangeKey[] = ['7d', '30d', '90d'];

function getErrMessage(err: unknown): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return '';
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(v || 0);
}

function labelForBucket(v: string): string {
  if (!v) return '—';
  if (v.includes('-W')) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
}

export default function AdminDashboardClient() {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const page = copy.pages?.dashboard ?? {};
  const { pageMeta } = useAdminSettings();
  const dashboardMeta = pageMeta?.dashboard;

  const [range, setRange] = React.useState<DashboardRangeKey>('30d');
  const q = useGetDashboardSummaryAdminQuery({ range });

  React.useEffect(() => {
    if (!q.isError) return;
    toast.error(getErrMessage(q.error) || copy.common?.states?.error || t('admin.common.error'));
  }, [q.isError, q.error, copy.common?.states?.error, t]);

  const analytics = q.data;
  const nav = copy.nav?.items ?? ({} as Record<string, string>);

  const kpis = React.useMemo(() => {
    const totals = analytics?.totals;
    if (!totals) return [];
    return [
      { key: 'users_total', label: t('admin.dashboard.analytics.kpis.users'), value: String(totals.users_total) },
      { key: 'consultants_active', label: t('admin.dashboard.analytics.kpis.consultants'), value: String(totals.consultants_active) },
      { key: 'today_bookings', label: t('admin.dashboard.analytics.kpis.todayBookings'), value: String(totals.today_bookings) },
      { key: 'revenue_total', label: t('admin.dashboard.analytics.kpis.revenue'), value: formatMoney(totals.revenue_total) },
    ];
  }, [analytics?.totals, t]);

  const moduleItems = React.useMemo(() => {
    const totals = analytics?.totals;
    if (!totals) return [];
    const pairs: Array<[string, number]> = [
      ['services', totals.services_total],
      ['bookings', totals.bookings_total],
      ['consultants', totals.consultants_active],
      ['availability', totals.availability_total],
      ['contacts', totals.contact_messages_total],
      ['audit', totals.audit_logs_total],
      ['storage', totals.storage_assets_total],
      ['users', totals.users_total],
      ['support', totals.support_tickets_total || 0],
      ['announcements', totals.announcements_total || 0],
    ];
    return pairs.map(([key, count]) => ({
      key,
      count,
      href: ROUTE_MAP[key] ?? null,
      label:
        (nav as Record<string, string>)[key] ||
        page[`label_${key}`] ||
        page[key] ||
        t(`admin.dashboard.items.${key}` as any) ||
        key,
    }));
  }, [analytics?.totals, nav, page, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {dashboardMeta?.title || page?.title || t('admin.dashboard.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.dashboard.analytics.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((key) => (
            <Button
              key={key}
              type="button"
              variant={range === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange(key)}
            >
              {t(`admin.dashboard.analytics.ranges.${key}` as any)}
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCcw className={`mr-2 size-4${q.isFetching ? ' animate-spin' : ''}`} />
            {copy.common?.actions?.refresh || t('admin.common.refresh')}
          </Button>
        </div>
      </div>

      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="gap-2 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!q.isLoading && analytics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <Card key={item.key}>
                <CardHeader className="gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tabular-nums">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.analytics.revenueChart.title')}</CardTitle>
                <CardDescription>{t('admin.dashboard.analytics.revenueChart.description')}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {analytics.revenueTrend.length ? (
                  <ChartContainer config={KPI_CHART_CONFIG} className="aspect-auto h-72 w-full">
                    <AreaChart data={analytics.revenueTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={labelForBucket} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) => labelForBucket(String(label))}
                            formatter={(value) => formatMoney(Number(value ?? 0))}
                          />
                        }
                      />
                      <Area dataKey="revenue_total" type="monotone" stroke="var(--color-revenue_total)" fill="var(--color-revenue_total)" fillOpacity={0.22} />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="text-sm text-muted-foreground">{t('admin.dashboard.analytics.states.empty')}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.analytics.servicesChart.title')}</CardTitle>
                <CardDescription>{t('admin.dashboard.analytics.servicesChart.description')}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {analytics.services.length ? (
                  <ChartContainer config={SERVICE_CHART_CONFIG} className="aspect-auto h-72 w-full">
                    <BarChart data={analytics.services}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="service_name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={analytics.services.length > 3 ? -12 : 0}
                        textAnchor={analytics.services.length > 3 ? 'end' : 'middle'}
                        height={50}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent labelFormatter={(label) => String(label)} formatter={(value) => `${Number(value ?? 0)}`} />}
                      />
                      <Bar dataKey="bookings_total" fill="var(--color-bookings_total)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="text-sm text-muted-foreground">{t('admin.dashboard.analytics.states.empty')}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.analytics.servicesTable.title')}</CardTitle>
                <CardDescription>{t('admin.dashboard.analytics.servicesTable.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.services.length ? analytics.services.map((svc) => (
                  <div key={svc.service_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">{svc.service_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('admin.dashboard.analytics.servicesTable.bookings', { count: String(svc.bookings_total) })}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{formatMoney(svc.revenue_total)}</div>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">{t('admin.dashboard.analytics.states.empty')}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.analytics.modules.title')}</CardTitle>
                <CardDescription>{t('admin.dashboard.analytics.modules.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {moduleItems.map((item) => {
                  const body = (
                    <div className="rounded-md border p-3 transition-colors hover:border-primary/50">
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                      <div className="mt-1 text-xl font-semibold tabular-nums">{item.count}</div>
                    </div>
                  );
                  return item.href ? (
                    <Link key={item.key} href={item.href} prefetch={false}>
                      {body}
                    </Link>
                  ) : (
                    <div key={item.key}>{body}</div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
