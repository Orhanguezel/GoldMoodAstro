'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  Star,
  CheckCircle2,
  XCircle,
  Activity,
  MessageSquare,
  ShieldCheck,
  Calendar
} from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { AdminReviewDto, AdminReviewListQueryParams } from '@/integrations/shared';
import {
  useListReviewsAdminQuery,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} from '@/integrations/hooks';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

function RatingStars({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < stars ? 'fill-[#C9A961] text-[#C9A961]' : 'text-muted-foreground opacity-20',
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAdminT('admin.reviews');

  const { localeOptions, defaultLocaleFromDb, coerceLocale, loading: localesLoading } = useAdminLocales();

  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const [filters, setFilters] = React.useState({
    search: '',
    approvedFilter: 'all',
    activeFilter: 'all',
    minRating: '',
    maxRating: '',
    locale: 'tr',
  });

  const queryParams = React.useMemo((): AdminReviewListQueryParams => ({
    search: filters.search || undefined,
    approved: filters.approvedFilter === 'approved' ? true : filters.approvedFilter === 'unapproved' ? false : undefined,
    active: filters.activeFilter === 'active' ? true : filters.activeFilter === 'inactive' ? false : undefined,
    minRating: filters.minRating ? Number(filters.minRating) : undefined,
    maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
    locale: filters.locale,
    orderBy: 'created_at',
    order: 'desc',
  }), [filters]);

  const { data: result, isLoading, isFetching, refetch } = useListReviewsAdminQuery(queryParams);
  const [updateReview] = useUpdateReviewAdminMutation();
  const [deleteReview] = useDeleteReviewAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<AdminReviewDto | null>(null);

  const handleToggleActive = async (item: AdminReviewDto) => {
    try {
      await updateReview({ id: item.id, patch: { is_active: !item.is_active } }).unwrap();
      toast.success(item.is_active ? 'Görünmez yapıldı' : 'Yayınlandı');
      refetch();
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleToggleApproved = async (item: AdminReviewDto) => {
    try {
      await updateReview({ id: item.id, patch: { is_approved: !item.is_approved } }).unwrap();
      toast.success(item.is_approved ? 'Onay kaldırıldı' : 'Onaylandı');
      refetch();
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const busy = isLoading || isFetching;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Müşteri Deneyimi</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Değerlendirmeler</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Danışman yorumlarını ve puanlarını moderatör gözüyle inceleyin.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={busy}
            className="rounded-full border-border/40 px-6 h-11"
          >
            <RefreshCcw className={`mr-2 size-4 ${busy ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button size="sm" asChild className="bg-[#C9A961] text-[#1A1715] hover:bg-[#C9A961]/90 rounded-full px-8 font-bold tracking-widest uppercase">
            <Link href="/admin/reviews/new">
              <Plus className="mr-2 size-4" />
              MANUEL YORUM
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-end">
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1">Yorum Ara</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="İsim veya yorum içeriği..."
                className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 block text-center">Durum</label>
            <Select value={filters.approvedFilter} onValueChange={v => setFilters(prev => ({ ...prev, approvedFilter: v }))}>
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="approved">Onaylı</SelectItem>
                <SelectItem value="unapproved">Bekleyen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 block text-center">Puan</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={5}
                value={filters.minRating}
                onChange={e => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
                placeholder="Min"
                className="bg-muted/20 border-border/40 rounded-2xl h-12 text-center"
              />
              <span className="opacity-30">/</span>
              <Input
                type="number"
                min={1}
                max={5}
                value={filters.maxRating}
                onChange={e => setFilters(prev => ({ ...prev, maxRating: e.target.value }))}
                placeholder="Max"
                className="bg-muted/20 border-border/40 rounded-2xl h-12 text-center"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 block text-center">Dil</label>
            <Select value={filters.locale} onValueChange={v => setFilters(prev => ({ ...prev, locale: v }))}>
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                {safeLocaleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-center w-24">Onay</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Kullanıcı</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Puan</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Yorum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Tarih</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center font-serif italic text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center font-serif italic text-muted-foreground opacity-30">
                    Henüz yorum bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 px-8 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => handleToggleApproved(item)}
                        disabled={busy}
                      >
                        {item.is_approved ? (
                          <CheckCircle2 className="size-6 text-[#4CAF6E]" />
                        ) : (
                          <XCircle className="size-6 text-muted-foreground opacity-30" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-serif text-lg text-foreground">{item.name || 'İsimsiz'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono opacity-50">{item.email || 'E-posta yok'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <RatingStars rating={item.rating} />
                        <span className="font-mono text-[10px] text-[#C9A961]">{item.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={14} className="mt-1 text-[#C9A961] shrink-0" />
                        <p className="text-sm font-serif italic text-foreground/80 leading-relaxed max-w-md line-clamp-2">
                          "{item.comment}"
                        </p>
                      </div>
                      {Number((item as any).is_verified) === 1 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4CAF6E]/10 border border-[#4CAF6E]/20 text-[#4CAF6E] text-[9px] font-bold tracking-widest uppercase">
                          <ShieldCheck size={10} /> Doğrulanmış Görüşme
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-center gap-2">
                        <Calendar size={12} className="text-[#C9A961]" />
                        {item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy', { locale: tr }) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                          className="data-[state=checked]:bg-[#C9A961]"
                        />
                        <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]">
                          <Link href={`/admin/reviews/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-[#E55B4D]/10 hover:text-[#E55B4D]"
                          onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                          disabled={busy}
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/40 rounded-[32px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-3xl">Yorumu Sil?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif italic text-lg pt-2">
              "{itemToDelete?.name}" tarafından yapılan bu yorum kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="rounded-full px-8">İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (itemToDelete) {
                  await deleteReview({ id: itemToDelete.id }).unwrap();
                  toast.success('Yorum silindi.');
                  refetch();
                }
              }}
              className="bg-[#E55B4D] text-white hover:bg-[#E55B4D]/90 rounded-full px-8 font-bold tracking-widest uppercase"
            >
              SİL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
