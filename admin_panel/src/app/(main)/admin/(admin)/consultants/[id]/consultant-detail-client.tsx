'use client';

import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import {
  useApproveConsultantAdminMutation,
  useGetConsultantAdminQuery,
  useRejectConsultantAdminMutation,
} from '@/integrations/hooks';

export default function ConsultantDetailClient({ id }: { id: string }) {
  const query = useGetConsultantAdminQuery(id);
  const [approve] = useApproveConsultantAdminMutation();
  const [reject] = useRejectConsultantAdminMutation();
  const t = useAdminT();
  const item = query.data;

  async function approveCurrent() {
    try {
      await approve(id).unwrap();
      toast.success(t('consultants.actions.approve_success'));
    } catch {
      toast.error(t('consultants.actions.approve_failed'));
    }
  }

  async function rejectCurrent() {
    const reason = window.prompt(t('consultants.actions.rejection_reason_prompt'));
    if (!reason?.trim()) return;
    try {
      await reject({ id, rejection_reason: reason.trim() }).unwrap();
      toast.success(t('consultants.actions.reject_success'));
    } catch {
      toast.error(t('consultants.actions.reject_failed'));
    }
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/consultants">
          <ArrowLeft className="mr-2 size-4" />
          {t('consultants.title')}
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{item?.full_name || item?.email || t('consultants.title_singular') }</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{item?.email}</p>
          </div>
          {item?.approval_status && (
            <Badge>
              {item.approval_status === 'approved'
                ? t('consultants.status.approved')
                : item.approval_status === 'rejected'
                ? t('consultants.status.rejected')
                : t('consultants.status.pending')}
              }
            </Badge>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">{t('consultants.labels.bio')}</div>
            <p className="mt-1 text-sm">{item?.bio || '-'}</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">{t('consultants.labels.expertise')}</div>
              <div className="mt-1 text-sm">
                {item?.expertise?.map((value) => t(`consultants.expertise.${value}`, {}, value)).join(', ') || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('consultants.labels.languages')}</div>
              <div className="mt-1 text-sm">
                {item?.languages?.map((value) => t(`consultants.languages.${value}`, {}, value)).join(', ') || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('consultants.labels.session')}</div>
              <div className="mt-1 text-sm">
                {item?.session_duration || '-'} min · {item?.session_price || '-'} {item?.currency || 'TRY'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="button" onClick={approveCurrent} disabled={!item || item.approval_status === 'approved'}>
              <Check className="mr-2 size-4" />
              {t('consultants.actions.approve')}
            </Button>
            <Button type="button" variant="outline" onClick={rejectCurrent} disabled={!item || item.approval_status === 'rejected'}>
              <X className="mr-2 size-4" />
              {t('consultants.actions.reject')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
