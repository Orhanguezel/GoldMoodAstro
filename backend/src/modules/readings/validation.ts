import { z } from 'zod';

export const generateDailyReadingBodySchema = z.object({
  chart_id: z.string().uuid(),
});
