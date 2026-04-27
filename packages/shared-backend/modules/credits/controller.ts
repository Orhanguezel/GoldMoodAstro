// src/modules/credits/controller.ts
// FAZ 10 / T10-2 — minimal handlers (paket listele, me bakiye + işlemler)

import { randomUUID } from 'crypto';
import type { RouteHandler } from 'fastify';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { creditPackages, creditTransactions, userCredits } from './schema';
import { orders, paymentGateways, payments } from '../orders/schema';
import { IyzicoService, resolveIyzicoLocale } from '../orders/iyzico.service';

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

function toMoneyMinorToDecimalString(valueMinor: number): string {
  return (Number(valueMinor) / 100).toFixed(2);
}

function toCurrency(value: unknown) {
  return String(value ?? 'TRY');
}

function toIyzicoMoneyValue(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function parseJSONNotes<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function resolveApiBase() {
  return (
    process.env.PUBLIC_URL ||
    process.env.BACKEND_URL ||
    (process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : 'http://localhost:8094')
  ).replace(/\/$/, '');
}

function getGatewayConfig(gateway: { config: string | null } | undefined) {
  const parsed = parseJSONNotes<Record<string, string>>(gateway?.config ?? null) ?? {};
  const testMode = process.env.IYZICO_TEST_MODE;
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
    baseUrl:
      parsed.baseUrl ??
      (testMode === 'false' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com'),
  };
}

async function getOrCreateUserCredit(userId: string) {
  const [existing] = await db.select().from(userCredits).where(eq(userCredits.user_id, userId)).limit(1);
  if (existing) return existing;

  const id = randomUUID();
  await db.insert(userCredits).values({ id, user_id: userId, balance: 0 });
  const [created] = await db.select().from(userCredits).where(eq(userCredits.id, id)).limit(1);
  return created;
}

async function addCreditTransaction(params: {
  user_id: string;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  order_id: string | null;
  description: string;
}) {
  const wallet = await getOrCreateUserCredit(params.user_id);
  const newBalance = wallet.balance + params.amount;

  await db.update(userCredits).set({ balance: newBalance }).where(eq(userCredits.id, wallet.id));

  await db.insert(creditTransactions).values({
    id: randomUUID(),
    user_id: params.user_id,
    type: params.amount >= 0 ? 'purchase' : 'consumption',
    amount: params.amount,
    balance_after: newBalance,
    reference_type: params.reference_type,
    reference_id: params.reference_id,
    order_id: params.order_id,
    description: params.description,
  } as any);

  return newBalance;
}

/** GET /credits/packages — public */
export const listPackages: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.is_active, 1))
    .orderBy(creditPackages.display_order);
  return reply.send({ data: rows });
};

/** GET /credits/me — auth, bakiye + son 20 işlem */
export const getMyCredits: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const wallet = await getOrCreateUserCredit(userId);

  const txs = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.user_id, userId))
    .orderBy(desc(creditTransactions.created_at))
    .limit(20);

  return reply.send({
    data: {
      balance: wallet.balance,
      currency: wallet.currency,
      recent_transactions: txs,
    },
  });
};

