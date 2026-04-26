// backend/src/modules/tarot/repository.ts

import { TAROT_CARDS } from './cards';

export async function drawCards(count: number = 1) {
  const shuffled = [...TAROT_CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() > 0.7
  }));
}
