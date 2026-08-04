import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { LlmUsageEvent } from '@goldmood/shared-backend/modules/llm/provider';
import { db } from '@/db/client';

export const VAT_RATE = 0.19;

const PRICE_PER_MILLION: Array<{ match: RegExp; input: number; output: number }> = [
  { match: /haiku-4-5/i, input: 1, output: 5 },
  { match: /sonnet-4(?:-|$)/i, input: 3, output: 15 },
  { match: /opus-4(?:-|$)/i, input: 5, output: 25 },
  { match: /claude-3-5-haiku/i, input: 0.8, output: 4 },
  { match: /claude-3-5-sonnet/i, input: 3, output: 15 },
];

function unitPrice(model: string) {
  return PRICE_PER_MILLION.find((item) => item.match.test(model)) ?? { input: 0, output: 0 };
}

export function calculateCost(event: LlmUsageEvent) {
  return calculateDetailedCost({ ...event, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, cacheReadTokens: 0 });
}

export function calculateDetailedCost(event: {
  model: string; inputTokens: number; outputTokens: number;
  cacheWrite5mTokens: number; cacheWrite1hTokens: number; cacheReadTokens: number;
}) {
  const price = unitPrice(event.model);
  const net = (event.inputTokens * price.input + event.outputTokens * price.output
    + event.cacheWrite5mTokens * price.input * 1.25
    + event.cacheWrite1hTokens * price.input * 2
    + event.cacheReadTokens * price.input * 0.1) / 1_000_000;
  return { net, gross: net * (1 + VAT_RATE) };
}

export async function recordLlmUsage(event: LlmUsageEvent): Promise<void> {
  const cost = calculateCost(event);
  await db.execute(sql`
    INSERT INTO llm_usage_events
      (id, provider, model, input_tokens, output_tokens, net_cost_usd, vat_rate, gross_cost_usd, source)
    VALUES
      (${randomUUID()}, ${event.provider}, ${event.model}, ${event.inputTokens}, ${event.outputTokens},
       ${cost.net}, ${VAT_RATE}, ${cost.gross}, 'goldmoodastro')
  `);
}

function rowsOf<T>(result: unknown): T[] {
  const value = result as any;
  return (Array.isArray(value?.[0]) ? value[0] : value) as T[];
}

export async function getAiBillingSummary() {
  const totals = rowsOf<any>(await db.execute(sql`
    SELECT
      COALESCE(SUM(input_tokens), 0) AS input_tokens,
      COALESCE(SUM(output_tokens), 0) AS output_tokens,
      COALESCE(SUM(net_cost_usd), 0) AS net_cost_usd,
      COALESCE(SUM(gross_cost_usd), 0) AS gross_cost_usd,
      COUNT(*) AS request_count
    FROM llm_usage_events
    WHERE source = 'goldmoodastro'
  `))[0] ?? {};
  const daily = rowsOf<any>(await db.execute(sql`
    SELECT DATE(created_at) AS date, provider, model,
      SUM(input_tokens) AS input_tokens, SUM(output_tokens) AS output_tokens,
      SUM(net_cost_usd) AS net_cost_usd, SUM(gross_cost_usd) AS gross_cost_usd,
      COUNT(*) AS request_count
    FROM llm_usage_events
    WHERE source = 'goldmoodastro'
    GROUP BY DATE(created_at), provider, model
    ORDER BY date DESC
    LIMIT 90
  `));
  const imported = rowsOf<any>(await db.execute(sql`
    SELECT COALESCE(SUM(input_tokens), 0) AS input_tokens,
      COALESCE(SUM(cache_write_5m_tokens), 0) AS cache_write_5m_tokens,
      COALESCE(SUM(cache_write_1h_tokens), 0) AS cache_write_1h_tokens,
      COALESCE(SUM(cache_read_tokens), 0) AS cache_read_tokens,
      COALESCE(SUM(output_tokens), 0) AS output_tokens,
      COALESCE(SUM(net_cost_usd), 0) AS net_cost_usd,
      COALESCE(SUM(gross_cost_usd), 0) AS gross_cost_usd,
      COUNT(*) AS row_count, MIN(usage_date_utc) AS first_date, MAX(usage_date_utc) AS last_date
    FROM llm_usage_imports
  `))[0] ?? {};
  const importedDaily = rowsOf<any>(await db.execute(sql`
    SELECT usage_date_utc AS date, provider, model, SUM(input_tokens + cache_write_5m_tokens +
      cache_write_1h_tokens + cache_read_tokens) AS input_tokens, SUM(output_tokens) AS output_tokens,
      SUM(net_cost_usd) AS net_cost_usd, SUM(gross_cost_usd) AS gross_cost_usd, COUNT(*) AS request_count
    FROM llm_usage_imports GROUP BY usage_date_utc, provider, model ORDER BY date DESC LIMIT 180
  `));

  const historicalNet = Number(imported.net_cost_usd || 0);
  const historicalGross = Number(imported.gross_cost_usd || 0);
  return {
    vatRate: VAT_RATE,
    trackingStartedAt: '2026-08-04',
    historical: {
      inputTokens: Number(imported.input_tokens || 0), outputTokens: Number(imported.output_tokens || 0),
      cacheWrite5mTokens: Number(imported.cache_write_5m_tokens || 0),
      cacheWrite1hTokens: Number(imported.cache_write_1h_tokens || 0), cacheReadTokens: Number(imported.cache_read_tokens || 0),
      rowCount: Number(imported.row_count || 0), firstDate: imported.first_date, lastDate: imported.last_date,
      netCostUsd: historicalNet, grossCostUsd: historicalGross, source: 'Anthropic Console CSV dışa aktarımları',
    },
    tracked: {
      inputTokens: Number(totals.input_tokens || 0), outputTokens: Number(totals.output_tokens || 0),
      requestCount: Number(totals.request_count || 0), netCostUsd: Number(totals.net_cost_usd || 0),
      grossCostUsd: Number(totals.gross_cost_usd || 0),
    },
    grandTotal: {
      netCostUsd: historicalNet + Number(totals.net_cost_usd || 0),
      grossCostUsd: historicalGross + Number(totals.gross_cost_usd || 0),
    },
    purchases: [
      { date: '2026-03-01', creditsUsd: 5, paidGrossUsd: 5.95, expiresAt: '2027-03-02' },
      { date: '2026-04-29', creditsUsd: 5, paidGrossUsd: 5.95, expiresAt: '2027-04-30' },
      { date: '2026-05-29', creditsUsd: 10, paidGrossUsd: 11.90, expiresAt: '2027-05-30' },
      { date: '2026-08-04', creditsUsd: 15, paidGrossUsd: 17.89, expiresAt: '2027-08-04' },
      { date: '2026-08-04', creditsUsd: 10, paidGrossUsd: 11.90, expiresAt: '2027-08-04' },
    ],
    currentBalanceSnapshot: { amountUsd: 25.01, capturedAt: '2026-08-04' },
    daily: [...daily, ...importedDaily].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 180),
  };
}
