import { describe, expect, test } from 'bun:test';
import { findExactAppleCreditItem, grantOnceWithRecovery } from './iap-replay';

describe('credit store transaction replay', () => {
  test('Apple receipt item must match both transaction and package SKU', () => {
    const items = [
      { transaction_id: 'older-transaction', product_id: 'credits.small' },
      { transaction_id: 'current-transaction', product_id: 'subscription.premium' },
    ];
    expect(findExactAppleCreditItem(items, 'current-transaction', 'credits.small')).toBeUndefined();
    expect(findExactAppleCreditItem(items, '', 'credits.small')).toBeUndefined();
    expect(findExactAppleCreditItem(items, 'older-transaction', 'credits.small')).toEqual(items[0]);
  });

  test('parallel deliveries grant once and the duplicate resolves to the committed order', async () => {
    let releases = 0;
    let releaseBoth!: () => void;
    const bothStarted = new Promise<void>((resolve) => { releaseBoth = resolve; });
    let grantedCredits = 0;
    let order: { id: string; user_id: string } | null = null;

    const deliver = () => grantOnceWithRecovery(async () => {
      releases += 1;
      if (releases === 2) releaseBoth();
      await bothStarted; // both requests already passed the preliminary lookup
      if (order) {
        throw Object.assign(new Error('Failed query: insert payment'), {
          cause: Object.assign(new Error('Duplicate entry for payments_txid_uq'), { code: 'ER_DUP_ENTRY' }),
        });
      }
      order = { id: 'one-store-order', user_id: 'account-a' };
      grantedCredits += 10;
      return { balance: grantedCredits };
    }, async () => order);

    const responses = await Promise.all([deliver(), deliver()]);
    expect(responses.filter((result) => result.granted)).toHaveLength(1);
    expect(responses.filter((result) => !result.granted)).toHaveLength(1);
    expect(grantedCredits).toBe(10);
    expect(order).toEqual({ id: 'one-store-order', user_id: 'account-a' });
  });

  test('a duplicate without a committed order fails closed', async () => {
    const duplicate = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
    await expect(grantOnceWithRecovery(
      async () => { throw duplicate; },
      async () => null,
    )).rejects.toBe(duplicate);
  });
});
