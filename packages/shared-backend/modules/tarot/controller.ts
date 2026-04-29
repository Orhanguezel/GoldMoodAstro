// packages/shared-backend/modules/tarot/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './repository';
import * as llm from '../llm';
import { drawCardsSchema } from './validation';

export async function handleDraw(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user; // if authenticated
  const body = drawCardsSchema.parse(req.body);
  const { spread_type, question, locale } = body;

  // 1) All cards fetch
  const allCards = await repo.getCards();
  if (!allCards.length) {
    return reply.status(404).send({ error: 'Tarot destesi bulunamadı.' });
  }

  // 2) Shuffle and pick
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  let count = 1;
  let positions: string[] = ['Genel'];

  if (spread_type === 'three_card_general') {
    count = 3;
    positions = ['Geçmiş', 'Şimdi', 'Gelecek'];
  } else if (spread_type === 'three_card_decision') {
    count = 3;
    positions = ['Seçenek A', 'Seçenek B', 'Tavsiye'];
  } else if (spread_type === 'celtic_cross') {
    count = 10;
    positions = ['Merkez', 'Engel', 'Hedef', 'Temel', 'Geçmiş', 'Gelecek', 'Benlik', 'Çevre', 'Umut/Korku', 'Sonuç'];
  }

  const picked = shuffled.slice(0, count).map((card, idx) => ({
    card_id: card.id,
    slug: card.slug,
    name: card.nameTr,
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
      `${p.position_name}: ${p.name} (${p.is_reversed ? 'Ters' : 'Düz'}). Anlam: ${p.is_reversed ? p.meanings.reversed : p.meanings.upright}`
    ).join('\n');

    const result = await llm.generate({
      promptKey: 'tarot_reading',
      locale,
      vars: {
        spread_label: spread_type,
        question: question || 'Genel rehberlik',
        cards_context: cardDescriptions,
      },
    });
    interpretation = result.content;
    promptId = result.promptId;
  } catch (err) {
    console.error('Tarot LLM Error:', err);
    interpretation = 'Yorum şu an oluşturulamadı, ancak kartlarınız yukarıdadır.';
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
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const readings = await repo.getReadingsByUser(user.id);
  return reply.send({ data: readings });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const reading = await repo.getReadingById(id);
  if (!reading) return reply.status(404).send({ error: 'Açılım bulunamadı.' });

  return reply.send({ data: reading });
}
