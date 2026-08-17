/**
 * Uçtan uca ödeme zinciri testi (LOKAL — prod'a karşı ÇALIŞTIRMA).
 *
 * Zincir: sipariş → Stripe webhook (sentetik imzalı) → orders.paid + payments +
 * booking.confirmed / kredi yükleme → booking-auto-complete → session_earning →
 * hold release → balance. Ayrıca medya (sesli) mesaj: kredi düş → mesaj →
 * danışman yanıtı → media_message_earning → release.
 *
 * Kullanım (backend/ dizininden, dev backend 8094'te AÇIKKEN):
 *   bun scripts/e2e-payment-chain-test.ts
 *
 * Test verisi 'E2E-' önekli order_number ve sentetik id'lerle yazılır;
 * script başında önceki koşunun kalıntıları temizlenir.
 */
import { createHmac, randomUUID } from 'node:crypto';
import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

const API = process.env.E2E_API || 'http://localhost:8094/api';
const WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '');

let passed = 0;
let failed = 0;
function check(ok: boolean, label: string, detail?: unknown) {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); }
  else { failed += 1; console.error(`  ✗ ${label}`, detail ?? ''); }
}

function rows<T = any>(r: unknown): T[] {
  const x = r as any;
  if (Array.isArray(x) && Array.isArray(x[0])) return x[0] as T[];
  return (Array.isArray(x) ? x : x?.rows ?? []) as T[];
}

