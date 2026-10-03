/// <reference types="bun-types" />
// Mobil paylaşım linkleri shared-config tablosundan üretilir; web tablosuyla
// kayarsa mobil 3xx/404 link paylaşır. Bu test ikisini birebir eşit tutar.
import { describe, expect, test } from 'bun:test';
import {
  PUBLIC_SEGMENTS as WEB_SEGMENTS,
  ZODIAC_SIGNS as WEB_SIGNS,
  ZODIAC_SUBPAGES as WEB_SUBPAGES,
  toLocalizedPublicPath as webPath,
} from '../src/i18n/localizedRoutes';
import {
  PUBLIC_ROUTE_LOCALES,
  PUBLIC_SEGMENTS,
  ZODIAC_SIGNS,
  ZODIAC_SUBPAGES,
  toLocalizedPublicPath as sharedPath,
} from '../../packages/shared-config/src/publicRoutes';

const samples = [
  ...Object.keys(PUBLIC_SEGMENTS).map((k) => `/${k}`),
  '/kahve-fali/result/abc', '/ruya-tabiri/result/abc', '/sinastri/result/abc',
  '/yildizname/result/abc', '/tarot/reading/abc', '/burclar/uyum', '/burclar/transit',
  ...Object.keys(ZODIAC_SIGNS).flatMap((s) => [`/burclar/${s}`, ...Object.keys(ZODIAC_SUBPAGES).map((p) => `/burclar/${s}/${p}`)]),
  '/blog/x', '/become-consultant',
];

describe('shared-config publicRoutes ↔ web localizedRoutes', () => {
  test('tablolar birebir aynı', () => {
    expect(PUBLIC_SEGMENTS).toEqual(WEB_SEGMENTS);
    expect(ZODIAC_SIGNS).toEqual(WEB_SIGNS);
    expect(ZODIAC_SUBPAGES).toEqual(WEB_SUBPAGES);
  });

  for (const lc of PUBLIC_ROUTE_LOCALES) {
    test(`${lc} yolları aynı`, () => {
      for (const path of samples) expect(sharedPath(lc, path)).toBe(webPath(lc, path));
    });
  }
});
