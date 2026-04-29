'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminReviewDto, AdminReviewListQueryParams } from '@/integrations/shared';
import {
  useListReviewsAdminQuery,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
  useBulkModerateReviewsAdminMutation,
} from '@/integrations/hooks';

function RatingStars({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < stars ? 'fill-gm-gold text-gm-gold' : 'text-gm-muted opacity-20',
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsClient() {
  const router = useRouter();
  const t = useAdminT('admin.reviews');

  const { localeOptions, loading: localesLoading } = useAdminLocales();

  const safeLocaleOptions = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  type StatusFilter = 'all' | 'pending' | 'approved' | 'auto_flagged' | 'verified' | 'with_outcome';

  const [filters, setFilters] = React.useState({
    search: '',
    statusFilter: 'all' as StatusFilter,
    minRating: '',
    maxRating: '',
    locale: 'tr',
  });

  const queryParams = React.useMemo((): AdminReviewListQueryParams => {
    const base: AdminReviewListQueryParams = {
      search: filters.search || undefined,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
      maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
      locale: filters.locale,
      orderBy: 'created_at',
      order: 'desc',
    };
    switch (filters.statusFilter) {
      case 'pending':       base.approved = false; break;
      case 'approved':      base.approved = true; break;
      case 'auto_flagged':  base.auto_flagged = true; break;
      case 'verified':      base.verified = true; break;
      case 'with_outcome':  base.has_outcome = true; break;
    }
    return base;
  }, [filters]);

  const { data: result, isLoading, isFetching, refetch } = useListReviewsAdminQuery(queryParams);
  const [updateReview] = useUpdateReviewAdminMutation();
  const [deleteReview] = useDeleteReviewAdminMutation();
  const [bulkModerate, { isLoading: isBulking }] = useBulkModerateReviewsAdminMutation();

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const toggleSelected = React.useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const [reportDialog, setReportDialog] = React.useState<{ open: boolean; review: AdminReviewDto | null }>({
    open: false,
    review: null,
  });

  const items = result?.items || [];
  const total = result?.total || 0;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<AdminReviewDto | null>(null);

  const handleToggleActive = async (item: AdminReviewDto) => {
    try {
      await updateReview({ id: item.id, patch: { is_active: !item.is_active } }).unwrap();
      toast.success(item.is_active ? t('messages.deactivated') : t('messages.activated'));
      refetch();
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const handleToggleApproved = async (item: AdminReviewDto) => {
    try {
      await updateReview({ id: item.id, patch: { is_approved: !item.is_approved } }).unwrap();
      toast.success(item.is_approved ? t('messages.approvalRemoved') : t('messages.approved'));
      refetch();
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const handleBulkModerate = async (approved: boolean) => {
    if (selected.size === 0) return;
    try {
      const res = await bulkModerate({ ids: [...selected], approved }).unwrap();
      toast.success(t('bulk.success', { count: res.updated, action: approved ? t('messages.approved') : t('messages.approvalRemoved') }));
      setSelected(new Set());
      refetch();
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const allOnPageChecked = items.length > 0 && items.every((i) => selected.has(i.id));
  const someOnPageChecked = items.some((i) => selected.has(i.id));

  const togglePageSelection = () => {
    if (allOnPageChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        items.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        items.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const busy = isLoading || isFetching || isBulking;

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

        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn("mr-2 size-4", busy && "animate-spin")} />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
          <Button asChild size="sm" className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-10 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-gold/20 transition-all active:scale-95">
            <Link href="/admin/reviews/new">
              <Plus className="mr-2 size-4" />
              {t('actions.createManual')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-end">
          <div className="space-y-3 md:col-span-2">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
              {t('filters.searchLabel')}
            </Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder={t('filters.searchPlaceholder')}
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">
              {t('filters.statusLabel')}
            </Label>
            <Select
              value={filters.statusFilter}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, statusFilter: v as StatusFilter }))}
            >
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                {(['all', 'pending', 'approved', 'auto_flagged', 'verified', 'with_outcome'] as StatusFilter[]).map(key => (
                  <SelectItem key={key} value={key}>{t(`filters.statusOptions.${key}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">
              {t('filters.ratingLabel')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={5}
                value={filters.minRating}
                onChange={e => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
                placeholder="Min"
                className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-center focus:ring-gm-gold/50 text-sm"
              />
              <span className="opacity-30 text-gm-muted">/</span>
              <Input
                type="number"
                min={1}
                max={5}
                value={filters.maxRating}
                onChange={e => setFilters(prev => ({ ...prev, maxRating: e.target.value }))}
                placeholder="Max"
                className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-center focus:ring-gm-gold/50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">
              {t('filters.localeLabel')}
            </Label>
            <Select value={filters.locale} onValueChange={v => setFilters(prev => ({ ...prev, locale: v }))}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                {safeLocaleOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <Card className="bg-gm-primary/5 border-gm-primary/20 rounded-[24px] overflow-hidden animate-in slide-in-from-top-4 shadow-2xl backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-8">
            <div className="text-sm font-serif italic text-gm-text/80">
              <span className="text-gm-gold font-bold text-lg mr-2">{selected.size}</span> 
              {t('bulk.selectedCount', { count: selected.size })}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="ghost"
                className="rounded-full h-10 px-8 text-[10px] font-bold tracking-widest uppercase hover:bg-gm-surface"
                onClick={() => setSelected(new Set())}
                disabled={busy}
              >
                {t('actions.clearSelection')}
              </Button>
              <Button
                onClick={() => handleBulkModerate(false)}
                disabled={busy}
                className="bg-gm-error text-white hover:bg-gm-error/90 rounded-full px-8 h-10 text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-gm-error/20"
              >
                <XCircle className="size-4 mr-2" />
                {t('actions.bulkModerateReject')}
              </Button>
              <Button
                onClick={() => handleBulkModerate(true)}
                disabled={busy}
                className="bg-gm-success text-white hover:bg-gm-success/90 rounded-full px-8 h-10 text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-gm-success/20"
              >
                <CheckCircle2 className="size-4 mr-2" />
                {t('actions.bulkModerateApprove')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-6 w-12 text-center">
                  <Checkbox
                    checked={allOnPageChecked ? true : (someOnPageChecked ? 'indeterminate' : false)}
                    onCheckedChange={togglePageSelection}
                    className="border-gm-border-soft data-[state=checked]:bg-gm-gold data-[state=checked]:border-gm-gold"
                  />
                </TableHead>
                <TableHead className="py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-center w-24 text-gm-muted">
                  {t('table.approval')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {t('table.user')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">
                  {t('table.rating')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {t('table.comment')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">
                  {t('table.date')}
                </TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {t('table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6"><Skeleton className="h-5 w-5 mx-auto rounded bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-8 mx-auto rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-10 w-40 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-20 mx-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-12 w-64 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-24 mx-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                      <MessageSquare className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">{t('table.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-6 text-center">
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelected(item.id)}
                        className="border-gm-border-soft data-[state=checked]:bg-gm-gold data-[state=checked]:border-gm-gold"
                      />
                    </TableCell>
                    <TableCell className="py-6 px-4 text-center">
                      <button
                        className="p-2 rounded-full transition-all hover:bg-gm-surface-high disabled:opacity-50"
                        onClick={() => handleToggleApproved(item)}
                        disabled={busy}
                      >
                        {item.is_approved ? (
                          <CheckCircle2 className="size-6 text-gm-success shadow-lg shadow-gm-success/20" />
                        ) : (
                          <XCircle className="size-6 text-gm-muted opacity-20 hover:opacity-50" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-serif text-lg text-gm-text group-hover:text-gm-primary transition-colors">
                          {item.name || t('table.unknownUser')}
                        </span>
                        <span className="text-[10px] text-gm-muted font-mono opacity-50 tracking-tighter">
                          {item.email || t('table.noEmail')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <RatingStars rating={item.rating} />
                        <span className="font-mono text-[11px] text-gm-gold font-bold tracking-widest">{item.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-start gap-3">
                        <MessageSquare size={14} className="mt-1 text-gm-gold shrink-0 opacity-40" />
                        <p className="text-sm font-serif italic text-gm-text/90 leading-relaxed max-w-md line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                          "{item.comment}"
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(item.is_verified || Number((item as any).is_verified) === 1) && (
                          <Badge variant="outline" className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gm-success/5 border-gm-success/20 text-gm-success text-[9px] font-bold tracking-[0.15em] uppercase">
                            <ShieldCheck size={10} /> {t('table.verified')}
                          </Badge>
                        )}
                        {item.moderation_flags && item.moderation_flags.safe === false && (
                          <button
                            type="button"
                            onClick={() => setReportDialog({ open: true, review: item })}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gm-error/5 border border-gm-error/30 text-gm-error text-[9px] font-bold tracking-[0.15em] uppercase hover:bg-gm-error/10 transition-all shadow-sm"
                          >
                            <ShieldAlert size={10} /> {t('table.autoFlagged')}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-gm-muted font-mono flex items-center justify-center gap-2 opacity-70">
                        <Calendar size={12} className="text-gm-gold/60" />
                        {item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy', { locale: tr }) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                          className="data-[state=checked]:bg-gm-gold"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-all"
                          onClick={() => router.push(`/admin/reviews/${item.id}`)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 hover:text-gm-error transition-all"
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
        <AlertDialogContent className="bg-gm-bg-deep border-gm-border-soft rounded-[32px] p-10 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-3xl text-gm-text">{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription className="font-serif italic text-lg pt-4 text-gm-muted leading-relaxed">
              {t('dialogs.delete.description', { name: itemToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-10">
            <AlertDialogCancel className="rounded-full px-10 h-12 border-gm-border-soft text-[10px] font-bold tracking-widest uppercase hover:bg-gm-surface">
              {t('dialogs.delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (itemToDelete) {
                  await deleteReview({ id: itemToDelete.id }).unwrap();
                  toast.success(t('messages.deleted'));
                  refetch();
                }
              }}
              className="bg-gm-error text-white hover:bg-gm-error/90 rounded-full px-12 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-error/20 transition-all active:scale-95"
            >
              {t('dialogs.delete.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Moderation report dialog */}
      <Dialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog({ open, review: open ? reportDialog.review : null })}
      >
        <DialogContent className="bg-gm-bg-deep border-gm-border-soft rounded-[40px] max-w-2xl p-0 overflow-hidden backdrop-blur-2xl shadow-2xl border-gm-gold/10">
          <div className="p-10 space-y-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl flex items-center gap-4 text-gm-text">
                <div className="size-14 rounded-full bg-gm-error/10 flex items-center justify-center text-gm-error shadow-inner border border-gm-error/20">
                  <ClipboardList className="size-6" />
                </div>
                {t('dialogs.report.title')}
              </DialogTitle>
              <DialogDescription className="text-lg text-gm-muted pt-4 font-serif italic leading-relaxed opacity-80">
                {t('dialogs.report.description')}
              </DialogDescription>
            </DialogHeader>

            {reportDialog.review?.moderation_flags ? (
              <div className="space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gm-muted ml-1">
                      {t('dialogs.report.triggeredFlags')}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(reportDialog.review.moderation_flags.flags ?? []).length > 0 ? (
                        (reportDialog.review.moderation_flags.flags ?? []).map((f, i) => (
                          <Badge key={`${f}-${i}`} variant="outline" className="border-gm-error/30 bg-gm-error/5 text-gm-error uppercase tracking-widest text-[9px] font-bold px-4 py-2 rounded-full">
                            <AlertTriangle size={10} className="mr-2" /> {f}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gm-muted italic opacity-50">{t('dialogs.report.flags.generic')}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-right">
                    <Label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gm-muted mr-1">
                      {t('dialogs.report.checkTime')}
                    </Label>
                    <div className="font-mono text-[11px] text-gm-muted bg-gm-surface/40 border border-gm-border-soft px-4 py-2 rounded-full inline-flex items-center gap-2">
                      <Calendar size={12} className="opacity-50" />
                      {reportDialog.review.moderation_flags.checked_at
                        ? format(new Date(String(reportDialog.review.moderation_flags.checked_at)), 'dd.MM.yyyy HH:mm', { locale: tr })
                        : '—'}
                    </div>
                  </div>
                </div>

                {(reportDialog.review.moderation_flags.matched_patterns ?? []).length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gm-muted ml-1">
                      {t('dialogs.report.matchedPatterns')}
                    </Label>
                    <div className="bg-gm-bg-deep/50 border border-gm-border-soft rounded-[24px] p-6 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gm-gold/20">
                      <ul className="space-y-3">
                        {(reportDialog.review.moderation_flags.matched_patterns ?? []).map((p, i) => (
                          <li key={`${p}-${i}`} className="text-sm font-mono text-gm-muted/80 flex gap-3 leading-relaxed">
                            <span className="text-gm-gold mt-1">•</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="rounded-full px-10 h-12 border-gm-border-soft text-[10px] font-bold tracking-widest uppercase hover:bg-gm-surface"
                    onClick={() => setReportDialog({ open: false, review: null })}
                  >
                    {t('dialogs.report.close')}
                  </Button>
                  <Button
                    className="bg-gm-success text-white hover:bg-gm-success/90 rounded-full px-12 h-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-success/20 transition-all active:scale-95"
                    onClick={async () => {
                      if (!reportDialog.review) return;
                      await updateReview({ id: reportDialog.review.id, patch: { is_approved: true } }).unwrap();
                      toast.success(t('messages.approved'));
                      setReportDialog({ open: false, review: null });
                      refetch();
                    }}
                    disabled={busy || !reportDialog.review}
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    {t('actions.saveAndApprove')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-lg text-gm-muted italic py-16 text-center font-serif opacity-50">
                {t('dialogs.report.empty')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
