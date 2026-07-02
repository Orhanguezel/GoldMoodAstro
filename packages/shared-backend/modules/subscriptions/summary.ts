import { db } from '../../db/client';

export type SubscriptionSummary = {
  is_premium: true;
  tier: 'premium';
  plan_code: string | null;
  period: 'monthly' | 'yearly' | 'lifetime' | null;
  status: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  is_trial: boolean;
};

export type SubscriptionSummaryRow = {
  status: string;
  ends_at: Date | string | null;
  trial_ends_at: Date | string | null;
  period: 'monthly' | 'yearly' | 'lifetime' | null;
  plan_code: string | null;
  price_minor?: number | null;
};

export function toSubscriptionSummaryIso(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isSubscriptionSummaryFuture(value: Date | string | null): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export function buildSubscriptionSummary(row: SubscriptionSummaryRow): SubscriptionSummary {
  return {
    is_premium: true,
    tier: 'premium',
    plan_code: row.plan_code ?? null,
    period: row.period ?? null,
    status: row.status,
    ends_at: toSubscriptionSummaryIso(row.ends_at),
    trial_ends_at: toSubscriptionSummaryIso(row.trial_ends_at),
    is_trial: isSubscriptionSummaryFuture(row.trial_ends_at),
  };
}

export async function getSubscriptionSummary(userId: string): Promise<SubscriptionSummary | null> {
  const [rows] = await (db as any).session.client.query(
    `SELECT s.status, s.ends_at, s.trial_ends_at, p.period, p.code AS plan_code
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = ?
       AND s.status IN ('active','grace_period','cancelled')
       AND (s.ends_at IS NULL OR s.ends_at > NOW())
       AND COALESCE(p.price_minor, s.price_minor, 0) > 0
     ORDER BY (s.ends_at IS NULL) DESC, s.ends_at DESC
     LIMIT 1`,
    [userId],
  );

  const row = Array.isArray(rows) ? rows[0] as SubscriptionSummaryRow | undefined : undefined;
  if (!row) return null;

  return buildSubscriptionSummary(row);
}

export async function hasPremiumSubscription(userId: string): Promise<boolean> {
  return (await getSubscriptionSummary(userId)) !== null;
}
