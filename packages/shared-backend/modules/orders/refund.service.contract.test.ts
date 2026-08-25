// Kaynak-metin sözleşme testi: iade geri sarma davranışının iki kritik kuralını
// kilitler (2026-08-25 — abonelik iadesi eklendi, notes ezme kusuru düzeltildi).
// Desen: superadmin-plan-change.test.ts ile aynı (readFileSync + regex bekçisi).
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(import.meta.dir, 'refund.service.ts'), 'utf8');

describe('refund.service sözleşmesi', () => {
  test('subscription_start iadesi aboneliği ANINDA kapatır (expired + ends_at=NOW)', () => {
    expect(source).toContain("orderContext?.context === 'subscription_start'");
    // 'cancelled' yetmez: summary.ts cancelled + ends_at>NOW'u premium sayar.
    expect(source).toMatch(/SET status = 'expired'/);
    expect(source).toMatch(/ends_at = NOW\(3\)/);
    // Eşleşme aktivasyon anahtarıyla: provider_subscription_id = payment_intent.
    expect(source).toMatch(/provider_subscription_id = \$\{payment\.transaction_id\}/);
  });

  test('iade sebebi siparişin notes JSON bağlamını EZMEZ', () => {
    // Eski bug kalıbı geri gelmesin: notes alanına çıplak reason yazmak
    // context/package_id/plan_id bilgisini yok ediyordu.
    expect(source).not.toMatch(/notes:\s*args\.reason\s*\|\|\s*order\.notes/);
    expect(source).toContain('refund_reason');
    // Kredi geri alımı ve abonelik kapatma aynı tek parse'tan okur.
    expect(source).toContain('orderContext');
  });

  test('abonelik kapatma non-fatal: hata iade kaydını geri almaz', () => {
    expect(source).toContain('subscription_deactivate_failed_after_refund');
  });
});
