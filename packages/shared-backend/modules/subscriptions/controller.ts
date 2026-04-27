// src/modules/subscriptions/controller.ts
// FAZ 10 / T10-1 — minimal handlers (plans listele, me, cancel)

import { randomUUID } from 'crypto';
import type { RouteHandler } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders, paymentGateways, payments } from '../orders/schema';
import { IyzicoService, resolveIyzicoLocale } from '../orders/iyzico.service';
import { subscriptionPlans, subscriptions } from './schema';

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? '') as string;
  const email = (u?.email ?? '') as string;
  const full_name = (u?.full_name ?? u?.name ?? null) as string | null;
  const phone = (u?.phone ?? null) as string | null;
  return { id, email, full_name, phone };
}

function resolveGatewaySlug(input: unknown) {
  const slug = String((input ?? 'iyzipay')).trim();
  return slug || 'iyzipay';
}

function resolveLocale(req: { query?: unknown; locale?: string }): string {
  const q = ((req.query as Record<string, string> | undefined)?.locale ?? '').trim().toLowerCase();
  return q || (req.locale ?? '').trim().toLowerCase() || 'tr';
}

function parseJSONNotes<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toMoneyMinorToDecimalString(valueMinor: number): string {
  return (Number(valueMinor) / 100).toFixed(2);
}

function computeSubscriptionEndAt(startAt: Date, period: 'monthly' | 'yearly' | 'lifetime') {
  if (period === 'lifetime') return null;
  const endAt = new Date(startAt.getTime());
  if (period === 'monthly') {
    endAt.setMonth(endAt.getMonth() + 1);
  } else {
    endAt.setFullYear(endAt.getFullYear() + 1);
  }
  return endAt;
}

function resolveApiBase() {
  return (
    process.env.PUBLIC_URL ||
    process.env.BACKEND_URL ||
    (process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : 'http://localhost:8094')
  ).replace(/\/$/, '');
}

function getGatewayConfig(gateway: { config: string | null } | undefined, envFallbackBaseUrl?: string) {
  const parsed = parseJSONNotes<Record<string, string>>(gateway?.config ?? null) ?? {};
  const testMode = process.env.IYZICO_TEST_MODE;
  const fallbackBase = envFallbackBaseUrl ??
    (testMode === 'false' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com');

  return {
    apiKey:
      parsed.apiKey ??
      process.env.IYZIPAY_API_KEY ??
      process.env.IYZICO_API_KEY ??
      '',
    secretKey:
      parsed.secretKey ??
      process.env.IYZIPAY_SECRET_KEY ??
      process.env.IYZICO_SECRET_KEY ??
      '',
    baseUrl: parsed.baseUrl ?? fallbackBase,
  };
}

function resolveIyzicoResultPaymentId(result: Record<string, unknown>): string {
  const paymentId = result.paymentId;
  if (typeof paymentId === 'number') return String(paymentId);
  return String(paymentId ?? '').trim();
}

function resolveIyzicoPaymentPrice(result: Record<string, unknown>): string {
  const paidPrice = result.paidPrice;
  const amount = result.paymentAmount;

  if (typeof paidPrice === 'string' && paidPrice.trim()) return paidPrice.trim();
  if (typeof paidPrice === 'number') return paidPrice.toFixed(2);
  if (typeof amount === 'string' && amount.trim()) return amount.trim();
  if (typeof amount === 'number') return amount.toFixed(2);
  return '0.00';
}

/** GET /subscriptions/plans — public, aktif planlar */
export const listPlans: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.is_active, 1))
    .orderBy(subscriptionPlans.display_order);
  return reply.send({ data: rows });
};

/** GET /subscriptions/me — auth, kullanıcının aktif aboneliği (yoksa null) */
export const getMySubscription: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);

  return reply.send({ data: rows[0] ?? null });
};

/** POST /subscriptions/cancel — auth, 1-tıkla iptal (anti-dark-pattern: friction yok) */
export const cancelMySubscription: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const body = (req.body ?? {}) as { reason?: string };

  const [active] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);

  if (!active) {
    return reply.code(404).send({ error: { message: 'no_active_subscription' } });
  }

  await db
    .update(subscriptions)
    .set({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: body.reason ?? null,
      auto_renew: 0,
    })
    .where(eq(subscriptions.id, active.id));

  return reply.send({ data: { id: active.id, status: 'cancelled', ends_at: active.ends_at } });
};

