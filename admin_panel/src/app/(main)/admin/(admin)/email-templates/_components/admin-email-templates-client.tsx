'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/email-templates/admin-email-templates-client.tsx
// FINAL — Admin Email Templates List (App Router + shadcn)
// - Modern UI with shadcn/ui components
// - Tailwind CSS with dark mode support
// - RTK Query hooks
// - Locale support
// - Template key & variables display
// =============================================================

import * as React from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Code2, Loader2, Mail, Pencil, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteEmailTemplateAdminMutation,
  useListEmailTemplatesAdminQuery,
  useUpdateEmailTemplateAdminMutation,
} from '@/integrations/hooks';
import type {
  EmailTemplateAdminListItemDto,
  EmailTemplateAdminListQueryParams,
} from '@/integrations/shared';
import { cn } from '@/lib/utils';

import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

type ActiveFilter = 'all' | 'active' | 'inactive';

type Filters = {
  search: string;
  activeFilter: ActiveFilter;
  locale: string;
};

function fmtDate(val: string | Date | null | undefined, locale?: string) {
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
  const err = e as {
    data?: { error?: { message?: unknown }; message?: unknown };
    message?: unknown;
  };

  const candidates = [err?.data?.error?.message, err?.data?.message, err?.message];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item;
  }
  return fallback;
}

