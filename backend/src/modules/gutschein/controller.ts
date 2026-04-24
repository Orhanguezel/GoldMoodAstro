// src/modules/gutschein/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { gutscheins, gutscheinProducts } from './schema';
import { eq, and } from 'drizzle-orm';
import { checkCodeSchema, purchaseSchema, redeemSchema } from './validation';
import { createPaypalOrder, capturePaypalOrder } from '@vps/shared-backend/modules/wallet/paypal.service';
import type { PaypalCredentials } from '@vps/shared-backend/modules/wallet/paypal.service';
import { getPaymentConfig } from './local-helpers';
import { env } from '@/core/env';
import { sendGutscheinEmail, buildGutscheinHtml, notifyAdminGutscheinPurchased } from './email';

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  return {
    id: (u?.id ?? u?.sub ?? '') as string,
    email: (u?.email ?? '') as string,
  };
}

/** KM-XXXX-XXXX — Verwirrungs-sichere Zeichen (keine 0/O/I/1) */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `KM-${seg()}-${seg()}`;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const [existing] = await db
      .select({ id: gutscheins.id })
      .from(gutscheins)
      .where(eq(gutscheins.code, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error('Could not generate unique code after 10 attempts');
}

// ── GET /gutscheins/products ─────────────────────────────────────────────────
export const listProducts: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select()
    .from(gutscheinProducts)
    .where(eq(gutscheinProducts.is_active, 1))
    .orderBy(gutscheinProducts.display_order);
  return reply.send(rows);
};

// ── POST /gutscheins/check ───────────────────────────────────────────────────
export const checkCode: RouteHandler = async (req, reply) => {
  const parsed = checkCodeSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.code, parsed.data.code))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  // Ablauf prüfen
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    if (row.status === 'active') {
      await db.update(gutscheins).set({ status: 'expired' }).where(eq(gutscheins.id, row.id));
    }
    return reply.code(400).send({ error: 'gutschein_expired' });
  }

  return reply.send({
    code:           row.code,
    value:          row.value,
    currency:       row.currency,
    status:         row.status,
    expires_at:     row.expires_at,
    recipient_name: row.recipient_name,
  });
};

// ── POST /gutscheins/purchase ────────────────────────────────────────────────
// Legt einen ausstehenden Gutschein an. Zahlungsintegration folgt separat.
export const purchaseGutschein: RouteHandler = async (req, reply) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const {
    product_id,
    custom_value,
    custom_currency,
    purchaser_name,
    purchaser_email,
    recipient_name,
    recipient_email,
    personal_message,
  } = parsed.data;

  // Resolve value / currency / validity — either from product or custom
  let resolvedValue: string;
  let resolvedCurrency: string;
  let resolvedValidityDays: number;
  let resolvedProductId: string | null = null;

  if (product_id) {
    const [product] = await db
      .select()
      .from(gutscheinProducts)
      .where(and(eq(gutscheinProducts.id, product_id), eq(gutscheinProducts.is_active, 1)))
      .limit(1);

    if (!product) return reply.code(404).send({ error: 'product_not_found' });

    resolvedValue       = product.value;
    resolvedCurrency    = product.currency;
    resolvedValidityDays = product.validity_days;
    resolvedProductId   = product.id;
  } else {
    // custom amount
    resolvedValue        = Number(custom_value!).toFixed(2);
    resolvedCurrency     = (custom_currency ?? 'EUR').toUpperCase();
    resolvedValidityDays = 365;
  }

  const code = await uniqueCode();
  const id = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + resolvedValidityDays);

  await db.insert(gutscheins).values({
    id,
    code,
    product_id:       resolvedProductId,
    value:            resolvedValue,
    currency:         resolvedCurrency,
    status:           'pending',
    purchaser_email,
    purchaser_name,
    recipient_email:  recipient_email ?? null,
    recipient_name:   recipient_name ?? null,
    personal_message: personal_message ?? null,
    expires_at:       expiresAt,
    payment_status:   'pending',
  });

  // ── PayPal Zahlungsintegration ────────────────────────────────────────────
  const cfg = await getPaymentConfig();
  if (cfg.paypal.enabled && cfg.paypal.clientId && cfg.paypal.clientSecret) {
    const defaultFront = env.FRONTEND_URL || 'http://localhost:3000';
    const reqLocale = (req.query as any)?.locale || req.headers['x-locale'] || 'de';
    const localePrefix = `/${reqLocale}`;
    const returnUrl = `${defaultFront}${localePrefix}/gutschein/success?id=${id}`;
    const cancelUrl = `${defaultFront}${localePrefix}/gutschein?cancelled=1`;

    const ppCredentials: PaypalCredentials = {
      clientId: cfg.paypal.clientId,
      clientSecret: cfg.paypal.clientSecret,
      baseUrl: cfg.paypal.baseUrl,
    };

    try {
      const pp = await createPaypalOrder({
        amount: Number(resolvedValue).toFixed(2),
        currency: resolvedCurrency,
        referenceId: id,
        customId: id,
        description: `Gutschein ${code}`,
        returnUrl,
        cancelUrl,
      }, ppCredentials);

      await db
        .update(gutscheins)
        .set({ payment_transaction_id: pp.orderId, order_ref: pp.orderId } as any)
        .where(eq(gutscheins.id, id));

      return reply.send({
        success:        true,
        gutschein_id:   id,
        code,
        value:          resolvedValue,
        currency:       resolvedCurrency,
        expires_at:     expiresAt,
        payment_status: 'pending',
        paypal: {
          order_id:    pp.orderId,
          approve_url: pp.approveUrl,
        },
      });
    } catch (err: any) {
      req.log.error({ err: err?.message ?? err }, 'PayPal order creation failed');
      return reply.code(500).send({
        success: false,
        error: 'paypal_order_failed',
        message: err?.message ?? 'PayPal order could not be created',
      });
    }
  }

  return reply.send({
    success:        true,
    gutschein_id:   id,
    code,
    value:          resolvedValue,
    currency:       resolvedCurrency,
    expires_at:     expiresAt,
    payment_status: 'pending',
  });
};

