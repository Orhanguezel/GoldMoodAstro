'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Megaphone, Plus, RefreshCcw, 
  Trash2, Pencil, Users, User, Star, Calendar, Activity,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useListAnnouncementsAdminQuery,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
} from '@/integrations/hooks';

export default function AdminAnnouncementsClient() {
  const t = useAdminT('admin.announcements');
  const query = useListAnnouncementsAdminQuery();
  const [update, updateState] = useUpdateAnnouncementAdminMutation();
  const [remove, removeState] = useDeleteAnnouncementAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, patch: { is_active: !current } }).unwrap();
      toast.success(t('messages.statusUpdated'));
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.deleteConfirm'))) return;
    try {
      await remove(id).unwrap();
      toast.success(t('messages.deleted'));
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const busy = query.isFetching || updateState.isLoading || removeState.isLoading;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('header.description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => query.refetch()} 
            disabled={busy}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn("mr-2 size-4", query.isFetching && "animate-spin")} />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
          <Button size="sm" asChild className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-10 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95">
            <Link href="/admin/announcements/new">
              <Plus className="mr-2 size-4" />
              {t('actions.create')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted w-32">{t('table.active')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.audience')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.titleContent')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.dateRange')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8 text-center"><Skeleton className="h-6 w-10 mx-auto rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-10 w-64 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-40 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : query.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                      <Megaphone className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">{t('table.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Switch 
                          checked={item.is_active} 
                          onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                          className="data-[state=checked]:bg-gm-gold"
                          disabled={busy}
                        />
                        <span className="text-[8px] font-bold tracking-widest uppercase opacity-40">
                          {item.is_active ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all shadow-sm",
                        item.audience === 'all' ? "bg-gm-gold/5 border-gm-gold/20 text-gm-gold" :
                        item.audience === 'users' ? "bg-gm-primary/5 border-gm-primary/20 text-gm-primary" :
                        "bg-gm-success/5 border-gm-success/20 text-gm-success"
                      )}>
                        {item.audience === 'all' && <Users className="size-3.5" />}
                        {item.audience === 'users' && <User className="size-3.5" />}
                        {item.audience === 'consultants' && <Star className="size-3.5" />}
                        {t(`audience.${item.audience}`)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="max-w-md font-serif text-xl text-gm-text group-hover:text-gm-primary transition-colors duration-500">
                        {item.title}
                      </div>
                      <div className="max-w-md text-sm text-gm-muted font-serif italic opacity-60 leading-relaxed mt-1 truncate">
                        {item.body}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-3 text-[10px] text-gm-muted font-mono opacity-80">
                        <div className="flex items-center gap-1.5">
                          <Eye className="size-3 text-gm-gold/60" />
                          {item.starts_at ? format(new Date(item.starts_at), 'dd MMM yyyy', { locale: tr }) : '-'}
                        </div>
                        <ChevronRight className="size-3 opacity-20" />
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="size-3 text-gm-error/60" />
                          {item.ends_at ? format(new Date(item.ends_at), 'dd MMM yyyy', { locale: tr }) : '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <Button asChild size="sm" variant="ghost" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold px-8 h-10 text-[10px] font-bold tracking-widest uppercase">
                          <Link href={`/admin/announcements/${item.id}`}>
                            <Pencil className="mr-2 size-4" />
                            {t('admin.common.edit', null, 'Düzenle')}
                          </Link>
                        </Button>
                        <button 
                          className="p-2.5 rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all border border-transparent hover:border-gm-error/20 shadow-sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={busy}
                        >
                          <Trash2 className="size-4" />
                        </button>
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
