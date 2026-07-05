'use client';

import * as React from 'react';
import { CalendarDays, Pencil, RefreshCcw, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useGenerateAdminHoroscopeMutation,
  useListAdminHoroscopesQuery,
  useUpdateAdminHoroscopeMutation,
} from '@/integrations/hooks';
import type {
  HoroscopeAdminDto,
  HoroscopeListParams,
  HoroscopePeriod,
  HoroscopeSign,
  HoroscopeSource,
  HoroscopeUpdatePayload,
} from '@/integrations/shared';
import { cn } from '@/lib/utils';

const SIGN_OPTIONS: { value: HoroscopeSign; label: string }[] = [
  { value: 'aries', label: 'Koç' },
  { value: 'taurus', label: 'Boğa' },
  { value: 'gemini', label: 'İkizler' },
  { value: 'cancer', label: 'Yengeç' },
  { value: 'leo', label: 'Aslan' },
  { value: 'virgo', label: 'Başak' },
  { value: 'libra', label: 'Terazi' },
  { value: 'scorpio', label: 'Akrep' },
  { value: 'sagittarius', label: 'Yay' },
  { value: 'capricorn', label: 'Oğlak' },
  { value: 'aquarius', label: 'Kova' },
  { value: 'pisces', label: 'Balık' },
];

const PERIOD_OPTIONS: { value: HoroscopePeriod; label: string }[] = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'transit', label: 'Transit' },
];

const SOURCE_LABELS: Record<HoroscopeSource, string> = {
  llm: 'LLM',
  astrolog_manual: 'Astrolog',
  seed: 'Seed',
};

const LOCALES = ['tr', 'en', 'de'];

function signLabel(sign: HoroscopeSign) {
  return SIGN_OPTIONS.find((item) => item.value === sign)?.label ?? sign;
}

function periodLabel(period: HoroscopePeriod) {
  return PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? period;
}

