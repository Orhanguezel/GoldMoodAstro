// =============================================================
// FILE: src/modules/contact/reply.service.ts
// İletişim mesajına yanıt akışının tek kaynağı: e-posta gönder + thread'e
// kaydet + durumu ilerlet. Hem admin paneli (/admin/contacts/:id/reply)
// hem dış CRM köprüsü (/ext/crm/contacts/:id/reply) bunu kullanır —
// şablon/durum davranışı iki kanalda birebir aynı kalsın diye.
// =============================================================
import {
  repoGetContactById,
  repoUpdateContact,
  repoCreateContactReply,
} from './repository';
import { sendMail } from '../mail';

export interface ContactReplyResult {
  contact: NonNullable<Awaited<ReturnType<typeof repoGetContactById>>>;
  created: Awaited<ReturnType<typeof repoCreateContactReply>>;
  emailStatus: 'sent' | 'failed';
}

export async function sendContactReplyMessage(args: {
  contactId: string;
  message: string;
  adminUserId?: string | null;
  log?: { error: (obj: unknown, msg?: string) => void };
}): Promise<ContactReplyResult | null> {
  const contact = await repoGetContactById(args.contactId);
  if (!contact) return null;

  const subject = /^re:/i.test(contact.subject) ? contact.subject : `Re: ${contact.subject}`;
  const safe = args.message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1226;line-height:1.6">
      <p>Merhaba ${contact.name || ''},</p>
      <div style="white-space:pre-wrap">${safe.replace(/\n/g, '<br/>')}</div>
      <hr style="border:none;border-top:1px solid #eadfca;margin:18px 0"/>
      <p style="color:#999;font-size:12px">Bu e-posta, GoldMoodAstro üzerinden gönderdiğiniz iletişim mesajına yanıttır.<br/>Gönderdiğiniz mesaj: “${(contact.subject || '').slice(0, 120)}”</p>
      <p style="color:#715d83;font-size:12px"><b>GoldMoodAstro</b></p>
    </div>`;
  const text = `Merhaba ${contact.name || ''},\n\n${args.message}\n\n—\nBu e-posta, GoldMoodAstro üzerinden gönderdiğiniz iletişim mesajına yanıttır.\nGoldMoodAstro`;

  let emailStatus: 'sent' | 'failed' = 'sent';
  let outboundMessageId: string | null = null;
  try {
    const info: any = await sendMail({ to: contact.email, subject, html, text } as any);
    outboundMessageId = info?.messageId ?? null;
  } catch (mailErr) {
    emailStatus = 'failed';
    args.log?.error({ err: mailErr }, 'contact_reply_mail_failed');
  }

  const created = await repoCreateContactReply({
    contact_id: args.contactId,
    message: args.message,
    admin_user_id: args.adminUserId ?? null,
    direction: 'outbound',
    email_message_id: outboundMessageId,
    email_status: emailStatus,
  });

  // İlk yanıtta durumu "işlemde" yap (kapalı değilse).
  if (contact.status === 'new') {
    await repoUpdateContact(args.contactId, { status: 'in_progress' } as any);
  }

  return { contact, created, emailStatus };
}
