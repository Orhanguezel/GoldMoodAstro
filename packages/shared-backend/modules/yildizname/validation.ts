// FAZ 24 / T24-1
import { z } from 'zod';

export const readYildiznameSchema = z.object({
  name: z.string().trim().min(2).max(120),
  mother_name: z.string().trim().min(2).max(120),
  birth_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  locale: z.string().trim().min(2).max(8).default('tr'),
});

export type ReadYildiznameInput = z.infer<typeof readYildiznameSchema>;
