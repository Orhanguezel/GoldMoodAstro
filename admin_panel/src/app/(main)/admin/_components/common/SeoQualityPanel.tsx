import Link from 'next/link';

import { Badge } from '@/components/ui/badge';

function qualityVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 75) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

export function SeoQualityPanel({
  listScore,
  detail,
  entityId,
  locale,
  b,
}: {
  listScore?: { overall_score: number; adsense_ready?: unknown; word_count?: number; index_ready?: unknown } | undefined;
  detail?: { breakdown?: unknown } | undefined;
  entityId: string;
  locale: string;
  b: (key: string, fallback: string, vars?: Record<string, string | number>) => string;
}) {
  const raw = detail?.breakdown;
  const items: any[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
      : [];
  const truthy = (v: unknown) => v === true || v === 1 || v === '1';
  const score = listScore ? Number(listScore.overall_score) : undefined;

  return (
    <div className="space-y-3 rounded-2xl border border-gm-border-soft bg-gm-bg-deep/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gm-muted">{b('form.seoScore', 'SEO / İçerik Kalite Skoru')}</span>
          {listScore ? (
            <>
              <Link href={`/admin/seo-quality/custom_page/${entityId}?locale=${locale}`}>
                <Badge variant={qualityVariant(score ?? 0)}>{score}/100</Badge>
              </Link>
              {truthy(listScore.adsense_ready)
                ? <Badge className="bg-gm-success/15 text-gm-success">{b('form.adsenseReady', 'AdSense hazır')}</Badge>
                : <Badge className="bg-gm-error/15 text-gm-error">{b('form.adsenseRisk', 'AdSense riski')}</Badge>}
              {truthy(listScore.index_ready)
                ? <Badge className="bg-gm-success/15 text-gm-success">{b('form.indexReady', 'Index uygun')}</Badge>
                : <Badge className="bg-gm-warning/15 text-gm-warning">{b('form.indexNotReady', 'Index eşiği altı')}</Badge>}
            </>
          ) : (
            <Badge variant="outline" className="text-gm-muted">{b('form.seoScorePending', 'Kaydedince hesaplanır')}</Badge>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((it: any) => (
            <div key={it.key} className="flex items-start justify-between gap-3 rounded-xl bg-gm-surface/30 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gm-text">
                  <span className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] ${it.ok ? 'bg-gm-success/15 text-gm-success' : 'bg-gm-error/15 text-gm-error'}`}>{it.ok ? '✓' : '✕'}</span>
                  {it.label}
                </div>
                {it.hint && <p className="mt-0.5 text-[10px] text-gm-muted">{it.hint}</p>}
              </div>
              <span className="shrink-0 text-[11px] font-bold text-gm-muted">{it.got}/{it.max}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
