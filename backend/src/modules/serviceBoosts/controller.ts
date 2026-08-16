import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  IyzicoService,
  isPaymentMockEnabled,
  resolveIyzicoConfigFromGateway,
  resolveIyzicoLocale,
  verifyIyzicoCallback,
} from '@goldmood/shared-backend/modules/orders/iyzico.service';

type BoostPackage = { id: string; days: number; price: number; currency?: string };

const checkoutSchema = z.object({
  package_id: z.string().trim().min(1).max(32),
  billing_city: z.string().trim().min(1).max(128),
  billing_postal_code: z.string().trim().min(1).max(32),
});

function rowsFromExecute<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

function resolveApiBase() {
  return (
    process.env.BACKEND_URL ||
    process.env.PUBLIC_URL ||
    (process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : 'http://localhost:8094')
  ).replace(/\/$/, '');
}

function resolveSiteUrl() {
  return (process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function resolveRequestLocale(req: Parameters<RouteHandler>[0]) {
  const queryLocale = String(((req.query as Record<string, unknown> | undefined)?.locale ?? '') || '').trim();
  return queryLocale || String((req as any).locale || 'tr');
}

function splitName(fullName: string | null | undefined) {
  const parts = String(fullName || 'GoldMoodAstro Danışmanı').trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] || 'Danışman',
    surname: parts.slice(1).join(' ') || '.',
  };
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

async function getCallerConsultant(req: Parameters<RouteHandler>[0]) {
  const userId = userIdFromRequest(req);
  if (!userId) return null;
  const result = await db.execute(sql`
    SELECT c.id, c.user_id, c.identity_number, c.billing_address, u.phone, u.email, u.full_name
    FROM consultants c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.user_id = ${userId}
    LIMIT 1
  `);
  return rowsFromExecute<{
    id: string;
    user_id: string;
    identity_number: string | null;
    billing_address: string | null;
    phone: string | null;
    email: string | null;
    full_name: string | null;
  }>(result)[0] ?? null;
}

async function readPackages(): Promise<BoostPackage[]> {
  const result = await db.execute(sql`
    SELECT value FROM site_settings
    WHERE \`key\` = 'service_boost_packages' AND locale IN ('*', 'tr')
    ORDER BY CASE WHEN locale='*' THEN 0 ELSE 1 END
    LIMIT 1
  `);
  const raw = rowsFromExecute<{ value: string }>(result)[0]?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to defaults
    }
  }
  return [
    { id: 'wk1', days: 7, price: 599, currency: 'TRY' },
    { id: 'wk2', days: 14, price: 1099, currency: 'TRY' },
    { id: 'wk4', days: 28, price: 1899, currency: 'TRY' },
  ];
}

export const getPackages: RouteHandler = async (_req, reply) => {
  const packages = await readPackages();
  return reply.send({ data: packages });
};

