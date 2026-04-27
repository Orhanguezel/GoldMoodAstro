// src/modules/subscriptions/controller.ts
// FAZ 10 / T10-1 — minimal handlers (plans listele, me, cancel)

import { randomUUID } from 'crypto';
import type { RouteHandler } from 'fastify';
import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { GoogleAuth } from 'google-auth-library';
import { db } from '../../db/client';
import { orders, paymentGateways, payments } from '../orders/schema';
import { IyzicoService, resolveIyzicoLocale } from '../orders/iyzico.service';
import { subscriptionPlans, subscriptions } from './schema';
import { users } from '../auth/schema';

type AdminSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'grace_period'
  | 'past_due';

type SubscriptionPlanPeriod = 'monthly' | 'yearly' | 'lifetime';

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

const ADMIN_SUBSCRIPTION_STATUS = new Set<AdminSubscriptionStatus>([
  'pending',
  'active',
  'cancelled',
  'expired',
  'grace_period',
  'past_due',
]);

const ADMIN_PLAN_PERIOD = new Set<SubscriptionPlanPeriod>(['monthly', 'yearly', 'lifetime']);

function asString(value: unknown) {
  return String(value ?? '').trim();
}

function asBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }
  return false;
}

function asPositiveInt(value: unknown, fallback = 0, min = 0) {
  const n = Number(asString(value));
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return i < min ? min : i;
}

function toAdminSubscriptionStatus(v: unknown): AdminSubscriptionStatus | '' {
  const s = asString(v);
  return ADMIN_SUBSCRIPTION_STATUS.has(s as AdminSubscriptionStatus)
    ? (s as AdminSubscriptionStatus)
    : '';
}

function normalizePlanPeriod(v: unknown): SubscriptionPlanPeriod | '' {
  const s = asString(v);
  return ADMIN_PLAN_PERIOD.has(s as SubscriptionPlanPeriod) ? (s as SubscriptionPlanPeriod) : '';
}

function parseFeatures(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((v) => v.trim()).filter(Boolean);
      }
    } catch {
      return raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }

  return null;
}

type IapPlatform = 'apple_iap' | 'google_iap';

type IapVerificationResult = {
  valid: boolean;
  reason?: string;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  expiresAt?: Date | null;
};

