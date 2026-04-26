// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';
import { registerBookingReminderCron } from '@/cron/booking-reminders';
import { registerDailyReadingsCron } from '@/cron/daily-readings';
import { registerHoroscopeCron } from '@/cron/horoscope-job';

async function main() {
  const app: any = await createApp();

  // Bind to 0.0.0.0 to allow network access (phone etc.)
  const host = (process.env.HOST ?? '0.0.0.0') as string;

  await app.listen({ port: env.PORT, host });

  if (process.env.DISABLE_CRON !== '1') {
    registerBookingReminderCron();
    registerDailyReadingsCron();
    registerHoroscopeCron();
  }

  console.log(`API listening ${host}:${env.PORT}`);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
