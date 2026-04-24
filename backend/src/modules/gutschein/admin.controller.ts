import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { gutscheins, gutscheinProducts } from './schema';
import {
  productCreateSchema,
  productUpdateSchema,
  adminCreateSchema,
  adminUpdateSchema,
} from './validation';
import { sendGutscheinEmail } from './email';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `KM-${seg()}-${seg()}`;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const [existing] = await db
      .select({ id: gutscheins.id })
      .from(gutscheins)
      .where(eq(gutscheins.code, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error('Could not generate unique code');
}

// ── Products ─────────────────────────────────────────────────────────────────

export const listProductsAdmin: RouteHandler = async (req, reply) => {
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select()
    .from(gutscheinProducts)
    .orderBy(gutscheinProducts.display_order)
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(gutscheinProducts);

  reply.header('x-total-count', String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

export const getProductAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select()
    .from(gutscheinProducts)
    .where(eq(gutscheinProducts.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'product_not_found' });
  return reply.send(row);
};

export const createProductAdmin: RouteHandler = async (req, reply) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const id = randomUUID();
  const d = parsed.data;

  await db.insert(gutscheinProducts).values({
    id,
    name: d.name,
    value: d.value.toFixed(2),
    currency: d.currency,
    validity_days: d.validity_days,
    description: d.description ?? null,
    is_active: d.is_active,
    display_order: d.display_order,
  } as any);

  const [created] = await db
    .select()
    .from(gutscheinProducts)
    .where(eq(gutscheinProducts.id, id))
    .limit(1);

  return reply.code(201).send(created);
};

export const updateProductAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const d = parsed.data;
  const updates: Record<string, unknown> = {};
  if (d.name !== undefined) updates.name = d.name;
  if (d.value !== undefined) updates.value = d.value.toFixed(2);
  if (d.currency !== undefined) updates.currency = d.currency;
  if (d.validity_days !== undefined) updates.validity_days = d.validity_days;
  if (d.description !== undefined) updates.description = d.description ?? null;
  if (d.is_active !== undefined) updates.is_active = d.is_active;
  if (d.display_order !== undefined) updates.display_order = d.display_order;

  if (Object.keys(updates).length === 0)
    return reply.code(400).send({ error: 'no_fields_to_update' });

  await db.update(gutscheinProducts).set(updates).where(eq(gutscheinProducts.id, id));

  const [updated] = await db
    .select()
    .from(gutscheinProducts)
    .where(eq(gutscheinProducts.id, id))
    .limit(1);

  return reply.send(updated);
};

export const deleteProductAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(gutscheinProducts).where(eq(gutscheinProducts.id, id));
  return reply.send({ success: true });
};

// ── Gutscheins ────────────────────────────────────────────────────────────────

export const listGutscheinsAdmin: RouteHandler = async (req, reply) => {
  const { page = '1', limit = '20', status, payment_status, q } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (status) conditions.push(eq(gutscheins.status, status as any));
  if (payment_status) conditions.push(eq(gutscheins.payment_status, payment_status as any));
  if (q) {
    conditions.push(
      or(
        like(gutscheins.code, `%${q}%`),
        like(gutscheins.purchaser_email, `%${q}%`),
        like(gutscheins.recipient_email, `%${q}%`),
      ) as any,
    );
  }

  const whereClause = conditions.length
    ? conditions.length === 1 ? conditions[0] : and(...conditions)
    : undefined;

  const base = db
    .select({
      id: gutscheins.id,
      code: gutscheins.code,
      product_id: gutscheins.product_id,
      value: gutscheins.value,
      currency: gutscheins.currency,
      status: gutscheins.status,
      purchaser_user_id: gutscheins.purchaser_user_id,
      purchaser_email: gutscheins.purchaser_email,
      purchaser_name: gutscheins.purchaser_name,
      recipient_email: gutscheins.recipient_email,
      recipient_name: gutscheins.recipient_name,
      personal_message: gutscheins.personal_message,
      payment_status: gutscheins.payment_status,
      issued_at: gutscheins.issued_at,
      expires_at: gutscheins.expires_at,
      redeemed_at: gutscheins.redeemed_at,
      redeemed_by_user_id: gutscheins.redeemed_by_user_id,
      is_admin_created: gutscheins.is_admin_created,
      admin_note: gutscheins.admin_note,
      order_ref: gutscheins.order_ref,
      created_at: gutscheins.created_at,
      updated_at: gutscheins.updated_at,
    })
    .from(gutscheins)
    .orderBy(desc(gutscheins.created_at))
    .limit(limitNum)
    .offset(offset);

  const rows = whereClause
    ? await base.where(whereClause)
    : await base;

  const countBase = db
    .select({ count: sql<number>`count(*)` })
    .from(gutscheins);
  const [{ count }] = whereClause
    ? await countBase.where(whereClause)
    : await countBase;

  reply.header('x-total-count', String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

export const getGutscheinAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });
  return reply.send(row);
};

