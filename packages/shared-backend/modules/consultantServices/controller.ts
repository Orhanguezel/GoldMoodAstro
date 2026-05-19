// packages/shared-backend/modules/consultantServices/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { appConfig } from '@goldmood/shared-config/appConfig';
import * as repo from './repository';
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

/* ─── Schemas ─── */
const servicePayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, 'slug_format'),
  description: z.string().trim().max(2000).nullable().optional(),
  duration_minutes: z.coerce
    .number()
    .int()
    .positive()
    .max(appConfig.consultants.maxSessionDurationMinutes)
    .default(appConfig.consultants.defaultSessionDurationMinutes),
  price: z.coerce.number().nonnegative().max(appConfig.consultants.maxSessionPrice).default(0),
  currency: z.string().trim().length(3).default(appConfig.consultants.defaultCurrency),
  media_type: z.enum(['audio', 'video']).default('audio'),
  is_free: z.coerce.number().int().min(0).max(1).default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
  sort_order: z.coerce.number().int().default(0),
  template_id: z.string().trim().max(36).nullable().optional(),
  category_slug: z.string().trim().max(64).nullable().optional(),
});

function validatePaidServicePrice(data: { is_free?: number; price?: number }, ctx: z.RefinementCtx) {
  if (data.is_free === 1) return;
  if ((data.price ?? 0) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'paid_service_price_must_be_positive',
    });
  }
}

const createSchema = servicePayloadSchema.superRefine(validatePaidServicePrice);
const updateSchema = servicePayloadSchema.partial().superRefine((data, ctx) => {
  if (data.is_free !== undefined || data.price !== undefined) {
    validatePaidServicePrice(data, ctx);
  }
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sort_order: z.coerce.number().int() })).min(1),
});

/* ─── Helpers ─── */
async function getConsultantIdByUserId(userId: string): Promise<string | null> {
  const result = await db.execute(sql`SELECT id FROM consultants WHERE user_id = ${userId} LIMIT 1`);
  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any);
  const row = (rows as any[])?.[0];
  return row?.id ?? null;
}

function normalizeServicePayload<T extends { price?: number; is_free?: number }>(data: T) {
  const normalized: Omit<T, 'price'> & { price?: string } = { ...data } as Omit<T, 'price'> & { price?: string };
  if (data.is_free === 1) {
    normalized.price = '0.00';
  } else if (data.price !== undefined) {
    normalized.price = Number(data.price).toFixed(2);
  }
  return normalized;
}

/* ─── PUBLIC ─── */
// GET /consultants/:consultantId/services
export async function listPublic(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const rows = await repo.listByConsultant(consultantId, { activeOnly: true });
  return reply.send({ data: rows });
}

/* ─── SELF (consultant kendi servisleri) ─── */
export async function resolveCallerConsultantId(req: FastifyRequest): Promise<string | null> {
  const u = (req as any).user as { sub?: string; id?: string } | undefined;
  const userId = u?.id ?? u?.sub;
  if (!userId) return null;
  return await getConsultantIdByUserId(String(userId));
}

export async function listSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const rows = await repo.listByConsultant(consultantId, { activeOnly: false });
  return reply.send({ data: rows });
}

export async function createSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const id = randomUUID();
  // is_free=1 ise price'ı 0 zorla
  const data = normalizeServicePayload(parsed.data);
  await repo.createWithSync({ id, consultant_id: consultantId, ...data });
  return reply.send({ data: { id } });
}

export async function updateSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { id } = req.params as { id: string };
  const own = await repo.getByIdForConsultant(id, consultantId);
  if (!own) return reply.code(404).send({ error: { message: 'not_found' } });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const patch = normalizeServicePayload(parsed.data);
  await repo.updateWithSync(id, consultantId, patch as any);
  return reply.send({ data: { id } });
}

export async function deleteSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { id } = req.params as { id: string };
  const own = await repo.getByIdForConsultant(id, consultantId);
  if (!own) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.removeWithSync(id, consultantId);
  return reply.send({ data: { id, ok: true } });
}

export async function reorderSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  await repo.reorder(consultantId, parsed.data.items);
  return reply.send({ data: { ok: true, count: parsed.data.items.length } });
}

function isDuplicateKeyError(error: unknown): boolean {
  const e = error as { code?: string; errno?: number } | undefined;
  return e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062;
}

async function uniqueSlugForConsultant(consultantId: string, baseSlug: string): Promise<string> {
  const cleanBase = baseSlug.replace(/-\d+$/i, '') || 'service';
  if (!(await repo.slugExistsForConsultant(consultantId, cleanBase))) return cleanBase;
  for (let i = 2; i < 100; i += 1) {
    const candidate = `${cleanBase}-${i}`;
    if (!(await repo.slugExistsForConsultant(consultantId, candidate))) return candidate;
  }
  return `${cleanBase}-${Date.now()}`;
}

export async function listSelfTemplates(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const rows = await repo.listTemplatesForConsultant(consultantId);
  return reply.send({ data: rows });
}

export async function createSelfFromTemplate(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { templateId } = req.params as { templateId: string };

  const existing = await repo.getByTemplateForConsultant(templateId, consultantId);
  if (existing) return reply.send({ data: existing });

  const template = await repo.getTemplateById(templateId);
  if (!template || template.is_active !== 1) return reply.code(404).send({ error: { message: 'template_not_found' } });

  const id = randomUUID();
  const sortOrder = await repo.nextSortOrder(consultantId);
  const slug = await uniqueSlugForConsultant(consultantId, template.slug);
  const data = {
    id,
    consultant_id: consultantId,
    template_id: template.id,
    category_slug: template.category_slug,
    name: template.name,
    slug,
    description: template.description ?? null,
    duration_minutes: template.duration_minutes,
    price: String(template.is_free === 1 ? '0.00' : template.price),
    currency: template.currency,
    media_type: template.media_type,
    is_free: template.is_free,
    is_active: 1,
    sort_order: sortOrder,
  };

  try {
    await repo.createWithSync(data);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicate = await repo.getByTemplateForConsultant(templateId, consultantId);
      if (duplicate) return reply.send({ data: duplicate });
    }
    throw error;
  }

  const created = await repo.getByIdForConsultant(id, consultantId);
  return reply.send({ data: created ?? { id } });
}

/* ─── ADMIN ─── */
export async function listAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const rows = await repo.listByConsultant(consultantId, { activeOnly: false });
  return reply.send({ data: rows });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const id = randomUUID();
  const data = normalizeServicePayload(parsed.data);
  await repo.createWithSync({ id, consultant_id: consultantId, ...data });
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const patch = normalizeServicePayload(parsed.data);
  await repo.updateWithSync(id, row.consultant_id, patch as any);
  return reply.send({ data: { id } });
}

export async function deleteAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.removeWithSync(id, row.consultant_id);
  return reply.send({ data: { id, ok: true } });
}
