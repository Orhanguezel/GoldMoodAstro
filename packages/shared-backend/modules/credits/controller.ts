// packages/shared-backend/modules/credits/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAuth } from 'google-auth-library';
import { z } from 'zod';
import * as repo from './repository';
import { IyzicoService, resolveIyzicoConfigFromGateway, resolveIyzicoLocale, verifyIyzicoCallback } from '../orders/iyzico.service';
import { db } from '../../db/client';
import { paymentGateways, orders, payments } from '../orders/schema';
import { creditTransactions, userCredits } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { profiles } from '../profiles/schema';
import { apiMessage } from '../_shared/api-i18n';

type IapPlatform = 'apple_iap' | 'google_iap';

const creditPackageBody = z.object({
  code: z.string().trim().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name_tr: z.string().trim().min(2).max(255),
  name_en: z.string().trim().min(2).max(255),
  description_tr: z.string().trim().max(5000).nullable().optional(),
  description_en: z.string().trim().max(5000).nullable().optional(),
  price_minor: z.coerce.number().int().min(0),
  currency: z.string().trim().length(3).default('TRY'),
  credits: z.coerce.number().int().min(1),
  bonus_credits: z.coerce.number().int().min(0).default(0),
  is_active: z.union([z.boolean(), z.coerce.number().int().min(0).max(1)]).default(1),
  is_featured: z.union([z.boolean(), z.coerce.number().int().min(0).max(1)]).default(0),
  display_order: z.coerce.number().int().min(0).default(0),
});

const creditPackagePatchBody = creditPackageBody.partial();

type CreditIapVerification = {
  valid: boolean;
  reason?: string;
  providerPurchaseId?: string;
  productId?: string;
  raw?: unknown;
};

export async function handleListPackages(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Record<string, string | undefined>;
  const locale = q?.locale || (req as any).locale || 'tr';
  const packages = await repo.listActivePackages(locale);
  return reply.send({ data: packages });
}

function tiny(value: unknown) {
  return value === true ? 1 : Number(value ?? 0) ? 1 : 0;
}

async function upsertCreditPackageI18n(packageId: string, data: { name_tr?: string; name_en?: string; description_tr?: string | null; description_en?: string | null }) {
  if (data.name_tr !== undefined || data.description_tr !== undefined) {
    await (db as any).session.client.query(
      `INSERT INTO credit_package_i18n (id, package_id, locale, name, description)
       VALUES (?, ?, 'tr', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), updated_at = NOW(3)`,
      [uuidv4(), packageId, data.name_tr ?? '', data.description_tr ?? null],
    );
  }
  if (data.name_en !== undefined || data.description_en !== undefined) {
    await (db as any).session.client.query(
      `INSERT INTO credit_package_i18n (id, package_id, locale, name, description)
       VALUES (?, ?, 'en', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), updated_at = NOW(3)`,
      [uuidv4(), packageId, data.name_en ?? '', data.description_en ?? null],
    );
  }
}

export async function handleAdminListCreditPackages(_req: FastifyRequest, reply: FastifyReply) {
  const [rows] = await (db as any).session.client.query(
    `SELECT *
     FROM credit_packages
     ORDER BY display_order ASC, price_minor ASC, created_at DESC`,
  );
  return reply.send({ data: rows });
}

export async function handleAdminGetCreditPackage(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as { id?: string }).id ?? '');
  const [rows] = await (db as any).session.client.query(
    `SELECT * FROM credit_packages WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = (rows as any[])[0];
  if (!row) return reply.code(404).send({ error: { message: 'credit_package_not_found' } });
  return reply.send({ data: row });
}

export async function handleAdminCreateCreditPackage(req: FastifyRequest, reply: FastifyReply) {
  const parsed = creditPackageBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const data = parsed.data;
  const id = uuidv4();

  await (db as any).session.client.query(
    `INSERT INTO credit_packages
      (id, code, name_tr, name_en, description_tr, description_en, price_minor, currency, credits, bonus_credits, is_active, is_featured, display_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      id,
      data.code,
      data.name_tr,
      data.name_en,
      data.description_tr ?? null,
      data.description_en ?? null,
      data.price_minor,
      data.currency.toUpperCase(),
      data.credits,
      data.bonus_credits,
      tiny(data.is_active),
      tiny(data.is_featured),
      data.display_order,
    ],
  );
  await upsertCreditPackageI18n(id, data);

  return handleAdminGetCreditPackage({ ...req, params: { id } } as FastifyRequest, reply);
}

