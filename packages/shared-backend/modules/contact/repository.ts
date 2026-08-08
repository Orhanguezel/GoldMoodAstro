// =============================================================
// FILE: src/modules/contact/repository.ts
// =============================================================
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import {
  contact_messages,
  contact_replies,
  type ContactView,
  type ContactReplyRow,
} from "./schema";
import {
  asc,
  eq,
} from "drizzle-orm";
import {
  buildContactInsert,
  buildContactListWhere,
  buildContactOrderExpr,
  buildContactPatch,
} from "./helpers";
import type {
  ContactCreateInput,
  ContactListParams,
  ContactUpdateInput,
} from "./validation";

export async function repoCreateContact(
  body: ContactCreateInput & { ip?: string | null; user_agent?: string | null },
): Promise<ContactView> {
  const id = randomUUID();
  const insert = buildContactInsert(body, id);

  await db.insert(contact_messages).values(insert);

  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return row as ContactView;
}

export async function repoGetContactById(id: string): Promise<ContactView | null> {
  const [row] = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.id, id))
    .limit(1);

  return (row ?? null) as ContactView | null;
}

/** Bir iletişim mesajının admin yanıtları (eskiden yeniye). */
export async function repoListContactReplies(contactId: string): Promise<ContactReplyRow[]> {
  return (await db
    .select()
    .from(contact_replies)
    .where(eq(contact_replies.contact_id, contactId))
    .orderBy(asc(contact_replies.created_at))) as ContactReplyRow[];
}

/** Yanıt kaydet — outbound (admin, e-posta gider) veya inbound (kullanıcı, IMAP ile alınan). */
export async function repoCreateContactReply(data: {
  contact_id: string;
  message: string;
  admin_user_id?: string | null;
  direction?: "outbound" | "inbound";
  from_email?: string | null;
  email_message_id?: string | null;
  email_status?: string;
}): Promise<ContactReplyRow> {
  const id = randomUUID();
  await db.insert(contact_replies).values({
    id,
    contact_id: data.contact_id,
    message: data.message,
    admin_user_id: data.admin_user_id ?? null,
    channel: "email",
    direction: data.direction ?? "outbound",
    from_email: data.from_email ?? null,
    email_message_id: data.email_message_id ?? null,
    email_status: data.email_status ?? "sent",
  });
  const [row] = await db
    .select()
    .from(contact_replies)
    .where(eq(contact_replies.id, id))
    .limit(1);
  return row as ContactReplyRow;
}

/** Bu e-posta Message-ID'si zaten kayıtlı mı (gelen e-posta dedup). */
export async function repoContactReplyExistsByMessageId(messageId: string): Promise<boolean> {
  if (!messageId) return false;
  const [row] = await db
    .select({ id: contact_replies.id })
    .from(contact_replies)
    .where(eq(contact_replies.email_message_id, messageId))
    .limit(1);
  return !!row;
}

/** Giden yanıtın messageId'sinden contact_id bul (gelen e-postanın In-Reply-To eşleşmesi). */
export async function repoFindContactIdByOutboundMessageId(messageId: string): Promise<string | null> {
  if (!messageId) return null;
  const [row] = await db
    .select({ contact_id: contact_replies.contact_id })
    .from(contact_replies)
    .where(eq(contact_replies.email_message_id, messageId))
    .limit(1);
  return row?.contact_id ?? null;
}

/** Bir e-posta adresine ait en güncel iletişim mesajını bul (gelen e-posta fallback eşleşmesi). */
export async function repoFindLatestContactByEmail(email: string): Promise<ContactView | null> {
  if (!email) return null;
  const rows = await db
    .select()
    .from(contact_messages)
    .where(eq(contact_messages.email, email.trim().toLowerCase()));
  if (!rows.length) return null;
  rows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return rows[0] as ContactView;
}

export async function repoListContacts(
  params: ContactListParams,
): Promise<ContactView[]> {
  const { limit = 50, offset = 0, orderBy, order = "desc" } = params;
  const whereExpr = buildContactListWhere(params);
  const orderExpr = buildContactOrderExpr(orderBy, order);

  const baseQuery = db
    .select()
    .from(contact_messages);

  const rows = await (whereExpr ? baseQuery.where(whereExpr) : baseQuery)
    .orderBy(orderExpr)
    .limit(Number(limit))
    .offset(Number(offset));

  return rows as ContactView[];
}

export async function repoUpdateContact(
  id: string,
  body: ContactUpdateInput,
): Promise<ContactView | null> {
  const patch = buildContactPatch(body);

  if (Object.keys(patch).length === 0) {
    return repoGetContactById(id);
  }

  await db
    .update(contact_messages)
    .set({
      ...patch,
      updated_at: new Date(),
    })
    .where(eq(contact_messages.id, id));

  return repoGetContactById(id);
}

export async function repoDeleteContact(id: string): Promise<boolean> {
  const res = await db
    .delete(contact_messages)
    .where(eq(contact_messages.id, id))
    .execute();

  const affectedRows =
    typeof res === 'object' && res !== null && 'affectedRows' in res
      ? Number((res as { affectedRows?: unknown }).affectedRows ?? 0)
      : 0;

  return affectedRows > 0;
}