export const createGutscheinAdmin: RouteHandler = async (req, reply) => {
  const parsed = adminCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const {
    product_id,
    value,
    currency,
    validity_days,
    purchaser_name,
    purchaser_email,
    recipient_name,
    recipient_email,
    personal_message,
    status,
    admin_note,
  } = parsed.data;

  const code = await uniqueCode();
  const id = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + validity_days);

  await db.insert(gutscheins).values({
    id,
    code,
    product_id: product_id ?? null,
    value: value.toFixed(2),
    currency,
    status,
    purchaser_email,
    purchaser_name,
    recipient_email: recipient_email ?? null,
    recipient_name: recipient_name ?? null,
    personal_message: personal_message ?? null,
    issued_at: status === 'active' ? now : null,
    expires_at: expiresAt,
    payment_status: 'paid',
    is_admin_created: 1,
    admin_note: admin_note ?? null,
  } as any);

  const [created] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  return reply.code(201).send(created);
};

export const updateGutscheinAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = adminUpdateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: 'validation_error', issues: parsed.error.issues });

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.admin_note !== undefined) updates.admin_note = parsed.data.admin_note ?? null;
  if (parsed.data.recipient_email !== undefined)
    updates.recipient_email = parsed.data.recipient_email ?? null;
  if (parsed.data.recipient_name !== undefined)
    updates.recipient_name = parsed.data.recipient_name ?? null;
  if (parsed.data.expires_at !== undefined)
    updates.expires_at = parsed.data.expires_at ? new Date(parsed.data.expires_at) : null;

  if (Object.keys(updates).length === 0)
    return reply.code(400).send({ error: 'no_fields_to_update' });

  await db.update(gutscheins).set(updates).where(eq(gutscheins.id, id));

  const [updated] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  return reply.send(updated);
};

export const cancelGutscheinAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select({ id: gutscheins.id, status: gutscheins.status })
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });
  if (row.status === 'redeemed')
    return reply.code(400).send({ error: 'cannot_cancel_redeemed' });

  await db
    .update(gutscheins)
    .set({ status: 'cancelled' })
    .where(eq(gutscheins.id, id));

  return reply.send({ success: true });
};

export const activateGutscheinAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select({ id: gutscheins.id })
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  await db
    .update(gutscheins)
    .set({ status: 'active', issued_at: new Date(), payment_status: 'paid' })
    .where(eq(gutscheins.id, id));

  return reply.send({ success: true });
};

export const deleteGutscheinAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .select({ id: gutscheins.id })
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  await db.delete(gutscheins).where(eq(gutscheins.id, id));
  return reply.send({ success: true });
};

// ── POST /gutscheins/:id/send-email ────────────────────────────────────────
export const sendGutscheinEmailAdmin: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body ?? {}) as { to?: string };

  const [row] = await db
    .select()
    .from(gutscheins)
    .where(eq(gutscheins.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: 'gutschein_not_found' });

  // Determine target email: explicit body.to > recipient_email > purchaser_email
  const targetEmail = body.to?.trim() || row.recipient_email || row.purchaser_email;
  if (!targetEmail) {
    return reply.code(400).send({ error: 'no_email_address' });
  }

  try {
    await sendGutscheinEmail(
      {
        code: row.code,
        value: row.value,
        currency: row.currency,
        purchaser_name: row.purchaser_name,
        purchaser_email: row.purchaser_email,
        recipient_name: row.recipient_name,
        recipient_email: row.recipient_email,
        personal_message: row.personal_message,
        expires_at: row.expires_at,
        issued_at: row.issued_at,
      },
      targetEmail,
    );
    return reply.send({ success: true, sent_to: targetEmail });
  } catch (err: any) {
    req.log.error({ err: err?.message ?? err }, 'gutschein_email_failed');
    return reply.code(500).send({ error: 'email_send_failed', message: err?.message });
  }
};