/** POST /credits/purchase — create credit package payment (Iyzipay checkout) */
export const purchaseCredits: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  if (!user.id) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const body = (req.body ?? {}) as { package_id?: string; payment_gateway_slug?: string };
  const packageSelector = String(body.package_id || '').trim();
  if (!packageSelector) {
    return reply.code(400).send({ error: { message: 'package_id_required' } });
  }

  const [packageById] = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.id, packageSelector))
    .limit(1);
  const [pkgByCode] = packageById
    ? [packageById]
    : await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.code, packageSelector))
        .limit(1);

  const packageRow = pkgByCode;
  if (!packageRow || !packageRow.is_active) {
    return reply.code(404).send({ error: { message: 'credit_package_not_found' } });
  }

  if (packageRow.price_minor <= 0) {
    const newBalance = await addCreditTransaction({
      user_id: user.id,
      amount: packageRow.credits + packageRow.bonus_credits,
      reference_type: 'package',
      reference_id: packageRow.id,
      order_id: null,
      description: 'Ücretsiz kredi paketi alımı',
    });

    return reply.send({
      data: {
        free: true,
        credits_added: packageRow.credits + packageRow.bonus_credits,
        balance: newBalance,
      },
    });
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
  const orderNumber = `CRED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await db.insert(orders).values({
    id: orderId,
    user_id: user.id,
    booking_id: null,
    order_number: orderNumber,
    status: 'pending',
    total_amount: toMoneyMinorToDecimalString(packageRow.price_minor),
    currency: packageRow.currency || 'TRY',
    payment_gateway_id: gateway.id,
    payment_status: 'unpaid',
    notes: JSON.stringify({
      context: 'credit_purchase',
      package_id: packageRow.id,
    }),
  } as any);

  const callbackUrl = `${resolveApiBase()}/api/v1/credits/webhook?order_id=${orderId}`;
  const iyzicoLocale = resolveIyzicoLocale(resolveLocale(req));
  const iyzico = new IyzicoService(getGatewayConfig(gateway));

  const names = (user.full_name || 'Müşteri').trim().split(/\s+/);
  const buyerName = names.shift() || 'Müşteri';
  const buyerSurname = names.join(' ') || '.';
  const name = user.email || `${buyerName} ${buyerSurname}`.trim() || 'Müşteri';

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId: `cred-${orderNumber}`,
      price: toMoneyMinorToDecimalString(packageRow.price_minor),
      paidPrice: toMoneyMinorToDecimalString(packageRow.price_minor),
      currency: packageRow.currency || 'TRY',
      basketId: orderNumber,
      callbackUrl,
      buyer: {
        id: user.id,
        name: buyerName,
        surname: buyerSurname,
        gsmNumber: user.phone || '+905000000000',
        email: user.email || 'customer@example.com',
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
          id: packageRow.id,
          name: `Kredi Paketi ${packageRow.name_tr}`,
          category1: 'Package',
          itemType: 'VIRTUAL',
          price: toMoneyMinorToDecimalString(packageRow.price_minor),
        },
      ],
    });

    if (result.status === 'success') {
      return reply.send({
        data: {
          order_id: orderId,
          package_id: packageRow.id,
          checkout_url: result['paymentPageUrl'],
          token: result['token'],
        },
      });
    }

    await db
      .update(orders)
      .set({ status: 'cancelled', payment_status: 'failed', updated_at: new Date() })
      .where(eq(orders.id, orderId));

    return reply.code(400).send({ error: { message: String(result['errorMessage'] || 'credit_payment_init_failed') } });
  } catch (err) {
    await db
      .update(orders)
      .set({ status: 'cancelled', payment_status: 'failed', updated_at: new Date() })
      .where(eq(orders.id, orderId));

    const message = err instanceof Error ? err.message : 'credit_payment_init_failed';
    return reply.code(500).send({ error: { message } });
  }
};

/** POST /credits/webhook — Iyzipay callback for credit package */
export const creditWebhook: RouteHandler = async (req, reply) => {
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
    return reply.send({ data: { order_id: orderId, paid: true } });
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

  const iyzico = new IyzicoService(getGatewayConfig(gateway));
  const result = await iyzico.retrieveCheckoutResult(token);

  const paymentId = toIyzicoMoneyValue((result as Record<string, unknown>).paymentId) || token;
  const isPaid = String(result.status) === 'success' && String(result.paymentStatus).toUpperCase() === 'SUCCESS';
  const amount = String(toIyzicoMoneyValue(result.paidPrice) || order.total_amount || '0');
  const currency = toCurrency((result.currency as string | undefined) || order.currency || 'TRY');

  const [existingPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.order_id, orderId), eq(payments.transaction_id, paymentId)))
    .limit(1);

  if (!existingPayment) {
    await db.insert(payments).values({
      id: randomUUID(),
      order_id: orderId,
      gateway_id: gateway.id,
      transaction_id: paymentId,
      amount,
      currency,
      status: isPaid ? 'success' : 'failure',
      raw_response: JSON.stringify(result),
    } as any);
  }

  await db
    .update(orders)
    .set({
      payment_status: isPaid ? 'paid' : 'failed',
      status: isPaid ? 'processing' : 'cancelled',
      transaction_id: paymentId,
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  if (!isPaid) {
    return reply.send({ data: { order_id: orderId, paid: false } });
  }

  const notes = parseJSONNotes<{ context?: string; package_id?: string }>(order.notes ?? null);
  const packageId = notes?.package_id;
  if (!packageId) {
    return reply.code(400).send({ error: { message: 'credit_context_not_found' } });
  }

  const [pkg] = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.id, packageId))
    .limit(1);

  if (!pkg) {
    return reply.code(404).send({ error: { message: 'credit_package_not_found' } });
  }

  const creditAmount = Number(pkg.credits || 0) + Number(pkg.bonus_credits || 0);
  const newBalance = await addCreditTransaction({
    user_id: order.user_id,
    amount: creditAmount,
    reference_type: 'credit_package',
    reference_id: pkg.id,
    order_id: orderId,
    description: `${pkg.name_tr} paketi alındı`,
  });

  return reply.send({
    data: {
      order_id: orderId,
      package_id: pkg.id,
      paid: true,
      credits_added: creditAmount,
      balance: newBalance,
    },
  });
};
