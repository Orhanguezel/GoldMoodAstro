/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import {
  toLocalizedPublicPath,
  toPublicRouteLocale,
} from '@goldmood/shared-config/publicRoutes';

// Paylaşım linkleri (src/lib/webShare.ts) kullanıcının dilindeki kanonik web
// adresine gitmeli; sabit /tr/ veya İngilizce burç slug'ı 308'e düşüyordu.
const cases: Array<[string, string, string]> = [
  ['tr-TR', '/burclar/aries', '/burclar/koc'],
  ['en', '/burclar/aries', '/zodiac-signs/aries'],
  ['de-DE', '/burclar/aries', '/sternzeichen/widder'],
  ['en', '/kahve-fali/result/abc', '/coffee-reading/result/abc'],
  ['de', '/ruya-tabiri/result/abc', '/traumdeutung/result/abc'],
  ['en', '/sinastri/result/abc', '/synastry/result/abc'],
  ['de', '/tarot/reading/abc', '/tarot/reading/abc'],
  ['tr', '/yildizname/result/abc', '/yildizname/result/abc'],
];

describe('mobil paylaşım yolları', () => {
  test.each(cases)('%s %s → %s', (locale, logical, expected) => {
    expect(toLocalizedPublicPath(toPublicRouteLocale(locale), logical)).toBe(expected);
  });

  test('bilinmeyen dil Türkçeye düşer', () => {
    expect(toPublicRouteLocale('fr')).toBe('tr');
    expect(toPublicRouteLocale(undefined)).toBe('tr');
  });
});
