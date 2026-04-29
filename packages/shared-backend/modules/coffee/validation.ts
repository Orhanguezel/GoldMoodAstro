// packages/shared-backend/modules/coffee/validation.ts
import { z } from 'zod';

export const createReadingSchema = z.object({
  image_ids: z.array(z.string()).min(3).max(3),
  locale: z.string().default('tr'),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
