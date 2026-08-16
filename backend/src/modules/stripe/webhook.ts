// =============================================================
// FILE: src/modules/stripe/webhook.ts
// Stripe webhook alıcısı (STRIPE-ODEME-RAPORU §4.2, Payment Link fazı).
// - İmza doğrulama: Stripe-Signature v1 = HMAC-SHA256("{t}.{rawBody}", whsec)
//   SDK'sız yapılır (bkz. https://docs.stripe.com/webhooks#verify-manually).
// - Fail-closed: STRIPE_WEBHOOK_SECRET yoksa uç 503 döner (fallback yok).
// - İdempotent: event id stripe_events tablosuna INSERT IGNORE; tekrar
//   teslimatlar sessizce 200 alır (Stripe retry fırtınası üretmez).
// - checkout.session.completed → admin'e e-posta bildirimi (Payment Link
//   satışları elle karşılandığı fazda görünürlük için).
// =============================================================
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendMail } from '@goldmood/shared-backend/modules/mail';
import { completePaidOrder } from '@goldmood/shared-backend/modules/orders/complete.service';

const TOLERANCE_SECONDS = 5 * 60;

function verifyStripeSignature(rawBody: Buffer, header: string, secret: string): boolean {
  const parts = new Map<string, string[]>();
  for (const kv of header.split(',')) {
    const [k, v] = kv.split('=', 2);
    if (!k || !v) continue;
    const key = k.trim();
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key)!.push(v.trim());
  }
  const timestamp = Number(parts.get('t')?.[0] ?? NaN);
  const signatures = parts.get('v1') ?? [];
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, 'utf8');
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}

async function notifyAdminCheckoutCompleted(event: any, log: FastifyRequest['log']) {
  try {
    const s = event?.data?.object ?? {};
    const amount = typeof s.amount_total === 'number' ? (s.amount_total / 100).toFixed(2) : '?';
    const currency = String(s.currency ?? '').toUpperCase();
    const email = s.customer_details?.email ?? s.customer_email ?? '(e-posta yok)';
    const name = s.customer_details?.name ?? '';
    const ref = s.client_reference_id ? `\nReferans: ${s.client_reference_id}` : '';
    await sendMail({
      // Bildirim kutusu: kullanıcının gerçek okuduğu adres (2026-08-16 talimatı).
      // ADMIN_EMAIL kullanılmıyor — o, seed admin hesabının login e-postası.
      to: process.env.STRIPE_NOTIFY_EMAIL || 'goldmoodastro@gmail.com',
      subject: `Stripe ödemesi alındı — ${amount} ${currency}`,
      text:
        `Stripe Checkout ödemesi tamamlandı.\n\n` +
        `Tutar: ${amount} ${currency}\nMüşteri: ${name} <${email}>${ref}\n` +
        `Session: ${s.id ?? '?'}\nEvent: ${event?.id ?? '?'}\n\n` +
        `Detay: https://dashboard.stripe.com/payments`,
    } as any);
  } catch (err) {
    // Bildirim hatası webhook'u düşürmez; Stripe'a yine 200 döneriz.
    log.error({ err }, 'stripe_webhook_admin_mail_failed');
  }
}

export async function registerStripeWebhook(app: FastifyInstance) {
  // Bu kapsam (encapsulated plugin) içinde JSON gövde parse EDİLMEZ — imza ham
  // gövde üzerinden hesaplanır. Fastify miras alınan parser'ı yeniden eklemeye
  // izin vermez (FST_ERR_CTP_ALREADY_PRESENT); önce kapsam içinde kaldırılır.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body);
  });

  app.post('/webhooks/stripe', async (req: FastifyRequest, reply: FastifyReply) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      req.log.error('STRIPE_WEBHOOK_SECRET missing — webhook fail-closed');
      return reply.code(503).send({ error: { message: 'stripe_webhook_disabled' } });
    }

    const rawBody = req.body as Buffer;
    const signature = req.headers['stripe-signature'];
    if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string') {
      return reply.code(400).send({ error: { message: 'invalid_payload' } });
    }
    if (!verifyStripeSignature(rawBody, signature, secret)) {
      return reply.code(400).send({ error: { message: 'invalid_signature' } });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return reply.code(400).send({ error: { message: 'invalid_json' } });
    }
    if (!event?.id || !event?.type) {
      return reply.code(400).send({ error: { message: 'invalid_event' } });
    }

    // İdempotens: aynı event ikinci kez gelirse kaydetme ve tekrar işleme.
    const inserted = await db.execute(sql`
      INSERT IGNORE INTO stripe_events (id, type, api_version, payload)
      VALUES (${event.id}, ${event.type}, ${String(event.api_version ?? '')}, ${rawBody.toString('utf8')})
    `);
    const affected = Number((inserted as any)?.[0]?.affectedRows ?? (inserted as any)?.affectedRows ?? 1);
    if (affected === 0) {
      return reply.send({ received: true, duplicate: true });
    }

    if (event.type === 'checkout.session.completed') {
      // 1) Ledger: siparişi tamamla (randevu onayı / kredi yükleme dahil).
      //    client_reference_id boşsa bu bir Payment Link satışıdır (sipariş
      //    kaydı yok) — o durumda yalnız bildirim kalır, hata değildir.
      const session = event?.data?.object ?? {};
      const orderId = String(session.client_reference_id || session.metadata?.order_id || '').trim();
      if (orderId) {
        try {
          const result = await completePaidOrder({
            orderId,
            providerSlug: 'stripe',
            transactionId: String(session.payment_intent || session.id),
            amount: (Number(session.amount_total ?? 0) / 100).toFixed(2),
            currency: String(session.currency || 'try').toUpperCase(),
            raw: session,
            log: req.log,
          });
          req.log.info({ orderId, result: result.status, context: (result as any).context }, 'stripe_order_completed');
          if (result.status !== 'not_found') {
            await db.execute(sql`UPDATE stripe_events SET processed_at = NOW(3) WHERE id = ${event.id}`);
          }
        } catch (err) {
          // Ledger hatası → 500 dön ki Stripe tekrar denesin (idempotens korur).
          req.log.error({ err, orderId }, 'stripe_order_completion_failed');
          return reply.code(500).send({ error: { message: 'order_completion_failed' } });
        }
      }

      // 2) Bildirim (ledger başarılı olsun ya da Payment Link olsun, her durumda).
      await notifyAdminCheckoutCompleted(event, req.log);
    }

    req.log.info({ eventId: event.id, type: event.type }, 'stripe_webhook_received');
    return reply.send({ received: true });
  });
}
