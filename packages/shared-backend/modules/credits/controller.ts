// packages/shared-backend/modules/credits/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './repository';
import { IyzicoService, resolveIyzicoConfigFromGateway, resolveIyzicoLocale, verifyIyzicoCallback } from '../orders/iyzico.service';
import { db } from '../../db/client';
import { paymentGateways, orders, payments } from '../orders/schema';
import { eq, and, sql } from 'drizzle-orm';
import { profiles } from '../profiles/schema';
import { apiMessage } from '../_shared/api-i18n';

export async function handleListPackages(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Record<string, string | undefined>;
  const locale = q?.locale || (req as any).locale || 'tr';
  const packages = await repo.listActivePackages(locale);
  return reply.send({ data: packages });
}

export async function handleGetBalance(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const balance = await repo.getUserBalance(user.id);
  return reply.send({ data: balance });
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
