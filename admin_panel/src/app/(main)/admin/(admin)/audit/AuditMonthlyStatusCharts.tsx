'use client';

// =============================================================
// FILE: AuditMonthlyStatusCharts.tsx
// Aylık trafik (bar) + durum kodu dağılımı (pasta, istek %/hata).
// Veri admin hariç (backend is_admin=0 filtreli).
// =============================================================

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useGetAuditMonthlyAdminQuery,
  useGetAuditStatusDistributionAdminQuery,
} from '@/integrations/endpoints/admin/audit_admin.endpoints';

const GOLD = '#D4AF37';
const PLUM = '#9B6FD9';

// Durum grubu renkleri
const STATUS_COLORS: Record<string, string> = {
  '2xx': '#4CAF6E', // başarılı
  '3xx': '#5B9BD5', // yönlendirme
  '4xx': '#F0A030', // istemci hatası
  '5xx': '#E55B4D', // sunucu hatası
  other: '#8B7BB8',
};
const STATUS_LABELS: Record<string, string> = {
  '2xx': '2xx Başarılı',
  '3xx': '3xx Yönlendirme',
  '4xx': '4xx İstemci Hatası',
  '5xx': '5xx Sunucu Hatası',
  other: 'Diğer',
};

const fmtNum = (n: number) => new Intl.NumberFormat('tr-TR').format(Number(n) || 0);

const tooltipStyle = {
  background: '#1c1710',
  border: '1px solid rgba(212,175,55,0.3)',
  borderRadius: 12,
  fontSize: 12,
} as const;

export function AuditMonthlyStatusCharts({ months = 12, days = 30 }: { months?: number; days?: number }) {
  const monthlyQ = useGetAuditMonthlyAdminQuery({ months });
  const statusQ = useGetAuditStatusDistributionAdminQuery();

  const monthly = monthlyQ.data ?? [];
  const status = statusQ.data ?? [];

  const statusTotal = status.reduce((a, s) => a + s.count, 0) || 0;
  const pieData = status
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status_group] ?? s.status_group,
      key: s.status_group,
      value: s.count,
      color: STATUS_COLORS[s.status_group] ?? STATUS_COLORS.other,
    }));

  const errors = status
    .filter((s) => s.status_group === '4xx' || s.status_group === '5xx')
    .reduce((a, s) => a + s.count, 0);
  const errorRate = statusTotal ? Math.round((errors / statusTotal) * 1000) / 10 : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Aylık trafik */}
      <div className="bg-gm-surface/40 p-6 rounded-[24px] border border-gm-border-soft shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold">
            Aylık Trafik (son {months} ay)
          </div>
          {monthlyQ.isFetching ? (
            <span className="text-[10px] text-gm-muted animate-pulse">yükleniyor…</span>
          ) : null}
        </div>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.10)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#9a8f7a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9a8f7a' }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: GOLD }} formatter={(v: any, n: any) => [fmtNum(Number(v)), n === 'requests' ? 'İstek' : n === 'errors' ? 'Hata' : n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === 'requests' ? 'İstek' : v === 'errors' ? 'Hata' : v)} />
              <Bar dataKey="requests" fill={GOLD} radius={[6, 6, 0, 0]} />
              <Bar dataKey="errors" fill="#E55B4D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gm-muted text-sm">
            {monthlyQ.isLoading ? 'Yükleniyor…' : 'Bu dönemde veri yok.'}
          </div>
        )}
      </div>

      {/* Durum kodu dağılımı — pasta */}
      <div className="bg-gm-surface/40 p-6 rounded-[24px] border border-gm-border-soft shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold">
            İstek Dağılımı (durum kodu)
          </div>
          <span className={`text-[11px] font-bold ${errorRate > 5 ? 'text-gm-error' : 'text-gm-muted'}`}>
            Hata oranı %{errorRate}
          </span>
        </div>
        {pieData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any, n: any) => {
                    const pct = statusTotal ? Math.round((Number(v) / statusTotal) * 1000) / 10 : 0;
                    return [`${fmtNum(Number(v))} (%${pct})`, n];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1 w-full">
              {pieData.map((s) => {
                const pct = statusTotal ? Math.round((s.value / statusTotal) * 1000) / 10 : 0;
                return (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span className="size-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-gm-text flex-1 truncate">{s.name}</span>
                    <span className="text-gm-muted tabular-nums">
                      {fmtNum(s.value)} · %{pct}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-gm-muted text-sm">
            {statusQ.isLoading ? 'Yükleniyor…' : 'Veri yok.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditMonthlyStatusCharts;
