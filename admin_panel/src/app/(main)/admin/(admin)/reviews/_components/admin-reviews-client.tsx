'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/reviews/admin-reviews-client.tsx
// FINAL — Admin Reviews List (App Router + shadcn)
// ✅ FULLY FIXED - Type safety issues resolved
// ✅ FIXED - resolveAdminApiLocale usage corrected
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

type ApprovedFilter = 'all' | 'approved' | 'unapproved';
type ActiveFilter = 'all' | 'active' | 'inactive';

type Filters = {
  search: string;
  approvedFilter: ApprovedFilter;
  activeFilter: ActiveFilter;
  minRating: string;
  maxRating: string;
  locale: string;
};

function fmtDate(val: string | null | undefined, locale?: string) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max = 60) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

function getErrMsg(e: unknown, fallback: string): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || fallback;
}

function RatingStars({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
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
  const adminUiLocale = usePreferencesStore((s) => s.adminLocale);

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  // ✅ FIX: Ensure localeOptions has correct type
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const urlLocale = localeShortClient(searchParams.get('locale') || '');
  const initialLocale =
    urlLocale ||
    defaultLocaleFromDb ||
    localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de');

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    approvedFilter: 'all',
    activeFilter: 'all',
    minRating: '',
    maxRating: '',
    locale: initialLocale,
  });

  // Update URL when locale changes
  React.useEffect(() => {
    const next = localeShortClient(filters.locale);
    if (!next) return;
    const cur = localeShortClient(searchParams.get('locale') || '');
    if (cur === next) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters.locale, router, searchParams]);

  // Build query params
  const queryParams = React.useMemo((): AdminReviewListQueryParams => {
    // ✅ FIXED: Correct usage of resolveAdminApiLocale with all parameters
    const apiLocale =
      localeShortClient(filters.locale) ||
      resolveAdminApiLocale(localeOptions, defaultLocaleFromDb, 'de');

    return {
      search: filters.search || undefined,
      approved:
        filters.approvedFilter === 'approved'
          ? true
          : filters.approvedFilter === 'unapproved'
            ? false
            : undefined,
      active:
        filters.activeFilter === 'active'
          ? true
          : filters.activeFilter === 'inactive'
            ? false
            : undefined,
      minRating: filters.minRating ? Number(filters.minRating) : undefined,
      maxRating: filters.maxRating ? Number(filters.maxRating) : undefined,
      locale: apiLocale,
      orderBy: 'created_at',
      order: 'desc',
    };
  }, [filters, localeOptions, defaultLocaleFromDb]);

  // RTK Query
  const { data: result, isLoading, isFetching, refetch } = useListReviewsAdminQuery(queryParams);

  const [updateReview] = useUpdateReviewAdminMutation();
  const [deleteReview] = useDeleteReviewAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<AdminReviewDto | null>(null);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleApprovedFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, approvedFilter: value as ApprovedFilter }));
  };

  const handleActiveFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, activeFilter: value as ActiveFilter }));
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFilters((prev) => ({ ...prev, locale: coerced }));
  };

  const handleToggleActive = async (item: AdminReviewDto) => {
    try {
      await updateReview({
        id: item.id,
        patch: { is_active: !item.is_active },
      }).unwrap();
      toast.success(item.is_active ? t('messages.deactivated') : t('messages.activated'));
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.genericError')));
    }
  };

  const handleToggleApproved = async (item: AdminReviewDto) => {
    try {
      await updateReview({
        id: item.id,
        patch: { is_approved: !item.is_approved },
      }).unwrap();
      toast.success(item.is_approved ? t('messages.approvalRemoved') : t('messages.approved'));
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.genericError')));
    }
  };

  const handleEdit = (item: AdminReviewDto) => {
    router.push(`/admin/reviews/${item.id}`);
  };

  const handleDeleteClick = (item: AdminReviewDto) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteReview({ id: itemToDelete.id }).unwrap();
      toast.success(t('messages.deleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.genericError')));
    }
  };

  const busy = isLoading || isFetching;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>{t('header.title')}</CardTitle>
                <CardDescription>{t('header.description')}</CardDescription>
              </div>
              <Button
                onClick={() => router.push('/admin/reviews/new')}
                disabled={busy}
                className="gap-2"
              >
                <Plus className="size-4" />
                {t('actions.create')}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-sm">
                  {t('filters.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('filters.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Approved Filter */}
              <div className="space-y-2">
                <Label htmlFor="approvedFilter" className="text-sm">
                  {t('filters.approvedLabel')}
                </Label>
                <Select
                  value={filters.approvedFilter}
                  onValueChange={handleApprovedFilterChange}
                  disabled={busy}
                >
                  <SelectTrigger id="approvedFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.options.all')}</SelectItem>
                    <SelectItem value="approved">{t('filters.options.approved')}</SelectItem>
                    <SelectItem value="unapproved">{t('filters.options.unapproved')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filter */}
              <div className="space-y-2">
                <Label htmlFor="activeFilter" className="text-sm">
                  {t('filters.activeLabel')}
                </Label>
                <Select
                  value={filters.activeFilter}
                  onValueChange={handleActiveFilterChange}
                  disabled={busy}
                >
                  <SelectTrigger id="activeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.options.all')}</SelectItem>
                    <SelectItem value="active">{t('filters.options.active')}</SelectItem>
                    <SelectItem value="inactive">{t('filters.options.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating & Locale Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Min Rating */}
              <div className="space-y-2">
                <Label htmlFor="minRating" className="text-sm">
                  {t('filters.minRatingLabel')}
                </Label>
                <Input
                  id="minRating"
                  type="number"
                  min={0}
                  max={5}
                  value={filters.minRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))}
                  placeholder={t('filters.minRatingPlaceholder')}
                  disabled={busy}
                />
              </div>

              {/* Max Rating */}
              <div className="space-y-2">
                <Label htmlFor="maxRating" className="text-sm">
                  {t('filters.maxRatingLabel')}
                </Label>
                <Input
                  id="maxRating"
                  type="number"
                  min={0}
                  max={5}
                  value={filters.maxRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxRating: e.target.value }))}
                  placeholder={t('filters.maxRatingPlaceholder')}
                  disabled={busy}
                />
              </div>

              {/* Locale - ✅ FIXED: Using safeLocaleOptions */}
              <div>
                <AdminLocaleSelect
                  value={filters.locale}
                  onChange={handleLocaleChange}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                  label={t('filters.localeLabel')}
                />
              </div>

              {/* Refresh */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="w-full gap-2"
                >
                  <RefreshCcw className={cn('size-4', isFetching && 'animate-spin')} />
                  {t('admin.common.refresh')}
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{t('summary.total', { total })}</span>
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('admin.common.loading')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table (Desktop) - Same as before */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.columns.nameEmail')}</TableHead>
                  <TableHead className="w-32">{t('table.columns.rating')}</TableHead>
                  <TableHead>{t('table.columns.comment')}</TableHead>
                  <TableHead className="w-24 text-center">{t('table.columns.approved')}</TableHead>
                  <TableHead className="w-24 text-center">{t('table.columns.active')}</TableHead>
                  <TableHead className="w-32">{t('table.columns.locale')}</TableHead>
                  <TableHead className="w-44">{t('table.columns.date')}</TableHead>
                  <TableHead className="w-44 text-right">{t('admin.common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('admin.common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {t('table.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{item.email || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={item.rating} />
                          <span className="text-xs text-muted-foreground">({item.rating})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{truncate(item.comment, 50)}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleApproved(item)}
                          disabled={busy}
                        >
                          {item.is_approved ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell>
                        {item.locale_resolved || item.submitted_locale ? (
                          <Badge variant="outline">
                            {item.locale_resolved || item.submitted_locale}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{fmtDate(item.created_at, adminUiLocale)}</div>
                        <div className="text-[10px]">
                          {t('table.updatedAt')}: {fmtDate(item.updated_at, adminUiLocale)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Pencil className="size-3.5" />
                            {t('admin.common.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            {t('admin.common.delete')}
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

        {/* Cards (Mobile) - Same as before */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('admin.common.loading')}</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('table.empty')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{item.name || '-'}</h3>
                      <p className="text-xs text-muted-foreground">{item.email || '-'}</p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={item.rating} />
                        <span className="text-xs text-muted-foreground">({item.rating})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.locale_resolved || item.submitted_locale ? (
                        <Badge variant="outline">
                          {item.locale_resolved || item.submitted_locale}
                        </Badge>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleApproved(item)}
                          disabled={busy}
                          title={item.is_approved ? t('labels.approved') : t('labels.unapproved')}
                        >
                          {item.is_approved ? (
                            <CheckCircle2 className="size-4 text-green-600" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('labels.comment')}</Label>
                    <p className="text-sm">{truncate(item.comment, 120)}</p>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      {t('labels.createdAt')}: {fmtDate(item.created_at, adminUiLocale)}
                    </div>
                    <div>
                      {t('labels.updatedAt')}: {fmtDate(item.updated_at, adminUiLocale)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Pencil className="size-3.5" />
                      {t('admin.common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="size-3.5" />
                      {t('admin.common.delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {
                name: itemToDelete?.name || t('deleteDialog.fallbackName'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
