type TarotFallbackCard = {
  position_name: string;
  name: string;
  is_reversed: boolean;
  meanings: {
    upright: string;
    reversed: string;
  };
};

type QuestionTopic = 'work' | 'relationship' | 'decision' | 'general';

function cleanSentence(value: string): string {
  return value.trim().replace(/[.!?…]+$/, '');
}

function punctuate(value: string): string {
  return /[.!?…]$/.test(value) ? value : `${value}.`;
}

function detectTopic(question: string): QuestionTopic {
  const normalized = question.toLocaleLowerCase('tr-TR');
  if (['iş', 'isler', 'kariyer', 'proje', 'çalış', 'job', 'work', 'career', 'project', 'arbeit', 'karriere', 'beruf', 'projekt'].some((term) => normalized.includes(term))) return 'work';
  if (['aşk', 'ilişki', 'partner', 'eşim', 'sevgili', 'love', 'relationship', 'liebe', 'beziehung'].some((term) => normalized.includes(term))) return 'relationship';
  if (['karar', 'seçim', 'hangisi', 'decision', 'choice', 'choose', 'entscheidung', 'wahl'].some((term) => normalized.includes(term))) return 'decision';
  return 'general';
}

function trContext(question: string, topic: QuestionTopic): string {
  if (!question) return 'Bu açılım, şu anda dikkatinizi isteyen ana temayı görünür kılmaya odaklanıyor.';
  if (topic === 'work') return `“${question}” ifadesi, emek verdiğiniz alanda ilerleme göremediğiniz için yeniden yön ve ivme aradığınızı düşündürüyor.`;
  if (topic === 'relationship') return `“${question}” sorusu, ilişkinin sonucundan önce aranızdaki mevcut dinamiği daha açık görme ihtiyacına işaret ediyor.`;
  if (topic === 'decision') return `“${question}” sorusu, seçeneklerin kendisinden çok karar verirken hangi ölçüte öncelik vereceğinizi netleştirme ihtiyacını gösteriyor.`;
  return `“${question}” sorusu, mevcut durumun içindeki asıl temayı ve etkileyebileceğiniz alanı görme ihtiyacına işaret ediyor.`;
}

function trAction(topic: QuestionTopic): string {
  if (topic === 'work') return 'Bugün bütün sorunları aynı anda çözmeye çalışmak yerine en çok sonuç üretecek tek işi seçin. Onu 20 dakikada başlayabileceğiniz ilk adıma bölün ve gün sonunda yalnızca bu adımın tamamlanıp tamamlanmadığına bakın.';
  if (topic === 'relationship') return 'Bugün sonucu tahmin etmeye çalışmak yerine, karşı tarafa açıkça söylemeniz gereken tek ihtiyacı ve gerçekten dinlemeniz gereken tek konuyu not edin. Uygunsa konuşmayı suçlama yerine bu iki başlık üzerinden kurun.';
  if (topic === 'decision') return 'İki seçeneği de tek cümleyle yazın ve her biri için “kontrol edebildiğim ilk adım ne?” sorusunu cevaplayın. En sakin ve geri döndürülebilir ilk adım, kararı test etmeniz için yeterlidir.';
  return 'Bugün kontrolünüzde olan tek bir alan seçin ve onu küçük, ölçülebilir bir adıma çevirin. Büyük bir sonuç beklemek yerine bu adımın size ne hissettirdiğini ve neyi netleştirdiğini gözlemleyin.';
}

function enAction(topic: QuestionTopic): string {
  if (topic === 'work') return 'Instead of trying to repair everything at once, choose the one task most likely to create movement. Reduce it to a first step you can begin in twenty minutes, then judge the day only by whether that step was completed.';
  if (topic === 'relationship') return 'Rather than predicting the outcome, write down one need you should express clearly and one thing you genuinely need to hear. If a conversation is appropriate, use those two points instead of blame.';
  if (topic === 'decision') return 'Write each option in one sentence and answer, “What is the first step I can control?” for both. The calmer, reversible step is enough to test the decision.';
  return 'Choose one part of the situation that is under your control and turn it into a small, observable action. Notice what that action clarifies instead of demanding an immediate final result.';
}

