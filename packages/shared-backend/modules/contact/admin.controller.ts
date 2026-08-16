// =============================================================
// FILE: src/modules/contact/admin.controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { handleRouteError, sendNotFound } from '../_shared';
import { ContactListParamsSchema, ContactUpdateSchema } from './validation';
import {
  repoListContacts,
  repoGetContactById,
  repoUpdateContact,
  repoDeleteContact,
  repoListContactReplies,
} from './repository';
import { sendContactReplyMessage } from './reply.service';
import { pollContactInbox } from './inbox';

const ContactReplyBodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

/** GET /admin/contacts */
export async function listContactsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = ContactListParamsSchema.parse(req.query ?? {});
    const list = await repoListContacts(parsed);
    return reply.send(list);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_contacts');
  }
}

/** GET /admin/contacts/:id — mesaj + admin yanıtları (thread) */
export async function getContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetContactById(id);
    if (!row) return sendNotFound(reply);
    const replies = await repoListContactReplies(id);
    return reply.send({ ...row, replies });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_contact');
  }
}

/** POST /admin/contacts/inbox/poll — gelen kutusunu elle tara (kullanıcı yanıtlarını çek) */
export async function pollContactInboxAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await pollContactInbox({ limit: 50 });
    if (!result.ok) {
      reply.code(502);
      return result;
    }
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_poll_contact_inbox');
  }
}

/** GET /admin/contacts/:id/replies */
export async function listContactRepliesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const replies = await repoListContactReplies(id);
    return reply.send(replies);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_contact_replies');
  }
}

/** POST /admin/contacts/:id/reply — kullanıcıya e-posta gönder + yanıtı kaydet */
export async function replyContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { message } = ContactReplyBodySchema.parse(req.body ?? {});
    const adminUserId = ((req as any).user?.sub as string | undefined) ?? null;

    const result = await sendContactReplyMessage({ contactId: id, message, adminUserId, log: req.log });
    if (!result) return sendNotFound(reply);

    if (result.emailStatus === 'failed') {
      reply.code(502);
      return { reply: result.created, email: 'failed', message: 'reply_saved_email_failed' };
    }
    reply.code(201);
    return { reply: result.created, email: 'sent' };
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_reply_contact');
  }
}

/** PATCH /admin/contacts/:id */
export async function updateContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const data = ContactUpdateSchema.parse(req.body ?? {});
    const updated = await repoUpdateContact(id, data);
    if (!updated) return sendNotFound(reply);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_contact');
  }
}

/** DELETE /admin/contacts/:id */
export async function removeContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const ok = await repoDeleteContact(id);
    return reply.send({ ok });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_contact');
  }
}
