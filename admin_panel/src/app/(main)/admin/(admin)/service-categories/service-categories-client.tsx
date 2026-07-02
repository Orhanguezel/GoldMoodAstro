'use client';

import * as React from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useListServiceCategoriesAdminQuery,
  useCreateServiceCategoryAdminMutation,
  useUpdateServiceCategoryAdminMutation,
  useDeleteServiceCategoryAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import type { ServiceCategoryDto, ServiceI18nMap } from '@/integrations/shared';

const FALLBACK_LOCALES = ['tr', 'en', 'de'];

function blankI18n(locales: string[]): ServiceI18nMap {
  return Object.fromEntries(locales.map((locale) => [locale, { name: '', description: '' }]));
}

function normalizeI18n(item: ServiceCategoryDto | null, locales: string[]): ServiceI18nMap {
  const base = blankI18n(locales);
  const source = item?.i18n ?? {};
  for (const locale of locales) {
    const row = source[locale];
    base[locale] = {
      name: row?.name ?? (locale === 'tr' ? item?.name ?? '' : ''),
      description: row?.description ?? (locale === 'tr' ? item?.description ?? '' : ''),
    };
  }
  return base;
}

function cleanI18n(map: ServiceI18nMap): ServiceI18nMap {
  return Object.fromEntries(
    Object.entries(map)
      .map(([locale, row]) => [
        locale,
        { name: row.name.trim(), description: row.description?.trim() || null },
      ])
      .filter(([, row]) => Boolean((row as { name: string }).name)),
  ) as ServiceI18nMap;
}