export const createCheckout: RouteHandler = async (req, reply) => {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const serviceId = String((req.params as { id?: string })?.id ?? '').trim();
  const parsed = checkoutSchema.safeParse(req.body ?? {});
  if (!serviceId) return reply.code(400).send({ error: { message: 'service_id_required' } });
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const serviceResult = await db.execute(sql`
    SELECT id, consultant_id, name FROM consultant_services
    WHERE id = ${serviceId} AND consultant_id = ${c.id}
    LIMIT 1
  `);
  const service = rowsFromExecute<{ id: string; consultant_id: string; name: string }>(serviceResult)[0];
  if (!service) return reply.code(404).send({ error: { message: 'service_not_found' } });

  const packages = await readPackages();
  const selected = packages.find((pkg) => pkg.id === parsed.data.package_id);
  if (!selected) return reply.code(400).send({ error: { message: 'boost_package_not_found' } });

  const boostId = randomUUID();
  const locale = resolveRequestLocale(req);
  const siteUrl = resolveSiteUrl();
  await db.execute(sql`
    INSERT INTO service_boosts (
      id, consultant_service_id, consultant_id, duration_days, price, currency,
      starts_at, ends_at, status, created_at, updated_at
    ) VALUES (
      ${boostId}, ${service.id}, ${c.id}, ${selected.days}, ${String(selected.price)},
      ${selected.currency ?? 'TRY'}, NOW(3), DATE_ADD(NOW(3), INTERVAL ${selected.days} DAY),
      'pending_payment', NOW(3), NOW(3)
    )
  `);

  if (isPaymentMockEnabled()) {
    const paymentId = `mock_boost_${Date.now()}`;
    await db.execute(sql`
      UPDATE service_boosts
      SET status = 'active',
          starts_at = NOW(3),
          ends_at = DATE_ADD(NOW(3), INTERVAL duration_days DAY),
          iyzipay_payment_id = ${paymentId},
          updated_at = NOW(3)
      WHERE id = ${boostId}
    `);
    return reply.code(201).send({
      data: {
        id: boostId,
        status: 'active',
        package: selected,
        checkout_url: `${siteUrl}/${locale}/me/consultant?boost_id=${encodeURIComponent(boostId)}&checkout=success&mock=1`,
        checkout_html: null,
      },
    });
  }

  const gatewayResult = await db.execute(sql`
    SELECT id, config FROM payment_gateways
    WHERE slug = 'iyzico' AND is_active = 1
    LIMIT 1
  `);
  const gateway = rowsFromExecute<{ id: string; config: string | null }>(gatewayResult)[0];
  if (!gateway) return reply.code(400).send({ error: { message: 'iyzico_gateway_not_configured' } });

  const userResult = await db.execute(sql`
    SELECT id, full_name, email, phone
    FROM users
    WHERE id = ${c.user_id}
    LIMIT 1
  `);
  const user = rowsFromExecute<{ id: string; full_name: string | null; email: string; phone: string | null }>(userResult)[0];
  if (!user?.email) return reply.code(400).send({ error: { message: 'consultant_email_required' } });

  const iyzico = new IyzicoService(resolveIyzicoConfigFromGateway(gateway));
  const name = splitName(user.full_name);
  let buyerPhone: string;
  let buyerIdentity: string;
  let buyerAddress: string;
  let buyerCity: string;
  let buyerPostalCode: string;
  try {
    buyerPhone = requirePaymentField(c.phone || user.phone, 'billing_phone_required');
    buyerIdentity = requireIdentityNumber(c.identity_number);
    buyerAddress = requirePaymentField(c.billing_address, 'billing_address_required');
    buyerCity = requirePaymentField(parsed.data.billing_city, 'billing_city_required');
    buyerPostalCode = requirePaymentField(parsed.data.billing_postal_code, 'billing_postal_code_required');
  } catch (error) {
    const statusCode = Number((error as Error & { statusCode?: number })?.statusCode ?? 400);
    return reply.code(statusCode).send({ error: { message: error instanceof Error ? error.message : 'billing_kyc_required' } });
  }
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const price = Number(selected.price).toFixed(2);

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: resolveIyzicoLocale(locale),
      conversationId: `boost_${boostId}`,
      price,
      paidPrice: price,
      currency: selected.currency ?? 'TRY',
      basketId: `BOOST-${boostId}`,
      callbackUrl: `${resolveApiBase()}/api/service-boosts/iyzico/callback?boost_id=${encodeURIComponent(boostId)}&locale=${encodeURIComponent(locale)}`,
      buyer: {
        id: user.id,
        name: name.name,
        surname: name.surname,
        gsmNumber: buyerPhone,
        email: user.email,
        identityNumber: buyerIdentity,
        lastLoginDate: nowStr,
        registrationDate: nowStr,
        registrationAddress: buyerAddress,
        ip: req.ip,
        city: buyerCity,
        country: 'Turkey',
        zipCode: buyerPostalCode,
      },
      shippingAddress: {
        contactName: user.full_name || 'GoldMoodAstro Danışmanı',
        city: buyerCity,
        country: 'Turkey',
        address: buyerAddress,
        zipCode: buyerPostalCode,
      },
      billingAddress: {
        contactName: user.full_name || 'GoldMoodAstro Danışmanı',
        city: buyerCity,
        country: 'Turkey',
        address: buyerAddress,
        zipCode: buyerPostalCode,
      },
      basketItems: [{
        id: boostId,
        name: `Hizmet öne çıkarma - ${service.name}`,
        category1: 'Service Boost',
        itemType: 'VIRTUAL',
        price,
      }],
    });

    if (result.status === 'success') {
      return reply.code(201).send({
        data: {
          id: boostId,
          status: 'pending_payment',
          package: selected,
          checkout_url: result.paymentPageUrl,
          checkout_html: result.checkoutFormContent ?? null,
          token: result.token,
        },
      });
    }

    await db.execute(sql`UPDATE service_boosts SET status = 'cancelled', updated_at = NOW(3) WHERE id = ${boostId}`);
    return reply.code(400).send({ error: { message: String(result.errorMessage || 'iyzico_checkout_failed') } });
  } catch (error) {
    await db.execute(sql`UPDATE service_boosts SET status = 'cancelled', updated_at = NOW(3) WHERE id = ${boostId}`);
    const message = error instanceof Error ? error.message : 'iyzico_checkout_failed';
    return reply.code(500).send({ error: { message } });
  }
};

export const getStatus: RouteHandler = async (req, reply) => {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const serviceId = String((req.params as { id?: string })?.id ?? '').trim();
  const result = await db.execute(sql`
    SELECT id, consultant_service_id, consultant_id, duration_days, price, currency,
           starts_at, ends_at, status, iyzipay_payment_id, created_at, updated_at
    FROM service_boosts
    WHERE consultant_service_id = ${serviceId} AND consultant_id = ${c.id}
    ORDER BY created_at DESC
    LIMIT 20
  `);
  return reply.send({ data: rowsFromExecute(result) });
};

