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

    expect(result).toContain('Bugün odağım ne olmalı”');
    expect(result).not.toContain('olmalı?.');
    expect(result).toContain('Değnek Sekizlisi (düz)');
    expect(result).toContain('Hızlı haber, hareket ve ivme');
    expect(result).toContain('küçük, ölçülebilir bir adıma');
    expect(result).not.toContain('Yorum şu an oluşturulamadı');
  });

  test('connects a work question with the card and offers a concrete next step', () => {
    const result = buildCardMeaningInterpretation({
      cards: [{
        ...card,
        name: 'Değnek Ası',
        meanings: {
          upright: 'İlham, yeni tutku, yaratıcılık, enerji.',
          reversed: 'Gecikme, motivasyon kaybı.',
        },
      }],
      question: 'islerim ters gidiyor',
      locale: 'tr',
    });

    expect(result).toContain('emek verdiğiniz alanda ilerleme göremediğiniz');
    expect(result).toContain('İlham, yeni tutku, yaratıcılık, enerji');
    expect(result).toContain('20 dakikada başlayabileceğiniz ilk adıma');
    expect(result).not.toContain('Bu açılımın odağı:');
  });

  test('uses reversed meaning and English framing', () => {
    const result = buildCardMeaningInterpretation({
      cards: [{ ...card, position_name: 'General', name: 'Eight of Wands', is_reversed: true }],
      locale: 'en',
    });

    expect(result).toContain('main theme asking for your attention');
    expect(result).toContain('Eight of Wands (reversed)');
    expect(result).toContain('Gecikme ve iletişim engeli');
    expect(result).toContain('energy is blocked');
  });

  test('provides German framing', () => {
    const result = buildCardMeaningInterpretation({
      cards: [{ ...card, position_name: 'Allgemein', name: 'Acht der Stäbe' }],
      locale: 'de',
    });

    expect(result).toContain('Aufmerksamkeit braucht');
    expect(result).toContain('Acht der Stäbe (aufrecht)');
  });
});
