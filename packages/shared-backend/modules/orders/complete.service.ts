// =============================================================
// FILE: src/modules/orders/complete.service.ts
//
// "Ödeme başarılı oldu, siparişi tamamla" akışının TEK KAYNAĞI.
// Sağlayıcıdan bağımsızdır: iyzico callback'i de Stripe webhook'u da burayı
// çağırır — yoksa iki yol arasında davranış farkı oluşur (ilk denemede
// credits_purchase kredisi yalnız iyzico yolunda veriliyordu).
//
// Sözleşme:
//   - İdempotent: aynı sipariş ikinci kez tamamlanamaz (koşullu UPDATE).
//   - Bağlama duyarlı: booking → randevu confirmed; credits_purchase → kredi yükle.
//   - Sağlayıcı satırı `payments.gateway_id` ile ayrışır (slug'tan çözülür).
// =============================================================
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders, paymentGateways, payments } from './schema';
import { bookings } from '../bookings/schema';
import { addCredits, getPackageById } from '../credits/repository';
import { activateSubscriptionForPaidOrder } from '../subscriptions/activate.service';
import { users } from '../auth/schema';
import { sendOrderCreatedMail } from '../mail/service';

export type OrderContext = 'booking' | 'credits_purchase' | 'subscription_start' | 'unknown';

export type CompletePaidOrderResult =
  | { status: 'not_found' }
  | { status: 'already_paid'; context: OrderContext; orderId: string }
  | { status: 'completed'; context: OrderContext; orderId: string; userId: string };

function parseNotes(raw: unknown): { context?: string; package_id?: string; plan_id?: string } {
  try {
    return JSON.parse(String(raw || '{}')) as { context?: string; package_id?: string; plan_id?: string };
  } catch {
    return {};
  }
}

async function resolveGatewayId(providerSlug: string): Promise<string> {
  const [gw] = await db
    .select({ id: paymentGateways.id })
    .from(paymentGateways)
    .where(eq(paymentGateways.slug, providerSlug))
    .limit(1);
  return gw?.id ?? '';
}

export async function completePaidOrder(args: {
  orderId: string;
  providerSlug: string;         // 'stripe' | 'iyzico'
  transactionId: string;
  amount: string;               // "12.34" (majör birim)
  currency: string;
  raw?: unknown;
  log?: { error: (obj: unknown, msg?: string) => void };
}): Promise<CompletePaidOrderResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, args.orderId)).limit(1);
  if (!order) return { status: 'not_found' };

  const notes = parseNotes(order.notes);
  const context: OrderContext =
    notes.context === 'credits_purchase'
      ? 'credits_purchase'
      : notes.context === 'subscription_start'
        ? 'subscription_start'
        : order.booking_id
          ? 'booking'
          : 'unknown';

  if (order.payment_status === 'paid') {
    return { status: 'already_paid', context, orderId: order.id };
  }

  const gatewayId = await resolveGatewayId(args.providerSlug);
  // Kredi ve abonelik siparişi tek adımda biter ("completed"); randevu siparişi
  // seans yapılana kadar işlemdedir ("processing").
  const nextStatus = context === 'credits_purchase' || context === 'subscription_start' ? 'completed' : 'processing';

  let didUpdate = false;
  await db.transaction(async (tx) => {
    const updateResult = await tx.execute(sql`
      UPDATE orders
      SET payment_status = 'paid',
          status = ${nextStatus},
          transaction_id = ${args.transactionId},
          updated_at = NOW(3)
      WHERE id = ${order.id} AND payment_status <> 'paid'
    `);
    const affected = Number((updateResult as any)?.[0]?.affectedRows ?? (updateResult as any)?.affectedRows ?? 0);
    if (affected < 1) return; // paralel istek bizden önce tamamlamış

    didUpdate = true;

    try {
      await tx.insert(payments).values({
        id: randomUUID(),
        order_id: order.id,
        gateway_id: gatewayId,
        amount: args.amount,
        currency: args.currency,
        status: 'success',
        transaction_id: args.transactionId,
        raw_response: JSON.stringify(args.raw ?? {}),
      } as any);
    } catch (err: any) {
      // transaction_id UNIQUE — tekrar teslimatta sessizce geç.
      if (!String(err?.message || '').includes('Duplicate')) throw err;
    }

    if (order.booking_id) {
      await tx.update(bookings).set({ status: 'confirmed' } as any).where(eq(bookings.id, order.booking_id));
    }
  });

  if (!didUpdate) {
    return { status: 'already_paid', context, orderId: order.id };
  }

  // Kredi yükleme transaction DIŞINDA: addCredits kendi ledger'ını yazıyor ve
  // hata verirse ödeme kaydını geri almak istemeyiz (para alındı — kredi
  // eksikse manuel telafi edilebilir, ama ödeme kaybolmamalı).
  if (context === 'credits_purchase' && notes.package_id) {
    try {
      const pkg = await getPackageById(notes.package_id);
      if (pkg) {
        const totalCredits = Number(pkg.credits || 0) + Number((pkg as any).bonusCredits ?? (pkg as any).bonus_credits ?? 0);
        // DİKKAT: credit_transactions'ta UNIQUE(reference_type, reference_id, type)
        // var. Referans PAKET olursa bir paket ömür boyu YALNIZ BİR KEZ satın
        // alınabilir (ikinci müşteri parayı öder, kredi alamaz). Doğru idempotens
        // anahtarı SİPARİŞTİR: sipariş başına tek yükleme.
        await addCredits(order.user_id, totalCredits, 'purchase', {
          type: 'credit_order',
          id: order.id,
          orderId: order.id,
          description: `Kredi paketi: ${(pkg as any).code ?? pkg.id}`,
        });
      }
    } catch (err) {
      args.log?.error({ err, orderId: order.id }, 'credits_grant_failed_after_payment');
    }
  }

  // Abonelik de transaction DIŞINDA: aktivasyon hatası ödemeyi geri almamalı.
  if (context === 'subscription_start' && notes.plan_id) {
    try {
      await activateSubscriptionForPaidOrder({
        userId: order.user_id,
        planId: notes.plan_id,
        provider: args.providerSlug === 'stripe' ? 'stripe' : 'iyzipay',
        providerReferenceId: args.transactionId,
      });
    } catch (err) {
      args.log?.error({ err, orderId: order.id }, 'subscription_activation_failed_after_payment');
    }
  }

  // Ödeme onayı e-postası — bugüne kadar YALNIZ admin REST ucundan tetiklenebiliyordu,
  // yani gerçek ödemede müşteriye hiç mail gitmiyordu (sendOrderCreatedMail ölü koddu).
  // Mail hatası ödemeyi geri almaz; log'a düşer.
  try {
    const [buyer] = await db
      .select({ email: users.email, full_name: users.full_name })
      .from(users)
      .where(eq(users.id, order.user_id))
      .limit(1);
    if (buyer?.email) {
      await sendOrderCreatedMail({
        to: buyer.email,
        customer_name: buyer.full_name || 'Danışan',
        order_number: order.order_number,
        final_amount: String(args.amount),
        status: nextStatus,
        locale: 'tr',
      });
    }
  } catch (err) {
    args.log?.error({ err, orderId: order.id }, 'order_confirmation_mail_failed');
  }

  return { status: 'completed', context, orderId: order.id, userId: order.user_id };
}
