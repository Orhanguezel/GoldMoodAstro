'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Eye, RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useApproveConsultantAdminMutation,
  useListConsultantsAdminQuery,
  useRejectConsultantAdminMutation,
} from '@/integrations/hooks';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
] as const;

function statusVariant(status: string) {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
}

export default function ConsultantsClient() {
  const [status, setStatus] = React.useState<string | undefined>();
  const query = useListConsultantsAdminQuery(status ? { approval_status: status } : undefined);
  const [approve, approveState] = useApproveConsultantAdminMutation();
  const [reject, rejectState] = useRejectConsultantAdminMutation();

  async function approveConsultant(id: string) {
    try {
      await approve(id).unwrap();
      toast.success('Consultant approved.');
    } catch {
      toast.error('Could not approve consultant.');
    }
  }

  async function rejectConsultant(id: string) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Consultants</h1>
          <p className="text-sm text-muted-foreground">Review consultant applications and availability state.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant={status === item.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultant List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.full_name || item.email || item.id}</div>
                    <div className="text-xs text-muted-foreground">{item.email}</div>
                  </TableCell>
                  <TableCell>{item.expertise?.join(', ') || '-'}</TableCell>
                  <TableCell>
                    {item.session_price} {item.currency || 'TRY'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.approval_status) as any}>{item.approval_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon" variant="outline" title="Details">
                        <Link href={`/admin/consultants/${item.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        title="Approve"
                        disabled={approveState.isLoading || item.approval_status === 'approved'}
                        onClick={() => approveConsultant(item.id)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        title="Reject"
                        disabled={rejectState.isLoading || item.approval_status === 'rejected'}
                        onClick={() => rejectConsultant(item.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!query.isLoading && !query.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No consultants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