/** POST /subscriptions/start — auth, subscription başlangıç / ödeme başlangıç */
export const startSubscription: RouteHandler = async (req, reply) => {
  const { id: userId, email, full_name, phone } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const body = (req.body ?? {}) as {
    plan_id?: string;
    plan_code?: string;
    payment_gateway_slug?: string;
  };

  const selector = String((body.plan_id || body.plan_code || '').trim());
  if (!selector) {
    return reply.code(400).send({ error: { message: 'plan_id_required' } });
  }

  const [planById] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, selector)).limit(1);
  const [planByCode] = planById
    ? [planById]
    : await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, selector)).limit(1);

  const plan = planByCode;
  if (!plan) {
    return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });
  }

  if (!plan.is_active) {
    return reply.code(400).send({ error: { message: 'subscription_plan_not_active' } });
  }

  const currency = plan.currency || 'TRY';
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);

  if (plan.price_minor <= 0) {
    const startedAt = new Date();
    const trialEndsAt =
      plan.trial_days > 0 ? new Date(startedAt.getTime() + plan.trial_days * 24 * 60 * 60 * 1000) : null;

    const endsAt =
      existing?.plan_id === plan.id ? existing.ends_at : computeSubscriptionEndAt(startedAt, plan.period);

    const subscriptionId = existing && existing.plan_id === plan.id ? existing.id : randomUUID();

    if (existing && existing.plan_id === plan.id) {
      return reply.send({
        data: {
          id: existing.id,
          status: existing.status,
          started_at: existing.started_at,
          ends_at: existing.ends_at,
          payment_provider: existing.provider,
        },
      });
    }

    if (existing) {
      await db
        .update(subscriptions)
        .set({ status: 'cancelled', auto_renew: 0, cancelled_at: new Date(), cancellation_reason: 'replaced_by_free_plan' })
        .where(eq(subscriptions.id, existing.id));
    }

    await db.insert(subscriptions).values({
      id: subscriptionId,
      user_id: userId,
      plan_id: plan.id,
      provider: 'manual',
      status: 'active',
      started_at: startedAt,
      ends_at: endsAt,
      trial_ends_at: trialEndsAt,
      auto_renew: plan.period === 'lifetime' ? 0 : 1,
      price_minor: plan.price_minor,
      currency,
    } as any);

    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);

    return reply.send({ data: row ?? null });
  }

  const gatewaySlug = resolveGatewaySlug(body.payment_gateway_slug);
  const [gateway] = await db
    .select()
    .from(paymentGateways)
    .where(and(eq(paymentGateways.slug, gatewaySlug), eq(paymentGateways.is_active, 1)))
    .limit(1);

  if (!gateway) {
    return reply.code(400).send({ error: { message: 'payment_gateway_not_found' } });
  }

  const orderId = randomUUID();
  const orderNumber = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await db.insert(orders).values({
    id: orderId,
    user_id: userId,
    booking_id: null,
    order_number: orderNumber,
    status: 'pending',
    total_amount: toMoneyMinorToDecimalString(plan.price_minor),
    currency,
    payment_gateway_id: gateway.id,
    payment_status: 'unpaid',
    notes: JSON.stringify({
      context: 'subscription_start',
      plan_id: plan.id,
      plan_code: plan.code,
      user_id: userId,
    }),
  } as any);

  const callbackUrl = `${resolveApiBase()}/api/v1/subscriptions/webhook?order_id=${orderId}`;
  const iyzicoLocale = resolveIyzicoLocale(resolveLocale(req));
  const iyzico = new IyzicoService(getGatewayConfig(gateway));

  const names = (full_name || 'Müşteri').trim().split(/\s+/);
  const buyerName = names.shift() || 'Müşteri';
  const buyerSurname = names.join(' ') || '.';
  const name = email || `${buyerName} ${buyerSurname}`.trim() || 'Müşteri';

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId: `sub-${orderNumber}`,
      price: toMoneyMinorToDecimalString(plan.price_minor),
      paidPrice: toMoneyMinorToDecimalString(plan.price_minor),
      currency,
      basketId: orderNumber,
      callbackUrl,
      buyer: {
        id: userId,
        name: buyerName,
        surname: buyerSurname,
        gsmNumber: phone || '+905000000000',
        email: email || 'customer@example.com',
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: 'Kayıt adresi belirtilmedi',
        ip: req.ip,
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: name,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Adres belirtilmedi',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: name,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Adres belirtilmedi',
        zipCode: '34000',
      },
      basketItems: [
        {
          id: plan.id,
          name: `${plan.name_tr} (${plan.period})`,
          category1: 'Subscription',
          itemType: 'VIRTUAL',
          price: toMoneyMinorToDecimalString(plan.price_minor),
        },
      ],
    });

    if (result.status === 'success') {
      return reply.send({
        data: {
          order_id: orderId,
          plan_id: plan.id,
          checkout_url: result['paymentPageUrl'],
          token: result['token'],
        },
      });
    }

    await db
      .update(orders)
      .set({ status: 'cancelled', payment_status: 'failed', updated_at: new Date() })
      .where(eq(orders.id, orderId));

    return reply.code(400).send({ error: { message: String(result['errorMessage'] || 'subscription_payment_init_failed') } });
  } catch (err) {
    await db
      .update(orders)
      .set({ status: 'cancelled', payment_status: 'failed', updated_at: new Date() })
      .where(eq(orders.id, orderId));
    const message = err instanceof Error ? err.message : 'subscription_payment_init_failed';
    return reply.code(500).send({ error: { message } });
  }
};

