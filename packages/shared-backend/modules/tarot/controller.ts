// packages/shared-backend/modules/tarot/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './repository';
import * as llm from '../llm';
import { drawCardsSchema } from './validation';
import { apiMessage } from '../_shared/api-i18n';

export async function handleDraw(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user; // if authenticated
  const body = drawCardsSchema.parse(req.body);
  const { spread_type, question, locale } = body;

  // 1) All cards fetch
  const allCards = await repo.getCards(locale);
  if (!allCards.length) {
    return reply.status(404).send({ error: apiMessage(req, 'tarot_deck_not_found') });
  }

  // 2) Shuffle and pick
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  let count = 1;
  const localeBase = String(locale || 'tr').toLowerCase().split('-')[0];
  const positionLabels: Record<string, Record<string, string[]>> = {
    one_card: {
      tr: ['Genel'],
      en: ['General'],
      de: ['Allgemein'],
    },
    three_card_general: {
      tr: ['Geçmiş', 'Şimdi', 'Gelecek'],
      en: ['Past', 'Present', 'Future'],
      de: ['Vergangenheit', 'Gegenwart', 'Zukunft'],
    },
    three_card_decision: {
      tr: ['Seçenek A', 'Seçenek B', 'Tavsiye'],
      en: ['Option A', 'Option B', 'Advice'],
      de: ['Option A', 'Option B', 'Rat'],
    },
    celtic_cross: {
      tr: ['Merkez', 'Engel', 'Hedef', 'Temel', 'Geçmiş', 'Gelecek', 'Benlik', 'Çevre', 'Umut/Korku', 'Sonuç'],
      en: ['Center', 'Challenge', 'Goal', 'Foundation', 'Past', 'Future', 'Self', 'Environment', 'Hope/Fear', 'Outcome'],
      de: ['Zentrum', 'Herausforderung', 'Ziel', 'Basis', 'Vergangenheit', 'Zukunft', 'Selbst', 'Umfeld', 'Hoffnung/Angst', 'Ergebnis'],
    },
  };
  let positions: string[] = positionLabels.one_card[localeBase] ?? positionLabels.one_card.tr;

  if (spread_type === 'three_card_general') {
    count = 3;
    positions = positionLabels.three_card_general[localeBase] ?? positionLabels.three_card_general.tr;
  } else if (spread_type === 'three_card_decision') {
    count = 3;
    positions = positionLabels.three_card_decision[localeBase] ?? positionLabels.three_card_decision.tr;
  } else if (spread_type === 'celtic_cross') {
    count = 10;
    positions = positionLabels.celtic_cross[localeBase] ?? positionLabels.celtic_cross.tr;
  }

  const picked = shuffled.slice(0, count).map((card, idx) => ({
    card_id: card.id,
    slug: card.slug,
    name: (card as any).name ?? card.nameTr,
    is_reversed: Math.random() > 0.8, // %20 ters gelme olasılığı
    position_name: positions[idx],
    meanings: {
      upright: card.uprightMeaning,
      reversed: card.reversedMeaning,
    },
    image_url: card.imageUrl,
  }));

  // 3) Interpretation via LLM
  let interpretation = '';
  let promptId = '';

  try {
    const cardDescriptions = picked.map(p => 
      `${p.position_name}: ${p.name} (${p.is_reversed ? (localeBase === 'de' ? 'umgekehrt' : localeBase === 'en' ? 'reversed' : 'Ters') : (localeBase === 'de' ? 'aufrecht' : localeBase === 'en' ? 'upright' : 'Düz')}). ${localeBase === 'de' ? 'Bedeutung' : localeBase === 'en' ? 'Meaning' : 'Anlam'}: ${p.is_reversed ? p.meanings.reversed : p.meanings.upright}`
    ).join('\n');

    const result = await llm.generate({
      promptKey: 'tarot_reading',
      locale,
      vars: {
        spread_label: spread_type,
        question: question || (localeBase === 'de' ? 'Allgemeine Orientierung' : localeBase === 'en' ? 'General guidance' : 'Genel rehberlik'),
        cards_context: cardDescriptions,
      },
    });
    interpretation = result.content;
    promptId = result.promptId;
  } catch (err) {
    console.error('Tarot LLM Error:', err);
    interpretation = localeBase === 'de'
      ? 'Die Deutung konnte gerade nicht erstellt werden, aber deine Karten stehen oben.'
      : localeBase === 'en'
        ? 'The interpretation could not be generated right now, but your cards are shown above.'
        : 'Yorum şu an oluşturulamadı, ancak kartlarınız yukarıdadır.';
  }

  // 4) Save to DB
  const readingId = uuidv4();
  await repo.createReading({
    id: readingId,
    userId: user?.id || null,
    spreadType: spread_type,
    cards: picked,
    question,
    interpretation,
    locale,
    promptId,
  });

  return reply.send({
    data: {
      id: readingId,
      spread_type,
      question,
      cards: picked,
      interpretation,
    }
  });
}

export async function handleGetMyReadings(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const readings = await repo.getReadingsByUser(user.id);
  return reply.send({ data: readings });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const reading = await repo.getReadingById(id);
  if (!reading) return reply.status(404).send({ error: apiMessage(req, 'tarot_reading_not_found') });

  // Sahiplik: bir kullanıcıya bağlı okuma yalnız sahibine görünür (KVKK — kişisel içerik).
  // Anonim (user_id null) okumalar anlık görüntüleme için açık kalır.
  const caller = (req as any).user;
  if ((reading as any).userId && (reading as any).userId !== caller?.id) {
    return reply.status(404).send({ error: apiMessage(req, 'tarot_reading_not_found') });
  }

  return reply.send({ data: reading });
}

/**
 * Tum kartleri listeler — PUBLIC, auth yok.
 *
 * Sosyal medya otomasyonu (ekosistem-sosyal-medya) gunluk seri icerikleri bu listeden
 * uretir; ayrica her kart icin ayri SEO sayfasi acmayi mumkun kilar. Sadece POST
 * (cekme) uclari vardi, listeleme yoktu.
 */
export async function handleListCards(req: FastifyRequest, reply: FastifyReply) {
  const locale = ((req.query as any)?.locale as string) || 'tr';
  const items = await repo.getCards(locale);
  return reply.send({ data: items, count: items.length });
}
