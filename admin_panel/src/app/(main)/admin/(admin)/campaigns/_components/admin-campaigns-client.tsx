'use client';

import * as React from 'react';
import { 
  Tag, Plus, RefreshCcw, 
  Trash2, Pencil, Ticket,
  CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListCampaignsAdminQuery,
  useUpdateCampaignAdminMutation,
  useDeleteCampaignAdminMutation,
} from '@/integrations/hooks';

export default function AdminCampaignsClient() {
  const query = useListCampaignsAdminQuery();
  const [update] = useUpdateCampaignAdminMutation();
  const [remove] = useDeleteCampaignAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, body: { is_active: !current } }).unwrap();
      toast.success('Status updated.');
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Campaign deleted.');
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold italic font-display text-gm-primary">Campaigns & Promos</h1>
          <p className="text-sm text-muted-foreground">Manage discount codes, bonus credits, and special offers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild className="bg-gm-primary hover:bg-gm-primary-dark">
            <Link href="/admin/campaigns/new">
              <Plus className="mr-2 size-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-gm-border-soft bg-gm-surface/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface-high/50">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="w-12">Active</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type & Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">Loading...</TableCell>
                </TableRow>
              ) : query.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No campaigns found.</TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface-high/30 transition-colors">
                    <TableCell>
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gm-primary/10 text-gm-primary">
                          <Ticket className="size-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gm-text">{item.name_tr}</div>
                          <div className="text-xs text-gm-muted flex items-center gap-1">
                            <code className="bg-gm-bg-deep px-1.5 py-0.5 rounded text-gm-gold font-bold uppercase">{item.code}</code>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] uppercase border-gm-primary/30 text-gm-primary">
                          {item.type.replace('_', ' ')}
                        </Badge>
                        <div className="font-bold text-gm-text">
                          {item.type === 'discount_percentage' && `%${item.value}`}
                          {item.type === 'discount_fixed' && `₺${item.value}`}
                          {item.type === 'bonus_credits' && `${item.value} Credits`}
                          {item.type === 'free_trial_days' && `${item.value} Days Free`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-gm-text-dim">
                          <span className="font-bold text-gm-text">{item.used_count}</span>
                          {item.max_uses ? ` / ${item.max_uses}` : ' / ∞'} uses
                        </div>
                        {item.max_uses && (
                          <div className="h-1.5 w-24 rounded-full bg-gm-bg-deep overflow-hidden">
                            <div 
                              className="h-full bg-gm-primary" 
                              style={{ width: `${Math.min(100, (item.used_count / item.max_uses) * 100)}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gm-surface-high text-gm-text-dim border-gm-border-soft capitalize">
                        {item.applies_to.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="hover:bg-gm-primary/10 hover:text-gm-primary">
                          <Link href={`/admin/campaigns/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
