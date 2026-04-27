import type { FastifyInstance } from 'fastify';

// Public routers
import { registerAuth } from '@goldmood/shared-backend/modules/auth/router';
import { registerHealth } from '@goldmood/shared-backend/modules/health/router';
import { registerStorage } from '@goldmood/shared-backend/modules/storage/router';
import { registerProfiles } from '@goldmood/shared-backend/modules/profiles/router';
import { registerSiteSettings } from '@goldmood/shared-backend/modules/siteSettings/router';
import { registerUserRoles } from '@goldmood/shared-backend/modules/userRoles/router';
import { registerNotifications } from '@goldmood/shared-backend/modules/notifications/router';
import { registerAudit } from '@goldmood/shared-backend/modules/audit/router';
import { registerContacts } from '@goldmood/shared-backend/modules/contact/router';
import { registerTelegram } from '@goldmood/shared-backend/modules/telegram/router';
import { registerMail } from '@goldmood/shared-backend/modules/mail/router';
import { registerEmailTemplates } from '@goldmood/shared-backend/modules/emailTemplates/router';
import { registerReviews } from '@goldmood/shared-backend/modules/review/router';
import { registerBookings } from '@goldmood/shared-backend/modules/bookings/router';
import { registerAvailability } from '@goldmood/shared-backend/modules/availability/router';
import { registerSupport } from '@goldmood/shared-backend/modules/support/router';
import { registerChat } from '@goldmood/shared-backend/modules/chat/router';
import { registerOrders } from '@goldmood/shared-backend/modules/orders/router';
import { registerWallet } from '@goldmood/shared-backend/modules/wallet/router';
import { registerAnnouncements } from '@goldmood/shared-backend/modules/announcements/router';
import { registerSubscriptions } from '@goldmood/shared-backend/modules/subscriptions/router';
import { registerCredits } from '@goldmood/shared-backend/modules/credits/router';

// Admin routers
import { registerUserAdmin } from '@goldmood/shared-backend/modules/auth/admin.routes';
import { registerStorageAdmin } from '@goldmood/shared-backend/modules/storage/admin.routes';
import { registerSiteSettingsAdmin } from '@goldmood/shared-backend/modules/siteSettings/admin.routes';
import { registerContactsAdmin } from '@goldmood/shared-backend/modules/contact/admin.routes';
import { registerAuditAdmin } from '@goldmood/shared-backend/modules/audit/admin.routes';
import { registerTelegramAdmin } from '@goldmood/shared-backend/modules/telegram/admin.routes';
import { registerEmailTemplatesAdmin } from '@goldmood/shared-backend/modules/emailTemplates/admin.routes';
import { registerReviewsAdmin } from '@goldmood/shared-backend/modules/review/admin.routes';
import { registerBookingsAdmin } from '@goldmood/shared-backend/modules/bookings/admin.routes';
import { registerAvailabilityAdmin } from '@goldmood/shared-backend/modules/availability/admin.routes';
import { registerSupportAdmin } from '@goldmood/shared-backend/modules/support/admin.routes';
import { registerChatAdmin } from '@goldmood/shared-backend/modules/chat/admin.routes';
import { registerWalletAdmin } from '@goldmood/shared-backend/modules/wallet/admin.routes';
import { registerDashboardAdmin } from '@goldmood/shared-backend/modules/dashboard/admin.routes';
import { registerDbAdmin } from '@goldmood/shared-backend/modules/db_admin/admin.routes';
import { registerAnnouncementsAdmin } from '@goldmood/shared-backend/modules/announcements/admin.routes';
import { registerOrdersAdmin } from '@goldmood/shared-backend/modules/orders/router';

export async function registerSharedPublic(api: FastifyInstance) {
  await registerAuth(api);
  await registerHealth(api);
  await registerStorage(api);
  await registerProfiles(api);
  await registerSiteSettings(api);
  await registerUserRoles(api);
  await registerNotifications(api);
  await registerAudit(api);
  await registerContacts(api);
  await registerTelegram(api);
  await registerMail(api);
  await registerEmailTemplates(api);
  await registerReviews(api);
  await registerBookings(api);
  await registerAvailability(api);
  await registerSupport(api);
  await registerChat(api);
  await registerOrders(api);
  await registerWallet(api);
  await registerAnnouncements(api);
  await registerSubscriptions(api);
  await registerCredits(api);
}

export async function registerSharedAdmin(adminApi: FastifyInstance) {
  for (const reg of [
    registerUserAdmin,
    registerStorageAdmin,
    registerSiteSettingsAdmin,
    registerContactsAdmin,
    registerAuditAdmin,
    registerTelegramAdmin,
    registerEmailTemplatesAdmin,
    registerReviewsAdmin,
    registerBookingsAdmin,
    registerAvailabilityAdmin,
    registerSupportAdmin,
    registerChatAdmin,
    registerWalletAdmin,
    registerOrdersAdmin,
    registerDashboardAdmin,
    registerDbAdmin,
    registerAnnouncementsAdmin,
  ]) {
    await adminApi.register(reg);
  }
}