function deAction(topic: QuestionTopic): string {
  if (topic === 'work') return 'Versuche heute nicht, alle Probleme gleichzeitig zu lösen. Wähle die eine Aufgabe mit der größten Wirkung, teile sie in einen ersten Schritt von zwanzig Minuten und bewerte den Tag nur danach, ob dieser Schritt erledigt wurde.';
  if (topic === 'relationship') return 'Statt das Ergebnis vorherzusagen, notiere ein Bedürfnis, das du klar aussprechen solltest, und einen Punkt, dem du wirklich zuhören möchtest. Führe ein passendes Gespräch anhand dieser beiden Punkte statt mit Vorwürfen.';
  if (topic === 'decision') return 'Schreibe beide Möglichkeiten in je einem Satz auf und beantworte für jede: „Welchen ersten Schritt kann ich selbst beeinflussen?“ Der ruhigere, umkehrbare Schritt reicht aus, um die Entscheidung zu prüfen.';
  return 'Wähle einen Bereich der Situation, den du beeinflussen kannst, und mache daraus einen kleinen, beobachtbaren Schritt. Achte darauf, was dieser Schritt klärt, statt sofort ein endgültiges Ergebnis zu verlangen.';
}

/**
 * Son LLM sağlayıcısı da erişilemiyorsa, veritabanındaki editoryal kart
 * anlamlarından soruyla bağlantılı, güvenli ve uygulanabilir bir okuma üretir.
 */
export function buildCardMeaningInterpretation(args: {
  cards: TarotFallbackCard[];
  question?: string | null;
  locale?: string | null;
}): string {
  const locale = String(args.locale || 'tr').toLowerCase().split('-')[0];
  const question = cleanSentence(String(args.question || ''));
  const topic = detectTopic(question);

  if (locale === 'de') {
    const context = question
      ? `„${question}“ zeigt den Wunsch, das zentrale Thema der Situation und deinen beeinflussbaren Spielraum klarer zu erkennen.`
      : 'Diese Legung richtet den Blick auf das Thema, das jetzt deine Aufmerksamkeit braucht.';
    const cards = args.cards.map((card) => {
      const direction = card.is_reversed ? 'umgekehrt' : 'aufrecht';
      const meaning = cleanSentence(card.is_reversed ? card.meanings.reversed : card.meanings.upright);
      const bridge = card.is_reversed
        ? 'Die Karte beschreibt dabei weniger ein endgültiges Hindernis als einen Energiefluss, der stockt und zuerst verstanden werden möchte.'
        : 'Die Karte lädt dazu ein, dieses Thema nicht nur zu erkennen, sondern in eine bewusste Handlung zu übersetzen.';
      return `${card.position_name} — ${card.name} (${direction}) lenkt den Blick auf „${meaning}“. ${bridge}`;
    });
    return [context, ...cards, deAction(topic), 'Die Karte verspricht kein festes Ergebnis; sie bietet eine Perspektive, mit der du deinen nächsten Schritt bewusster wählen kannst.'].join('\n\n');
  }

  if (locale === 'en') {
    const context = question
      ? `“${question}” points to a need to see the situation’s central theme and the part you can influence more clearly.`
      : 'This reading focuses on the main theme asking for your attention right now.';
    const cards = args.cards.map((card) => {
      const direction = card.is_reversed ? 'reversed' : 'upright';
      const meaning = cleanSentence(card.is_reversed ? card.meanings.reversed : card.meanings.upright);
      const bridge = card.is_reversed
        ? 'This is less a final obstacle than a sign that the energy is blocked and needs to be understood before it can move.'
        : 'The invitation is not merely to notice this theme, but to translate it into one deliberate action.';
      return `${card.position_name} — ${card.name} (${direction}) brings “${meaning}” into focus. ${bridge}`;
    });
    return [context, ...cards, enAction(topic), 'The card does not promise a fixed outcome; it offers a perspective from which you can choose your next step more consciously.'].join('\n\n');
  }

  const cards = args.cards.map((card) => {
    const direction = card.is_reversed ? 'ters' : 'düz';
    const meaning = cleanSentence(card.is_reversed ? card.meanings.reversed : card.meanings.upright);
    const bridge = card.is_reversed
      ? 'Bu, kesin bir olumsuz sonuçtan çok enerjinin nerede tıkandığını anlamadan ilerlemeye çalıştığınızı düşündürür.'
      : 'Buradaki vurgu, bu temayı yalnızca fark etmekte değil, küçük ama bilinçli bir davranışa dönüştürmektedir.';
    return `${card.position_name} — ${card.name} (${direction}), “${meaning}” temasını öne çıkarıyor. ${bridge}`;
  });

  return [
    trContext(question, topic),
    ...cards,
    trAction(topic),
    'Kart kesin bir sonuç vaat etmiyor; mevcut tabloya farklı bir açıdan bakıp sonraki adımınızı daha bilinçli seçmeniz için bir çerçeve sunuyor.',
  ].map(punctuate).join('\n\n');
}
