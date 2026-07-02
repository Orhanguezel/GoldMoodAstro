'use client';

import Link from 'next/link';
import { ExternalLink, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  useGetSeoQualityDetailQuery,
  useInspectGscUrlsMutation,
  useRecalculateSeoMutation,
  useSetSeoIndexMutation,
  type SeoBreakdownItem,
  type SeoEntityType,
} from '@/integrations/hooks';

function bool(v: unknown) {
  return v === true || v === 1 || v === '1';
}

function parseBreakdown(v: unknown): SeoBreakdownItem[] {
  if (Array.isArray(v)) return v as SeoBreakdownItem[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-gm-success';
  if (score >= 40) return 'bg-gm-warning';
  return 'bg-gm-error';
}

export default function SeoQualityDetailClient({ type, id, locale }: { type: string; id: string; locale: string }) {
  const safeType = type as SeoEntityType;
  const { data, isLoading, refetch } = useGetSeoQualityDetailQuery({ type: safeType, id, locale });
  const [recalculateSeo, recalcState] = useRecalculateSeoMutation();
  const [setSeoIndex, setIndexState] = useSetSeoIndexMutation();
  const [inspectGscUrls, inspectState] = useInspectGscUrlsMutation();

  async function onRecalculate() {
    try {
      await recalculateSeo({ type: safeType, id, locale }).unwrap();
      toast.success('Yeniden hesaplama başladı.');
      setTimeout(() => refetch(), 1200);
    } catch {
      toast.error('Yeniden hesaplama başlatılamadı.');
    }
  }

  async function onToggleIndex(next: boolean) {
    try {
      await setSeoIndex({ type: safeType, id, seo_index: next ? 1 : 0 }).unwrap();
      toast.success('Index ayarı güncellendi.');
    } catch {
      toast.error('Index ayarı güncellenemedi.');
    }
  }

  async function onInspectGsc() {
    if (!data?.url) return;
    try {
      const result = await inspectGscUrls({ url: data.url }).unwrap();
      toast.success(result.configured ? 'GSC inceleme kuyruğa alındı.' : 'GSC ayarı yok; URL bilinmeyen olarak kaydedildi.');
      setTimeout(() => refetch(), 700);
    } catch {
      toast.error('GSC inceleme başlatılamadı.');
    }
  }

  if (isLoading || !data) return <div className="p-8 text-gm-muted">Yükleniyor...</div>;

  const score = Number(data.overall_score) || 0;
  const breakdown = parseBreakdown(data.breakdown);
  const canToggleIndex = safeType === 'custom_page';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link href="/admin/seo-quality">← SEO Kalite</Link>
          </Button>
          <h1 className="font-serif text-4xl text-gm-text">SEO Analizi</h1>
          <p className="text-sm text-gm-muted">{data.title || data.entity_id} · {data.locale?.toUpperCase()}</p>
        </div>
        <Button onClick={onRecalculate} disabled={recalcState.isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Yeniden Hesapla
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gm-muted">Readiness</span>
            <span className="text-2xl font-bold">{score}/100</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gm-surface">
            <div className={`h-full ${scoreColor(score)}`} style={{ width: `${Math.min(100, score)}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={bool(data.adsense_ready) ? 'default' : 'destructive'}>{bool(data.adsense_ready) ? 'AdSense hazır' : 'AdSense riski'}</Badge>
            <Badge variant={bool(data.index_ready) ? 'default' : 'secondary'}>{bool(data.index_ready) ? 'Index hazır' : 'Index hazır değil'}</Badge>
            <Badge variant={data.gsc?.state === 'indexed' ? 'default' : data.gsc?.state === 'issue' ? 'destructive' : 'secondary'}>
              GSC {data.gsc?.state === 'indexed' ? 'indexed' : data.gsc?.state === 'issue' ? 'issue' : 'unknown'}
            </Badge>
            {bool(data.is_thin_content) && <Badge variant="destructive">Thin content</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Kelime</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.word_count}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Başlık</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.heading_count}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Görsel</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.image_count}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Bileşen Breakdown</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {breakdown.map((item) => (
            <div key={item.key} className="rounded-lg border border-gm-border-soft p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium">{item.ok ? '✓' : '✗'} {item.label}</span>
                <Badge variant={item.ok ? 'default' : 'secondary'}>{item.got}/{item.max}</Badge>
              </div>
              {item.hint && <p className="text-sm text-gm-muted">{item.hint}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Index ve Public URL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {canToggleIndex ? (
            <div className="flex items-center justify-between rounded-lg border border-gm-border-soft p-4">
              <div>
                <div className="font-medium">seo_index</div>
                <div className="text-sm text-gm-muted">Bu custom page sitemap/index kapsamına alınsın.</div>
              </div>
              <Switch checked={bool(data.seo_index)} disabled={setIndexState.isLoading} onCheckedChange={onToggleIndex} />
            </div>
          ) : (
            <p className="text-sm text-gm-muted">Bu entity tipi için index politikası otomatik türetilir.</p>
          )}
          {data.url && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={data.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Public URL
                </a>
              </Button>
              <Button variant="outline" onClick={onInspectGsc} disabled={inspectState.isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> GSC Kontrol Et
              </Button>
            </div>
          )}
          <div className="rounded-lg border border-gm-border-soft p-4 text-sm text-gm-muted">
            <div className="font-medium text-gm-text">Google Search Console</div>
            <div>Durum: {data.gsc?.coverage_state || data.gsc?.state || 'unknown'}</div>
            <div>Verdict: {data.gsc?.verdict || '-'}</div>
            <div>Son kontrol: {data.gsc?.checked_at || '-'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
