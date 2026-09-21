type TarotFallbackCard = {
  position_name: string;
  name: string;
  is_reversed: boolean;
  meanings: {
    upright: string;
    reversed: string;
  };
};

/**
 * Son LLM sağlayıcısı da erişilemiyorsa, veritabanındaki editoryal kart
 * anlamlarından güvenli ve kullanılabilir bir okuma üretir.
 */
export function buildCardMeaningInterpretation(args: {
  cards: TarotFallbackCard[];
  question?: string | null;
  locale?: string | null;
}): string {
  const locale = String(args.locale || 'tr').toLowerCase().split('-')[0];
  const question = String(args.question || '').trim();
  const punctuate = (value: string) => /[.!?…]$/.test(value) ? value : `${value}.`;

  if (locale === 'de') {
    const focus = question || 'Allgemeine Orientierung';
    const cards = args.cards.map((card) => {
      const direction = card.is_reversed ? 'umgekehrt' : 'aufrecht';
      const meaning = card.is_reversed ? card.meanings.reversed : card.meanings.upright;
      return `${card.position_name} — ${card.name} (${direction}): ${meaning}`;
    });
    return [
      `Fokus dieser Legung: ${punctuate(focus)}`,
      ...cards,
      'Lies diese Symbole als Einladung zur Reflexion, nicht als festgelegte Vorhersage. Achte darauf, welches Thema zu deiner aktuellen Situation passt, und wähle daraus einen kleinen, realistischen nächsten Schritt.',
    ].join('\n\n');
  }

  if (locale === 'en') {
    const focus = question || 'General guidance';
    const cards = args.cards.map((card) => {
      const direction = card.is_reversed ? 'reversed' : 'upright';
      const meaning = card.is_reversed ? card.meanings.reversed : card.meanings.upright;
      return `${card.position_name} — ${card.name} (${direction}): ${meaning}`;
    });
    return [
      `Focus of this reading: ${punctuate(focus)}`,
      ...cards,
      'Read these symbols as an invitation to reflect, not as a fixed prediction. Notice which theme fits your present situation and turn it into one small, realistic next step.',
    ].join('\n\n');
  }

  const focus = question || 'Genel rehberlik';
  const cards = args.cards.map((card) => {
    const direction = card.is_reversed ? 'ters' : 'düz';
    const meaning = card.is_reversed ? card.meanings.reversed : card.meanings.upright;
    return `${card.position_name} — ${card.name} (${direction}): ${meaning}`;
  });
  return [
    `Bu açılımın odağı: ${punctuate(focus)}`,
    ...cards,
    'Bu sembolleri değişmez bir gelecek tahmini olarak değil, düşünmeye davet olarak okuyun. Mevcut durumunuza uyan temayı fark edip buradan küçük ve gerçekçi bir sonraki adım seçebilirsiniz.',
  ].join('\n\n');
}
