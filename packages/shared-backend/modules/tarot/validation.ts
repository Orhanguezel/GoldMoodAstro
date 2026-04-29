// packages/shared-backend/modules/tarot/validation.ts
import { z } from 'zod';

export const drawCardsSchema = z.object({
  spread_type: z.enum(['one_card', 'three_card_general', 'three_card_decision', 'celtic_cross']),
  question: z.string().optional(),
  locale: z.string().default('tr'),
});

export type DrawCardsInput = z.infer<typeof drawCardsSchema>;
