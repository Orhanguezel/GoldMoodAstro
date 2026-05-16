/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { computeNatalChart } from './compute';
import type { BirthChartInput } from './types';

function expectClose(actual: number, expected: number, precision = 3) {
  expect(actual).toBeCloseTo(expected, precision);
}

describe('computeNatalChart houses', () => {
  const cases: Array<{
    name: string;
    input: BirthChartInput;
    expected: { asc: number; mc: number; sunHouse: number };
  }> = [
    {
      name: 'Tekirdag 1985-06-12 07:38 GMT+03',
      input: {
        date: '1985-06-12',
        time: '07:38:00',
        tzIana: 'Europe/Istanbul',
        latitude: 40.98,
        longitude: 27.51,
      },
      // Placidus + swe.house_pos: Güneş 12. ev (eski uydurma formül 9. ev gösteriyordu)
      expected: { asc: 106.9766, mc: 357.2356, sunHouse: 12 },
    },
    {
      name: 'Istanbul 2000-01-01 12:00 Europe/Istanbul',
      input: {
        date: '2000-01-01',
        time: '12:00:00',
        tzIana: 'Europe/Istanbul',
        latitude: 41.0082,
        longitude: 28.9784,
      },
      expected: { asc: 16.1992, mc: 278.5936, sunHouse: 11 },
    },
    {
      name: 'New York 1990-07-15 08:30 America/New_York',
      input: {
        date: '1990-07-15',
        time: '08:30:00',
        tzIana: 'America/New_York',
        latitude: 40.7128,
        longitude: -74.006,
      },
      expected: { asc: 145.7419, mc: 49.0508, sunHouse: 9 },
    },
    {
      // Tarihsel TZ regresyon guard'ı: Türkiye 1979 yaz boyu UTC+3 (DST yok).
      // luxon Europe/Istanbul 180dk vermeli; UTC+4 olursa ASC ~Kova 8° (yanlış).
      // Doğru (Swiss Ephemeris): ASC Balık 0°21', MC Yay 13°18'.
      name: 'Kaman/Kirsehir 1979-06-08 00:30 Europe/Istanbul (TZ guard)',
      input: {
        date: '1979-06-08',
        time: '00:30:00',
        tzIana: 'Europe/Istanbul',
        latitude: 39.35,
        longitude: 33.72,
      },
      expected: { asc: 330.3574, mc: 253.3077, sunHouse: 5 },
    },
  ];

  for (const { name, input, expected } of cases) {
    test(`${name} uses Swiss Ephemeris Placidus cusps`, async () => {
      const chart = await computeNatalChart(input);

      expect(chart.input.houseSystem).toBe('placidus');
      expect(chart.house_accuracy).toBe('exact');
      expect(chart.houses).toHaveLength(12);
      expectClose(chart.ascendant.longitude, expected.asc);
      expectClose(chart.midheaven.longitude, expected.mc);
      expect(chart.planets.sun.house).toBe(expected.sunHouse);
    });
  }

  test('unknown birth time uses whole-sign approximate houses', async () => {
    const chart = await computeNatalChart({
      date: '1985-06-12',
      tobKnown: false,
      tzIana: 'Europe/Istanbul',
      latitude: 40.98,
      longitude: 27.51,
    });

    expect(chart.input.houseSystem).toBe('whole_sign');
    expect(chart.house_accuracy).toBe('approx');
    expect(chart.houses.every((house) => house.longitude % 30 === 0)).toBe(true);
  });
});