function shortDate(value: string) {
  return value ? value.slice(0, 10) : '-';
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeForm(item: HoroscopeAdminDto): HoroscopeUpdatePayload {
  return {
    content: item.content,
    mood_score: item.mood_score,
    lucky_number: item.lucky_number,
    lucky_color: item.lucky_color,
  };
}

export default function HoroscopesClient() {
  const [filters, setFilters] = React.useState<HoroscopeListParams>({
    sign: 'all',
    period: 'daily',
    locale: 'tr',
    source: 'all',
    limit: 50,
    offset: 0,
  });
  const [selected, setSelected] = React.useState<HoroscopeAdminDto | null>(null);
  const [form, setForm] = React.useState<HoroscopeUpdatePayload>({});

  const queryParams = React.useMemo(() => filters, [filters]);
  const query = useListAdminHoroscopesQuery(queryParams);
  const [updateHoroscope, updateState] = useUpdateAdminHoroscopeMutation();
  const [generateHoroscope, generateState] = useGenerateAdminHoroscopeMutation();

  const busy = query.isFetching || updateState.isLoading || generateState.isLoading;
  const canGenerateFromFilters = filters.sign && filters.sign !== 'all' && filters.period && filters.period !== 'all';

  const openEdit = (item: HoroscopeAdminDto) => {
    setSelected(item);
    setForm(makeForm(item));
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      const updated = await updateHoroscope({ id: selected.id, body: form }).unwrap();
      setSelected(updated);
      setForm(makeForm(updated));
      toast.success('Yorum kaydedildi.');
    } catch {
      toast.error('Yorum kaydedilemedi.');
    }
  };

  const handleGenerate = async (item?: HoroscopeAdminDto) => {
    const sign = item?.sign ?? (filters.sign !== 'all' ? filters.sign : undefined);
    const period = item?.period ?? (filters.period !== 'all' ? filters.period : undefined);
    const locale = item?.locale ?? filters.locale ?? 'tr';
    const date = item?.period_start_date ?? filters.date;

    if (!sign || !period) {
      toast.error('Üretim için burç ve dönem seçin.');
      return;
    }

    try {
      await generateHoroscope({
        sign,
        period,
        locale,
        date: date || undefined,
        force: true,
      }).unwrap();
      toast.success('Yorum üretimi tamamlandı.');
    } catch {
      toast.error('Yorum üretimi başarısız oldu.');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">ASTROLOJI ICERIKLERI</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Günlük Yorumlar</h1>
          <p className="text-sm italic text-gm-muted">Burç yorumlarını dil, dönem ve kaynak bazında yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={busy}
            className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn('mr-2 size-4 text-gm-gold', query.isFetching && 'animate-spin')} />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={() => handleGenerate()}
            disabled={!canGenerateFromFilters || busy}
            className="h-11 rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-gm-bg hover:bg-gm-gold/80"
          >
            <Sparkles className="mr-2 size-4" />
            Üret
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <Select
          value={filters.sign ?? 'all'}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, sign: value as HoroscopeListParams['sign'], offset: 0 }))}
        >
          <SelectTrigger className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <SelectValue placeholder="Burç" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm burçlar</SelectItem>
            {SIGN_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.period ?? 'all'}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, period: value as HoroscopeListParams['period'], offset: 0 }))}
        >
          <SelectTrigger className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <SelectValue placeholder="Dönem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm dönemler</SelectItem>
            {PERIOD_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.locale ?? 'tr'}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, locale: value, offset: 0 }))}
        >
          <SelectTrigger className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <SelectValue placeholder="Dil" />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((locale) => (
              <SelectItem key={locale} value={locale}>{locale.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.source ?? 'all'}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value as HoroscopeListParams['source'], offset: 0 }))}
        >
          <SelectTrigger className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <SelectValue placeholder="Kaynak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kaynaklar</SelectItem>
            <SelectItem value="llm">LLM</SelectItem>
            <SelectItem value="astrolog_manual">Astrolog</SelectItem>
            <SelectItem value="seed">Seed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.date ?? ''}
          onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value || undefined, offset: 0 }))}
          className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text"
        />

        <Select
          value={String(filters.limit ?? 50)}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, limit: Number(value), offset: 0 }))}
        >
          <SelectTrigger className="h-11 border-gm-border-soft bg-gm-surface/20 text-gm-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden rounded-[24px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Burç</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Dönem</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Tarih</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Dil</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">İçerik</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kaynak</TableHead>
                  <TableHead className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow className="border-gm-border-soft">
                    <TableCell colSpan={7} className="py-16 text-center text-sm italic text-gm-muted">Yükleniyor...</TableCell>
                  </TableRow>
                ) : query.data?.items.length === 0 ? (
                  <TableRow className="border-gm-border-soft">
                    <TableCell colSpan={7} className="py-16 text-center text-sm italic text-gm-muted">Kayıt bulunamadı.</TableCell>
                  </TableRow>
                ) : (
                  query.data?.items.map((item) => (
                    <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface/40">
                      <TableCell className="px-6 py-5 font-medium text-gm-text">{signLabel(item.sign)}</TableCell>
                      <TableCell className="py-5 text-sm text-gm-text-dim">{periodLabel(item.period)}</TableCell>
                      <TableCell className="py-5 text-sm text-gm-text-dim">{shortDate(item.period_start_date)}</TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className="rounded-full border-gm-primary/30 bg-gm-primary/5 text-gm-primary">
                          {item.locale.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] py-5">
                        <p className="line-clamp-2 text-sm text-gm-text-dim">{item.content}</p>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full',
                            item.source === 'astrolog_manual'
                              ? 'border-gm-gold/40 bg-gm-gold/10 text-gm-gold'
                              : 'border-gm-border-soft text-gm-muted',
                          )}
                        >
                          {SOURCE_LABELS[item.source]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full text-gm-muted hover:bg-gm-primary/10 hover:text-gm-primary"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={busy}
                            className="h-9 w-9 rounded-full text-gm-gold hover:bg-gm-gold/10 hover:text-gm-gold"
                            onClick={() => handleGenerate(item)}
                          >
                            <Sparkles className="size-4" />
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

        <Card className="rounded-[24px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="space-y-5 p-6">
            {selected ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-serif text-2xl text-gm-text">{signLabel(selected.sign)}</h2>
                    <Badge variant="outline" className="rounded-full border-gm-border-soft text-gm-muted">
                      {selected.locale.toUpperCase()} / {periodLabel(selected.period)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gm-muted">
                    <CalendarDays className="size-3.5" />
                    <span>{shortDate(selected.period_start_date)}</span>
                    <span>•</span>
                    <span>{formatDateTime(selected.updated_at)}</span>
                  </div>
                </div>

                <Textarea
                  value={form.content ?? ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  className="min-h-[320px] border-gm-border-soft bg-gm-bg/30 text-sm leading-6 text-gm-text"
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.mood_score ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, mood_score: event.target.value ? Number(event.target.value) : null }))}
                    placeholder="Mood"
                    className="border-gm-border-soft bg-gm-bg/30 text-gm-text"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={form.lucky_number ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, lucky_number: event.target.value ? Number(event.target.value) : null }))}
                    placeholder="Sayı"
                    className="border-gm-border-soft bg-gm-bg/30 text-gm-text"
                  />
                  <Input
                    value={form.lucky_color ?? ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, lucky_color: event.target.value || null }))}
                    placeholder="Renk"
                    className="border-gm-border-soft bg-gm-bg/30 text-gm-text"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={busy}
                    className="h-11 rounded-full bg-gm-gold px-6 text-[10px] font-bold uppercase tracking-widest text-gm-bg hover:bg-gm-gold/80"
                  >
                    <Save className="mr-2 size-4" />
                    Kaydet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerate(selected)}
                    disabled={busy}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
                  >
                    <Sparkles className="mr-2 size-4 text-gm-gold" />
                    Yeniden Üret
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-center text-sm italic text-gm-muted">
                Düzenlemek için tablodan bir yorum seçin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-gm-muted">
        Toplam {query.data?.total ?? 0} kayıt
      </div>
    </div>
  );
}
