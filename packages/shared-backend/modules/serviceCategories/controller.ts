import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import { DEFAULT_LOCALE, type CategoryI18nMap } from './repository';
import { createServiceCategorySchema, updateServiceCategorySchema } from './validation';

type Body = {
  slug?: string;
  name?: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: number;
  i18n?: CategoryI18nMap;
};

// Body'den i18n map türet (i18n yoksa name/description → tr). Ana tablo için tr fallback döndür.
function normalizeI18n(body: Body): { i18n: CategoryI18nMap; base: { name: string; description: string | null } } | null {
  const i18n: CategoryI18nMap = { ...(body.i18n ?? {}) };
  if ((!i18n[DEFAULT_LOCALE] || !i18n[DEFAULT_LOCALE].name?.trim()) && body.name?.trim()) {
    i18n[DEFAULT_LOCALE] = { name: body.name.trim(), description: body.description ?? null };
  }
  const baseText = i18n[DEFAULT_LOCALE] || Object.values(i18n)[0];
  if (!baseText?.name?.trim()) return null;
  return { i18n, base: { name: baseText.name.trim(), description: baseText.description ?? null } };
}

export async function listPublic(req: FastifyRequest, reply: FastifyReply) {
  const { locale } = req.query as { locale?: string };
  const rows = await repo.list({ activeOnly: true, locale });
  return reply.send({ data: rows });
}

export async function listAdmin(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.listWithI18n();
  return reply.send({ data: rows });
}

export async function getAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getByIdWithI18n(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data: row });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createServiceCategorySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const norm = normalizeI18n(parsed.data as Body);
  if (!norm) return reply.code(400).send({ error: { message: 'name_required' } });
  const id = randomUUID();
  await repo.create(
    {
      id,
      slug: parsed.data.slug!,
      name: norm.base.name,
      description: norm.base.description,
      icon: parsed.data.icon ?? null,
      sort_order: parsed.data.sort_order ?? 0,
      is_active: parsed.data.is_active ?? 1,
    },
    norm.i18n,
  );
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  const parsed = updateServiceCategorySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const body = parsed.data as Body;

  // Dil-bağımsız alanlar
  const patch: Record<string, unknown> = {};
  if (body.slug !== undefined) patch.slug = body.slug;
  if (body.icon !== undefined) patch.icon = body.icon;
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  // i18n (varsa) — ana tablonun tr fallback'ini de senkronla
  let i18n: CategoryI18nMap | undefined;
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
  const templateCount = await repo.countTemplatesForSlug(row.slug);
  if (templateCount > 0) return reply.code(409).send({ error: { message: 'category_has_templates' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}
