'use client';

import * as React from 'react';
import { 
  Tag, Plus, RefreshCcw, 
  Trash2, Pencil, Ticket
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
import { cn } from '@/lib/utils';

export default function AdminCampaignsClient() {
  const query = useListCampaignsAdminQuery(undefined);
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

  const busy = query.isFetching;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">KAMPANYA YÖNETİMİ</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Kampanyalar & Promolar</h1>
          <p className="text-sm italic text-gm-muted">İndirim kodlarını, hediye kredileri ve özel teklifleri yönetin.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", query.isFetching && "animate-spin")} />
            Yenile
          </Button>
          <Button 
            size="sm" 
            asChild 
            className="h-12 rounded-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg px-8 text-[10px] font-bold uppercase tracking-widest border border-transparent shadow-lg shadow-gm-gold/10"
          >
            <Link href="/admin/campaigns/new">
              <Plus className="mr-2 size-4" />
              Yeni Kampanya
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Glassmorphic Card & Table */}
      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Aktif</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kampanya Tanımı</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Tip & Değer</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kullanım Durumu</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kapsam</TableHead>
                <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : query.data?.length === 0 ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                    Kayıtlı kampanya bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors">
                    <TableCell className="px-8 py-5">
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                        className="data-[state=checked]:bg-gm-gold"
                      />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gm-gold/10 text-gm-gold border border-gm-gold/25 shadow-inner">
                          <Ticket className="size-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gm-text">{item.name_tr}</div>
                          <div className="text-[11px] text-gm-muted/80 flex items-center gap-1 mt-1">
                            Kod: <code className="bg-gm-bg-deep px-2 py-0.5 rounded text-gm-gold font-bold uppercase tracking-wider text-[10px] border border-gm-border-soft">{item.code}</code>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className="w-fit rounded-full text-[9px] uppercase border-gm-primary/30 text-gm-primary bg-gm-primary/5 tracking-widest px-2.5 py-0.5">
                          {item.type.replace('_', ' ')}
                        </Badge>
                        <div className="font-bold text-gm-text text-sm">
                          {item.type === 'discount_percentage' && `%${item.value}`}
                          {item.type === 'discount_fixed' && `₺${item.value}`}
                          {item.type === 'bonus_credits' && `${item.value} Kredi`}
                          {item.type === 'free_trial_days' && `${item.value} Gün Ücretsiz`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-gm-text-dim font-light">
                          Kullanım: <span className="font-bold text-gm-text">{item.used_count}</span>
                          {item.max_uses ? ` / ${item.max_uses}` : ' / ∞'}
                        </div>
                        {item.max_uses && (
                          <div className="h-1.5 w-24 rounded-full bg-gm-bg-deep/60 overflow-hidden border border-gm-border-soft/30">
                            <div 
                              className="h-full bg-gm-gold rounded-full" 
                              style={{ width: `${Math.min(100, (item.used_count / item.max_uses) * 100)}%` }} 
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="bg-gm-bg-deep text-gm-text-dim border border-gm-border-soft/60 capitalize rounded-full text-[10px] px-3 py-1 font-medium">
                        {item.applies_to.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted">
                          <Link href={`/admin/campaigns/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 rounded-full text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
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
