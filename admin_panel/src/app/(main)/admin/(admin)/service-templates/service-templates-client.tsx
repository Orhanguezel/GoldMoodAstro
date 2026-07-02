'use client';

import * as React from 'react';
import {
  AudioLines,
  Edit2,
  Gift,
  Layers,
  Plus,
  RefreshCcw,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateServiceTemplateAdminMutation,
  useDeleteServiceTemplateAdminMutation,
  useListServiceCategoriesAdminQuery,
  useListServiceTemplatesAdminQuery,
  useUpdateServiceTemplateAdminMutation,
} from '@/integrations/hooks';
import type { ServiceI18nMap, ServiceTemplateDto } from '@/integrations/shared';
import { cn } from '@/lib/utils';

const FALLBACK_LOCALES = ['tr', 'en', 'de'];

function blankI18n(locales: string[]): ServiceI18nMap {
  return Object.fromEntries(locales.map((locale) => [locale, { name: '', description: '' }]));
}

function normalizeI18n(item: ServiceTemplateDto | null, locales: string[]): ServiceI18nMap {
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

export default function ServiceTemplatesClient() {
  const t = useAdminT('admin.services');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>('all');

  const {
    localeOptions,
    activeLocaleCodes,
    defaultLocaleFromDb,
    loading: localesLoading,
    coerceLocale,
  } = useAdminLocales();
  const formLocales = activeLocaleCodes.length ? activeLocaleCodes : FALLBACK_LOCALES;
  const defaultLocale = defaultLocaleFromDb || formLocales[0] || 'tr';

  const { data: templates = [], isLoading, isFetching, refetch } = useListServiceTemplatesAdminQuery(
    selectedCategoryFilter !== 'all' ? { category_slug: selectedCategoryFilter } : undefined,
  );
  const { data: categories = [], isLoading: isCategoriesLoading } = useListServiceCategoriesAdminQuery();

  const [createTemplate, { isLoading: isCreating }] = useCreateServiceTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateServiceTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteServiceTemplateAdminMutation();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<ServiceTemplateDto | null>(null);
  const [selectedLocale, setSelectedLocale] = React.useState(defaultLocale);
  const [listLocale, setListLocale] = React.useState(defaultLocale);
  const formRef = React.useRef<HTMLDivElement>(null);

  const [categorySlug, setCategorySlug] = React.useState('');
  const [i18n, setI18n] = React.useState<ServiceI18nMap>(() => blankI18n(formLocales));
  const [slug, setSlug] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(45);
  const [price, setPrice] = React.useState<string | number>('0');
  const [currency, setCurrency] = React.useState('TRY');
  const [mediaType, setMediaType] = React.useState<'audio' | 'video'>('audio');
  const [isFree, setIsFree] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    const safe = (prev: string) => coerceLocale(prev, defaultLocale) || defaultLocale || FALLBACK_LOCALES[0];
    setSelectedLocale(safe);
    setListLocale(safe);
  }, [coerceLocale, defaultLocale]);

  // Form açılınca forma kaydır (kullanıcı sayfanın altında açıldığını farketsin).
  React.useEffect(() => {
    if (!formOpen) return;
    const raf = requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(raf);
  }, [formOpen, editingTemplate]);

  React.useEffect(() => {
    if (editingTemplate && formOpen) {
      setCategorySlug(editingTemplate.category_slug || '');
      setI18n(normalizeI18n(editingTemplate, formLocales));
      setSlug(editingTemplate.slug || '');
      setDurationMinutes(editingTemplate.duration_minutes || 45);
      setPrice(editingTemplate.price ?? 0);
      setCurrency(editingTemplate.currency || 'TRY');
      setMediaType(editingTemplate.media_type || 'audio');
      setIsFree(editingTemplate.is_free ?? false);
      setSortOrder(editingTemplate.sort_order || 0);
      setIsActive(editingTemplate.is_active ?? true);
      return;
    }

    setCategorySlug(categories[0]?.slug || '');
    setI18n(blankI18n(formLocales));
    setSlug('');
    setDurationMinutes(45);
    setPrice('0');
    setCurrency('TRY');
    setMediaType('audio');
    setIsFree(false);
    setSortOrder(0);
    setIsActive(true);
  }, [editingTemplate, formOpen, categories, formLocales.join('|')]);

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
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (template: ServiceTemplateDto) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextI18n = cleanI18n(i18n);
    const baseText = nextI18n[defaultLocale] ?? nextI18n.tr ?? Object.values(nextI18n)[0];

    if (!categorySlug) {
      toast.error(t('templates.toast.categoryRequired'));
      return;
    }
    if (!baseText?.name?.trim() || !slug.trim()) {
      toast.error(t('templates.toast.nameSlugRequired'));
      return;
    }

    const priceNum = Number(price);
    if (!isFree && (Number.isNaN(priceNum) || priceNum <= 0)) {
      toast.error(t('templates.toast.priceRequired'));
      return;
    }

    const payload = {
      category_slug: categorySlug,
      name: baseText.name.trim(),
      slug: slug.trim(),
      description: baseText.description?.trim() || null,
      duration_minutes: Number(durationMinutes),
      price: isFree ? 0 : priceNum,
      currency: currency.trim() || 'TRY',
      media_type: mediaType,
      is_free: isFree ? 1 : 0,
      sort_order: Number(sortOrder),
      is_active: isActive ? 1 : 0,
      i18n: nextI18n,
    };

    try {
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, patch: payload }).unwrap();
        toast.success(t('templates.toast.updated'));
      } else {
        await createTemplate(payload).unwrap();
        toast.success(t('templates.toast.created'));
      }
      closeForm();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || t('templates.toast.error'));
    }
  };

  const handleDelete = async (id: string, tempName: string) => {
    const ok = window.confirm(t('templates.toast.deleteConfirm', { name: tempName }));
    if (!ok) return;

    try {
      await deleteTemplate({ id }).unwrap();
      toast.success(t('templates.toast.deleted'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || t('templates.toast.deleteError'));
    }
  };

  const busy = isLoading || isFetching || isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-gm-gold text-[10px] font-bold uppercase tracking-[0.2em]">
              {t('templates.eyebrow')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text text-foreground">{t('templates.title')}</h1>
          <p className="text-gm-muted font-serif text-sm italic opacity-70">{t('templates.description')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminLocaleSelect
            value={listLocale}
            onChange={(locale) => setListLocale(coerceLocale(locale, defaultLocale) || defaultLocale)}
            options={localeOptions.length ? localeOptions : FALLBACK_LOCALES.map((locale) => ({ value: locale, label: locale.toUpperCase() }))}
            loading={localesLoading}
            className="border-gm-border-soft bg-gm-surface/40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
            {t('templates.refresh')}
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90"
          >
            <Plus className="mr-2 size-4" />
            {t('templates.newButton')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Label className="text-gm-muted text-sm font-bold uppercase tracking-widest">{t('templates.categoryFilter')}</Label>
          <div className="w-64">
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                <SelectValue placeholder={t('templates.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep text-gm-text">
                <SelectItem value="all">{t('templates.allCategories')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.name')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.category')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.durationType')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.price')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.status')}</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('templates.col.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-gm-border-soft">
                      <TableCell className="px-8 py-6"><Skeleton className="h-12 w-48 rounded-full bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-6 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-20 rounded-lg bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-16 rounded-lg bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                      <TableCell className="px-8 py-6"><Skeleton className="ml-auto h-10 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                    </TableRow>
                  ))
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-30">
                        <Layers className="h-20 w-20 text-gm-gold/50" />
                        <span className="text-gm-muted font-serif text-xl italic">{t('templates.emptyFilter')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((item) => {
                    const category = categories.find((c) => c.slug === item.category_slug);
                    const rowName = item.i18n?.[listLocale]?.name || item.name;
                    const rowDesc = item.i18n?.[listLocale]?.description || item.description;
                    const catName = category?.i18n?.[listLocale]?.name || category?.name || item.category_slug;
                    return (
                      <TableRow key={item.id} className="group border-gm-border-soft transition-colors hover:bg-gm-primary/[0.03]">
                        <TableCell className="px-8 py-6">
                          <div>
                            <div className="font-serif text-xl text-gm-text">{rowName}</div>
                            <div className="text-gm-muted mt-1 font-mono text-[10px] opacity-50">{item.slug}</div>
                            {rowDesc ? (
                              <div className="text-gm-muted mt-1 max-w-sm truncate text-xs">{rowDesc}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <span className="rounded-full border border-gm-border-soft bg-gm-surface/40 px-3 py-1 text-xs text-gm-text">
                            {catName}
                          </span>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gm-text text-foreground">{item.duration_minutes} {t('templates.minutesShort')}</span>
                            <div className="text-gm-muted flex items-center gap-1 text-[10px] uppercase">
                              {item.media_type === 'video' ? <Video className="size-3 text-gm-gold" /> : <AudioLines className="size-3 text-gm-gold" />}
                              {item.media_type === 'video' ? t('templates.mediaVideo') : t('templates.mediaAudio')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          {item.is_free ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gm-success/20 bg-gm-success/10 px-2.5 py-1 text-[10px] font-bold text-gm-success">
                              <Gift className="size-3" /> {t('templates.free')}
                            </span>
                          ) : (
                            <span className="font-serif text-lg font-bold text-gm-gold">
                              {item.price} {item.currency}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-6">
                          <div className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] transition-all',
                            item.is_active ? 'border-gm-success/20 bg-gm-success/5 text-gm-success' : 'border-gm-error/20 bg-gm-error/5 text-gm-error',
                          )}>
                            <div className={cn('h-1.5 w-1.5 animate-pulse rounded-full', item.is_active ? 'bg-gm-success' : 'bg-gm-error')} />
                            {item.is_active ? t('templates.active') : t('templates.inactive')}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-30 transition-all duration-300 group-hover:opacity-100">
                            <Button size="icon" variant="ghost" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold" onClick={() => handleOpenEdit(item)}>
                              <Edit2 className="size-5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full text-gm-error/40 hover:bg-gm-error/10 hover:text-gm-error" onClick={() => handleDelete(item.id, item.name)}>
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {formOpen && (
        <Card ref={formRef} className="scroll-mt-24 border-2 border-gm-gold/40 bg-gm-bg-deep/80 text-gm-text shadow-xl ring-2 ring-gm-gold/10">
          <CardContent className="p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-serif text-2xl">
                  {editingTemplate ? t('templates.dialog.editTitle') : t('templates.dialog.createTitle')}
                </h2>
                <p className="text-sm text-gm-muted">{t('templates.dialog.description')}</p>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.category')}</Label>
                  <Select value={categorySlug} onValueChange={setCategorySlug}>
                    <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                      <SelectValue placeholder={t('templates.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep text-gm-text">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mediaType" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.mediaType')}</Label>
                  <Select value={mediaType} onValueChange={(val) => setMediaType(val as 'audio' | 'video')}>
                    <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                      <SelectValue placeholder={t('templates.field.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep text-gm-text">
                      <SelectItem value="audio">{t('templates.mediaAudioCall')}</SelectItem>
                      <SelectItem value="video">{t('templates.mediaVideoCall')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempName" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.name')}</Label>
                  <Input
                    id="tempName"
                    value={currentText.name}
                    onChange={(e) => setLocaleText({ name: e.target.value })}
                    placeholder={t('templates.field.namePlaceholder')}
                    className="border-gm-border-soft bg-gm-surface/40"
                    required={selectedLocale === defaultLocale}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempSlug" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.slug')}</Label>
                  <Input
                    id="tempSlug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="astroloji-harita-analizi"
                    className="border-gm-border-soft bg-gm-surface/40"
                    required
                    disabled={!!editingTemplate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempDesc" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.description')}</Label>
                <Textarea
                  id="tempDesc"
                  value={currentText.description ?? ''}
                  onChange={(e) => setLocaleText({ description: e.target.value })}
                  placeholder={t('templates.field.descriptionPlaceholder')}
                  className="border-gm-border-soft bg-gm-surface/40"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.duration')}</Label>
                  <Input id="duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="border-gm-border-soft bg-gm-surface/40" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempPrice" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.price')}</Label>
                  <Input id="tempPrice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border-gm-border-soft bg-gm-surface/40" disabled={isFree} required={!isFree} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempCurrency" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.currency')}</Label>
                  <Input id="tempCurrency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="border-gm-border-soft bg-gm-surface/40" disabled />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-surface/40 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold uppercase tracking-widest text-gm-text text-foreground">{t('templates.field.isFree')}</Label>
                    <p className="text-[10px] text-gm-muted">{t('templates.field.isFreeHelp')}</p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={(checked) => { setIsFree(checked); if (checked) setPrice('0'); }} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempSort" className="text-sm font-bold uppercase tracking-widest text-gm-muted">{t('templates.field.sortOrder')}</Label>
                  <Input id="tempSort" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="0" className="border-gm-border-soft bg-gm-surface/40" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-surface/40 p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold uppercase tracking-widest text-gm-text text-foreground">{t('templates.field.isActive')}</Label>
                  <p className="text-xs text-gm-muted">{t('templates.field.isActiveHelp')}</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={closeForm}>
                  {t('templates.cancel')}
                </Button>
                <Button type="submit" disabled={busy || isCategoriesLoading} className="bg-gm-gold px-6 text-white">
                  {t('templates.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
