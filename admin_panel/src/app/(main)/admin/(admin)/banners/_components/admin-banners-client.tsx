'use client';

import * as React from 'react';
import { 
  Layout, Plus, RefreshCcw, 
  Trash2, Pencil, Image as ImageIcon,
  ExternalLink, Eye, MousePointerClick
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
  useListBannersAdminQuery,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';

export default function AdminBannersClient() {
  const query = useListBannersAdminQuery(undefined);
  const [update] = useUpdateBannerAdminMutation();
  const [remove] = useDeleteBannerAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, body: { is_active: !current } }).unwrap();
      toast.success('Status updated.');
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Banner deleted.');
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">REKLAM & BANNER YÖNETİMİ</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Banner Yönetimi</h1>
          <p className="text-sm italic text-gm-muted">Mobil ve web platformlarındaki reklam ve promosyon banner'larını yönetin.</p>
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
            <Link href="/admin/banners/new">
              <Plus className="mr-2 size-4" />
              Yeni Banner
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
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Banner Detayı</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Konum (Placement)</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">İstatistikler</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Planlama</TableHead>
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
                    Kayıtlı banner bulunamadı.
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
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-[12px] border border-gm-border-soft bg-gm-bg-deep shadow-inner flex items-center justify-center">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.code} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gm-muted/50">
                              <ImageIcon className="size-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gm-text">{item.title_tr || item.code}</div>
                          <div className="text-[11px] text-gm-muted/80 flex items-center gap-1.5 mt-1">
                            <code className="bg-gm-bg-deep px-1.5 py-0.5 rounded text-gm-gold border border-gm-border-soft/60 text-[9px] font-bold uppercase tracking-wider">{item.code}</code>
                            {item.locale !== '*' && (
                              <Badge variant="outline" className="rounded-full border-gm-primary/20 bg-gm-primary/5 text-gm-primary text-[9px] uppercase tracking-widest px-2 py-0.5">
                                {item.locale}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="bg-gm-bg-deep text-gm-text-dim border border-gm-border-soft/60 capitalize rounded-full text-[10px] px-3 py-1 font-semibold">
                        {item.placement.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-gm-text-dim font-light">
                          <Eye className="size-3.5 text-gm-info" />
                          <span>{item.view_count.toLocaleString()} görüntülenme</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gm-text-dim font-light">
                          <MousePointerClick className="size-3.5 text-gm-success" />
                          <span>{item.click_count.toLocaleString()} tıklama</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-xs text-gm-text-dim">
                      {item.starts_at ? (
                        <div className="space-y-1 font-light">
                          <div className="text-gm-success">Başl: {format(new Date(item.starts_at), 'dd MMM yy')}</div>
                          {item.ends_at && <div className="text-gm-error">Bitiş: {format(new Date(item.ends_at), 'dd MMM yy')}</div>}
                        </div>
                      ) : (
                        <span className="italic font-light text-gm-muted">Planlama Yok</span>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {item.link_url && (
                          <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted">
                            <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        )}
                        <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted">
                          <Link href={`/admin/banners/${item.id}`}>
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