export async function handleAdminUpdateCreditPackage(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as { id?: string }).id ?? '');
  const parsed = creditPackagePatchBody.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const data = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];
  const mapping: Record<string, string> = {
    code: 'code',
    name_tr: 'name_tr',
    name_en: 'name_en',
    description_tr: 'description_tr',
    description_en: 'description_en',
    price_minor: 'price_minor',
    currency: 'currency',
    credits: 'credits',
    bonus_credits: 'bonus_credits',
    is_active: 'is_active',
    is_featured: 'is_featured',
    display_order: 'display_order',
  };

  for (const [key, column] of Object.entries(mapping)) {
    if (!(key in data)) continue;
    fields.push(`${column} = ?`);
    const value = (data as Record<string, unknown>)[key];
    values.push(key === 'is_active' || key === 'is_featured' ? tiny(value) : key === 'currency' ? String(value).toUpperCase() : value ?? null);
  }

  if (fields.length) {
    await (db as any).session.client.query(
      `UPDATE credit_packages SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`,
      [...values, id],
    );
  }
  await upsertCreditPackageI18n(id, data);

  return handleAdminGetCreditPackage(req, reply);
}

export async function handleAdminDeleteCreditPackage(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as { id?: string }).id ?? '');
  const [result] = await (db as any).session.client.query(`DELETE FROM credit_packages WHERE id = ?`, [id]);
  if (Number((result as any)?.affectedRows ?? 0) < 1) {
    return reply.code(404).send({ error: { message: 'credit_package_not_found' } });
  }
  return reply.send({ ok: true });
}

export async function handleGetBalance(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const balance = await repo.getUserBalance(user.id);
  return reply.send({ data: balance });
}

export async function handleGetMe(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const [balance, transactions] = await Promise.all([
    repo.getUserBalance(user.id),
    repo.getTransactionHistory(user.id),
  ]);

  return reply.send({
    data: {
      balance: Number((balance as any)?.balance ?? 0),
      currency: String((balance as any)?.currency || 'TRY-CREDIT'),
      recent_transactions: transactions,
    },
  });
}

function resolveApiBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.PUBLIC_URL ||
    (process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : 'http://localhost:8094')
  ).replace(/\/$/, '');
}

function requirePaymentField(value: unknown, message: string) {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) {
    const err = new Error(message);
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  return cleaned;
}

function requireIdentityNumber(value: unknown) {
  const cleaned = requirePaymentField(value, 'billing_identity_number_required');
  if (!/^\d{10,11}$/.test(cleaned)) {
    const err = new Error('billing_identity_number_invalid');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  return cleaned;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err || 'unknown_error');
}

function asString(value: unknown) {
  return String(value ?? '').trim();
}

function asNum(value: unknown): number {
  const n = Number(asString(value));
  return Number.isFinite(n) ? n : NaN;
}

function normalizeIapPlatform(value: unknown): IapPlatform | null {
  const v = asString(value).toLowerCase();
  if (v === 'apple' || v === 'ios' || v === 'apple_iap') return 'apple_iap';
  if (v === 'google' || v === 'android' || v === 'google_iap') return 'google_iap';
  return null;
}

function envProductKey(code: string, platform: IapPlatform) {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return `IAP_CREDIT_PRODUCT_${normalizedCode}_${platform === 'apple_iap' ? 'IOS' : 'ANDROID'}`;
}

