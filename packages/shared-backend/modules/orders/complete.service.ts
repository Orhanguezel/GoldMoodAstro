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

export type OrderContext = 'booking' | 'credits_purchase' | 'unknown';

export type CompletePaidOrderResult =
  | { status: 'not_found' }
  | { status: 'already_paid'; context: OrderContext; orderId: string }
  | { status: 'completed'; context: OrderContext; orderId: string; userId: string };

function parseNotes(raw: unknown): { context?: string; package_id?: string } {
  try {
    return JSON.parse(String(raw || '{}')) as { context?: string; package_id?: string };
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
    notes.context === 'credits_purchase' ? 'credits_purchase' : order.booking_id ? 'booking' : 'unknown';

  if (order.payment_status === 'paid') {
    return { status: 'already_paid', context, orderId: order.id };
  }

  const gatewayId = await resolveGatewayId(args.providerSlug);
  // Kredi siparişi tek adımda biter ("completed"); randevu siparişi seans
  // yapılana kadar işlemdedir ("processing") — mevcut iyzico davranışı korunur.
  const nextStatus = context === 'credits_purchase' ? 'completed' : 'processing';

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
        await addCredits(order.user_id, totalCredits, 'purchase', {
          type: 'credit_package',
          id: pkg.id,
          orderId: order.id,
          description: `Kredi paketi: ${(pkg as any).code ?? pkg.id}`,
        });
      }
    } catch (err) {
      args.log?.error({ err, orderId: order.id }, 'credits_grant_failed_after_payment');
    }
  }

  return { status: 'completed', context, orderId: order.id, userId: order.user_id };
}
