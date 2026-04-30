// src/index.ts
import { createApp } from './app';
import { env } from '@/core/env';
import { registerBookingReminderCron } from '@/cron/booking-reminders';
import { registerBookingSlaCron } from '@/cron/booking-sla';
import { registerDailyReadingsCron } from '@/cron/daily-readings';
import { registerHoroscopeCron } from '@/cron/horoscope-job';
import { registerReviewFollowupCron } from '@/cron/review-followup';
import { registerAccountDeletionCron } from '@/cron/account-deletion';
import { registerRequestNowTimeoutCron } from '@/cron/request-now-timeout';
import { registerPushSender } from '@goldmood/shared-backend/modules/notifications';
import { sendPushNotification } from '@/modules/firebase/service';

// shared-backend modülleri firebase-admin'i import edemediği için
// startup'ta concrete sender'ı register ediyoruz.
registerPushSender(async (params) => {
  await sendPushNotification(params);
});

async function main() {
  const app: any = await createApp();

  // Bind to 0.0.0.0 to allow network access (phone etc.)
  const host = (process.env.HOST ?? '0.0.0.0') as string;

  await app.listen({ port: env.PORT, host });

  if (process.env.DISABLE_CRON !== '1') {
    registerBookingReminderCron();
    registerBookingSlaCron();
    registerDailyReadingsCron();
    registerHoroscopeCron();
    registerReviewFollowupCron();
    registerAccountDeletionCron();
    registerRequestNowTimeoutCron();
  }

  console.log(`API listening ${host}:${env.PORT}`);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
