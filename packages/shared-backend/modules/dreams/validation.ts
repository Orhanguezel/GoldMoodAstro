// packages/shared-backend/modules/dreams/validation.ts
import { z } from 'zod';

export const interpretDreamSchema = z.object({
  dream_text: z.string().min(10).max(5000),
  locale: z.string().default('tr'),
});

export type InterpretDreamInput = z.infer<typeof interpretDreamSchema>;