/** POST /subscriptions/webhook — Iyzipay checkout callback */
export const subscriptionWebhook: RouteHandler = async (req, reply) => {
  const query = (req.query as Record<string, string | undefined>) ?? {};
  const body = (req.body ?? {}) as { token?: string; order_id?: string };
  const orderId = String(query.order_id || body.order_id || '').trim();
  const token = String(query.token || body.token || '').trim();

  if (!orderId || !token) {
    return reply.code(400).send({ error: { message: 'order_id_and_token_required' } });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    return reply.code(404).send({ error: { message: 'order_not_found' } });
  }

  if (order.payment_status === 'paid' && order.status === 'processing') {
    return reply.send({ data: { order_id: orderId, status: order.payment_status } });
  }

  let [gateway] = await db
    .select()
    .from(paymentGateways)
    .where(and(eq(paymentGateways.id, order.payment_gateway_id || ''), eq(paymentGateways.is_active, 1)))
    .limit(1);

  if (!gateway) {
    const [fallback] = await db
      .select()
      .from(paymentGateways)
      .where(and(eq(paymentGateways.slug, 'iyzipay'), eq(paymentGateways.is_active, 1)))
      .limit(1);
    gateway = fallback;
  }

  if (!gateway) {
    return reply.code(400).send({ error: { message: 'payment_gateway_not_found' } });
  }

  const cfg = getGatewayConfig(gateway);
  const iyzico = new IyzicoService(cfg);

  const result = await iyzico.retrieveCheckoutResult(token);

  const paymentId = resolveIyzicoResultPaymentId(result);
  const paidPrice = resolveIyzicoPaymentPrice(result);
  const isPaid = String(result.status) === 'success' && String(result.paymentStatus).toUpperCase() === 'SUCCESS';
  const payStatus = isPaid ? 'success' : 'failure';

  if (order.payment_status === 'paid' && order.status === 'processing') {
    return reply.send({ data: { order_id: orderId, paid: true, status: order.payment_status } });
  }

  const [existingPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.order_id, orderId), eq(payments.transaction_id, paymentId || token)))
    .limit(1);

  if (!existingPayment) {
    await db.insert(payments).values({
      id: randomUUID(),
      order_id: orderId,
      gateway_id: gateway.id,
      transaction_id: paymentId || token,
      amount: paidPrice || String(order.total_amount || '0'),
      currency: (result.currency as string | undefined) || order.currency || 'TRY',
      status: payStatus,
      raw_response: JSON.stringify(result),
    } as any);
  }

  await db
    .update(orders)
    .set({
      payment_status: isPaid ? 'paid' : 'failed',
      status: isPaid ? 'processing' : 'cancelled',
      transaction_id: paymentId || token,
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  if (isPaid) {
    const notes = parseJSONNotes<{ context?: string; plan_id?: string }>(order.notes ?? null);
    const planId = notes?.plan_id;
    if (!planId) {
      return reply.code(400).send({ error: { message: 'subscription_context_not_found' } });
    }

    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
    if (!plan) {
      return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });
    }

    const now = new Date();
    const periodEnd = computeSubscriptionEndAt(now, plan.period);
    const trialDays = Number(plan.trial_days || 0);
    const trialEndsAt = trialDays > 0
      ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
      : null;

    const [active] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.user_id, order.user_id), eq(subscriptions.status, 'active')))
      .limit(1);

    const providerReferenceId =
      String((result.subscriptionReferenceCode as string | undefined) || paymentId || '').trim();
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.user_id, order.user_id), eq(subscriptions.provider_subscription_id, providerReferenceId)),
      )
      .limit(1);

    if (existingSub) {
      return reply.send({ data: existingSub, order_id: orderId });
    }

    if (active) {
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          auto_renew: 0,
          cancelled_at: now,
          cancellation_reason: 'replaced_by_payment',
        })
        .where(eq(subscriptions.id, active.id));
    }

    const subscriptionId = randomUUID();
    await db.insert(subscriptions).values({
      id: subscriptionId,
      user_id: order.user_id,
      plan_id: plan.id,
      provider: 'iyzipay',
      provider_subscription_id: providerReferenceId,
      status: 'active',
      started_at: now,
      ends_at: periodEnd,
      trial_ends_at: trialEndsAt,
      auto_renew: 1,
      price_minor: plan.price_minor,
      currency: plan.currency || 'TRY',
    } as any);

    const [created] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    return reply.send({ data: created, order_id: orderId });
  }

  return reply.send({ data: { order_id: orderId, paid: false } });
};

/** POST /subscriptions/verify-receipt — Apple/Google IAP doğrulama hook */
export const verifyReceipt: RouteHandler = async (req, reply) => {
  const body = (req.body ?? {}) as {
    platform?: string;
    receipt?: string;
    transaction_id?: string;
  };

  const platform = String(body.platform || '').toLowerCase();
  const receipt = String(body.receipt || '').trim();

  if (!['apple', 'google', 'apple_iap', 'google_iap'].includes(platform)) {
    return reply.code(400).send({ error: { message: 'unsupported_platform' } });
  }

  if (!receipt) {
    return reply.code(400).send({ error: { message: 'receipt_required' } });
  }

  return reply.send({
    data: {
      platform,
      valid: false,
      transaction_id: String(body.transaction_id || ''),
      message: 'IAP receipt verification is not implemented in this phase.',
      next: 'integration_pending',
    },
  });
};