function expectedCreditProductId(pkg: { code?: string | null }, platform: IapPlatform) {
  const code = asString(pkg.code).toLowerCase();
  const platformKey = envProductKey(code, platform);
  const sharedKey = `IAP_CREDIT_PRODUCT_${code.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  return asString(process.env[platformKey] || process.env[sharedKey] || `com.goldmoodastro.app.credits.${code}`);
}

function stableProviderId(raw: string) {
  const value = asString(raw);
  if (!value) return '';
  if (value.length <= 240) return value;
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
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
  const normalized = raw.replace(/\\n/g, '\n').trim();
  if (!normalized) return null;
  try {
    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
  } catch {}
  return null;
}

async function resolveGoogleAccessToken(): Promise<string> {
  const explicitToken = asString(process.env.IAP_GOOGLE_ACCESS_TOKEN);
  if (explicitToken) return explicitToken;

  const credentials = parseServiceAccount(asString(process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON));
  if (!credentials) throw new Error('google_service_account_missing');

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

async function verifyAppleCreditReceipt(params: {
  receipt: string;
  transactionId?: string;
  productId?: string;
}): Promise<CreditIapVerification> {
  const bundleId = asString(process.env.IAP_APPLE_BUNDLE_ID);
  if (!bundleId) return { valid: false, reason: 'apple_bundle_id_missing' };
  if (!params.receipt) return { valid: false, reason: 'receipt_required' };

  const requestBody = {
    'receipt-data': params.receipt,
    password: asString(process.env.IAP_APPLE_SHARED_SECRET) || undefined,
    'exclude-old-transactions': false,
  };
  const endpoints = ['https://buy.itunes.apple.com/verifyReceipt', 'https://sandbox.itunes.apple.com/verifyReceipt'];
  const useSandboxFirst = asString(process.env.IAP_APPLE_USE_SANDBOX).toLowerCase() === 'true';
  const orderedEndpoints = useSandboxFirst ? [...endpoints].reverse() : endpoints;

  for (const endpoint of orderedEndpoints) {
    const response = await postJson(endpoint, requestBody);
    const data = response.data as {
      status?: number;
      receipt?: { bundle_id?: string; in_app?: unknown[] };
      latest_receipt_info?: unknown[];
    };
    const status = asNum(data.status);
    if (status === 21007 && endpoint === 'https://buy.itunes.apple.com/verifyReceipt') continue;
    if (status !== 0) return { valid: false, reason: `apple_receipt_status_${Number.isFinite(status) ? status : 'unknown'}` };
    if (data.receipt?.bundle_id && data.receipt.bundle_id !== bundleId) {
      return { valid: false, reason: 'apple_receipt_wrong_bundle' };
    }

    const receiptItems = [...(data.latest_receipt_info ?? []), ...(data.receipt?.in_app ?? [])] as Array<Record<string, unknown>>;
    const txId = asString(params.transactionId);
    const prodId = asString(params.productId);
    const item =
      receiptItems.find((candidate) => {
        const itemTx = asString(candidate.transaction_id);
        const itemOriginalTx = asString(candidate.original_transaction_id);
        const itemProductId = asString(candidate.product_id);
        const matchesTx = txId ? itemTx === txId || itemOriginalTx === txId : false;
        const matchesProduct = prodId ? itemProductId === prodId : false;
        return matchesTx || matchesProduct;
      }) ?? receiptItems[0];

    if (!item) return { valid: false, reason: 'apple_receipt_transaction_not_found' };
    if (asString(item.cancellation_date_ms || item.cancellation_date)) {
      return { valid: false, reason: 'apple_purchase_cancelled' };
    }

    const providerPurchaseId = stableProviderId(asString(item.transaction_id || item.original_transaction_id || txId));
    const productId = asString(item.product_id || prodId);
    if (!providerPurchaseId || !productId) return { valid: false, reason: 'apple_receipt_incomplete' };

    return { valid: true, providerPurchaseId, productId, raw: data };
  }

  return { valid: false, reason: 'apple_receipt_verification_failed' };
}

async function verifyGoogleCreditPurchase(params: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<CreditIapVerification> {
  const accessToken = await resolveGoogleAccessToken();
  const endpoint =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(params.packageName)}` +
    `/purchases/products/${encodeURIComponent(params.productId)}/tokens/${encodeURIComponent(params.purchaseToken)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    const errorPayload = body.error as Record<string, unknown> | undefined;
    const errorCode = asString(errorPayload?.code ?? body.errorCode ?? response.status);
    return { valid: false, reason: `google_product_not_found_${errorCode}` };
  }

  const purchaseState = asNum(body.purchaseState);
  if (purchaseState !== 0) return { valid: false, reason: 'google_product_not_purchased' };

  return {
    valid: true,
    providerPurchaseId: stableProviderId(asString(body.orderId || params.purchaseToken)),
    productId: params.productId,
    raw: body,
  };
}

export async function handleBuyCredits(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const { package_id, locale = 'tr', identity_number } = req.body as { package_id: string, locale?: string; identity_number?: string };
  
  const pkg = await repo.getPackageById(package_id, locale);
  if (!pkg) return reply.status(404).send({ error: apiMessage(req, 'package_not_found') });

  // 1. Resolve Iyzico Gateway
  const [gateway] = await db.select().from(paymentGateways).where(and(eq(paymentGateways.slug, 'iyzico'), eq(paymentGateways.is_active, 1))).limit(1);
  if (!gateway) return reply.status(400).send({ error: apiMessage(req, 'payment_not_configured') });

  const iyzico = new IyzicoService(resolveIyzicoConfigFromGateway(gateway));

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  const orderId = uuidv4();
  const orderNumber = `CRD-${Date.now()}`;
  const amount = (pkg.priceMinor / 100).toFixed(2);
  const currency = pkg.currency || 'TRY';

  // Create order record for tracking
  await db.insert(orders).values({
    id: orderId,
    user_id: user.id,
    order_number: orderNumber,
    status: 'pending',
    total_amount: amount,
    currency,
    payment_gateway_id: gateway.id,
    payment_status: 'unpaid',
    notes: JSON.stringify({
      context: 'credits_purchase',
      package_id: pkg.id,
      package_code: pkg.code,
      user_id: user.id,
    }),
  });

  const iyzicoLocale = resolveIyzicoLocale(locale);
  let buyerPhone: string;
  let buyerIdentity: string;
  let buyerFullName: string;
  let buyerAddress: string;
  let buyerCity: string;
  let buyerPostalCode: string;
  try {
    buyerPhone = requirePaymentField(profile?.phone, 'billing_phone_required');
    buyerIdentity = requireIdentityNumber(identity_number);
    buyerFullName = requirePaymentField(profile?.full_name, 'billing_full_name_required');
    buyerAddress = requirePaymentField(profile?.address_line1, 'billing_address_required');
    buyerCity = requirePaymentField(profile?.city, 'billing_city_required');
    buyerPostalCode = requirePaymentField(profile?.postal_code, 'billing_postal_code_required');
  } catch (error) {
    const statusCode = Number((error as Error & { statusCode?: number })?.statusCode ?? 400);
    return reply.status(statusCode).send({ error: error instanceof Error ? error.message : 'billing_kyc_required' });
  }
  const nameParts = buyerFullName.split(/\s+/).filter(Boolean);

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId: `conv_${orderNumber}`,
      price: amount,
      paidPrice: amount,
      currency,
      basketId: orderNumber,
      callbackUrl: `${resolveApiBase()}/api/credits/iyzico/callback?order_id=${orderId}`,
      buyer: {
        id: user.id,
        name: nameParts[0],
        surname: nameParts.slice(1).join(' ') || '.',
        gsmNumber: buyerPhone,
        email: user.email,
        identityNumber: buyerIdentity,
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: buyerAddress,
        ip: req.ip,
        city: buyerCity,
        country: 'Turkey',
        zipCode: buyerPostalCode,
      },
      shippingAddress: {
        contactName: buyerFullName,
        city: buyerCity,
        country: 'Turkey',
        address: buyerAddress,
        zipCode: buyerPostalCode,
      },
      billingAddress: {
        contactName: buyerFullName,
        city: buyerCity,
        country: 'Turkey',
        address: buyerAddress,
        zipCode: buyerPostalCode,
      },
      basketItems: [{
        id: pkg.id,
        name: pkg.name ?? pkg.nameTr ?? pkg.name_tr,
        category1: 'Credits',
        itemType: 'VIRTUAL',
        price: amount,
      }],
    });

    if (result['status'] === 'success') {
      return reply.send({
        data: {
          checkout_url: result['paymentPageUrl'],
          token: result['token'],
        }
      });
    } else {
      return reply.status(400).send({ error: result['errorMessage'] });
    }
  } catch (err) {
    req.log.error(`iyzico_credit_init_failed: ${errorMessage(err)}`);
    return reply.status(500).send({ error: apiMessage(req, 'payment_init_failed') });
  }
}

export async function handleVerifyIapReceipt(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const body = (req.body ?? {}) as {
    platform?: string;
    package_id?: string;
    package_code?: string;
    receipt?: string;
    transaction_id?: string;
    purchase_token?: string;
    product_id?: string;
  };

  const platform = normalizeIapPlatform(body.platform);
  const packageSelector = asString(body.package_id || body.package_code);
  const receipt = asString(body.receipt);
  const transactionId = asString(body.transaction_id);
  const purchaseToken = asString(body.purchase_token);
  const productId = asString(body.product_id);

  if (!platform) return reply.status(400).send({ error: { message: 'unsupported_platform' } });
  if (!packageSelector) return reply.status(400).send({ error: { message: 'package_id_required' } });
  if (!receipt && !transactionId && !purchaseToken && !productId) {
    return reply.status(400).send({ error: { message: 'receipt_required' } });
  }

  const pkg = (await repo.getPackageById(packageSelector)) ?? null;
  const packageByCode = pkg ? null : (await repo.listActivePackages()).find((item: any) => item.code === packageSelector);
  const resolvedPkg = pkg ?? packageByCode ?? null;
  if (!resolvedPkg) return reply.status(404).send({ error: { message: 'package_not_found' } });
  if (Number((resolvedPkg as any).isActive ?? (resolvedPkg as any).is_active ?? 0) !== 1) {
    return reply.status(400).send({ error: { message: 'package_not_active' } });
  }

  const expectedProductId = expectedCreditProductId(resolvedPkg as { code?: string | null }, platform);
  if (productId && expectedProductId && productId !== expectedProductId) {
    return reply.status(400).send({ error: { message: 'iap_product_mismatch' } });
  }

  let verification: CreditIapVerification;
  try {
    if (platform === 'apple_iap') {
      verification = await verifyAppleCreditReceipt({ receipt, transactionId, productId });
    } else {
      const packageName = asString(process.env.IAP_GOOGLE_PACKAGE_NAME);
      if (!packageName) return reply.status(500).send({ error: { message: 'google_package_name_missing' } });
      if (!purchaseToken || !productId) {
        return reply.status(400).send({ error: { message: 'purchase_token_and_product_id_required' } });
      }
      verification = await verifyGoogleCreditPurchase({ packageName, productId, purchaseToken });
    }
  } catch (err) {
    return reply.status(400).send({ error: { message: err instanceof Error ? err.message : 'iap_verification_failed' } });
  }

  if (!verification.valid || !verification.providerPurchaseId) {
    return reply.status(400).send({ error: { message: verification.reason || 'receipt_invalid' } });
  }

  if (verification.productId && expectedProductId && verification.productId !== expectedProductId) {
    return reply.status(400).send({ error: { message: 'iap_product_mismatch' } });
  }

  const [existingRows] = await (db as any).session.client.query(
    `SELECT * FROM orders
     WHERE transaction_id = ?
       AND notes LIKE '%"context":"iap_credit_purchase"%'
     LIMIT 1`,
    [verification.providerPurchaseId],
  );
  const existingOrder = Array.isArray(existingRows) ? existingRows[0] : null;
  if (existingOrder) {
    if (existingOrder.user_id !== user.id) {
      return reply.status(409).send({ error: { message: 'transaction_already_used' } });
    }
    const balance = await repo.getUserBalance(user.id);
    return reply.send({
      data: {
        platform,
        valid: true,
        idempotent: true,
        order_id: existingOrder.id,
        package_id: (resolvedPkg as any).id,
        credits_added: 0,
        balance: Number((balance as any)?.balance ?? 0),
      },
    });
  }

  const orderId = uuidv4();
  const orderNumber = `IAPCRD-${Date.now()}`;
  const totalCredits = Number((resolvedPkg as any).credits || 0) + Number((resolvedPkg as any).bonusCredits ?? (resolvedPkg as any).bonus_credits ?? 0);
  const priceMinor = Number((resolvedPkg as any).priceMinor ?? (resolvedPkg as any).price_minor ?? 0);
  const currency = String((resolvedPkg as any).currency || 'TRY');
  const amount = (priceMinor / 100).toFixed(2);
  const gatewaySlug = platform === 'apple_iap' ? 'apple_iap' : 'google_iap';
  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, gatewaySlug)).limit(1);

  const result = await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId,
      user_id: user.id,
      order_number: orderNumber,
      status: 'completed',
      total_amount: amount,
      currency,
      payment_gateway_id: gateway?.id ?? null,
      payment_status: 'paid',
      transaction_id: verification.providerPurchaseId,
      notes: JSON.stringify({
        context: 'iap_credit_purchase',
        platform,
        package_id: (resolvedPkg as any).id,
        package_code: (resolvedPkg as any).code,
        product_id: verification.productId || productId,
      }),
    } as any);

    await tx.execute(sql`
      INSERT INTO user_credits (id, user_id, balance, currency, created_at, updated_at)
      VALUES (${uuidv4()}, ${user.id}, 0, 'TRY-CREDIT', NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE updated_at = updated_at
    `);

    const creditTxId = uuidv4();
    await tx.insert(creditTransactions).values({
      id: creditTxId,
      userId: user.id,
      type: 'purchase',
      amount: totalCredits,
      balanceAfter: 0,
      referenceType: 'order',
      referenceId: orderId,
      orderId,
      description: `${(resolvedPkg as any).name ?? (resolvedPkg as any).nameTr ?? (resolvedPkg as any).name_tr ?? 'Kredi'} paketi IAP ile satın alındı.`,
    });

    await tx.execute(sql`
      UPDATE user_credits
      SET balance = balance + ${totalCredits}, updated_at = NOW(3)
      WHERE user_id = ${user.id}
    `);

    const [current] = await tx.select().from(userCredits).where(eq(userCredits.userId, user.id)).limit(1);
    const balanceAfter = Number(current?.balance ?? 0);
    await tx.update(creditTransactions).set({ balanceAfter }).where(eq(creditTransactions.id, creditTxId));

    if (gateway?.id) {
      await tx.insert(payments).values({
        id: uuidv4(),
        order_id: orderId,
        gateway_id: gateway.id,
        amount,
        currency,
        status: 'success',
        transaction_id: verification.providerPurchaseId,
        raw_response: JSON.stringify(verification.raw ?? {}),
      });
    }

    return { balance: balanceAfter };
  });

  return reply.send({
    data: {
      platform,
      valid: true,
      order_id: orderId,
      package_id: (resolvedPkg as any).id,
      product_id: verification.productId || productId,
      transaction_id: transactionId,
      credits_added: totalCredits,
      balance: Number((result as any)?.balance ?? 0),
    },
  });
}

export async function handleIyzicoCallback(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query ?? {}) as { order_id?: string; token?: string };
  const body = (req.body ?? {}) as { token?: string };
  const order_id = String(query.order_id || '').trim();
  const token = String(body.token ?? query.token ?? '').trim();

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, 'iyzico')).limit(1);
  const iyzico = new IyzicoService(resolveIyzicoConfigFromGateway(gateway));

  const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    if (!token) return reply.redirect(`${siteUrl}/me/credits?status=failed`);

    const [order] = await db.select().from(orders).where(eq(orders.id, order_id)).limit(1);
    if (!order) return reply.redirect(`${siteUrl}/me/credits?status=failed`);
    if (order.payment_status === 'paid') return reply.redirect(`${siteUrl}/me/credits?status=success`);

    let notes: { package_id?: string } = {};
    try {
      notes = JSON.parse(String(order.notes || '{}'));
    } catch {
      notes = {};
    }
    const pkg = notes.package_id ? await repo.getPackageById(notes.package_id) : null;
    if (!pkg) return reply.redirect(`${siteUrl}/me/credits?status=failed`);

    const verified = await verifyIyzicoCallback({
      iyzico,
      token,
      expectedAmountMinor: Number(pkg.priceMinor ?? pkg.price_minor),
      expectedCurrency: pkg.currency || order.currency || 'TRY',
      expectedBasketId: order.order_number,
      expectedConversationId: `conv_${order.order_number}`,
    });

    await db.transaction(async (tx) => {
      const updateResult = await tx.execute(sql`
        UPDATE orders
        SET payment_status='paid', status='completed', transaction_id=${verified.paymentId}, updated_at=NOW(3)
        WHERE id=${order.id} AND payment_status <> 'paid'
      `);
      const affected = Number((updateResult as any)?.[0]?.affectedRows ?? (updateResult as any)?.affectedRows ?? 0);
      if (affected < 1) return;

      const totalCredits = Number(pkg.credits || 0) + Number(pkg.bonusCredits ?? pkg.bonus_credits ?? 0);
      await repo.addCredits(order.user_id, totalCredits, 'purchase', {
        type: 'package',
        id: pkg.id,
        orderId: order.id,
        description: `${pkg.name ?? pkg.nameTr ?? pkg.name_tr} paketi satın alındı.`,
      });

      try {
        await tx.insert(payments).values({
          id: uuidv4(),
          order_id: order.id,
          gateway_id: gateway?.id || '',
          amount: (verified.paidPriceMinor / 100).toFixed(2),
          currency: verified.currency,
          status: 'success',
          transaction_id: verified.paymentId,
          raw_response: JSON.stringify(verified.raw),
        });
      } catch (err: any) {
        if (!String(err?.message || '').includes('Duplicate')) throw err;
      }
    });

    return reply.redirect(`${siteUrl}/me/credits?status=success`);
  } catch (err) {
    req.log.error(`iyzico_credit_callback_failed: ${errorMessage(err)}`);
    return reply.redirect(`${siteUrl}/me/credits?status=error`);
  }
}
