'use client';

import React from 'react';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCohortsAdminQuery } from '@/integrations/endpoints/admin/audit_admin.endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuditCohortChart({ range }: { range: string }) {
  const t = useAdminT('admin.audit');
  const { data, isLoading, isError } = useGetCohortsAdminQuery({ range: `${range}w` });

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

  const { cohorts, retention } = data.data;

  // We group retention by cohort_week
  const cohortMap = new Map<number, { week_index: number; active_users: number }[]>();
  retention.forEach((r: any) => {
    if (!cohortMap.has(r.cohort_week)) {
      cohortMap.set(r.cohort_week, []);
    }
    cohortMap.get(r.cohort_week)!.push(r);
  });

  const maxWeeks = Math.max(1, ...retention.map((r: any) => r.week_index));

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="p-8 pb-4 border-b border-gm-border-soft bg-gm-surface/40">
        <CardTitle className="font-serif text-2xl flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gm-gold" /> {t('cohort.title')}
        </CardTitle>
        <CardDescription className="font-serif italic opacity-70 text-gm-muted">
          {t('cohort.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 font-bold text-gm-muted whitespace-nowrap border-b border-gm-border-soft">{t('cohort.cohortColumn')}</th>
              <th className="p-3 font-bold text-gm-muted text-center border-b border-gm-border-soft">{t('columns.user')}</th>
              {Array.from({ length: maxWeeks + 1 }).map((_, i) => (
                <th key={i} className="p-3 font-bold text-gm-muted text-center border-b border-gm-border-soft w-12">
                  {t('cohort.weekShort', { n: String(i) })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c: any) => {
              const items = cohortMap.get(c.cohort_week) || [];
              const baseUsers = c.users || 1;
              
              return (
                <tr key={c.cohort_week} className="border-b border-gm-border-soft/50 last:border-0 hover:bg-gm-surface/30">
                  <td className="p-3 font-mono font-medium text-gm-text">{c.cohort_week}</td>
                  <td className="p-3 text-center text-gm-muted">{c.users}</td>
                  {Array.from({ length: maxWeeks + 1 }).map((_, i) => {
                    const row = items.find((x) => Number(x.week_index) === i);
                    const pct = row ? (Number(row.active_users) / baseUsers) * 100 : 0;
                    
                    return (
                      <td key={i} className="p-1">
                        {row ? (
                          <div 
                            className={cn(
                              "h-10 flex items-center justify-center rounded-lg font-mono text-xs transition-colors",
                              pct > 0 ? "text-gm-bg" : "text-gm-muted"
                            )}
                            style={{
                              backgroundColor: pct > 0 ? `rgba(212, 175, 55, ${Math.max(0.2, pct / 100)})` : 'transparent',
                            }}
                          >
                            {pct > 0 ? `${pct.toFixed(0)}%` : '-'}
                          </div>
                        ) : (
                          <div className="h-10" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
