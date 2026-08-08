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
  repoCreateContactReply,
} from './repository';
import { sendMail } from '../mail';

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
    const contact = await repoGetContactById(id);
    if (!contact) return sendNotFound(reply);

    const adminUserId = ((req as any).user?.sub as string | undefined) ?? null;
    const subject = /^re:/i.test(contact.subject) ? contact.subject : `Re: ${contact.subject}`;
    const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1226;line-height:1.6">
      <p>Merhaba ${contact.name || ''},</p>
      <div style="white-space:pre-wrap">${safe.replace(/\n/g, '<br/>')}</div>
      <hr style="border:none;border-top:1px solid #eadfca;margin:18px 0"/>
      <p style="color:#999;font-size:12px">Bu e-posta, GoldMoodAstro üzerinden gönderdiğiniz iletişim mesajına yanıttır.<br/>Gönderdiğiniz mesaj: “${(contact.subject || '').slice(0, 120)}”</p>
      <p style="color:#715d83;font-size:12px"><b>GoldMoodAstro</b></p>
    </div>`;
    const text = `Merhaba ${contact.name || ''},\n\n${message}\n\n—\nBu e-posta, GoldMoodAstro üzerinden gönderdiğiniz iletişim mesajına yanıttır.\nGoldMoodAstro`;

    let emailStatus: 'sent' | 'failed' = 'sent';
    try {
      await sendMail({ to: contact.email, subject, html, text } as any);
    } catch (mailErr) {
      emailStatus = 'failed';
      req.log.error({ err: mailErr }, 'contact_reply_mail_failed');
    }

    const created = await repoCreateContactReply({
      contact_id: id,
      message,
      admin_user_id: adminUserId,
      email_status: emailStatus,
    });

    // İlk yanıtta durumu "işlemde" yap (kapalı değilse).
    if (contact.status === 'new') {
      await repoUpdateContact(id, { status: 'in_progress' } as any);
    }

    if (emailStatus === 'failed') {
      reply.code(502);
      return { reply: created, email: 'failed', message: 'reply_saved_email_failed' };
    }
    reply.code(201);
    return { reply: created, email: 'sent' };
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
