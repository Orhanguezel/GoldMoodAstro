'use client';

import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useApproveConsultantAdminMutation,
  useGetConsultantAdminQuery,
  useRejectConsultantAdminMutation,
} from '@/integrations/hooks';

export default function ConsultantDetailClient({ id }: { id: string }) {
  const query = useGetConsultantAdminQuery(id);
  const [approve] = useApproveConsultantAdminMutation();
  const [reject] = useRejectConsultantAdminMutation();
  const item = query.data;

  async function approveCurrent() {
    try {
      await approve(id).unwrap();
      toast.success('Consultant approved.');
    } catch {
      toast.error('Could not approve consultant.');
    }
  }

  async function rejectCurrent() {
    const reason = window.prompt('Rejection reason');
    if (!reason?.trim()) return;
    try {
      await reject({ id, rejection_reason: reason.trim() }).unwrap();
      toast.success('Consultant rejected.');
    } catch {
      toast.error('Could not reject consultant.');
    }
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/consultants">
          <ArrowLeft className="mr-2 size-4" />
          Consultants
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{item?.full_name || item?.email || 'Consultant'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{item?.email}</p>
          </div>
          {item?.approval_status && <Badge>{item.approval_status}</Badge>}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Bio</div>
            <p className="mt-1 text-sm">{item?.bio || '-'}</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Expertise</div>
              <div className="mt-1 text-sm">{item?.expertise?.join(', ') || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Languages</div>
              <div className="mt-1 text-sm">{item?.languages?.join(', ') || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Session</div>
              <div className="mt-1 text-sm">
                {item?.session_duration || '-'} min · {item?.session_price || '-'} {item?.currency || 'TRY'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="button" onClick={approveCurrent} disabled={!item || item.approval_status === 'approved'}>
              <Check className="mr-2 size-4" />
              Approve
            </Button>
            <Button type="button" variant="outline" onClick={rejectCurrent} disabled={!item || item.approval_status === 'rejected'}>
              <X className="mr-2 size-4" />
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
