// =============================================================
// FILE: src/modules/support/repository.ts
// =============================================================

import { and, desc, asc, eq, like, count, or } from "drizzle-orm";
import { db } from '../../db/client';
import { supportTickets, ticketReplies } from "./schema";
import { users } from "@goldmood/shared-backend/modules/auth/schema";
import { randomUUID } from "crypto";

export type Status = "open" | "in_progress" | "waiting_response" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";

export type ListParams = {
  user_id?: string;
  status?: Status;
  priority?: Priority;
  q?: string;
  limit: number;
  offset: number;
  sort: "created_at" | "updated_at";
  order: "asc" | "desc";
};

const coalesceStatus = (s?: string | null) =>
  !s || s.trim() === "" ? "open" : s;
const coalescePriority = (p?: string | null) =>
  !p || p.trim() === "" ? "medium" : p;

/** users tablosu ile join'li base select */
function buildSupportTicketSelect() {
  return db
    .select({
      id: supportTickets.id,
      user_id: supportTickets.user_id,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      priority: supportTickets.priority,
      created_at: supportTickets.created_at,
      updated_at: supportTickets.updated_at,
      user_full_name: users.full_name,
      user_email: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(users.id, supportTickets.user_id));
}

/** DB row -> API DTO (user_display_name + user_email ekliyoruz) */
function mapTicketRow(row: any) {
  const status = coalesceStatus(row.status as any);
  const priority = coalescePriority(row.priority as any);

  const fullName = row.user_full_name as string | null | undefined;
  const email = row.user_email as string | null | undefined;

  let user_display_name: string | null = null;
  if (fullName && fullName.trim()) {
    user_display_name = fullName.trim();
  } else if (email) {
    user_display_name = email.split("@")[0] ?? email;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    subject: row.subject,
    message: row.message,
    status,
    priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_display_name,
    user_email: email ?? null,
  };
}

export const SupportRepo = {
  async list(params: ListParams) {
    const { user_id, status, priority, q, limit, offset, sort, order } =
      params;

    const whereClauses = [
      user_id ? eq(supportTickets.user_id, user_id) : undefined,
      status ? eq(supportTickets.status, status) : undefined,
      priority ? eq(supportTickets.priority, priority) : undefined,
      q
        ? or(
          like(supportTickets.subject, `%${q}%`),
          like(supportTickets.message, `%${q}%`),
        )
        : undefined,
    ].filter(Boolean) as any[];

    const whereExpr =
      whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const sortCol =
      sort === "created_at"
        ? supportTickets.created_at
        : supportTickets.updated_at;
    const orderBy = order === "asc" ? asc(sortCol) : desc(sortCol);

    const listQuery = whereExpr
      ? buildSupportTicketSelect()
        .where(whereExpr)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)
      : buildSupportTicketSelect()
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

    const countQuery = whereExpr
      ? db
        .select({ total: count() })
        .from(supportTickets)
        .where(whereExpr)
      : db.select({ total: count() }).from(supportTickets);

    const [rows, [{ total }]] = await Promise.all([listQuery, countQuery]);

    const data = rows.map((r) => mapTicketRow(r));
    return { data, total: Number(total ?? 0) };
  },

  async getById(id: string) {
    const [row] = await buildSupportTicketSelect()
      .where(eq(supportTickets.id, id))
      .limit(1);

    if (!row) return null;
    return mapTicketRow(row);
  },

  async createTicket(body: {
    user_id: string;
    subject: string;
    message: string;
    priority?: Priority;
  }) {
    const id = randomUUID();
    const now = new Date();

    const row: typeof supportTickets.$inferInsert = {
      id,
      user_id: body.user_id,
      subject: body.subject,
      message: body.message,
      status: "open",
      priority: body.priority ?? "medium",
      created_at: now as any,
      updated_at: now as any,
    };

    await db.insert(supportTickets).values(row);
    return await this.getById(id);
  },

  async updateTicket(
    id: string,
    patch: Partial<{
      subject: string;
      message: string;
      status: Status;
      priority: Priority;
    }>,
  ) {
    const now = new Date();
    await db
      .update(supportTickets)
      .set({ ...patch, updated_at: now as any })
      .where(eq(supportTickets.id, id));

    return await this.getById(id);
  },

  async listRepliesByTicket(ticketId: string) {
    const rows = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.ticket_id, ticketId))
      .orderBy(asc(ticketReplies.created_at));

    return rows.map((r) => ({
      ...r,
      is_admin: !!(r.is_admin as any),
    }));
  },

  async createReply(body: {
    ticket_id: string;
    user_id?: string | null;
    message: string;
    is_admin?: boolean;
  }) {
    const id = randomUUID();
    const now = new Date();

    const row: typeof ticketReplies.$inferInsert = {
      id,
      ticket_id: body.ticket_id,
      user_id: body.user_id ?? null,
      message: body.message,
      is_admin: body.is_admin ? 1 : 0,
      created_at: now as any,
    };

    await db.insert(ticketReplies).values(row);

    const [created] = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.id, id))
      .limit(1);

    return {
      ...created,
      is_admin: !!(created.is_admin as any),
    };
  },
};