function asDateFromMs(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const d = new Date(value.length > 9 ? n : n * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function asNum(value: unknown): number {
  const n = Number(asString(value));
  return Number.isFinite(n) ? n : NaN;
}

async function postJson(url: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function parseServiceAccount(raw: string): Record<string, string> | null {
  if (!raw.trim()) return null;
  const normalized = raw.replace(/\\n/g, '\n').trim();
  try {
    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
  } catch {}

  return null;
}

async function resolveGoogleAccessToken(): Promise<string> {
  const explicitToken = asString(process.env.IAP_GOOGLE_ACCESS_TOKEN);
  if (explicitToken) return explicitToken;

  const rawServiceAccount = asString(process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!rawServiceAccount) {
    throw new Error('google_service_account_missing');
  }

  const credentials = parseServiceAccount(rawServiceAccount);
  if (!credentials) {
    throw new Error('google_service_account_invalid');
  }

  const client = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await client.getClient();
  const tokenData = await authClient.getAccessToken();
  const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
  if (!token) throw new Error('google_access_token_unavailable');
  return token;
}

async function verifyAppleReceipt(params: {
  receipt: string;
  transactionId?: string;
  productId?: string;
}): Promise<IapVerificationResult> {
  const bundleId = asString(process.env.IAP_APPLE_BUNDLE_ID);
  if (!bundleId) {
    return { valid: false, reason: 'apple_bundle_id_missing' };
  }

  const sharedSecret = asString(process.env.IAP_APPLE_SHARED_SECRET);
  const requestBody = {
    'receipt-data': params.receipt,
    password: sharedSecret || undefined,
    'exclude-old-transactions': true,
  };

  const endpoints = ['https://buy.itunes.apple.com/verifyReceipt', 'https://sandbox.itunes.apple.com/verifyReceipt'];
  const useSandboxFirst = asBool(process.env.IAP_APPLE_USE_SANDBOX);
  const orderedEndpoints = useSandboxFirst ? [...endpoints].reverse() : endpoints;

  let lastError: string | undefined;

  for (const endpoint of orderedEndpoints) {
    const response = await postJson(endpoint, requestBody);
    if (!response.status || response.status >= 500) {
      lastError = 'apple_receipt_service_error';
      continue;
    }

    const data = response.data as {
      status?: number;
      environment?: string;
      receipt?: { in_app?: unknown[]; bundle_id?: string };
      latest_receipt_info?: unknown[];
    };

    const status = asNum(data.status);
    if (!Number.isFinite(status)) {
      return { valid: false, reason: 'apple_receipt_invalid_response' };
    }

    if (status === 21007) {
      if (endpoint === 'https://buy.itunes.apple.com/verifyReceipt') {
        continue;
      }
      return { valid: false, reason: 'apple_receipt_invalid_test' };
    }

    if (status === 21008) {
      return { valid: false, reason: 'apple_receipt_invalid_prod' };
    }

    if (status === 21005 || status !== 0) {
      return { valid: false, reason: `apple_receipt_status_${status}` };
    }

    if (bundleId && data.receipt?.bundle_id && data.receipt.bundle_id !== bundleId) {
      return { valid: false, reason: 'apple_receipt_wrong_bundle' };
    }

    const receiptItems = [...(data.latest_receipt_info ?? []), ...(data.receipt?.in_app ?? [])] as Array<
      Record<string, unknown>
    >;
    const txId = asString(params.transactionId);
    const prodId = asString(params.productId);
    const normalized =
      receiptItems.find((item) => {
        const itemTx = asString(item.transaction_id);
        const itemOriginalTx = asString(item.original_transaction_id);
        const itemProductId = asString(item.product_id);
        const matchesTx = txId ? itemTx === txId || itemOriginalTx === txId : false;
        const matchesProduct = prodId ? itemProductId === prodId : false;
        return matchesTx || matchesProduct;
      }) ?? receiptItems[0];

    if (!normalized && (receiptItems.length || txId || prodId)) {
      return { valid: false, reason: 'apple_receipt_no_items' };
    }

    if (!normalized && !txId && !prodId) {
      return { valid: false, reason: 'apple_receipt_transaction_not_found' };
    }

    const providerSubscriptionId = asString(normalized?.original_transaction_id || normalized?.transaction_id || txId || params.receipt.slice(0, 240));
    const providerCustomerId = asString(normalized?.app_account_token || normalized?.web_order_line_item_id);
    const expiresAt = asDateFromMs(normalized?.expires_date_ms);

    return {
      valid: true,
      providerSubscriptionId: providerSubscriptionId || null,
      providerCustomerId: providerCustomerId || null,
      expiresAt: expiresAt || null,
    };
  }

  return { valid: false, reason: lastError || 'apple_receipt_verification_failed' };
}

async function verifyGoogleReceipt(params: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<IapVerificationResult> {
  const token = await resolveGoogleAccessToken();
  const encodedPackage = encodeURIComponent(params.packageName);
  const encodedProduct = encodeURIComponent(params.productId);
  const encodedToken = encodeURIComponent(params.purchaseToken);

  const subscriptionEndpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodedPackage}/purchases/subscriptions/${encodedProduct}/tokens/${encodedToken}`;
  const productEndpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodedPackage}/purchases/products/${encodedProduct}/tokens/${encodedToken}`;

  const headers = { Authorization: `Bearer ${token}` };

  let response = await fetch(subscriptionEndpoint, { headers });
  let body = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (response.status === 404) {
    response = await fetch(productEndpoint, { headers });
    body = await response.json().catch(() => ({})) as Record<string, unknown>;
  }

  if (!response.ok) {
    const errorPayload = body.error as Record<string, unknown> | undefined;
    const errorCode = asString(
      errorPayload?.code ?? body.errorCode ?? (errorPayload?.['code'] as string | number | undefined),
    );
    return { valid: false, reason: `google_purchase_not_found_${errorCode || response.status}` };
  }

  const orderId = asString(body.orderId || body.purchaseToken);
  const purchaseState = asNum(body.purchaseState);
  const autoRenewing = asString(body.autoRenewing);
  const expiryMillis = asString(body.expiryTimeMillis);
  const paid = asNum(body.paymentState) === 1;
  const providerCustomerId = asString(body.obfuscatedExternalProfileId || body.obfuscatedAccountId || body.accountId);
  const expiresAt = asDateFromMs(expiryMillis);
  const isValidState = purchaseState === 0 || paid || autoRenewing === 'true' || (expiresAt ? true : false);

  if (!isValidState) {
    return { valid: false, reason: 'google_purchase_not_active' };
  }

  return {
    valid: true,
    providerSubscriptionId: orderId || params.purchaseToken,
    providerCustomerId: providerCustomerId || null,
    expiresAt,
  };
}

function toAdminWhereClause(
  query: Record<string, unknown>,
): SQL<unknown> | undefined {
  const where: SQL[] = [];

  const status = toAdminSubscriptionStatus(query.status);
  if (status) where.push(eq(subscriptions.status, status));

  const userId = asString(query.user_id);
  if (userId) where.push(eq(subscriptions.user_id, userId));

  const planId = asString(query.plan_id);
  if (planId) where.push(eq(subscriptions.plan_id, planId));

  const provider = asString(query.provider);
  if (provider) where.push(eq(subscriptions.provider, provider as never));

  const q = asString(query.q);
  if (q) {
    const wildcard = `%${q}%`;
    where.push(
      or(
        like(subscriptions.id, wildcard),
        like(subscriptions.provider_subscription_id, wildcard),
        like(users.email, wildcard),
        like(users.full_name, wildcard),
        like(subscriptionPlans.code, wildcard),
        like(subscriptionPlans.name_tr, wildcard),
        like(subscriptionPlans.name_en, wildcard),
      ) as SQL,
    );
  }

  if (where.length === 0) return undefined;
  return where.length === 1 ? where[0] : and(...where);
}

function toPlanWhereClause(query: Record<string, unknown>): SQL<unknown> | undefined {
  const where: SQL[] = [];

  const isActiveRaw = query.is_active;
  if (isActiveRaw !== undefined) {
    const isActive = asBool(isActiveRaw);
    if (String(isActiveRaw).trim().length > 0) where.push(eq(subscriptionPlans.is_active, isActive ? 1 : 0));
  }

  const isLif = asString(query.period);
  if (isLif) where.push(eq(subscriptionPlans.period, isLif as never));

  const q = asString(query.q);
  if (q) {
    const wildcard = `%${q}%`;
    where.push(
      or(
        like(subscriptionPlans.code, wildcard),
        like(subscriptionPlans.name_tr, wildcard),
        like(subscriptionPlans.name_en, wildcard),
        like(subscriptionPlans.description_tr, wildcard),
        like(subscriptionPlans.description_en, wildcard),
      ) as SQL,
    );
  }

  if (where.length === 0) return undefined;
  return where.length === 1 ? where[0] : and(...where);
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
    plan_id?: string;
    plan_code?: string;
    receipt?: string;
    transaction_id?: string;
    purchase_token?: string;
    product_id?: string;
  };

  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const platformInput = String(body.platform || '').toLowerCase();
  const platform: IapPlatform | null =
    platformInput === 'apple' || platformInput === 'apple_iap'
      ? 'apple_iap'
      : platformInput === 'google' || platformInput === 'google_iap'
        ? 'google_iap'
        : null;

  const planSelector = String(body.plan_id || body.plan_code || '').trim();
  const receipt = String(body.receipt || '').trim();
  const transactionId = String(body.transaction_id || '').trim();
  const purchaseToken = String(body.purchase_token || '').trim();
  const productId = String(body.product_id || '').trim();

  if (!platform) {
    return reply.code(400).send({ error: { message: 'unsupported_platform' } });
  }

  if (!planSelector) {
    return reply.code(400).send({ error: { message: 'plan_id_required' } });
  }

  if (!receipt && !transactionId && !purchaseToken && !productId) {
    return reply.code(400).send({ error: { message: 'receipt_required' } });
  }

  const [planById] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planSelector)).limit(1);
  const [planByCode] = planById
    ? [planById]
    : await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, planSelector)).limit(1);

  const plan = planByCode;
  if (!plan) {
    return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });
  }

  if (!plan.is_active) {
    return reply.code(400).send({ error: { message: 'subscription_plan_not_active' } });
  }

  const now = new Date();
  const trialEndsAt =
    plan.trial_days > 0 ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000) : null;
  let verification: IapVerificationResult;

  try {
    if (platform === 'apple_iap') {
      verification = await verifyAppleReceipt({
        receipt,
        transactionId,
        productId,
      });
    } else {
      const packageName = asString(process.env.IAP_GOOGLE_PACKAGE_NAME);
      if (!packageName) {
        return reply.code(500).send({ error: { message: 'google_package_name_missing' } });
      }

      if (!purchaseToken || !productId) {
        return reply.code(400).send({ error: { message: 'purchase_token_and_product_id_required' } });
      }

      verification = await verifyGoogleReceipt({
        packageName,
        productId,
        purchaseToken,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'iap_verification_failed';
    return reply.code(400).send({ error: { message } });
  }

  if (!verification.valid || !verification.providerSubscriptionId) {
    return reply.code(400).send({ error: { message: verification.reason || 'receipt_invalid' } });
  }

  const providerSubscriptionId = verification.providerSubscriptionId || transactionId || purchaseToken || productId || receipt.slice(0, 240);
  const periodEnd = verification.expiresAt ?? computeSubscriptionEndAt(now, plan.period);

  const [existingByProvider] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.provider, platform),
        eq(subscriptions.provider_subscription_id, providerSubscriptionId),
      ),
    )
    .limit(1);

  if (existingByProvider) {
    if (existingByProvider.user_id !== userId) {
      return reply.code(409).send({ error: { message: 'transaction_already_used' } });
    }

    await db
      .update(subscriptions)
      .set({
        status: 'active',
        started_at: existingByProvider.started_at ?? now,
        ends_at: existingByProvider.ends_at ?? periodEnd,
        trial_ends_at: existingByProvider.trial_ends_at ?? trialEndsAt,
        auto_renew: plan.period === 'lifetime' ? 0 : 1,
        price_minor: plan.price_minor,
        currency: plan.currency || 'TRY',
        provider_customer_id: verification.providerCustomerId || existingByProvider.provider_customer_id || null,
        plan_id: existingByProvider.plan_id === plan.id ? existingByProvider.plan_id : plan.id,
        provider: platform as 'apple_iap' | 'google_iap',
      })
      .where(eq(subscriptions.id, existingByProvider.id));

    const [refetched] = await db.select().from(subscriptions).where(eq(subscriptions.id, existingByProvider.id)).limit(1);
    return reply.send({
      data: {
        platform,
        valid: true,
        transaction_id: transactionId,
        reason: verification.reason,
        subscription: refetched,
      },
    });
  }

  const [active] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);

  if (active) {
    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        auto_renew: 0,
        cancelled_at: now,
        cancellation_reason: 'replaced_by_iap',
      })
      .where(eq(subscriptions.id, active.id));
  }

  const subscriptionId = randomUUID();
  await db.insert(subscriptions).values({
    id: subscriptionId,
    user_id: userId,
    plan_id: plan.id,
    provider: platform as 'apple_iap' | 'google_iap',
    provider_subscription_id: providerSubscriptionId,
    provider_customer_id: verification.providerCustomerId || null,
    status: 'active',
    started_at: now,
    ends_at: periodEnd,
    trial_ends_at: trialEndsAt,
    auto_renew: plan.period === 'lifetime' ? 0 : 1,
    price_minor: plan.price_minor,
    currency: plan.currency || 'TRY',
  } as any);

  const [created] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);

  return reply.send({
    data: {
      platform,
      valid: true,
      transaction_id: transactionId,
      subscription: created,
    },
  });
};

