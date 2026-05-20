'use client';

import React, { useMemo } from 'react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetFunnelReportAdminQuery } from '@/integrations/endpoints/admin/audit_admin.endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';

export function AuditFunnelChart({ range }: { range: string }) {
  const t = useAdminT('admin.audit');
  
  const { data, isLoading, isError } = useGetFunnelReportAdminQuery({ range: `${range}d` });

  if (isLoading) {
    return (
      <div className="flex gap-4 w-full h-[400px] items-end justify-between p-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className={`w-[14%] h-[${100 - i * 15}%] rounded-t-xl`} />)}
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return <div className="p-8 text-center text-gm-muted italic">Veri yüklenemedi.</div>;
  }

  const steps = data.data.steps || [];
  const maxCount = Math.max(1, ...steps.map((s: any) => s.count));

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
        <CardTitle className="font-serif text-2xl flex items-center gap-3">
          <Filter className="h-5 w-5 text-gm-gold" /> Dönüşüm Hunisi
        </CardTitle>
        <CardDescription className="font-serif italic opacity-70 text-gm-muted">
          Ziyaretten satışa kullanıcı yolculuğu
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col gap-6">
          {steps.map((step: any, index: number) => {
            const pct = (step.count / maxCount) * 100;
            return (
              <div key={step.step} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gm-text">{step.step}</span>
                  <span className="text-gm-muted">
                    {step.count} ({step.conversion_from_start}%)
                    {index > 0 && <span className="ml-2 text-gm-error">Düşüş: {step.drop_off_rate}%</span>}
                  </span>
                </div>
                <div className="h-6 w-full bg-gm-bg-deep rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gm-gold transition-all duration-1000" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
