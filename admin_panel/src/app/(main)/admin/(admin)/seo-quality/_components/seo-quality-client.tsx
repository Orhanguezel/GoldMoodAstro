'use client';

import * as React from 'react';
import Link from 'next/link';
import { BarChart3, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListSeoQualityQuery,
  useGetGscSummaryQuery,
  useRecalculateSeoMutation,
  type SeoEntityType,
  type SeoQualityListItem,
} from '@/integrations/hooks';

const ALL = '__all__';

function bool(v: unknown) {
  return v === true || v === 1 || v === '1';
}

function qualityVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 75) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

function typeLabel(type: string) {
  if (type === 'custom_page') return 'Sayfa/Blog';
  if (type === 'consultant') return 'Danışman';
  return type;
}

function editHref(item: SeoQualityListItem): string {
  if (item.entity_type === 'consultant') return `/admin/consultants/${item.entity_id}`;
  if (item.entity_type === 'custom_page') {
    if (item.module_key === 'blog') return '/admin/blog';
    if (item.module_key === 'landing') return '/admin/landing';
    return '/admin/pages';
  }
  return `/admin/seo-quality/${item.entity_type}/${item.entity_id}?locale=${item.locale}`;
}

export default function SeoQualityClient() {
  const [entityType, setEntityType] = React.useState<string>(ALL);
  const [locale, setLocale] = React.useState<string>(ALL);
  const [risk, setRisk] = React.useState<string>(ALL);
  const [q, setQ] = React.useState('');
  const [lowOnly, setLowOnly] = React.useState(false);
  const [recalculateSeo, recalcState] = useRecalculateSeoMutation();

  const params = React.useMemo(() => ({
    entity_type: entityType === ALL ? undefined : entityType as SeoEntityType,
    locale: locale === ALL ? undefined : locale,
    q: q.trim() || undefined,
    max_score: lowOnly ? 39 : undefined,
    adsense_ready: risk === 'adsense' ? 0 as const : undefined,
    index_ready: risk === 'index' ? 0 as const : undefined,
    duplicate_slug: risk === 'duplicate' ? 1 as const : undefined,
    page_size: 100,
  }), [entityType, locale, q, lowOnly, risk]);

  const { data, isLoading, isFetching, refetch, error } = useListSeoQualityQuery(params);
  const { data: gscSummary } = useGetGscSummaryQuery();
  const items = data?.items ?? [];
  const summary = data?.summary;

  async function onRecalculateAll() {
    try {
      await recalculateSeo({}).unwrap();
      toast.success('Yeniden hesaplama arka planda başladı.');
    } catch {
      toast.error('Yeniden hesaplama başlatılamadı.');
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl text-gm-text">SEO Genel Bakış</h1>
          <p className="text-sm text-gm-muted">Skor dağılımı ve riskli içerikler burada izlenir; düzenleme ilgili içerik modülünde yapılır.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Yenile
          </Button>
          <Button onClick={onRecalculateAll} disabled={recalcState.isLoading}>
            <BarChart3 className="mr-2 h-4 w-4" /> Tümünü Hesapla
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Ortalama Skor</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.avg_score ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Toplam İçerik</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data?.total ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">AdSense Risk</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-gm-warning">{summary?.adsense_risk_count ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Duplicate Slug</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-gm-error">{summary?.duplicate_slug_count ?? 0}</CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">GSC Indexed</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{gscSummary?.indexed ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">GSC Issue</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-gm-error">{gscSummary?.issue ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">GSC Unknown</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-gm-muted">{gscSummary?.unknown ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Gerçek Index Sorunu</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-gm-warning">{gscSummary?.real_issue ?? 0}</CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gm-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="URL veya entity id ara" className="pl-9" />
            </div>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tüm tipler</SelectItem>
                <SelectItem value="custom_page">Sayfa/Blog</SelectItem>
                <SelectItem value="consultant">Danışman</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tüm diller</SelectItem>
                <SelectItem value="tr">TR</SelectItem>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="de">DE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={risk} onValueChange={setRisk}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tüm durumlar</SelectItem>
                <SelectItem value="adsense">AdSense riski</SelectItem>
                <SelectItem value="index">Index hazır değil</SelectItem>
                <SelectItem value="duplicate">Duplicate slug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-gm-muted">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Sadece düşük skor (&lt;40)
          </label>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-gm-error/30 bg-gm-error/10 p-4 text-gm-error">SEO kalite verisi alınamadı.</div>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Locale</TableHead>
              <TableHead>Skor</TableHead>
              <TableHead>AdSense</TableHead>
              <TableHead>Kelime</TableHead>
              <TableHead className="text-right">Aksiyon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isFetching) && items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center">Yükleniyor...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-gm-muted">Kayıt yok.</TableCell></TableRow>
            ) : items.map((item: SeoQualityListItem) => (
              <TableRow key={`${item.entity_type}:${item.entity_id}:${item.locale}`}>
                <TableCell>
                  <div className="font-medium">{item.title || item.entity_id}</div>
                  <div className="max-w-md truncate text-xs text-gm-muted">{item.url}</div>
                </TableCell>
                <TableCell>{typeLabel(item.entity_type)}</TableCell>
                <TableCell className="uppercase">{item.locale}</TableCell>
                <TableCell><Badge variant={qualityVariant(Number(item.overall_score))}>{item.overall_score}/100</Badge></TableCell>
                <TableCell><Badge variant={bool(item.adsense_ready) ? 'default' : 'destructive'}>{bool(item.adsense_ready) ? 'Hazır' : 'Risk'}</Badge></TableCell>
                <TableCell>{item.word_count}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={editHref(item)}>Modülde düzenle</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
