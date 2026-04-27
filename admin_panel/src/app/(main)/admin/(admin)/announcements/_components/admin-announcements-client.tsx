'use client';

import * as React from 'react';
import { 
  Megaphone, Plus, RefreshCcw, 
  Trash2, Pencil, Users, User, Star, Calendar, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListAnnouncementsAdminQuery,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
} from '@/integrations/hooks';
import Link from 'next/link';

export default function AdminAnnouncementsClient() {
  const query = useListAnnouncementsAdminQuery();
  const [update] = useUpdateAnnouncementAdminMutation();
  const [remove] = useDeleteAnnouncementAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, patch: { is_active: !current } }).unwrap();
      toast.success('Durum güncellendi.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Duyuru silindi.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Sistem İletişimi</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Duyurular</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Uygulama genelindeki duyuruları ve bildirimleri buradan yönetin.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => query.refetch()} 
            disabled={query.isFetching}
            className="rounded-full border-border/40 px-6"
          >
            <RefreshCcw className={`mr-2 size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button size="sm" asChild className="bg-[#C9A961] text-[#1A1715] hover:bg-[#C9A961]/90 rounded-full px-8 font-bold tracking-widest uppercase">
            <Link href="/admin/announcements/new">
              <Plus className="mr-2 size-4" />
              YENİ DUYURU
            </Link>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest w-24 text-center">Aktif</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Hedef Kitle</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Başlık & İçerik</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Yayın Tarihi</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-serif italic text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : query.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-serif italic text-muted-foreground">
                    <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Henüz duyuru bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 px-8 text-center">
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                        className="data-[state=checked]:bg-[#C9A961]"
                      />
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        item.audience === 'all' ? 'border-[#C9A961]/30 bg-[#C9A961]/5 text-[#C9A961]' :
                        item.audience === 'users' ? 'border-[#7B5EA7]/30 bg-[#7B5EA7]/5 text-[#7B5EA7]' :
                        'border-[#4CAF6E]/30 bg-[#4CAF6E]/5 text-[#4CAF6E]'
                      }`}>
                        {item.audience === 'all' && <Users className="size-3" />}
                        {item.audience === 'users' && <User className="size-3" />}
                        {item.audience === 'consultants' && <Star className="size-3" />}
                        {item.audience === 'all' ? 'HERKES' : item.audience === 'users' ? 'DANIŞANLAR' : 'DANIŞMANLAR'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="font-serif text-lg text-foreground mb-1">{item.title}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground italic font-serif opacity-70">{item.body}</div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <Calendar className="w-3 h-3 text-[#C9A961]" />
                        {item.starts_at ? format(new Date(item.starts_at), 'dd MMM yyyy', { locale: tr }) : '-'}
                        <span className="opacity-30">→</span>
                        {item.ends_at ? format(new Date(item.ends_at), 'dd MMM yyyy', { locale: tr }) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3">
                        <Button asChild size="icon" variant="ghost" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]">
                          <Link href={`/admin/announcements/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" className="rounded-full hover:bg-[#E55B4D]/10 hover:text-[#E55B4D]" onClick={() => handleDelete(item.id)}>
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
