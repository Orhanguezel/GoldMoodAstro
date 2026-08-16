'use client';

import React from 'react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetTrafficSourcesAdminQuery } from '@/integrations/endpoints/admin/audit_admin.endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AuditTrafficChart({ range }: { range: string }) {
  const t = useAdminT('admin.audit');
  const { data, isLoading, isError } = useGetTrafficSourcesAdminQuery({ range: `${range}d` });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return <div className="p-8 text-center text-gm-muted italic">{t('common.loadFailed')}</div>;
  }

  const sources = data.data || [];

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
        <CardTitle className="font-serif text-2xl flex items-center gap-3">
          <Share2 className="h-5 w-5 text-gm-gold" /> {t('traffic.title')}
        </CardTitle>
        <CardDescription className="font-serif italic opacity-70 text-gm-muted">
          {t('traffic.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gm-surface/30">
              <th className="p-4 font-bold text-gm-muted">{t('traffic.sourceColumn')}</th>
              <th className="p-4 font-bold text-gm-muted text-right">{t('traffic.visitors')}</th>
              <th className="p-4 font-bold text-gm-muted text-right">{t('traffic.signups')}</th>
              <th className="p-4 font-bold text-gm-muted text-right">{t('traffic.bookings')}</th>
              <th className="p-4 font-bold text-gm-muted text-right">{t('traffic.revenue')}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src: any, index: number) => {
              const isDirect = src.source === 'direct';
              
              return (
                <tr key={index} className="border-b border-gm-border-soft/50 last:border-0 hover:bg-gm-surface/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-gm-text">{src.source}</span>
                      {isDirect && (
                        <Badge variant="outline" className="text-[10px] tracking-widest text-gm-muted border-gm-border-soft bg-gm-surface/20">
                          {t('traffic.direct')}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium">{src.visitors}</td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{src.signups}</span>
                      <span className="text-[10px] text-gm-muted">{src.signup_conversion}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{src.bookings}</span>
                      <span className="text-[10px] text-gm-muted">{src.booking_conversion}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-serif text-gm-gold font-bold">₺{src.revenue.toFixed(2)}</span>
                  </td>
                </tr>
              );
            })}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gm-muted italic">
                  {t('traffic.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
