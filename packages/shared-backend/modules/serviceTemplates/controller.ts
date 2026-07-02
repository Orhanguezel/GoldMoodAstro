import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import { DEFAULT_LOCALE, type TemplateI18nMap } from './repository';
import { createServiceTemplateSchema, updateServiceTemplateSchema } from './validation';

type Body = {
  category_slug?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  media_type?: 'audio' | 'video';
  is_free?: number;
  sort_order?: number;
  is_active?: number;
  i18n?: TemplateI18nMap;
};

function normalizeI18n(body: Body): { i18n: TemplateI18nMap; base: { name: string; description: string | null } } | null {
  const i18n: TemplateI18nMap = { ...(body.i18n ?? {}) };
  if ((!i18n[DEFAULT_LOCALE] || !i18n[DEFAULT_LOCALE].name?.trim()) && body.name?.trim()) {
    i18n[DEFAULT_LOCALE] = { name: body.name.trim(), description: body.description ?? null };
  }
  const baseText = i18n[DEFAULT_LOCALE] || Object.values(i18n)[0];
  if (!baseText?.name?.trim()) return null;
  return { i18n, base: { name: baseText.name.trim(), description: baseText.description ?? null } };
}

function normalizeTemplatePayload<T extends Body>(data: T) {
  const { i18n: _i18n, ...rest } = data;
  const normalized: Omit<typeof rest, 'price'> & { price?: string } = { ...rest } as Omit<typeof rest, 'price'> & { price?: string };
  if (data.is_free === 1) {
    normalized.price = '0.00';
  } else if (data.price !== undefined) {
    normalized.price = Number(data.price).toFixed(2);
  }
  return normalized;
}

export async function listAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { category_slug } = req.query as { category_slug?: string };
  const rows = await repo.listWithI18n({ category_slug });
  return reply.send({ data: rows });
}

export async function getAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getByIdWithI18n(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data: row });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createServiceTemplateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const body = parsed.data as Body;
  const norm = normalizeI18n(body);
  if (!norm) return reply.code(400).send({ error: { message: 'name_required' } });
  const id = randomUUID();
  const payload = normalizeTemplatePayload({ ...body, name: norm.base.name, description: norm.base.description });
  await repo.create({
    id,
    category_slug: payload.category_slug!,
    slug: payload.slug!,
    name: norm.base.name,
    description: norm.base.description,
    duration_minutes: payload.duration_minutes,
    price: payload.price,
    currency: payload.currency,
    media_type: payload.media_type,
    is_free: payload.is_free,
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  }, norm.i18n);
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  const parsed = updateServiceTemplateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const body = parsed.data as Body;
  const patch: Record<string, unknown> = normalizeTemplatePayload(body);
  delete patch.i18n;

  let i18n: TemplateI18nMap | undefined;
  if (body.i18n || body.name !== undefined) {
    const norm = normalizeI18n(body);
    if (norm) {
      i18n = norm.i18n;
      patch.name = norm.base.name;
      patch.description = norm.base.description;
    }
  }

  await repo.update(id, patch, i18n);
  return reply.send({ data: { id } });
}

export async function deleteAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}
