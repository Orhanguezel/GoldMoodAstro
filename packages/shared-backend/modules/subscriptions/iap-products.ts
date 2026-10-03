export type IapPlatform = 'apple_iap' | 'google_iap';

type StorePlan = { code: string; period: string };
type ReceiptItem = Record<string, unknown>;

function value(input: unknown): string {
  return String(input ?? '').trim();
}

/** A store SKU grants exactly one of the two configured subscription plans. */
export function expectedSubscriptionProductId(
  plan: StorePlan,
  platform: IapPlatform,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const code = value(plan.code).toLowerCase();
  const period = value(plan.period).toLowerCase();
  if ((code !== 'monthly' && code !== 'yearly') || code !== period) return null;

  const suffix = platform === 'apple_iap' ? 'IOS' : 'ANDROID';
  const selected = value(env[`IAP_SUBSCRIPTION_PRODUCT_${code.toUpperCase()}_${suffix}`]);
  const otherCode = code === 'monthly' ? 'YEARLY' : 'MONTHLY';
  const other = value(env[`IAP_SUBSCRIPTION_PRODUCT_${otherCode}_${suffix}`]);
  if (!selected || !other || selected === other) return null;
  return selected;
}

export function submittedSubscriptionProductMatchesPlan(
  plan: StorePlan,
  platform: IapPlatform,
  submittedProductId: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const expected = expectedSubscriptionProductId(plan, platform, env);
  return Boolean(expected && value(submittedProductId) === expected);
}

/** Never fall back to another item from an Apple receipt's purchase history. */
export function findMatchingAppleSubscriptionItem(
  items: ReceiptItem[],
  expectedProductId: string,
  transactionId: string,
): ReceiptItem | null {
  const productId = value(expectedProductId);
  if (!productId) return null;
  const requestedTransaction = value(transactionId);

  return items.find((item) => {
    if (value(item.product_id) !== productId) return false;
    if (!requestedTransaction) return true;
    return value(item.transaction_id) === requestedTransaction
      || value(item.original_transaction_id) === requestedTransaction;
  }) ?? null;
}
