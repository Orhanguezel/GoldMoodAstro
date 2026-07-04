'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Languages, RefreshCcw, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import type { SettingValue } from '@/integrations/shared';

type LocaleCode = 'tr' | 'en' | 'de';
type MobileI18nTree = Record<string, unknown>;
type FlatRow = { path: string; value: string };

const LOCALES: Array<{ value: LocaleCode; label: string }> = [
  { value: 'tr', label: 'TR' },
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
];

function parseValue(value: unknown): MobileI18nTree {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as MobileI18nTree : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value as MobileI18nTree : {};
}

function flattenStrings(value: unknown, prefix = ''): FlatRow[] {
  if (typeof value === 'string') return [{ path: prefix, value }];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenStrings(child, nextPrefix);
  });
}

function setPath(root: MobileI18nTree, locale: LocaleCode, path: string, value: string): MobileI18nTree {
  const cloned = structuredClone(root) as MobileI18nTree;
  const parts = path.split('.').filter(Boolean);
  let cursor: Record<string, unknown> = (cloned[locale] && typeof cloned[locale] === 'object'
    ? cloned[locale]
    : {}) as Record<string, unknown>;
  cloned[locale] = cursor;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
  return cloned;
}

export function MobileI18nTab() {
  const [locale, setLocale] = React.useState<LocaleCode>('tr');
  const [search, setSearch] = React.useState('');
  const [draft, setDraft] = React.useState<MobileI18nTree>({});
  const [dirty, setDirty] = React.useState(false);
  const query = useGetSiteSettingAdminByKeyQuery({ key: 'ui_mobile_i18n', locale: '*' });
  const [updateSetting, updateState] = useUpdateSiteSettingAdminMutation();

  React.useEffect(() => {
    if (!query.data) return;
    setDraft(parseValue(query.data.value));
    setDirty(false);
  }, [query.data]);

  const rows = React.useMemo(() => {
    const localeTree = draft[locale] ?? {};
    const q = search.trim().toLowerCase();
    const all = flattenStrings(localeTree);
    if (!q) return all;
    return all.filter((row) => row.path.toLowerCase().includes(q) || row.value.toLowerCase().includes(q));
  }, [draft, locale, search]);

  const save = async () => {
    try {
      await updateSetting({ key: 'ui_mobile_i18n', locale: '*', value: draft as SettingValue }).unwrap();
      toast.success('Mobil i18n kaydedildi');
      setDirty(false);
    } catch {
      toast.error('Mobil i18n kaydedilemedi');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto_auto]">
        <div className="space-y-2">
          <Label>Dil</Label>
          <Select value={locale} onValueChange={(value) => setLocale(value as LocaleCode)}>
            <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
              {LOCALES.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Arama</Label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="auth.login, kredi, hata..."
              className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="rounded-full h-12 px-6"
            onClick={() => query.refetch()}
            disabled={query.isFetching || updateState.isLoading}
          >
            <RefreshCcw className={cn('mr-2 size-4', query.isFetching && 'animate-spin')} />
            Yenile
          </Button>
        </div>
        <div className="flex items-end">
          <Button
            className="rounded-full h-12 px-8 bg-gm-gold text-gm-ink hover:bg-gm-gold/90"
            onClick={save}
            disabled={!dirty || updateState.isLoading}
          >
            <Save className="mr-2 size-4" />
            Kaydet
          </Button>
        </div>
      </div>

      <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-[minmax(220px,320px)_1fr] border-b border-gm-border-soft bg-gm-surface/40 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
            <div>Anahtar</div>
            <div>Metin</div>
          </div>
          <div className="max-h-[620px] overflow-auto">
            {query.isLoading ? (
              <div className="p-10 text-center text-gm-muted">Yükleniyor...</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-4 p-16 text-gm-muted">
                <Languages className="size-12 opacity-40" />
                <span>Kayıt bulunamadı</span>
              </div>
            ) : rows.map((row) => (
              <div key={row.path} className="grid grid-cols-[minmax(220px,320px)_1fr] gap-6 border-b border-gm-border-soft px-6 py-4">
                <div className="break-all font-mono text-xs text-gm-gold">{row.path}</div>
                <Textarea
                  value={row.value}
                  onChange={(event) => {
                    setDraft((current) => setPath(current, locale, row.path, event.target.value));
                    setDirty(true);
                  }}
                  className="min-h-12 resize-y bg-gm-surface/40 border-gm-border-soft rounded-2xl text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
