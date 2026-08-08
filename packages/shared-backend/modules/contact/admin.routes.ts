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
  pollContactInboxAdmin,
} from './admin.controller';

export async function registerContactsAdmin(app: FastifyInstance) {
  const B = '/contacts';
  app.get(B, listContactsAdmin);
  // NOT: statik "inbox" route'u ":id"den ÖNCE tanımlı olmalı (Fastify statik'i önceler ama garanti).
  app.post(`${B}/inbox/poll`, pollContactInboxAdmin);
  app.get(`${B}/:id`, getContactAdmin);
  app.patch(`${B}/:id`, updateContactAdmin);
  app.delete(`${B}/:id`, removeContactAdmin);
  // İki yönlü mesajlaşma: admin yanıtı → kullanıcıya e-posta + kayıt (thread).
  app.get(`${B}/:id/replies`, listContactRepliesAdmin);
  app.post(`${B}/:id/reply`, replyContactAdmin);
}
