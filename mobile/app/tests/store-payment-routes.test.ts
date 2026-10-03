import { expect, test } from 'bun:test';
import { isAllowedContentWebUrl, resolveMenuLink } from '../src/lib/menuRoutes';

const site = 'https://goldmoodastro.com';

test('digital product menu URLs open the native purchase screens', () => {
  expect(resolveMenuLink('/tr/pricing', 'tr', site)).toEqual({ kind: 'expo', path: '/packages' });
  expect(resolveMenuLink(`${site}/en/me/credits`, 'en', site)).toEqual({ kind: 'expo', path: '/(tabs)/profile/credits' });
  expect(resolveMenuLink(`${site}/de/profile/subscription`, 'de', site)).toEqual({ kind: 'expo', path: '/(tabs)/profile/subscription' });
});

test('generic WebView rejects digital checkout and unsafe URL schemes', () => {
  expect(isAllowedContentWebUrl(`${site}/tr/pricing`, site)).toBe(false);
  expect(isAllowedContentWebUrl(`${site}/en/me/credits`, site)).toBe(false);
  expect(isAllowedContentWebUrl('https://www.goldmoodastro.com/de/pricing', site)).toBe(false);
  expect(isAllowedContentWebUrl(`${site}/tr/checkout/123`, site)).toBe(false);
  expect(isAllowedContentWebUrl(`${site}/tr/%63heckout/123`, site)).toBe(false);
  expect(isAllowedContentWebUrl(`${site}/tr/%2563heckout/123`, site)).toBe(false);
  expect(isAllowedContentWebUrl('https://checkout.stripe.com/c/pay/123', site)).toBe(false);
  expect(isAllowedContentWebUrl('https://www.paypal.com/checkoutnow', site)).toBe(false);
  expect(isAllowedContentWebUrl('https://unknown.example/checkout', site)).toBe(false);
  expect(isAllowedContentWebUrl('javascript:alert(1)', site)).toBe(false);
  expect(isAllowedContentWebUrl(`${site}/tr/blog`, site)).toBe(true);
});

test('booking checkout remains a separate authorized Stripe flow', () => {
  expect(resolveMenuLink('/tr/consultants', 'tr', site)).toEqual({ kind: 'expo', path: '/(tabs)/connect' });
});
