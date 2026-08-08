// =============================================================
// FILE: src/modules/contact/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import {
  listContactsAdmin,
  getContactAdmin,
  updateContactAdmin,
  removeContactAdmin,
  listContactRepliesAdmin,
  replyContactAdmin,
} from './admin.controller';

export async function registerContactsAdmin(app: FastifyInstance) {
  const B = '/contacts';
  app.get(B, listContactsAdmin);
  app.get(`${B}/:id`, getContactAdmin);
  app.patch(`${B}/:id`, updateContactAdmin);
  app.delete(`${B}/:id`, removeContactAdmin);
  // İki yönlü mesajlaşma: admin yanıtı → kullanıcıya e-posta + kayıt (thread).
  app.get(`${B}/:id/replies`, listContactRepliesAdmin);
  app.post(`${B}/:id/reply`, replyContactAdmin);
}
