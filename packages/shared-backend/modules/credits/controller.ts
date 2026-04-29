// packages/shared-backend/modules/credits/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './repository';
import { IyzicoService, resolveIyzicoLocale } from '../orders/iyzico.service';
import { db } from '../../db/client';
import { paymentGateways, orders, payments } from '../orders/schema';
import { eq, and } from 'drizzle-orm';
import { profiles } from '../profiles/schema';

export async function handleListPackages(req: FastifyRequest, reply: FastifyReply) {
  const packages = await repo.listActivePackages();
  return reply.send({ data: packages });
}

export async function handleGetBalance(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });
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

function resolveIyzicoConfig(gateway?: { config: string | null }) {
  const config = JSON.parse(gateway?.config || '{}');
  return {
    apiKey: config.apiKey || process.env.IYZIPAY_API_KEY || process.env.IYZICO_API_KEY || '',
    secretKey: config.secretKey || process.env.IYZIPAY_SECRET_KEY || process.env.IYZICO_SECRET_KEY || '',
    baseUrl: config.baseUrl || (process.env.IYZICO_TEST_MODE === 'false' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com'),
  };
}

export async function handleBuyCredits(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const { package_id, locale = 'tr' } = req.body as { package_id: string, locale?: string };
  
  const pkg = await repo.getPackageById(package_id);
  if (!pkg) return reply.status(404).send({ error: 'Paket bulunamadı.' });

  // 1. Resolve Iyzico Gateway
  const [gateway] = await db.select().from(paymentGateways).where(and(eq(paymentGateways.slug, 'iyzico'), eq(paymentGateways.is_active, 1))).limit(1);
  if (!gateway) return reply.status(400).send({ error: 'Ödeme sistemi yapılandırılmamış.' });

  const iyzico = new IyzicoService(resolveIyzicoConfig(gateway));

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  const orderId = uuidv4();
  const orderNumber = `CRD-${Date.now()}`;
  const amount = (pkg.priceMinor / 100).toFixed(2);

  // Create order record for tracking
  await db.insert(orders).values({
    id: orderId,
    user_id: user.id,
    order_number: orderNumber,
    status: 'pending',
    total_amount: amount,
    currency: 'TRY',
    payment_gateway_id: gateway.id,
    payment_status: 'unpaid',
    notes: `Kredi Yükleme: ${pkg.nameTr}`,
  });

  const iyzicoLocale = resolveIyzicoLocale(locale);

  try {
    const result = await iyzico.initializeCheckoutForm({
      locale: iyzicoLocale,
      conversationId: `conv_${orderNumber}`,
      price: amount,
      paidPrice: amount,
      currency: 'TRY',
      basketId: orderNumber,
      callbackUrl: `${resolveApiBase()}/api/credits/iyzico/callback?order_id=${orderId}&package_id=${pkg.id}`,
      buyer: {
        id: user.id,
        name: profile?.full_name?.split(' ')[0] || 'Müşteri',
        surname: profile?.full_name?.split(' ').slice(1).join(' ') || '.',
        gsmNumber: profile?.phone || '+905000000000',
        email: user.email,
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        registrationAddress: profile?.address_line1 || 'İstanbul',
        ip: req.ip,
        city: profile?.city || 'İstanbul',
        country: 'Turkey',
        zipCode: profile?.postal_code || '34000',
      },
      shippingAddress: {
        contactName: profile?.full_name || 'Müşteri',
        city: profile?.city || 'İstanbul',
        country: 'Turkey',
        address: profile?.address_line1 || 'İstanbul',
        zipCode: profile?.postal_code || '34000',
      },
      billingAddress: {
        contactName: profile?.full_name || 'Müşteri',
        city: profile?.city || 'İstanbul',
        country: 'Turkey',
        address: profile?.address_line1 || 'İstanbul',
        zipCode: profile?.postal_code || '34000',
      },
      basketItems: [{
        id: pkg.id,
        name: pkg.nameTr,
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
    console.error('Iyzico Init Error:', err);
    return reply.status(500).send({ error: 'Ödeme başlatılamadı.' });
  }
}

export async function handleIyzicoCallback(req: FastifyRequest, reply: FastifyReply) {
  const { order_id, package_id } = req.query as { order_id: string, package_id: string };
  const { token } = req.body as { token: string };

  const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.slug, 'iyzico')).limit(1);
  const iyzico = new IyzicoService(resolveIyzicoConfig(gateway));

  const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const result = await iyzico.retrieveCheckoutResult(token);
    const isPaid = result['status'] === 'success' && result['paymentStatus'] === 'SUCCESS';

    if (isPaid) {
      const [order] = await db.select().from(orders).where(eq(orders.id, order_id)).limit(1);
      const pkg = await repo.getPackageById(package_id);

      if (order && pkg && order.payment_status !== 'paid') {
        // 1. Update order
        await db.update(orders).set({
          payment_status: 'paid',
          status: 'completed',
          transaction_id: (result['paymentId'] as string) || token,
        }).where(eq(orders.id, order_id));

        // 2. Add credits
        const totalCredits = pkg.credits + pkg.bonusCredits;
        await repo.addCredits(order.user_id, totalCredits, 'purchase', {
          type: 'package',
          id: pkg.id,
          orderId: order.id,
          description: `${pkg.nameTr} paketi satın alındı.`
        });
        
        // 3. Log payment
        await db.insert(payments).values({
          id: uuidv4(),
          order_id: order.id,
          gateway_id: gateway?.id || '',
          amount: (result['paidPrice'] as string) || '0',
          currency: 'TRY',
          status: 'success',
          transaction_id: (result['paymentId'] as string) || token,
          raw_response: JSON.stringify(result),
        });
      }

      return reply.redirect(`${siteUrl}/me/credits?status=success`);
    } else {
      return reply.redirect(`${siteUrl}/me/credits?status=failed`);
    }
  } catch (err) {
    console.error('Iyzico Callback Error:', err);
    return reply.redirect(`${siteUrl}/me/credits?status=error`);
  }
}