export default function ServiceCategoriesClient() {
  const t = useAdminT('admin.services');
  const { data: categories = [], isLoading, isFetching, refetch } = useListServiceCategoriesAdminQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateServiceCategoryAdminMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateServiceCategoryAdminMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteServiceCategoryAdminMutation();
  const {
    localeOptions,
    activeLocaleCodes,
    defaultLocaleFromDb,
    loading: localesLoading,
    coerceLocale,
  } = useAdminLocales();
  const formLocales = activeLocaleCodes.length ? activeLocaleCodes : FALLBACK_LOCALES;
  const defaultLocale = defaultLocaleFromDb || formLocales[0] || 'tr';

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ServiceCategoryDto | null>(null);
  const [selectedLocale, setSelectedLocale] = React.useState(defaultLocale);

  // Form states
  const [slug, setSlug] = React.useState('');
  const [i18n, setI18n] = React.useState<ServiceI18nMap>(() => blankI18n(formLocales));
  const [icon, setIcon] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    setSelectedLocale((prev) => coerceLocale(prev, defaultLocale));
  }, [coerceLocale, defaultLocale]);

  React.useEffect(() => {
    if (editingCategory && formOpen) {
      setSlug(editingCategory.slug || '');
      setI18n(normalizeI18n(editingCategory, formLocales));
      setIcon(editingCategory.icon || '');
      setSortOrder(editingCategory.sort_order || 0);
      setIsActive(editingCategory.is_active ?? true);
    } else {
      setSlug('');
      setI18n(blankI18n(formLocales));
      setIcon('');
      setSortOrder(0);
      setIsActive(true);
    }
  }, [editingCategory, formOpen, formLocales.join('|')]);

  const currentText = i18n[selectedLocale] ?? { name: '', description: '' };
  const setLocaleText = (patch: Partial<{ name: string; description: string }>) => {
    setI18n((prev) => ({
      ...prev,
      [selectedLocale]: {
        name: patch.name ?? prev[selectedLocale]?.name ?? '',
        description: patch.description ?? prev[selectedLocale]?.description ?? '',
      },
    }));
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (category: ServiceCategoryDto) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextI18n = cleanI18n(i18n);
    const baseText = nextI18n[defaultLocale] ?? nextI18n.tr ?? Object.values(nextI18n)[0];
    if (!slug.trim() || !baseText?.name?.trim()) {
      toast.error(t('categories.toast.slugNameRequired'));
      return;
    }

    const payload = {
      slug: slug.trim(),
      name: baseText.name.trim(),
      description: baseText.description?.trim() || null,
      icon: icon.trim() || null,
      sort_order: Number(sortOrder),
      is_active: isActive ? 1 : 0,
      i18n: nextI18n,
    };

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, patch: payload }).unwrap();
        toast.success(t('categories.toast.updated'));
      } else {
        await createCategory(payload).unwrap();
        toast.success(t('categories.toast.created'));
      }
      setFormOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      const message = err?.data?.error?.message || t('categories.toast.error');
      toast.error(message);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    const ok = window.confirm(t('categories.toast.deleteConfirm', { name: catName }));
    if (!ok) return;

    try {
      await deleteCategory({ id }).unwrap();
      toast.success(t('categories.toast.deleted'));
    } catch (err: any) {
      if (err?.status === 409 || err?.data?.error?.code === 'category_has_templates') {
        toast.error(t('categories.toast.hasTemplates'));
      } else {
        toast.error(err?.data?.error?.message || t('categories.toast.deleteError'));
      }
    }
  };

  const busy = isLoading || isFetching || isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('categories.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text text-foreground">{t('categories.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('categories.description')}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
            {t('categories.refresh')}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="rounded-full bg-gm-gold text-white px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:opacity-90 shadow-lg"
          >
            <Plus className="mr-2 size-4" />
            {t('categories.newButton')}
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.category')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.slug')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.icon')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.order')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.status')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('categories.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-12 w-48 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-32 bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-12 bg-gm-surface/20 rounded-lg" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-12 bg-gm-surface/20 rounded-lg" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-24 bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <FolderTree className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">
                        {t('categories.empty')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div>
                        <div className="font-serif text-xl text-gm-text text-foreground">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gm-muted max-w-xs truncate mt-1">{item.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm font-mono text-gm-muted">{item.slug}</TableCell>
                    <TableCell className="py-6 text-sm font-mono text-gm-muted">
                      {item.icon ? (
                        <span className="px-2 py-1 bg-gm-surface/40 border border-gm-border-soft rounded text-xs">{item.icon}</span>
                      ) : (
                        <span className="text-gm-muted/40">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-6 text-sm font-bold text-gm-gold">{item.sort_order}</TableCell>
                    <TableCell className="py-6">
                      <div className={cn(
                        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all',
                        item.is_active ? 'bg-gm-success/5 border-gm-success/20 text-gm-success' : 'bg-gm-error/5 border-gm-error/20 text-gm-error'
                      )}>
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full animate-pulse',
                          item.is_active ? 'bg-gm-success' : 'bg-gm-error'
                        )} />
                        {item.is_active ? t('categories.active') : t('categories.inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all"
                          onClick={() => handleDelete(item.id, item.name)}
                        >
                          <Trash2 className="size-5" />
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

      {formOpen && (
        <Card className="border-gm-border-soft bg-gm-bg-deep/80 text-gm-text text-foreground shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-serif text-2xl">
                  {editingCategory ? t('categories.dialog.editTitle') : t('categories.dialog.createTitle')}
                </h2>
                <p className="text-sm text-gm-muted">{t('categories.dialog.description')}</p>
              </div>
              <AdminLocaleSelect
                value={selectedLocale}
                onChange={(locale) => setSelectedLocale(coerceLocale(locale, defaultLocale))}
                options={localeOptions.length ? localeOptions : formLocales.map((locale) => ({ value: locale, label: locale.toUpperCase() }))}
                loading={localesLoading}
                className="border-gm-border-soft bg-gm-surface/40"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('categories.field.name')}</Label>
                  <Input
                    id="name"
                    value={currentText.name}
                    onChange={(e) => setLocaleText({ name: e.target.value })}
                    placeholder={t('categories.field.namePlaceholder')}
                    className="border-gm-border-soft bg-gm-surface/40"
                    required={selectedLocale === defaultLocale}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('categories.field.slug')}</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={t('categories.field.slugPlaceholder')}
                    className="border-gm-border-soft bg-gm-surface/40"
                    required
                    disabled={!!editingCategory}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('categories.field.description')}</Label>
                  <Textarea
                    id="description"
                    value={currentText.description ?? ''}
                    onChange={(e) => setLocaleText({ description: e.target.value })}
                    placeholder={t('categories.field.descriptionPlaceholder')}
                    className="border-gm-border-soft bg-gm-surface/40"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('categories.field.icon')}</Label>
                    <Input
                      id="icon"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder={t('categories.field.iconPlaceholder')}
                      className="border-gm-border-soft bg-gm-surface/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortOrder" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('categories.field.sortOrder')}</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      placeholder="0"
                      className="border-gm-border-soft bg-gm-surface/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-gm-border-soft bg-gm-surface/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold uppercase tracking-widest text-gm-text text-foreground">{t('categories.field.isActive')}</Label>
                    <p className="text-xs text-gm-muted">{t('categories.field.isActiveHelp')}</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => { setFormOpen(false); setEditingCategory(null); }}>
                  {t('categories.cancel')}
                </Button>
                <Button type="submit" disabled={busy} className="bg-gm-gold text-white px-6">
                  {t('categories.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