export default function AdminEmailTemplatesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAdminT('admin.emailTemplates');

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const urlLocale = searchParams.get('locale') || '';
  const initialLocale =
    urlLocale ||
    defaultLocaleFromDb ||
    localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de', 'de') ||
    '';

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    activeFilter: 'all',
    locale: initialLocale,
  });

  React.useEffect(() => {
    if (localesLoading) return;
    setFilters((prev) => {
      const nextLocale = coerceLocale(prev.locale, defaultLocaleFromDb);
      if (nextLocale === prev.locale) return prev;
      return { ...prev, locale: nextLocale };
    });
  }, [coerceLocale, defaultLocaleFromDb, localesLoading]);

  // Update URL when locale changes
  React.useEffect(() => {
    if (!filters.locale) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', filters.locale);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters.locale, router, searchParams]);

  // Build query params
  const queryParams = React.useMemo((): EmailTemplateAdminListQueryParams => {
    // ✅ Sadece locale normalize et
    const apiLocale = localeShortClient(filters.locale);

    return {
      q: filters.search || undefined,
      is_active:
        filters.activeFilter === 'active'
          ? true
          : filters.activeFilter === 'inactive'
            ? false
            : undefined,
      locale: apiLocale,
      order_by: 'updated_at',
      order_dir: 'desc',
    };
  }, [filters]);

  // RTK Query
  const {
    data: items = [],
    isLoading,
    isFetching,
    refetch,
  } = useListEmailTemplatesAdminQuery(queryParams);

  const [updateTemplate] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate] = useDeleteEmailTemplateAdminMutation();

  const total = items.length;
  const dateLocale = localeShortClient(filters.locale) || undefined;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<EmailTemplateAdminListItemDto | null>(
    null,
  );

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleActiveFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, activeFilter: value as ActiveFilter }));
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFilters((prev) => ({ ...prev, locale: coerced }));
  };

  const handleToggleActive = async (item: EmailTemplateAdminListItemDto) => {
    try {
      await updateTemplate({
        id: item.id,
        body: { is_active: !item.is_active },
      }).unwrap();
      toast.success(
        item.is_active
          ? t('list.toast.deactivated')
          : t('list.toast.activated'),
      );
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('common.operationFailed')));
    }
  };

  const handleEdit = (item: EmailTemplateAdminListItemDto) => {
    router.push(`/admin/email-templates/${item.id}`);
  };

  const handleDeleteClick = (item: EmailTemplateAdminListItemDto) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTemplate({ id: itemToDelete.id }).unwrap();
      toast.success(t('list.toast.deleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err, t('common.operationFailed')));
    }
  };

  const busy = isLoading;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>{t('list.title')}</CardTitle>
                <CardDescription>{t('list.description')}</CardDescription>
              </div>
              <Button
                onClick={() => router.push('/admin/email-templates/new')}
                disabled={busy}
                className="gap-2"
              >
                <Plus className="size-4" />
                {t('list.addButton')}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-sm">
                  {t('list.filters.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('list.filters.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Active Filter */}
              <div className="space-y-2">
                <Label htmlFor="activeFilter" className="text-sm">
                  {t('list.filters.statusLabel')}
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
                    <SelectItem value="all">
                      {t('list.filters.statusOptions.all')}
                    </SelectItem>
                    <SelectItem value="active">
                      {t('list.filters.statusOptions.active')}
                    </SelectItem>
                    <SelectItem value="inactive">
                      {t('list.filters.statusOptions.inactive')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Locale */}
              <div>
                <AdminLocaleSelect
                  value={filters.locale}
                  onChange={handleLocaleChange}
                  options={localeOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Refresh */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {t('list.totalRecords', { count: total })}
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={busy} className="gap-2">
                <RefreshCcw className={cn('size-4', isFetching && 'animate-spin')} />
                {t('list.refreshButton')}
              </Button>
            </div>

            {isFetching && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>{t('list.fetching')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table (Desktop) */}
        <Card className="hidden xl:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.table.headers.templateKey')}</TableHead>
                  <TableHead>{t('list.table.headers.nameSubject')}</TableHead>
                  <TableHead className="w-48">
                    {t('list.table.headers.variables')}
                  </TableHead>
                  <TableHead className="w-24 text-center">
                    {t('list.table.headers.active')}
                  </TableHead>
                  <TableHead className="w-32">
                    {t('list.table.headers.locale')}
                  </TableHead>
                  <TableHead className="w-44">
                    {t('list.table.headers.date')}
                  </TableHead>
                  <TableHead className="w-40 text-right">
                    {t('list.table.headers.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" />
                        <span>{t('list.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('list.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={`${item.id}-${item.template_key}-${item.locale}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Code2 className="size-4 text-muted-foreground" />
                          <code className="rounded bg-muted px-2 py-1 text-xs font-medium">
                            {item.template_key || '-'}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.template_name || '-'}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            <span>{truncate(item.subject, 40)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.detected_variables && item.detected_variables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.detected_variables.slice(0, 3).map((v) => (
                              <Badge key={v} variant="secondary" className="text-[10px]">
                                {v}
                              </Badge>
                            ))}
                            {item.detected_variables.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{item.detected_variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                          disabled={busy}
                        />
                      </TableCell>
                      <TableCell>
                        {item.locale ? (
                          <Badge variant="outline">{item.locale}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{fmtDate(item.created_at, dateLocale)}</div>
                        <div className="text-[10px]">
                          {t('list.table.updatedLabel')}:{' '}
                          {fmtDate(item.updated_at, dateLocale)}
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
                            {t('list.actions.edit')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={busy}
                            className="gap-2"
                          >
                            <Trash2 className="size-3.5" />
                            {t('list.actions.delete')}
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

        {/* Cards (Mobile) */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('list.loading')}</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('list.empty')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-4 pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="size-4 text-muted-foreground" />
                        <code className="rounded bg-muted px-2 py-1 text-xs font-medium">
                          {item.template_key || '-'}
                        </code>
                      </div>
                      {item.locale && <Badge variant="outline">{item.locale}</Badge>}
                      <h3 className="font-semibold">{item.template_name || '-'}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span>{truncate(item.subject, 50)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">
                        {t('list.mobile.activeLabel')}
                      </Label>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  {/* Variables */}
                  {item.detected_variables && item.detected_variables.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {t('list.mobile.variablesLabel')}
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {item.detected_variables.map((v) => (
                          <Badge key={v} variant="secondary" className="text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      {t('list.mobile.createdLabel')}:{' '}
                      {fmtDate(item.created_at, dateLocale)}
                    </div>
                    <div>
                      {t('list.mobile.updatedLabel')}:{' '}
                      {fmtDate(item.updated_at, dateLocale)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Pencil className="size-3.5" />
                      {t('list.actions.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={busy}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="size-3.5" />
                      {t('list.actions.delete')}
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
            <AlertDialogTitle>{t('list.dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.dialog.description', {
                template:
                  itemToDelete?.template_key ||
                  t('list.dialog.templateFallback'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('list.dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('list.dialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
