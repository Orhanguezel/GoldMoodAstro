// =============================================================
// FILE: modules/subscriptions/activate.service.ts
//
// "Abonelik ödemesi alındı → aboneliği başlat" adımının sağlayıcıdan bağımsız
// tek kaynağı. iyzico callback'i de Stripe webhook'u da burayı çağırır.
//
// NEDEN AYRI DOSYA: controller.ts iyzico servisini import ediyor; orders/
// complete.service.ts oradan import etseydi orders ↔ subscriptions döngüsü
// oluşurdu. Bu dosya yalnız db + schema'ya bakar, hiçbir sağlayıcıyı tanımaz.
//
// İdempotens: (user_id, provider_subscription_id) ikilisi zaten varsa hiçbir şey
// yapmaz — webhook tekrar teslimatı ikinci abonelik doğuramaz.
// =============================================================
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { subscriptionPlans, subscriptions } from './schema';

export type SubscriptionProviderSlug = 'stripe' | 'iyzipay' | 'manual';

export function computeSubscriptionEndAt(startAt: Date, period: 'monthly' | 'yearly' | 'lifetime') {
  if (period === 'lifetime') return null;
  const endAt = new Date(startAt.getTime());
  if (period === 'monthly') endAt.setMonth(endAt.getMonth() + 1);
  else endAt.setFullYear(endAt.getFullYear() + 1);
  return endAt;
}

async function userUsedSubscriptionTrial(userId: string): Promise<boolean> {
  const [rows] = await (db as any).session.client.query(
    `SELECT 1 FROM subscriptions WHERE user_id = ? AND trial_ends_at IS NOT NULL LIMIT 1`,
    [userId],
  );
  return Array.isArray(rows) && rows.length > 0;
}

export type ActivateResult =
  | { status: 'plan_not_found' }
  | { status: 'already_active'; subscriptionId: string }
  | { status: 'activated'; subscriptionId: string };

/**
 * Ödemesi tamamlanmış bir abonelik siparişini aboneliğe dönüştürür.
 * @param providerReferenceId sağlayıcıdaki ödeme/abonelik referansı (idempotens anahtarı)
 */
export async function activateSubscriptionForPaidOrder(args: {
  userId: string;
  planId: string;
  provider: SubscriptionProviderSlug;
  providerReferenceId: string;
}): Promise<ActivateResult> {
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, args.planId)).limit(1);
  if (!plan) return { status: 'plan_not_found' };

  const providerRef = String(args.providerReferenceId || '').trim();
  if (providerRef) {
    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.user_id, args.userId), eq(subscriptions.provider_subscription_id, providerRef)))
      .limit(1);
    if (existingSub) return { status: 'already_active', subscriptionId: existingSub.id };
  }

  const now = new Date();
  const periodEnd = computeSubscriptionEndAt(now, plan.period as 'monthly' | 'yearly' | 'lifetime');
  const trialDays = (await userUsedSubscriptionTrial(args.userId)) ? 0 : Number(plan.trial_days || 0);
  const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

  // Yeni ödeme öncekini devralır: aynı anda iki aktif abonelik olmamalı.
  const [active] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, args.userId), eq(subscriptions.status, 'active')))
    .limit(1);
  if (active) {
    await db
      .update(subscriptions)
      .set({ status: 'cancelled', auto_renew: 0, cancelled_at: now, cancellation_reason: 'replaced_by_payment' } as any)
      .where(eq(subscriptions.id, active.id));
  }

  const subscriptionId = randomUUID();
  await db.insert(subscriptions).values({
    id: subscriptionId,
    user_id: args.userId,
    plan_id: plan.id,
    provider: args.provider,
    provider_subscription_id: providerRef || subscriptionId,
    status: 'active',
    started_at: now,
    ends_at: periodEnd,
    trial_ends_at: trialEndsAt,
    auto_renew: 0,
    price_minor: plan.price_minor,
    currency: plan.currency || 'TRY',
  } as any);

  return { status: 'activated', subscriptionId };
}