export const listAdmin: RouteHandler = async (req) => {
  const status = String((req.query as { status?: string } | undefined)?.status ?? '').trim();
  const result = await db.execute(
    status
      ? sql`
          SELECT sb.*, cs.name AS service_name, u.full_name AS consultant_name
          FROM service_boosts sb
          INNER JOIN consultant_services cs ON cs.id = sb.consultant_service_id
          INNER JOIN consultants c ON c.id = sb.consultant_id
          INNER JOIN users u ON u.id = c.user_id
          WHERE sb.status = ${status}
          ORDER BY sb.created_at DESC
          LIMIT 200
        `
      : sql`
          SELECT sb.*, cs.name AS service_name, u.full_name AS consultant_name
          FROM service_boosts sb
          INNER JOIN consultant_services cs ON cs.id = sb.consultant_service_id
          INNER JOIN consultants c ON c.id = sb.consultant_id
          INNER JOIN users u ON u.id = c.user_id
          ORDER BY sb.created_at DESC
          LIMIT 200
        `,
  );
  return { data: rowsFromExecute(result) };
};

export const cancelAdmin: RouteHandler = async (req, reply) => {
  const id = String((req.params as { id?: string })?.id ?? '').trim();
  if (!id) return reply.code(400).send({ error: { message: 'boost_id_required' } });
  await db.execute(sql`UPDATE service_boosts SET status = 'cancelled', updated_at = NOW(3) WHERE id = ${id}`);
  return { data: { id, status: 'cancelled' } };
};

export const iyzicoCallback: RouteHandler = async (req, reply) => {
  const body = (req.body ?? {}) as { boost_id?: string; status?: string; paymentId?: string; payment_id?: string; token?: string };
  const query = (req.query ?? {}) as { boost_id?: string; status?: string; paymentId?: string; payment_id?: string; token?: string; locale?: string };
  const boostId = String(body.boost_id ?? query.boost_id ?? '').trim();
  const token = String(body.token ?? query.token ?? '').trim();
  if (!boostId) return reply.code(400).send({ error: { message: 'boost_id_required' } });
  if (!token) return reply.code(400).send({ error: { message: 'iyzico_token_required' } });
  const locale = String(query.locale || 'tr').trim() || 'tr';

  const boostResult = await db.execute(sql`
    SELECT id, price, currency, status
    FROM service_boosts
    WHERE id = ${boostId}
    LIMIT 1
  `);
  const boost = rowsFromExecute<{ id: string; price: string | number; currency: string; status: string }>(boostResult)[0];
  if (!boost) return reply.code(404).send({ error: { message: 'boost_not_found' } });

  const gatewayResult = await db.execute(sql`
    SELECT id, config FROM payment_gateways
    WHERE slug = 'iyzico' AND is_active = 1
    LIMIT 1
  `);
  const gateway = rowsFromExecute<{ id: string; config: string | null }>(gatewayResult)[0];
  if (!gateway) return reply.code(400).send({ error: { message: 'iyzico_gateway_not_configured' } });

  try {
    const iyzico = new IyzicoService(resolveIyzicoConfigFromGateway(gateway));
    const verified = await verifyIyzicoCallback({
      iyzico,
      token,
      expectedAmountMinor: Math.round(Number(boost.price) * 100),
      expectedCurrency: boost.currency || 'TRY',
      expectedBasketId: `BOOST-${boostId}`,
      expectedConversationId: `boost_${boostId}`,
    });

    const updateResult = await db.execute(sql`
      UPDATE service_boosts
      SET status = 'active',
          starts_at = NOW(3),
          ends_at = DATE_ADD(NOW(3), INTERVAL duration_days DAY),
          iyzipay_payment_id = ${verified.paymentId},
          updated_at = NOW(3)
      WHERE id = ${boostId} AND status = 'pending_payment'
    `);
    const affected = Number((updateResult as any)?.[0]?.affectedRows ?? (updateResult as any)?.affectedRows ?? 0);
    if (affected < 1 && boost.status !== 'active') {
      return reply.code(409).send({ error: { message: 'boost_not_pending' } });
    }
  } catch {
    await db.execute(sql`
      UPDATE service_boosts
      SET status = 'cancelled', updated_at = NOW(3)
      WHERE id = ${boostId} AND status = 'pending_payment'
    `);
    return reply.redirect(`${resolveSiteUrl()}/${locale}/me/consultant?boost_id=${encodeURIComponent(boostId)}&checkout=failed`);
  }

  const siteUrl = resolveSiteUrl();
  return reply.redirect(`${siteUrl}/${locale}/me/consultant?boost_id=${encodeURIComponent(boostId)}&checkout=success`);
};
