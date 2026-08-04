'use client';

import * as React from 'react';
import { Activity, Calculator, Coins, Loader2, ReceiptText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Summary = {
  vatRate: number;
  trackingStartedAt: string;
  historical: { netCostUsd: number; grossCostUsd: number; source: string };
  tracked: { inputTokens: number; outputTokens: number; requestCount: number; netCostUsd: number; grossCostUsd: number };
  grandTotal: { netCostUsd: number; grossCostUsd: number };
  purchases: Array<{ date: string; creditsUsd: number; paidGrossUsd: number; expiresAt: string }>;
  currentBalanceSnapshot: { amountUsd: number; capturedAt: string };
  daily: Array<{ date: string; provider: string; model: string; input_tokens: string; output_tokens: string; net_cost_usd: string; gross_cost_usd: string; request_count: string }>;
};

const usd = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 });
const integer = new Intl.NumberFormat('tr-TR');

export function AiBillingTab() {
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('mh_access_token') || localStorage.getItem('access_token') || '';
      const response = await fetch('/api/admin/ai-billing/summary', { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'AI maliyet bilgisi alınamadı');
      setData(result.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI maliyet bilgisi alınamadı'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-gm-gold" /></div>;
  if (!data) return <div className="rounded-2xl bg-red-500/10 p-5 text-sm text-red-400">{error}</div>;

  const purchaseGross = data.purchases.reduce((total, row) => total + row.paidGrossUsd, 0);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="font-serif text-2xl text-gm-text">Claude API kullanımı</h3><p className="mt-2 text-sm text-gm-muted">Yalnız GoldMoodAstro backend çağrıları · KDV %{Math.round(data.vatRate * 100)}</p></div>
      <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 size-4" />Yenile</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Activity} label="Takip edilen istek" value={integer.format(data.tracked.requestCount)} />
      <Metric icon={Calculator} label="Toplam token" value={integer.format(data.tracked.inputTokens + data.tracked.outputTokens)} hint={`${integer.format(data.tracked.inputTokens)} giriş · ${integer.format(data.tracked.outputTokens)} çıkış`} />
      <Metric icon={ReceiptText} label="Site maliyeti (KDV dahil)" value={usd.format(data.grandTotal.grossCostUsd)} hint={`${usd.format(data.grandTotal.netCostUsd)} net`} />
      <Metric icon={Coins} label="Satın alınan kredi" value={usd.format(data.purchases.reduce((sum, row) => sum + row.creditsUsd, 0))} hint={`${usd.format(purchaseGross)} karttan çekilen`} />
    </div>

    <Card className="border-gm-border-soft bg-gm-surface/30">
      <CardHeader><CardTitle className="font-serif text-xl">Maliyet özeti</CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <Row label="Anthropic Console geçmiş GoldMoodAstro maliyeti" value={`${usd.format(data.historical.netCostUsd)} net · ${usd.format(data.historical.grossCostUsd)} KDV dahil`} />
        <Row label={`Yerel token takibi (${data.trackingStartedAt} sonrası)`} value={`${usd.format(data.tracked.netCostUsd)} net · ${usd.format(data.tracked.grossCostUsd)} KDV dahil`} />
        <Row label="Site sahibine yansıtılabilir toplam kullanım" value={usd.format(data.grandTotal.grossCostUsd)} strong />
        <Row label={`Bakiye anlık görüntüsü (${data.currentBalanceSnapshot.capturedAt})`} value={usd.format(data.currentBalanceSnapshot.amountUsd)} />
      </CardContent>
    </Card>

    <Card className="border-gm-border-soft bg-gm-surface/30">
      <CardHeader><CardTitle className="font-serif text-xl">Kredi satın alma geçmişi</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-gm-muted"><tr><th className="pb-3">Tarih</th><th className="pb-3">Kredi</th><th className="pb-3">Vergi dahil ödeme</th><th className="pb-3">Son kullanım</th></tr></thead><tbody>{data.purchases.map((row, index) => <tr key={`${row.date}-${index}`} className="border-t border-gm-border-soft"><td className="py-3">{row.date}</td><td>{usd.format(row.creditsUsd)}</td><td>{usd.format(row.paidGrossUsd)}</td><td>{row.expiresAt}</td></tr>)}</tbody></table></CardContent>
    </Card>

    <Card className="border-gm-border-soft bg-gm-surface/30">
      <CardHeader><CardTitle className="font-serif text-xl">Günlük token hareketleri</CardTitle></CardHeader>
      <CardContent>{data.daily.length === 0 ? <p className="text-sm text-gm-muted">Takip başladı; ilk başarılı site çağrısından sonra hareketler burada görünecek.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-gm-muted"><tr><th className="pb-3">Tarih</th><th className="pb-3">Model</th><th className="pb-3">Giriş</th><th className="pb-3">Çıkış</th><th className="pb-3">KDV dahil</th></tr></thead><tbody>{data.daily.map((row) => <tr key={`${row.date}-${row.model}`} className="border-t border-gm-border-soft"><td className="py-3">{row.date}</td><td>{row.model}</td><td>{integer.format(Number(row.input_tokens))}</td><td>{integer.format(Number(row.output_tokens))}</td><td>{usd.format(Number(row.gross_cost_usd))}</td></tr>)}</tbody></table></div>}</CardContent>
    </Card>
  </div>;
}

function Metric({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string }) {
  return <Card className="border-gm-border-soft bg-gm-surface/30"><CardContent className="p-5"><Icon className="size-5 text-gm-gold" /><p className="mt-4 text-xs uppercase tracking-wider text-gm-muted">{label}</p><p className="mt-2 text-2xl font-bold text-gm-text">{value}</p>{hint ? <p className="mt-1 text-xs text-gm-muted">{hint}</p> : null}</CardContent></Card>;
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex flex-wrap justify-between gap-2 border-b border-gm-border-soft py-3 last:border-0"><span className="text-gm-muted">{label}</span><span className={strong ? 'font-bold text-gm-gold' : 'font-semibold text-gm-text'}>{value}</span></div>; }

