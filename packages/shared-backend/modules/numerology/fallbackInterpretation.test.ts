/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { calculateNumerology } from './logic';
import { buildFallbackInterpretation } from './fallbackInterpretation';
import { findRiskyTopics } from '../_shared/contentModeration';

describe('numerology fallback interpretation', () => {
  const calc = calculateNumerology('Ayşe Yılmaz', '1990-05-14');

  test('her locale dört sayıyı da adıyla anar', () => {
    for (const locale of ['tr', 'en', 'de']) {
      const text = buildFallbackInterpretation(calc, locale);
      for (const n of [calc.lifePath, calc.destiny, calc.soulUrge, calc.personality]) {
        expect(text).toContain(` ${n}: `);
      }
    }
  });

  test('bilinmeyen locale Türkçeye düşer', () => {
    expect(buildFallbackInterpretation(calc, 'xx')).toBe(buildFallbackInterpretation(calc, 'tr'));
  });

  test('temasız sayı boş satır üretmez', () => {
    const text = buildFallbackInterpretation({ lifePath: 0, destiny: 1, soulUrge: 2, personality: 3 }, 'tr');
    expect(text).not.toContain(': .');
    expect(text.split('\n')).toHaveLength(5);
  });

  test('ana sayılar dahil tüm temalar yasaklı içerik süzgecinden geçer', () => {
    for (const locale of ['tr', 'en', 'de']) {
      for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
        const text = buildFallbackInterpretation({ lifePath: n, destiny: n, soulUrge: n, personality: n }, locale);
        expect(findRiskyTopics(text)).toEqual([]);
      }
    }
  });
});