/** ===== ADMIN ===== */

/**
 * GET /admin/subscriptions
 * Query: status | q | user_id | plan_id | provider | limit | offset
 */
export const listSubscriptionsAdmin: RouteHandler = async (req, reply) => {
  const q = (req.query as Record<string, unknown>) ?? {};
  const limit = asPositiveInt(q.limit, 50, 1);
  const offset = asPositiveInt(q.offset, 0, 0);

  const predicate = toAdminWhereClause(q);
  const base = db
    .select({
      id: subscriptions.id,
      user_id: subscriptions.user_id,
      plan_id: subscriptions.plan_id,
      provider: subscriptions.provider,
      provider_subscription_id: subscriptions.provider_subscription_id,
      provider_customer_id: subscriptions.provider_customer_id,
      status: subscriptions.status,
      started_at: subscriptions.started_at,
      ends_at: subscriptions.ends_at,
      trial_ends_at: subscriptions.trial_ends_at,
      cancelled_at: subscriptions.cancelled_at,
      cancellation_reason: subscriptions.cancellation_reason,
      auto_renew: subscriptions.auto_renew,
      price_minor: subscriptions.price_minor,
      currency: subscriptions.currency,
      created_at: subscriptions.created_at,
      updated_at: subscriptions.updated_at,
      user_email: users.email,
      user_full_name: users.full_name,
      user_phone: users.phone,
      plan_code: subscriptionPlans.code,
      plan_name_tr: subscriptionPlans.name_tr,
      plan_name_en: subscriptionPlans.name_en,
    })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.user_id))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.plan_id));

  const rows = await (predicate ? base.where(predicate) : base)
    .orderBy(desc(subscriptions.created_at))
    .limit(limit)
    .offset(offset);

  const countQuery = db
    .select({ total: sql<number>`COUNT(*)` })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.user_id))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.plan_id));

  const countRows = await (predicate ? countQuery.where(predicate) : countQuery);
  const total = Number((countRows[0] as { total: number } | undefined)?.total ?? rows.length);

  return reply.send({
    data: rows,
    limit,
    offset,
    total,
  });
};

