// =============================================================
// FILE: modules/orders/refund.service.ts
//
// "Para iade edildi → defteri geri sar" adımının TEK KAYNAĞI.
//
// İki yerden çağrılır:
//   1. Admin panelden iade (refundOrderAdmin) — önce sağlayıcıya iade isteği,
//      sonra burası.
//   2. Stripe `charge.refunded` webhook'u — iade Stripe panelinden yapılmışsa
//      sitenin haberi olmuyordu: sipariş "ödendi" kalıyor, danışman hakedişi
//      duruyordu (2026-08-16 finans incelemesi bulgusu).
//
// İdempotent: sipariş zaten refunded ise hiçbir şey yapmaz; negatif payment
// satırı transaction_id UNIQUE'i sayesinde ikinci kez yazılmaz.
// =============================================================
import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { orders, payments } from './schema';
import { clawbackCredits, getPackageById } from '../credits/repository';

export type RefundLedgerResult =
  | { status: 'not_found' }
  | { status: 'already_refunded'; orderId: string }
  | { status: 'not_paid'; orderId: string }
  | { status: 'refunded'; orderId: string };

/**
 * Sipariş defterini iade durumuna alır: negatif ödeme satırı, sipariş durumu,
 * danışman hakedişinin geri sarılması, randevunun iptali, kredi geri alımı,
 * abonelik siparişinde premium erişimin anında kapatılması.
 *
 * @param providerRefund sağlayıcıdan dönen ham yanıt (payments.raw_response'a yazılır)
 */
