// packages/shared-backend/modules/consultantSelf/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireConsultant } from '../../middleware/roles';

export async function registerConsultantSelf(app: FastifyInstance) {
  const guard = [requireAuth, requireConsultant];

  // Profil
  app.get('/me/consultant', { preHandler: guard }, controller.getProfile);
  app.patch('/me/consultant', { preHandler: guard }, controller.updateProfile);

  // Randevular
  app.get('/me/consultant/bookings', { preHandler: guard }, controller.listBookings);
  app.post('/me/consultant/bookings/:id/approve', { preHandler: guard }, controller.approveBooking);
  app.post('/me/consultant/bookings/:id/reject', { preHandler: guard }, controller.rejectBooking);
  app.post('/me/consultant/bookings/:id/cancel', { preHandler: guard }, controller.cancelBooking);
  app.patch('/me/consultant/bookings/:id/notes', { preHandler: guard }, controller.updateBookingNotes);

  // İstatistik
  app.get('/me/consultant/stats', { preHandler: guard }, controller.getStats);

  // Mesajlar (T30-6)
  app.get('/me/consultant/threads', { preHandler: guard }, controller.listMessageThreads);
  app.get('/me/consultant/threads/:id/messages', { preHandler: guard }, controller.listMessagesInThread);
  app.post('/me/consultant/threads/:id/reply', { preHandler: guard }, controller.replyInThread);

  // Cüzdan (T30-7)
  app.get('/me/consultant/wallet', { preHandler: guard }, controller.getMyWallet);
  app.post('/me/consultant/wallet/withdraw', { preHandler: guard }, controller.requestWithdrawal);

  // Yorumlar (T30-8)
  app.get('/me/consultant/reviews', { preHandler: guard }, controller.listMyReviews);
  app.post('/me/consultant/reviews/:id/reply', { preHandler: guard }, controller.replyToReview);

  // Müsaitlik (T30-4)
  app.get('/me/consultant/availability', { preHandler: guard }, controller.getMyAvailability);
  app.put('/me/consultant/availability', { preHandler: guard }, controller.updateMyAvailability);
  app.post('/me/consultant/availability/day', { preHandler: guard }, controller.overrideMyAvailabilityDay);
}
