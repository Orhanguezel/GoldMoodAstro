'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetUserActivityAdminQuery } from '@/integrations/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Clock, CreditCard, Calendar, ArrowRight } from 'lucide-react';

export function UserActivityPanel({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useGetUserActivityAdminQuery({ id: userId, range: '30d' });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return <div className="text-center text-gm-error p-8">Aktivite bilgileri yüklenemedi.</div>;
  }

  const { summary, events } = data.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-2xl shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-full bg-gm-success/10 text-gm-success flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gm-muted uppercase tracking-widest">Toplam Harcama</div>
              <div className="text-2xl font-serif text-gm-text">₺{summary?.total_spend || '0.00'}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-2xl shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-full bg-gm-info/10 text-gm-info flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gm-muted uppercase tracking-widest">Randevular</div>
              <div className="text-2xl font-serif text-gm-text">{summary?.booking_count || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-2xl shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 rounded-full bg-gm-gold/10 text-gm-gold flex items-center justify-center">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gm-muted uppercase tracking-widest">Son Aktif</div>
              <div className="text-sm font-medium text-gm-text mt-1">
                {summary?.last_active ? new Date(summary.last_active).toLocaleString('tr-TR') : 'Hiç'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden shadow-xl">
        <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <Activity className="h-5 w-5 text-gm-gold" /> Aktivite Geçmişi (Son 30 Gün)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {events && events.length > 0 ? (
            <div className="space-y-6 border-l-2 border-gm-border-soft pl-6 ml-3">
              {events.map((evt: any, i: number) => {
                const isEvent = evt.source === 'event';
                const topic = (evt.topic || '').replace('funnel:', '');
                return (
                  <div key={i} className="relative">
                    <div className="absolute -left-[35px] top-1 size-4 rounded-full bg-gm-surface border-2 border-gm-gold shadow-sm" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-gm-text">
                          {isEvent ? topic : 'Sayfa Görüntüleme / İşlem'}
                        </span>
                        <span className="ml-3 text-xs text-gm-muted/80 break-all">
                          {evt.message}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-gm-muted whitespace-nowrap">
                        {new Date(evt.occurred_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gm-muted italic p-4">Kayıtlı aktivite bulunamadı.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