/**
 * GET /admin/subscriptions/:id
 */
export const getSubscriptionAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const id = asString(req.params?.id);
  if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

  const [row] = await db
    .select({
      id: subscriptions.id,
      user_id: subscriptions.user_id,
      plan_id: subscriptions.plan_id,
      provider: subscriptions.provider,
      provider_subscription_id: subscriptions.provider_subscription_id,
      provider_customer_id: subscriptions.provider_customer_id,
      status: subscriptions.status,
      started_at: subscriptions.started_at,
      ends_at: subscriptions.ends_at,
      trial_ends_at: subscriptions.trial_ends_at,
      cancelled_at: subscriptions.cancelled_at,
      cancellation_reason: subscriptions.cancellation_reason,
      auto_renew: subscriptions.auto_renew,
      price_minor: subscriptions.price_minor,
      currency: subscriptions.currency,
      created_at: subscriptions.created_at,
      updated_at: subscriptions.updated_at,
      user_email: users.email,
      user_full_name: users.full_name,
      user_phone: users.phone,
      plan_code: subscriptionPlans.code,
      plan_name_tr: subscriptionPlans.name_tr,
      plan_name_en: subscriptionPlans.name_en,
      plan_description_tr: subscriptionPlans.description_tr,
      plan_description_en: subscriptionPlans.description_en,
    })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.user_id))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.plan_id))
    .where(eq(subscriptions.id, id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'subscription_not_found' } });
  }

  return reply.send({ data: row });
};