async function postWebhook(event: Record<string, unknown>): Promise<{ status: number; body: any }> {
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', WEBHOOK_SECRET).update(`${t}.${payload}`).digest('hex');
  const res = await fetch(`${API}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${sig}` },
    body: payload,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function cleanup() {
  await db.execute(sql`DELETE FROM wallet_transactions WHERE transaction_ref LIKE 'booking:e2e-%' OR transaction_ref LIKE 'media_message:e2e-%'`);
  await db.execute(sql`DELETE FROM media_messages WHERE id LIKE 'e2e-%'`);
  await db.execute(sql`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'E2E-%')`);
  await db.execute(sql`DELETE FROM stripe_events WHERE id LIKE 'evt_e2e_%'`);
  // credit_transactions siparişlerden ÖNCE silinmeli: sonra silinirse alt sorgu
  // boş döner ve satırlar kalıcı olur (bakiye testi bir sonraki koşuda sapar).
  await db.execute(sql`DELETE FROM credit_transactions WHERE reference_id LIKE 'e2e-%' OR order_id IN (SELECT id FROM orders WHERE order_number LIKE 'E2E-%')`).catch(() => {});
  await db.execute(sql`DELETE FROM invoices WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'E2E-%')`).catch(() => {});
  await db.execute(sql`DELETE FROM orders WHERE order_number LIKE 'E2E-%'`);
  await db.execute(sql`DELETE FROM bookings WHERE id LIKE 'e2e-%'`);
}

async function main() {
  if (!WEBHOOK_SECRET) { console.error('STRIPE_WEBHOOK_SECRET yok (.env)'); process.exit(1); }

  // Sabit test aktörleri: seed'li danışman (Zeynep) + seed'li müşteri
  const [consultant] = rows(await db.execute(sql`
    SELECT c.id, c.user_id FROM consultants c JOIN users u ON u.id = c.user_id
    WHERE u.email = 'zeynep.yildiz@goldmood.test' LIMIT 1
  `));
  const [customer] = rows(await db.execute(sql`
    SELECT id FROM users WHERE role = 'user' LIMIT 1
  `));
  const [resource] = rows(await db.execute(sql`
    SELECT id FROM resources WHERE external_ref_id = ${consultant?.id ?? ''} LIMIT 1
  `));
  if (!consultant || !customer || !resource) { console.error('Seed aktörleri/resource yok — önce bun run db:seed'); process.exit(1); }

  await cleanup();

  console.log('\n── 1) RANDEVU ödemesi: order → webhook → paid + confirmed');
  const bookingId = `e2e-${randomUUID().slice(0, 23)}`;
  const orderId = randomUUID();
  await db.execute(sql`
    INSERT INTO bookings (id, user_id, name, email, phone, locale, consultant_id, resource_id,
      appointment_date, appointment_time, session_duration, session_price, media_type, status, created_at, updated_at)
    VALUES (${bookingId}, ${customer.id}, 'E2E Musteri', 'e2e@test.local', '+900000000000', 'tr',
      ${consultant.id}, ${resource.id}, DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 HOUR), '%Y-%m-%d'),
      DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 HOUR), '%H:%i'), 30, '500.00', 'audio', 'pending_payment', NOW(3), NOW(3))
  `);
  await db.execute(sql`
    INSERT INTO orders (id, user_id, booking_id, order_number, status, total_amount, currency, payment_status, created_at, updated_at)
    VALUES (${orderId}, ${customer.id}, ${bookingId}, ${'E2E-' + Date.now()}, 'pending', '500.00', 'TRY', 'unpaid', NOW(3), NOW(3))
  `);

  const wh1 = await postWebhook({
    id: `evt_e2e_${randomUUID().slice(0, 12)}`,
    type: 'checkout.session.completed',
    api_version: 'e2e',
    data: { object: { id: `cs_e2e_1`, client_reference_id: orderId, payment_intent: `pi_e2e_${Date.now()}`,
      amount_total: 50000, currency: 'try', customer_details: { email: 'e2e@test.local', name: 'E2E Musteri' } } },
  });
  check(wh1.status === 200, `webhook 200 döndü (${wh1.status})`, wh1.body);

  const [orderAfter] = rows(await db.execute(sql`SELECT payment_status, status FROM orders WHERE id = ${orderId}`));
  check(orderAfter?.payment_status === 'paid', `order paid (${orderAfter?.payment_status})`);
  check(orderAfter?.status === 'processing', `order processing (${orderAfter?.status})`);
  const [pay] = rows(await db.execute(sql`
    SELECT p.amount, g.slug FROM payments p LEFT JOIN payment_gateways g ON g.id = p.gateway_id WHERE p.order_id = ${orderId}
  `));
  check(Boolean(pay), 'payments satırı yazıldı');
  check(pay?.slug === 'stripe', `payments provider stripe (${pay?.slug})`);
  const [bookingAfter] = rows(await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId}`));
  check(bookingAfter?.status === 'confirmed', `booking confirmed (${bookingAfter?.status})`);

  console.log('\n── 1b) FATURA: ödeme tamamlanınca otomatik kesildi mi');
  {
    const [inv] = rows(await db.execute(sql`
      SELECT invoice_number, amount, currency, pdf_path, tax_note FROM invoices WHERE order_id = ${orderId}
    `));
    check(Boolean(inv), 'fatura oluştu');
    check(/^GM-\d{4}-\d{5}$/.test(String(inv?.invoice_number ?? '')), `numara formatı GM-YYYY-NNNNN (${inv?.invoice_number})`);
    check(Number(inv?.amount) === 500, `fatura tutarı 500 (${inv?.amount})`);
    check(String(inv?.tax_note ?? '').includes('19'), 'KDV notu (§19 UStG) faturada');
    if (inv?.pdf_path) {
      const { existsSync, statSync } = await import('node:fs');
      const ok = existsSync(String(inv.pdf_path)) && statSync(String(inv.pdf_path)).size > 1000;
      check(ok, `PDF diske yazıldı (${inv.pdf_path})`);
    } else {
      check(false, 'PDF yolu yazılmadı');
    }
  }

  console.log('\n── 2) Aynı webhook TEKRAR gelirse (idempotens)');
  const wh1b = await postWebhook({
    id: `evt_e2e_${randomUUID().slice(0, 12)}`,
    type: 'checkout.session.completed',
    api_version: 'e2e',
    data: { object: { id: `cs_e2e_1`, client_reference_id: orderId, payment_intent: `pi_e2e_dup`,
      amount_total: 50000, currency: 'try' } },
  });
  check(wh1b.status === 200, 'tekrar teslimat 200');
  const payCount = rows(await db.execute(sql`SELECT COUNT(*) AS n FROM payments WHERE order_id = ${orderId}`))[0];
  check(Number(payCount?.n) === 1, `payments hâlâ 1 satır (${payCount?.n})`);

  console.log('\n── 3) booking-auto-complete → session_earning (pending)');
  const { runBookingAutoComplete } = await import('../src/cron/booking-auto-complete');
  const autoRes = await runBookingAutoComplete();
  check(autoRes.completed >= 1, `randevu otomatik completed (${autoRes.completed})`);
  const [bookingDone] = rows(await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId}`));
  check(bookingDone?.status === 'completed', `booking completed (${bookingDone?.status})`);
  const [earning] = rows(await db.execute(sql`
    SELECT amount, payment_status, description FROM wallet_transactions WHERE transaction_ref = ${'booking:' + bookingId}
  `));
  check(Boolean(earning), 'session_earning yazıldı');
  check(earning?.payment_status === 'pending', `hakediş pending (${earning?.payment_status})`);
  // %40 komisyon: 500 brüt → 300 net
  check(Number(earning?.amount) === 300, `net tutar 300 = 500 - %40 komisyon (${earning?.amount})`);

  console.log('\n── 4) Hold süresi dolunca release → balance');
  await db.execute(sql`
    UPDATE wallet_transactions SET created_at = DATE_SUB(NOW(3), INTERVAL 40 DAY) WHERE transaction_ref = ${'booking:' + bookingId}
  `);
  const [walletBefore] = rows(await db.execute(sql`
    SELECT w.id, w.balance, w.pending_balance FROM wallets w WHERE w.consultant_id = ${consultant.id} OR w.user_id = ${consultant.user_id} LIMIT 1
  `));
  const { runConsultantEarningsRelease } = await import('../src/cron/consultant-earnings');
  await runConsultantEarningsRelease();
  const [released] = rows(await db.execute(sql`
    SELECT payment_status FROM wallet_transactions WHERE transaction_ref = ${'booking:' + bookingId}
  `));
  check(released?.payment_status === 'completed', `hakediş released (${released?.payment_status})`);
  const [walletAfter] = rows(await db.execute(sql`SELECT balance FROM wallets WHERE id = ${walletBefore?.id}`));
  check(Number(walletAfter?.balance) >= Number(walletBefore?.balance ?? 0) + 300, `bakiye +300 (${walletBefore?.balance} → ${walletAfter?.balance})`);

  console.log('\n── 5) KREDİ satın alma: order(credits_purchase) → webhook → kredi yüklenir');
  const [pkg] = rows(await db.execute(sql`SELECT id, code, credits, bonus_credits FROM credit_packages WHERE is_active = 1 LIMIT 1`));
  check(Boolean(pkg), 'aktif kredi paketi var');
  if (pkg) {
    const creditOrderId = randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, user_id, order_number, status, total_amount, currency, payment_status, notes, created_at, updated_at)
      VALUES (${creditOrderId}, ${customer.id}, ${'E2E-CRD-' + Date.now()}, 'pending', '250.00', 'TRY', 'unpaid',
        ${JSON.stringify({ context: 'credits_purchase', package_id: pkg.id, package_code: pkg.code, user_id: customer.id })}, NOW(3), NOW(3))
    `);
    const balBefore = rows(await db.execute(sql`SELECT balance FROM user_credits WHERE user_id = ${customer.id}`))[0];
    const wh2 = await postWebhook({
      id: `evt_e2e_${randomUUID().slice(0, 12)}`,
      type: 'checkout.session.completed',
      api_version: 'e2e',
      data: { object: { id: 'cs_e2e_2', client_reference_id: creditOrderId, payment_intent: `pi_e2e_c_${Date.now()}`,
        amount_total: 25000, currency: 'try' } },
    });
    check(wh2.status === 200, 'kredi webhook 200');
    const [creditOrder] = rows(await db.execute(sql`SELECT payment_status, status FROM orders WHERE id = ${creditOrderId}`));
    check(creditOrder?.payment_status === 'paid' && creditOrder?.status === 'completed', `kredi siparişi paid+completed (${creditOrder?.payment_status}/${creditOrder?.status})`);
    const balAfter = rows(await db.execute(sql`SELECT balance FROM user_credits WHERE user_id = ${customer.id}`))[0];
    const expected = Number(pkg.credits) + Number(pkg.bonus_credits ?? 0);
    check(Number(balAfter?.balance ?? 0) - Number(balBefore?.balance ?? 0) === expected,
      `kredi bakiyesi +${expected} (${balBefore?.balance ?? 0} → ${balAfter?.balance ?? 0})`);

    // 5b) AYNI paketin İKİNCİ satışı da kredi yüklemeli.
    // Regresyon: credit_transactions UNIQUE(reference_type,reference_id,type) —
    // referans paket olduğu sürece bir paket ömür boyu tek kez satılabiliyordu;
    // ikinci müşteri parayı ödeyip kredisiz kalıyordu (2026-08-16'da bulundu).
    const creditOrderId2 = randomUUID();
    await db.execute(sql`
      INSERT INTO orders (id, user_id, order_number, status, total_amount, currency, payment_status, notes, created_at, updated_at)
      VALUES (${creditOrderId2}, ${customer.id}, ${'E2E-CRD2-' + Date.now()}, 'pending', '250.00', 'TRY', 'unpaid',
        ${JSON.stringify({ context: 'credits_purchase', package_id: pkg.id, package_code: pkg.code, user_id: customer.id })}, NOW(3), NOW(3))
    `);
    const wh2b = await postWebhook({
      id: `evt_e2e_${randomUUID().slice(0, 12)}`,
      type: 'checkout.session.completed',
      api_version: 'e2e',
      data: { object: { id: 'cs_e2e_2b', client_reference_id: creditOrderId2, payment_intent: `pi_e2e_c2_${Date.now()}`,
        amount_total: 25000, currency: 'try' } },
    });
    check(wh2b.status === 200, 'ikinci kredi webhook 200');
    const balAfter2 = rows(await db.execute(sql`SELECT balance FROM user_credits WHERE user_id = ${customer.id}`))[0];
    check(Number(balAfter2?.balance ?? 0) - Number(balAfter?.balance ?? 0) === expected,
      `AYNI paketin 2. satışı da +${expected} yükledi (${balAfter?.balance ?? 0} → ${balAfter2?.balance ?? 0})`);
  }

  console.log('\n── 6) SESLİ MESAJ: kredi düş → mesaj → yanıt → media_message_earning → release');
  const mmId = `e2e-${randomUUID().slice(0, 23)}`;
  // Danışmanın medya ayarını garanti et (audio 100 TRY)
  await db.execute(sql`
    INSERT INTO consultant_media_settings (consultant_id, audio_enabled, audio_price, video_enabled, video_price, reply_sla_hours, updated_at)
    VALUES (${consultant.id}, 1, '100.00', 0, '0.00', 48, NOW(3))
    ON DUPLICATE KEY UPDATE audio_enabled = 1, audio_price = '100.00'
  `);
  await db.execute(sql`
    INSERT INTO media_messages (id, user_id, consultant_id, kind, direction, storage_path, price, currency, charge_ref, status, created_at, updated_at)
    VALUES (${mmId}, ${customer.id}, ${consultant.id}, 'audio', 'question', 'e2e/test.webm', '100.00', 'TRY', ${'e2e-' + mmId}, 'sent', NOW(3), NOW(3))
  `);
  // Danışman yanıtı repository fonksiyonuyla (gerçek akış): earning'i o yazar
  const { createReply } = await import('@goldmood/shared-backend/modules/mediaMessages/repository');
  const replyRes = await createReply(consultant.id, consultant.user_id, mmId, {
    kind: 'audio', storage_path: 'e2e/reply.webm', duration_seconds: 30,
  });
  check((replyRes as any)?.status !== 'not_found' && (replyRes as any)?.status !== 'not_answerable',
    `danışman yanıtı oluştu (${(replyRes as any)?.status ?? 'ok'})`);
  const [mmAfter] = rows(await db.execute(sql`SELECT status FROM media_messages WHERE id = ${mmId}`));
  check(mmAfter?.status === 'answered', `mesaj answered (${mmAfter?.status})`);
  const [mmEarning] = rows(await db.execute(sql`
    SELECT amount, payment_status FROM wallet_transactions WHERE transaction_ref = ${'media_message:' + mmId}
  `));
  check(Boolean(mmEarning), 'media_message_earning yazıldı');
  if (mmEarning) {
    check(Number(mmEarning.amount) === 60, `net 60 = 100 - %40 (${mmEarning.amount})`);
    await db.execute(sql`UPDATE wallet_transactions SET created_at = DATE_SUB(NOW(3), INTERVAL 40 DAY) WHERE transaction_ref = ${'media_message:' + mmId}`);
    const { runConsultantEarningsRelease: release2 } = await import('../src/cron/consultant-earnings');
    await release2();
    const [mmReleased] = rows(await db.execute(sql`SELECT payment_status FROM wallet_transactions WHERE transaction_ref = ${'media_message:' + mmId}`));
    check(mmReleased?.payment_status === 'completed', `media earning released (${mmReleased?.payment_status}) — eski kodda SONSUZA DEK pending kalıyordu`);
  }

  console.log('\n── 7) İADE: charge.refunded → sipariş refunded + hakediş geri sarıldı');
  {
    // Yeni: iade Stripe panelinden yapıldığında da defter geri sarılmalı.
    // Aşama 1-4'teki randevu siparişi ödenmiş ve hakedişi serbest bırakılmıştı.
    const [balBefore] = rows(await db.execute(
      sql`SELECT balance FROM wallets WHERE consultant_id = ${consultant.id}`,
    ));
    const [payRow] = rows(await db.execute(
      sql`SELECT transaction_id FROM payments WHERE order_id = ${orderId} AND status = 'success' LIMIT 1`,
    ));

    const wh3 = await postWebhook({
      id: `evt_e2e_${randomUUID().slice(0, 12)}`,
      type: 'charge.refunded',
      api_version: 'e2e',
      data: { object: { id: 'ch_e2e_1', payment_intent: payRow?.transaction_id, amount: 50000, amount_refunded: 50000, currency: 'try' } },
    });
    check(wh3.status === 200, `iade webhook 200 (${wh3.status})`, wh3.body);

    const [orderRefunded] = rows(await db.execute(
      sql`SELECT payment_status, status FROM orders WHERE id = ${orderId}`,
    ));
    check(orderRefunded?.payment_status === 'refunded', `sipariş refunded (${orderRefunded?.payment_status})`);

    const [negPay] = rows(await db.execute(
      sql`SELECT amount FROM payments WHERE order_id = ${orderId} AND status = 'refund' LIMIT 1`,
    ));
    check(Boolean(negPay), 'negatif ödeme satırı yazıldı');

    const [earningAfter] = rows(await db.execute(
      sql`SELECT payment_status FROM wallet_transactions WHERE transaction_ref = ${'booking:' + bookingId}`,
    ));
    check(earningAfter?.payment_status === 'refunded', `hakediş refunded (${earningAfter?.payment_status})`);

    const [balAfter] = rows(await db.execute(
      sql`SELECT balance FROM wallets WHERE consultant_id = ${consultant.id}`,
    ));
    check(
      Number(balBefore?.balance ?? 0) - Number(balAfter?.balance ?? 0) === 300,
      `bakiyeden 300 geri alındı (${balBefore?.balance} → ${balAfter?.balance})`,
    );

    const [bookingAfter] = rows(await db.execute(sql`SELECT status FROM bookings WHERE id = ${bookingId}`));
    check(bookingAfter?.status === 'cancelled', `randevu iptal edildi (${bookingAfter?.status})`);
  }

  console.log(`\n══ SONUÇ: ${passed} geçti, ${failed} kaldı ══`);
  await cleanup();
  process.exit(failed === 0 ? 0 : 1);
}

void main();
