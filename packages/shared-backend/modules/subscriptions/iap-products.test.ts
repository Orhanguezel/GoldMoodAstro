import { describe, expect, test } from 'bun:test';
import { expectedSubscriptionProductId, findMatchingAppleSubscriptionItem, submittedSubscriptionProductMatchesPlan } from './iap-products';

const products = {
  IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS: 'com.goldmoodastro.app.monthly',
  IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS: 'com.goldmoodastro.app.yearly',
  IAP_SUBSCRIPTION_PRODUCT_MONTHLY_ANDROID: 'com.goldmoodastro.app.monthly',
  IAP_SUBSCRIPTION_PRODUCT_YEARLY_ANDROID: 'com.goldmoodastro.app.yearly',
};

describe('subscription store product binding', () => {
  test('a monthly store purchase cannot authorize the annual plan on either platform', () => {
    const annualPlan = { code: 'yearly', period: 'yearly' };
    expect(submittedSubscriptionProductMatchesPlan(annualPlan, 'apple_iap', products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS, products)).toBe(false);
    expect(submittedSubscriptionProductMatchesPlan(annualPlan, 'google_iap', products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_ANDROID, products)).toBe(false);

    const monthlyReceiptItem = { product_id: products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS, transaction_id: 'monthly-transaction', expires_date_ms: String(Date.now() + 86_400_000) };
    expect(findMatchingAppleSubscriptionItem([monthlyReceiptItem], products.IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS, 'monthly-transaction')).toBeNull();
  });

  test('a matching annual purchase is selected even when the receipt also contains monthly history', () => {
    const annualPlan = { code: 'yearly', period: 'yearly' };
    const expected = expectedSubscriptionProductId(annualPlan, 'apple_iap', products);
    const monthly = { product_id: products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS, transaction_id: 'monthly-transaction' };
    const annual = { product_id: products.IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS, transaction_id: 'annual-transaction' };
    expect(expected).toBe(products.IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS);
    expect(submittedSubscriptionProductMatchesPlan(annualPlan, 'apple_iap', annual.product_id, products)).toBe(true);
    expect(findMatchingAppleSubscriptionItem([monthly, annual], expected!, 'annual-transaction')).toBe(annual);
    expect(findMatchingAppleSubscriptionItem([monthly, annual], expected!, 'monthly-transaction')).toBeNull();
    expect(submittedSubscriptionProductMatchesPlan(annualPlan, 'google_iap', products.IAP_SUBSCRIPTION_PRODUCT_YEARLY_ANDROID, products)).toBe(true);
  });

  test('missing SKU configuration and unsupported plan mappings fail closed', () => {
    expect(expectedSubscriptionProductId({ code: 'yearly', period: 'yearly' }, 'apple_iap', {})).toBeNull();
    expect(submittedSubscriptionProductMatchesPlan({ code: 'yearly', period: 'yearly' }, 'apple_iap', products.IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS, {})).toBe(false);
    expect(expectedSubscriptionProductId({ code: 'yearly', period: 'yearly' }, 'apple_iap', {
      ...products,
      IAP_SUBSCRIPTION_PRODUCT_YEARLY_IOS: products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS,
    })).toBeNull();
    expect(expectedSubscriptionProductId({ code: 'premium', period: 'yearly' }, 'apple_iap', products)).toBeNull();
    expect(expectedSubscriptionProductId({ code: 'lifetime', period: 'lifetime' }, 'google_iap', products)).toBeNull();
    expect(findMatchingAppleSubscriptionItem([{ product_id: products.IAP_SUBSCRIPTION_PRODUCT_MONTHLY_IOS }], '', '')).toBeNull();
  });
});