/**
 * POST /admin/subscriptions/:id/refund
 */
export const refundSubscriptionAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const id = asString(req.params?.id);
  if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

  const body = (req.body as { reason?: string; ended_at?: string | null }) ?? {};
  const now = new Date();
  const reason = asString(body.reason) || 'admin_refund_or_cancel';

  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'subscription_not_found' } });

  if (row.status === 'cancelled') {
    return reply.send({
      data: {
        subscription: row,
        message: 'already_cancelled',
      },
    });
  }

  const endsAt = asString(body.ended_at);
  const endDate = endsAt ? new Date(endsAt) : now;

  await db
    .update(subscriptions)
    .set({
      status: 'cancelled',
      auto_renew: 0,
      cancelled_at: now,
      cancellation_reason: reason,
      ends_at: Number.isNaN(endDate.getTime()) ? now : endDate,
    })
    .where(eq(subscriptions.id, id));

  const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return reply.send({ data: updated, refunded: true });
};

/** GET /admin/subscription-plans */
export const listSubscriptionPlansAdmin: RouteHandler = async (req, reply) => {
  const q = (req.query as Record<string, unknown>) ?? {};
  const limit = asPositiveInt(q.limit, 200, 1);
  const offset = asPositiveInt(q.offset, 0, 0);

  const where = toPlanWhereClause(q);
  const base = db
    .select()
    .from(subscriptionPlans)
    .orderBy(subscriptionPlans.display_order, desc(subscriptionPlans.created_at));

  const rows = await (where ? base.where(where) : base).limit(limit).offset(offset);

  const countRows = await (where
    ? db.select({ total: sql<number>`COUNT(*)` }).from(subscriptionPlans).where(where)
    : db.select({ total: sql<number>`COUNT(*)` }).from(subscriptionPlans));

  return reply.send({
    data: rows,
    limit,
    offset,
    total: Number((countRows[0] as { total: number }).total),
  });
};

/** GET /admin/subscription-plans/:id */
export const getSubscriptionPlanAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const id = asString(req.params?.id);
  if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

  const [row] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });

  return reply.send({ data: row });
};

