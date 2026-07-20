import { z } from 'zod';

const aspectConfigSchema = z.object({
  type: z.enum(['conjunction', 'sextile', 'square', 'trine', 'opposition']),
  angle: z.number(),
  orb: z.number().positive(),
});

export const appConfigSchema = z.object({
  astrology: z.object({
    aspects: z.array(aspectConfigSchema),
  }),
  birthCharts: z.object({
    maxChartsPerUser: z.number().int().positive(),
  }),
  consultants: z.object({
    defaultExpertise: z.array(z.string()),
    defaultLanguages: z.array(z.string()),
    defaultSessionPrice: z.string(),
    maxSessionPrice: z.number().positive(),
    defaultSessionDurationMinutes: z.number().int().positive(),
    maxSessionDurationMinutes: z.number().int().positive(),
    defaultCurrency: z.string().length(3),
  }),
  geocode: z.object({
    cacheTtlDays: z.number().int().positive(),
  }),
  livekit: z.object({
    defaultSessionDurationMinutes: z.number().int().positive(),
    bookingWindowBufferMinutes: z.number().int().positive(),
    roomPrefix: z.string().min(1),
    // Seans süresi dolunca odayı otomatik kapatma (M1-b).
    autoCloseGraceMinutes: z.number().int().nonnegative(),
    autoCloseFirstRunDelayMs: z.number().int().nonnegative(),
    autoCloseIntervalMs: z.number().int().positive(),
  }),
  requestNow: z.object({
    timeoutMinutes: z.number().int().positive(),
    firstRunDelayMs: z.number().int().nonnegative(),
    intervalMs: z.number().int().positive(),
  }),
  credits: z.object({
    perTry: z.number().int().positive(),
    yildiznameExtraCost: z.number().int().nonnegative(),
    liveSessionCreditMultiplier: z.number().positive(),
  }),
  dailyReadings: z.object({
    runHourUtc: z.number().int().min(0).max(23),
    pollIntervalMs: z.number().int().positive(),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type AspectConfig = AppConfig['astrology']['aspects'][number];

export const appConfig = appConfigSchema.parse({
  astrology: {
    aspects: [
      { type: 'conjunction', angle: 0, orb: 8 },
      { type: 'sextile', angle: 60, orb: 5 },
      { type: 'square', angle: 90, orb: 6 },
      { type: 'trine', angle: 120, orb: 6 },
      { type: 'opposition', angle: 180, orb: 8 },
    ],
  },
  birthCharts: {
    maxChartsPerUser: 5,
  },
  consultants: {
    defaultExpertise: ['astrology'],
    defaultLanguages: ['tr'],
    defaultSessionPrice: '0.00',
    maxSessionPrice: 100_000,
    defaultSessionDurationMinutes: 30,
    maxSessionDurationMinutes: 240,
    defaultCurrency: 'TRY',
  },
  geocode: {
    cacheTtlDays: 30,
  },
  livekit: {
    defaultSessionDurationMinutes: 30,
    bookingWindowBufferMinutes: 15,
    roomPrefix: 'goldmood',
    // Planlanan bitişin üstüne tanınan pay: ağ kopması/geç başlama gibi durumlarda
    // görüşmeyi saniyesinde kesmemek için. 0 yapılırsa tam bitişte kapanır.
    autoCloseGraceMinutes: 2,
    autoCloseFirstRunDelayMs: 20_000,
    autoCloseIntervalMs: 60_000,
  },
  requestNow: {
    timeoutMinutes: 5,
    firstRunDelayMs: 10_000,
    intervalMs: 60_000,
  },
  credits: {
    perTry: 10,
    yildiznameExtraCost: 50,
    liveSessionCreditMultiplier: 1,
  },
  dailyReadings: {
    runHourUtc: 6,
    pollIntervalMs: 5 * 60 * 1000,
  },
} satisfies AppConfig);
