// =============================================================
// FILE: src/modules/contact/inbox.ts
// IMAP gelen kutusu tarayıcı: kullanıcıların e-posta YANITLARINI iletişim
// thread'ine (contact_replies, direction='inbound') düşürür. İki yönlü mesajlaşma.
// Config SMTP'den türetilir (Hostinger: aynı kutu, imap.hostinger.com:993).
// =============================================================
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getSmtpSettings } from "../siteSettings/service";
import {
  repoContactReplyExistsByMessageId,
  repoFindContactIdByOutboundMessageId,
  repoFindLatestContactByEmail,
  repoCreateContactReply,
  repoUpdateContact,
} from "./repository";

export type InboxPollResult = {
  ok: boolean;
  imported: number;
  scanned: number;
  skipped: number;
  reason?: string;
};

async function getImapConfig(): Promise<
  { host: string; port: number; secure: boolean; user: string; pass: string } | null
> {
  const smtp = await getSmtpSettings();
  const user = (smtp.username ?? "").trim();
  const pass = (smtp.password ?? "").trim();
  if (!user || !pass) return null;

  // IMAP host'unu SMTP host'undan türet (Hostinger: aynı kutu, imap.hostinger.com:993).
  const smtpHost = (smtp.host ?? "").trim();
  const host = /hostinger/i.test(smtpHost)
    ? "imap.hostinger.com"
    : smtpHost.replace(/^smtp\./i, "imap.");
  if (!host) return null;

  const port = 993;
  return { host, port, secure: true, user, pass };
}

/** "On ... wrote:" / "> " alıntı bloklarını ve imzayı basitçe kes — sadece yeni metni al. */
function stripQuoted(text: string): string {
  const lines = (text || "").split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (/^>/.test(line)) break;
    if (/^\s*On .+ wrote:\s*$/i.test(line)) break;
    if (/^\s*.+ (yazdı|dedi|şunları yazdı):\s*$/i.test(line)) break;
    if (/^-{2,}\s*(Orijinal|Original)/i.test(line)) break;
    if (/^_{5,}$/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * INBOX'taki OKUNMAMIŞ e-postaları tarar, iletişim thread'lerine düşürür.
 * Güvenli: eşleşmeyen (bizimle ilgisiz) e-postalara dokunmaz ve SEEN yapmaz.
 */
export async function pollContactInbox(opts?: { limit?: number }): Promise<InboxPollResult> {
  const cfg = await getImapConfig();
  if (!cfg) return { ok: false, imported: 0, scanned: 0, skipped: 0, reason: "imap_not_configured" };

  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });

  let imported = 0;
  let scanned = 0;
  let skipped = 0;

  try {
    await client.connect();
  } catch (err: any) {
    return { ok: false, imported, scanned, skipped, reason: `imap_connect_failed: ${err?.message ?? err}` };
  }

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const uids = (await client.search({ seen: false, since }, { uid: true })) || [];
      const limited = uids.slice(-(opts?.limit ?? 50));
      if (limited.length === 0) {
        return { ok: true, imported, scanned, skipped };
      }

      for await (const msg of client.fetch(limited, { source: true, envelope: true }, { uid: true })) {
        scanned++;
        try {
          const source = (msg as any).source as Buffer | undefined;
          if (!source) { skipped++; continue; }
          const parsed = await simpleParser(source);

          const messageId = (parsed.messageId || "").trim();
          const fromEmail =
            (parsed.from?.value?.[0]?.address || "").trim().toLowerCase();
          const inReplyTo = (parsed.inReplyTo || "").trim();
          const references = Array.isArray(parsed.references)
            ? parsed.references
            : parsed.references
              ? [parsed.references]
              : [];

          // dedup: bu e-posta zaten alındıysa atla (ama SEEN yap ki tekrar taranmasın)
          if (messageId && (await repoContactReplyExistsByMessageId(messageId))) {
            skipped++;
            await client.messageFlagsAdd((msg as any).uid, ["\\Seen"], { uid: true });
            continue;
          }

          // eşleştir: önce In-Reply-To/References → giden yanıtın contact'ı; sonra gönderen adresi
          let contactId: string | null = null;
          for (const ref of [inReplyTo, ...references].filter(Boolean)) {
            contactId = await repoFindContactIdByOutboundMessageId(ref);
            if (contactId) break;
          }
          if (!contactId && fromEmail) {
            const c = await repoFindLatestContactByEmail(fromEmail);
            contactId = c?.id ?? null;
          }
          // eşleşmeyen e-posta bizimle ilgili değil → dokunma, SEEN yapma (kullanıcının kendi kutusu)
          if (!contactId) { skipped++; continue; }

          const cleaned = stripQuoted(parsed.text || "").slice(0, 8000) || "(boş mesaj)";
          await repoCreateContactReply({
            contact_id: contactId,
            message: cleaned,
            direction: "inbound",
            from_email: fromEmail || null,
            email_message_id: messageId || null,
            email_status: "sent",
          });
          await repoUpdateContact(contactId, { status: "in_progress" } as any);
          await client.messageFlagsAdd((msg as any).uid, ["\\Seen"], { uid: true });
          imported++;
        } catch {
          skipped++;
        }
      }
    } finally {
      lock.release();
    }
  } catch (err: any) {
    return { ok: false, imported, scanned, skipped, reason: `imap_poll_failed: ${err?.message ?? err}` };
  } finally {
    await client.logout().catch(() => undefined);
  }

  return { ok: true, imported, scanned, skipped };
}
