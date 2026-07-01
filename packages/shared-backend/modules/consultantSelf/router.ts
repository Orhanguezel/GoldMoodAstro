// packages/shared-backend/modules/consultantSelf/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin, requireConsultant } from '../../middleware/roles';

export async function registerConsultantSelf(app: FastifyInstance) {
  const guard = [requireAuth, requireConsultant];

  // Profil
  app.get('/me/consultant', { preHandler: guard }, controller.getProfile);
  app.patch('/me/consultant', { preHandler: guard }, controller.updateProfile);
  app.post('/me/consultant/kyc/documents', { preHandler: guard }, controller.uploadKycDocument);
  app.post('/me/consultant/kyc/submit', { preHandler: guard }, controller.submitKyc);

  // Blog taslakları: danışman yazar, admin yayına alır.
  app.get('/me/consultant/blog-posts', { preHandler: guard }, controller.listBlogPosts);
  app.post('/me/consultant/blog-posts', { preHandler: guard }, controller.createBlogPost);
  app.patch('/me/consultant/blog-posts/:id', { preHandler: guard }, controller.updateBlogPost);
  app.delete('/me/consultant/blog-posts/:id', { preHandler: guard }, controller.deleteBlogPost);

  // Randevular
  app.get('/me/consultant/bookings', { preHandler: guard }, controller.listBookings);
  app.post('/me/consultant/bookings/:id/approve', { preHandler: guard }, controller.approveBooking);
  app.post('/me/consultant/bookings/:id/reject', { preHandler: guard }, controller.rejectBooking);
  app.post('/me/consultant/bookings/:id/cancel', { preHandler: guard }, controller.cancelBooking);
  app.patch('/me/consultant/bookings/:id/notes', { preHandler: guard }, controller.updateBookingNotes);

  // İstatistik
  app.get('/me/consultant/stats', { preHandler: guard }, controller.getStats);
  app.get('/me/consultant/profile-completion', { preHandler: guard }, controller.getProfileCompletion);
  app.get('/me/consultant/profile-views', { preHandler: guard }, controller.getProfileViews);
  app.get('/me/consultant/clients', { preHandler: guard }, controller.listClients);
  app.get('/me/consultant/clients/:userId', { preHandler: guard }, controller.getClientDetail);

  // Mesajlar (T30-6)
  app.get('/me/consultant/threads', { preHandler: guard }, controller.listMessageThreads);
  app.get('/me/consultant/threads/:id/messages', { preHandler: guard }, controller.listMessagesInThread);
  app.post('/me/consultant/threads/:id/mark-read', { preHandler: guard }, controller.markThreadRead);
  app.post('/me/consultant/threads/:id/read', { preHandler: guard }, controller.markThreadRead);
  app.post('/me/consultant/threads/:id/reply', { preHandler: guard }, controller.replyInThread);
  app.get('/me/consultant/messages', { preHandler: guard }, controller.listMessageThreads);
  app.get('/me/consultant/messages/:id', { preHandler: guard }, controller.listMessagesInThread);
  app.post('/me/consultant/messages/:id/mark-read', { preHandler: guard }, controller.markThreadRead);
  app.post('/me/consultant/messages/:id/read', { preHandler: guard }, controller.markThreadRead);
  app.post('/me/consultant/messages/:id/reply', { preHandler: guard }, controller.replyInThread);

  // Danışan tarafı mesaj kutusu — düz kullanıcı (role=user) da erişebilmeli;
  // yetki controller'da chat_participants üyeliğiyle kontrol ediliyor.
  const customerGuard = [requireAuth];
  app.get('/me/customer/threads', { preHandler: customerGuard }, controller.listCustomerThreads);
  app.get('/me/customer/threads/:id/messages', { preHandler: customerGuard }, controller.listCustomerThreadMessages);
  app.post('/me/customer/threads/:id/mark-read', { preHandler: customerGuard }, controller.markCustomerThreadRead);
  app.post('/me/customer/threads/:id/read', { preHandler: customerGuard }, controller.markCustomerThreadRead);
  app.post('/me/customer/threads/:id/reply', { preHandler: customerGuard }, controller.replyAsCustomer);

  // Cüzdan (T30-7)
  app.get('/me/consultant/wallet', { preHandler: guard }, controller.getMyWallet);
  app.get('/me/consultant/wallet/monthly-stats', { preHandler: guard }, controller.getWalletMonthlyStats);
  app.post('/me/consultant/wallet/withdraw', { preHandler: guard }, controller.requestWithdrawal);
  app.get('/me/consultant/withdrawals', { preHandler: guard }, controller.listMyWithdrawals);

  // Yorumlar (T30-8)
  app.get('/me/consultant/reviews', { preHandler: guard }, controller.listMyReviews);
  app.post('/me/consultant/reviews/:id/reply', { preHandler: guard }, controller.replyToReview);

  // Müsaitlik (T30-4)
  app.get('/me/consultant/availability', { preHandler: guard }, controller.getMyAvailability);
  app.put('/me/consultant/availability', { preHandler: guard }, controller.updateMyAvailability);
  app.patch('/me/consultant/availability', { preHandler: guard }, controller.updateMyAvailability);
  app.post('/me/consultant/availability/day', { preHandler: guard }, controller.overrideMyAvailabilityDay);
}

export async function registerConsultantSelfAdmin(app: FastifyInstance) {
  const guard = [requireAuth, requireAdmin];

  app.get('/kyc/pending', { preHandler: guard }, controller.listPendingKyc);
  app.post('/kyc/:consultantId/approve', { preHandler: guard }, controller.approveKycAdmin);
  app.post('/kyc/:consultantId/reject', { preHandler: guard }, controller.rejectKycAdmin);

  app.get('/withdrawals', { preHandler: guard }, controller.listWithdrawalsAdmin);
  app.post('/withdrawals/:id/approve', { preHandler: guard }, controller.approveWithdrawalAdmin);
  app.post('/withdrawals/:id/reject', { preHandler: guard }, controller.rejectWithdrawalAdmin);
  app.post('/withdrawals/:id/mark-paid', { preHandler: guard }, controller.markWithdrawalPaidAdmin);
}