// ── POST /gutscheins/redeem (requireAuth) ────────────────────────────────────
export const redeemGutschein: RouteHandler = async (req, reply) => {
  const user = getUser(req);
  const parsed = redeemSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const { code, booking_id } = parsed.data;

  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.code, code))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  if (row.status !== 'active')
    return reply.code(400).send({ error: 'gutschein_not_redeemable', status: row.status });

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await db.update(gutscheins).set({ status: 'expired' }).where(eq(gutscheins.id, row.id));
    return reply.code(400).send({ error: 'gutschein_expired' });
  }

  await db
    .update(gutscheins)
    .set({
      status:               'redeemed',
      redeemed_at:          new Date(),
      redeemed_by_user_id:  user.id,
      redeemed_booking_id:  booking_id ?? null,
    })
    .where(eq(gutscheins.id, row.id));

  return reply.send({
    success:  true,
    code:     row.code,
    value:    row.value,
    currency: row.currency,
  });
};

// ── POST /gutscheins/:id/paypal/capture ──────────────────────────────────────
export const captureGutscheinPaypal: RouteHandler = async (req, reply) => {
  const gutscheinId = (req.params as { id: string }).id;
  const { order_id } = (req.body as { order_id?: string }) ?? {};

  if (!gutscheinId) return reply.code(400).send({ error: 'missing_id' });
  if (!order_id) return reply.code(400).send({ error: 'missing_order_id' });

  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, gutscheinId))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  // Idempotenz: bereits bezahlt
  if (row.payment_status === 'paid') {
    return reply.send({
      success:      true,
      already_paid: true,
      gutschein_id: row.id,
      code:         row.code,
    });
  }

  const cfg = await getPaymentConfig();
  if (!cfg.paypal.enabled || !cfg.paypal.clientId || !cfg.paypal.clientSecret) {
    return reply.code(400).send({ error: 'paypal_not_configured' });
  }

  const ppCredentials: PaypalCredentials = {
    clientId:     cfg.paypal.clientId,
    clientSecret: cfg.paypal.clientSecret,
    baseUrl:      cfg.paypal.baseUrl,
  };

  try {
    const capture = await capturePaypalOrder(order_id, ppCredentials);

    if (capture.captureStatus === 'COMPLETED' || capture.orderStatus === 'COMPLETED') {
      const issuedAt = new Date();
      await db
        .update(gutscheins)
        .set({
          payment_status:         'paid',
          status:                 'active',
          issued_at:              issuedAt,
          payment_transaction_id: capture.captureId ?? order_id,
        } as any)
        .where(eq(gutscheins.id, gutscheinId));

      // Auto-send gutschein email to purchaser (and recipient if different)
      const emailData = {
        code: row.code,
        value: row.value,
        currency: row.currency,
        purchaser_name: row.purchaser_name,
        purchaser_email: row.purchaser_email,
        recipient_name: row.recipient_name,
        recipient_email: row.recipient_email,
        personal_message: row.personal_message,
        expires_at: row.expires_at,
        issued_at: issuedAt,
      };

      // Send in background — don't block the response
      if (row.purchaser_email) {
        sendGutscheinEmail(emailData, row.purchaser_email).catch((e) =>
          req.log.error({ err: e?.message ?? e }, 'gutschein_email_to_purchaser_failed'),
        );
      }
      if (row.recipient_email && row.recipient_email !== row.purchaser_email) {
        sendGutscheinEmail(emailData, row.recipient_email).catch((e) =>
          req.log.error({ err: e?.message ?? e }, 'gutschein_email_to_recipient_failed'),
        );
      }

      // Admin notification (DB + email + telegram)
      notifyAdminGutscheinPurchased(emailData).catch((e) =>
        req.log.error({ err: e?.message ?? e }, 'gutschein_admin_notify_failed'),
      );

      return reply.send({
        success:        true,
        gutschein_id:   gutscheinId,
        code:           row.code,
        value:          row.value,
        currency:       row.currency,
        capture_status: capture.captureStatus,
      });
    }

    return reply.code(400).send({ error: 'capture_not_completed', status: capture.captureStatus });
  } catch (err: any) {
    return reply.code(500).send({ error: 'paypal_capture_failed', message: err?.message });
  }
};

// ── GET /gutscheins/:id/print ────────────────────────────────────────────────
export const printGutschein: RouteHandler = async (req, reply) => {
  const gutscheinId = (req.params as { id: string }).id;

  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, gutscheinId))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  if (row.payment_status !== 'paid' && !row.is_admin_created) {
    return reply.code(400).send({ error: 'gutschein_not_paid' });
  }

  const { getSiteBranding } = await import('./email');
  const locale = (req.query as any)?.locale || 'de';
  const branding = await getSiteBranding(locale);

  const html = buildGutscheinHtml(
    {
      code: row.code,
      value: row.value,
      currency: row.currency,
      purchaser_name: row.purchaser_name,
      purchaser_email: row.purchaser_email,
      recipient_name: row.recipient_name,
      recipient_email: row.recipient_email,
      personal_message: row.personal_message,
      expires_at: row.expires_at,
      issued_at: row.issued_at,
    },
    branding,
    { forPrint: true },
  );

  reply.header('Content-Type', 'text/html; charset=utf-8');
  return reply.send(html);
};
