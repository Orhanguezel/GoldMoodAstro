import { describe, expect, test } from 'bun:test';
import { classifyPaymentReturn, PAYMENT_SUCCESS_PATTERNS, PAYMENT_FAILURE_PATTERNS } from '../src/lib/paymentReturn';

const site = 'https://goldmoodastro.com';
const oldAdminPatterns = {
  success: PAYMENT_SUCCESS_PATTERNS,
  failure: PAYMENT_FAILURE_PATTERNS.filter((pattern) => pattern !== 'status=cancelled'),
};

describe('Stripe WebView return', () => {
  test('recognizes current backend success and cancel URLs with old admin settings', () => {
    expect(classifyPaymentReturn(`${site}/tr/booking/payment?status=success&order_id=1`, site, oldAdminPatterns)).toBe('success');
    expect(classifyPaymentReturn(`${site}/tr/booking/payment?status=cancelled&order_id=1`, site, oldAdminPatterns)).toBe('failure');
  });

  test('does not accept a return marker from a different host', () => {
    expect(classifyPaymentReturn('https://checkout.example/tr/booking/payment?status=success', site, oldAdminPatterns)).toBeNull();
  });
});