export async function applyRefundToLedger(args: {
  orderId: string;
  reason?: string | null;
  providerRefund?: unknown;
  /** Kısmi iade için; verilmezse ödemenin tamamı iade sayılır. */
  amount?: number | null;
  log?: { error: (obj: unknown, msg?: string) => void };
}): Promise<RefundLedgerResult> {
  const [order] = await db.select().from(orders).where(eq(orders.id, args.orderId)).limit(1);
  if (!order) return { status: 'not_found' };
  if (order.payment_status === 'refunded') return { status: 'already_refunded', orderId: order.id };
  if (order.payment_status !== 'paid') return { status: 'not_paid', orderId: order.id };

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.order_id, order.id), eq(payments.status, 'success')))
    .orderBy(desc(payments.created_at))
    .limit(1);

  const refundAmount = args.amount != null ? Number(args.amount) : Number(payment?.amount ?? order.total_amount ?? 0);

  // Sipariş bağlamı (context/package_id/plan_id) iade SONRASI adımların anahtarı:
  // kredi geri alımı ve abonelik kapatma buradan okur. Tek yerde parse edilir.
  let orderContext: { context?: string; package_id?: string } = {};
  try {
    const parsed = JSON.parse(String(order.notes || '{}'));
    if (parsed && typeof parsed === 'object') orderContext = parsed;
  } catch { /* notes JSON değil — bağlamsız sipariş */ }

  // İade sebebi siparişin notes JSON'unu EZMEZ (2026-08-25 düzeltmesi: eski
  // davranış context'i yok ediyordu, sonraki incelemede sipariş türü kayboluyordu).
  // Sebep JSON'a refund_reason olarak eklenir; notes JSON değilse aynen korunur
  // (sebep zaten payments.raw_response ile birlikte kayıt altında).
  let nextNotes: string | null = (order.notes as string | null) ?? null;
  if (args.reason) {
    try {
      const parsed = JSON.parse(String(order.notes || '{}'));
      if (parsed && typeof parsed === 'object') {
        (parsed as Record<string, unknown>).refund_reason = args.reason;
        nextNotes = JSON.stringify(parsed);
      }
    } catch { /* JSON değil — orijinal notes korunur */ }
  }

  await db.transaction(async (tx) => {
    if (payment) {
      try {
        await tx.insert(payments).values({
          id: randomUUID(),
          order_id: order.id,
          gateway_id: payment.gateway_id,
          amount: `-${refundAmount.toFixed(2)}`,
          currency: payment.currency || order.currency || 'TRY',
          status: 'refund',
          transaction_id: `refund_${payment.transaction_id}`,
          raw_response: JSON.stringify(args.providerRefund ?? {}),
        } as any);
      } catch (err: any) {
        // transaction_id UNIQUE — webhook tekrar teslimatında sessizce geç.
        if (!String(err?.message || '').includes('Duplicate')) throw err;
      }
    }

    await tx
      .update(orders)
      .set({
        status: 'refunded',
        payment_status: 'refunded',
        notes: nextNotes,
        updated_at: new Date(),
      } as any)
      .where(eq(orders.id, order.id));

    if (order.booking_id) {
      // Bekleyen hakediş: pending_balance'tan düş.
      await tx.execute(sql`
        UPDATE wallets w
        INNER JOIN wallet_transactions wt ON wt.wallet_id = w.id
        SET w.pending_balance = GREATEST(w.pending_balance - wt.amount, 0),
            w.total_earnings = GREATEST(w.total_earnings - wt.amount, 0),
            w.updated_at = NOW(3),
            wt.payment_status = 'refunded',
            wt.updated_at = NOW(3)
        WHERE wt.booking_id = ${order.booking_id}
          AND wt.purpose = 'session_earning'
          AND wt.payment_status = 'pending'
      `);
      // Serbest bırakılmış hakediş: balance'tan düş.
      await tx.execute(sql`
        UPDATE wallets w
        INNER JOIN wallet_transactions wt ON wt.wallet_id = w.id
        SET w.balance = w.balance - wt.amount,
            w.total_earnings = GREATEST(w.total_earnings - wt.amount, 0),
            w.updated_at = NOW(3),
            wt.payment_status = 'refunded',
            wt.updated_at = NOW(3)
        WHERE wt.booking_id = ${order.booking_id}
          AND wt.purpose = 'session_earning'
          AND wt.payment_status = 'completed'
      `);
      await tx.execute(sql`
        UPDATE bookings SET status = 'cancelled', updated_at = NOW(3) WHERE id = ${order.booking_id}
      `);
    }
  });

  // Kredi geri alımı transaction DIŞINDA: hata iade kaydını geri almamalı.
  try {
    const notes = orderContext;
    if (notes?.context === 'credits_purchase' && notes.package_id) {
      const pkg = await getPackageById(notes.package_id);
      if (pkg) {
        const totalCredits = Number(pkg.credits || 0) + Number((pkg as any).bonusCredits ?? (pkg as any).bonus_credits ?? 0);
        await clawbackCredits(order.user_id, totalCredits, {
          type: 'order_refund_clawback',
          id: order.id,
          orderId: order.id,
          description: `Order refund clawback: ${order.order_number}`,
        });
      }
    }
  } catch (err) {
    args.log?.error({ err, orderId: order.id }, 'credits_clawback_failed_after_refund');
  }

  // Abonelik iadesi (2026-08-25): subscription_start siparişinin parası geri
  // döndüyse premium erişim ANINDA biter. 'cancelled' YETMEZ — summary.ts
  // 'cancelled' + ends_at>NOW'u premium sayar (iptal = yenileme durur, erişim
  // sürer). Bu yüzden status='expired' + ends_at=NOW. Eşleşme aktivasyondaki
  // anahtarla kurulur: provider_subscription_id = payment_intent
  // (activate.service.ts). Kısmi iadede de kapatılır (bilinçli karar: yarım
  // premium yok). IAP abonelikleri mağazadan iade edilir, bu eşleşmeye girmez.
  // Transaction DIŞINDA ve non-fatal: hata iade kaydını geri almamalı.
  try {
    if (orderContext?.context === 'subscription_start' && order.user_id && payment?.transaction_id) {
      const result: any = await db.execute(sql`
        UPDATE subscriptions
           SET status = 'expired',
               ends_at = NOW(3),
               cancelled_at = NOW(3),
               cancellation_reason = ${`order_refund:${order.order_number}`.slice(0, 500)},
               auto_renew = 0,
               updated_at = NOW(3)
         WHERE user_id = ${order.user_id}
           AND provider_subscription_id = ${payment.transaction_id}
           AND status IN ('pending','active','grace_period','cancelled','past_due')
      `);
      const affected = Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
      if (affected === 0) {
        // Zaten expired (webhook tekrar teslimatı) — hata değil; yine de iz bırak.
        args.log?.error({ orderId: order.id, paymentIntent: payment.transaction_id }, 'subscription_refund_no_active_row');
      }
    }
  } catch (err) {
    args.log?.error({ err, orderId: order.id }, 'subscription_deactivate_failed_after_refund');
  }

  return { status: 'refunded', orderId: order.id };
}