/** POST /admin/subscription-plans */
export const createSubscriptionPlanAdmin: RouteHandler = async (req, reply) => {
  const body = (req.body as Record<string, unknown>) ?? {};
  const code = asString(body.code);
  const nameTr = asString(body.name_tr);
  const nameEn = asString(body.name_en);
  if (!code || !nameTr || !nameEn) {
    return reply.code(400).send({ error: { message: 'required_fields_missing' } });
  }

  const period = normalizePlanPeriod(body.period);
  if (!period) {
    return reply.code(400).send({ error: { message: 'invalid_period' } });
  }

  const [exists] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, code)).limit(1);
  if (exists) {
    return reply.code(409).send({ error: { message: 'subscription_plan_code_conflict' } });
  }

  const features = parseFeatures((body as { features?: unknown }).features);
  const id = randomUUID();
  const currency = asString(body.currency) || 'TRY';
  const priceMinor = asPositiveInt(body.price_minor, 0, 0);
  const trialDays = asPositiveInt(body.trial_days, 0, 0);
  const displayOrder = asPositiveInt(body.display_order, 0, 0);
  const isActive = asBool(body.is_active);

  await db.insert(subscriptionPlans).values({
    id,
    code,
    name_tr: nameTr,
    name_en: nameEn,
    description_tr: asString((body as { description_tr?: unknown }).description_tr) || null,
    description_en: asString((body as { description_en?: unknown }).description_en) || null,
    price_minor: priceMinor,
    currency,
    period,
    trial_days: trialDays,
    features: features as unknown as never,
    is_active: isActive ? 1 : 0,
    display_order: displayOrder,
  } as never);

  const [created] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return reply.send({ data: created });
};

/** PATCH /admin/subscription-plans/:id */
export const updateSubscriptionPlanAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const id = asString(req.params?.id);
  if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

  const body = (req.body as Record<string, unknown>) ?? {};
  const patch: Record<string, unknown> = {};

  if (body.code !== undefined) {
    const code = asString(body.code);
    if (!code) return reply.code(400).send({ error: { message: 'code_required' } });

    const [conflict] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, code))
      .limit(1);
    if (conflict && conflict.id !== id) {
      return reply.code(409).send({ error: { message: 'subscription_plan_code_conflict' } });
    }
    patch.code = code;
  }

  if (body.name_tr !== undefined) {
    const v = asString(body.name_tr);
    if (!v) return reply.code(400).send({ error: { message: 'name_tr_required' } });
    patch.name_tr = v;
  }

  if (body.name_en !== undefined) {
    const v = asString(body.name_en);
    if (!v) return reply.code(400).send({ error: { message: 'name_en_required' } });
    patch.name_en = v;
  }

  if (body.description_tr !== undefined) patch.description_tr = asString(body.description_tr) || null;
  if (body.description_en !== undefined) patch.description_en = asString(body.description_en) || null;

  if (body.price_minor !== undefined) patch.price_minor = asPositiveInt(body.price_minor, 0, 0);
  if (body.currency !== undefined) patch.currency = asString(body.currency) || 'TRY';

  if (body.period !== undefined) {
    const period = normalizePlanPeriod(body.period);
    if (!period) return reply.code(400).send({ error: { message: 'invalid_period' } });
    patch.period = period;
  }

  if (body.trial_days !== undefined) patch.trial_days = asPositiveInt(body.trial_days, 0, 0);
  if (body.features !== undefined) patch.features = parseFeatures(body.features) as unknown as never;

  if (body.is_active !== undefined) patch.is_active = asBool(body.is_active) ? 1 : 0;
  if (body.display_order !== undefined) patch.display_order = asPositiveInt(body.display_order, 0, 0);

  if (Object.keys(patch).length === 0) {
    return reply.code(400).send({ error: { message: 'nothing_to_update' } });
  }

  const [existing] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  if (!existing) return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });

  await db.update(subscriptionPlans).set(patch as never).where(eq(subscriptionPlans.id, id));
  const [updated] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);

  return reply.send({ data: updated });
};

/** DELETE /admin/subscription-plans/:id */
export const deleteSubscriptionPlanAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const id = asString(req.params?.id);
  if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

  const [existing] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  if (!existing) return reply.code(404).send({ error: { message: 'subscription_plan_not_found' } });

  const countRows = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.plan_id, id));

  if (Number(countRows[0]?.total ?? 0) > 0) {
    return reply
      .code(409)
      .send({ error: { message: 'subscription_plan_in_use', active_users: countRows[0]?.total } });
  }

  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  return reply.send({ data: { id, deleted: true } });
};
