import { expect, test } from 'bun:test';
import { mediaPriceToCredits, sameMediaPrice } from './pricing';

test('paid audio and video prices in TRY debit the matching credit value', () => {
  expect(mediaPriceToCredits(1)).toBe(10);
  expect(mediaPriceToCredits(29.99)).toBe(300);
  expect(mediaPriceToCredits(0.01)).toBe(1);
  expect(() => mediaPriceToCredits(0)).toThrow('media_price_invalid');
  expect(sameMediaPrice(29.99, 29.99)).toBe(true);
  expect(sameMediaPrice(29.99, 30)).toBe(false);
});
