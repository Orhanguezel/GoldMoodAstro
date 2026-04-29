// packages/shared-backend/modules/numerology/validation.ts
import { z } from 'zod';

export const calculateNumerologySchema = z.object({
  full_name: z.string().min(3).max(100),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  locale: z.string().default('tr'),
});
