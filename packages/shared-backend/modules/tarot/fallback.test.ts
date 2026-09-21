import { describe, expect, test } from 'bun:test';

import { buildCardMeaningInterpretation } from './fallback';

const card = {
  position_name: 'Genel',
  name: 'Değnek Sekizlisi',
  is_reversed: false,
  meanings: {
    upright: 'Hızlı haber, hareket ve ivme.',
    reversed: 'Gecikme ve iletişim engeli.',
  },
};

describe('buildCardMeaningInterpretation', () => {
  test('uses the selected localized card meaning in Turkish', () => {
    const result = buildCardMeaningInterpretation({
      cards: [card],
      question: 'Bugün odağım ne olmalı?',
      locale: 'tr',
    });

    expect(result).toContain('Bugün odağım ne olmalı?');
    expect(result).not.toContain('olmalı?.');
    expect(result).toContain('Değnek Sekizlisi (düz)');
    expect(result).toContain(card.meanings.upright);
    expect(result).not.toContain('Yorum şu an oluşturulamadı');
  });

  test('uses reversed meaning and English framing', () => {
    const result = buildCardMeaningInterpretation({
      cards: [{ ...card, position_name: 'General', name: 'Eight of Wands', is_reversed: true }],
      locale: 'en',
    });

    expect(result).toContain('General guidance');
    expect(result).toContain('Eight of Wands (reversed)');
    expect(result).toContain(card.meanings.reversed);
  });

  test('provides German framing', () => {
    const result = buildCardMeaningInterpretation({
      cards: [{ ...card, position_name: 'Allgemein', name: 'Acht der Stäbe' }],
      locale: 'de',
    });

    expect(result).toContain('Allgemeine Orientierung');
    expect(result).toContain('Acht der Stäbe (aufrecht)');
  });
});
