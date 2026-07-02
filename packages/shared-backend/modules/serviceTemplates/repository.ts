import { randomUUID } from 'crypto';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  serviceTemplates,
  serviceTemplatesI18n,
  type NewServiceTemplate,
  type ServiceTemplate,
} from './schema';

export const DEFAULT_LOCALE = 'tr';

export type LocaleText = { name: string; description: string | null };
export type TemplateI18nMap = Record<string, LocaleText>;
export type TemplateWithI18n = ServiceTemplate & { i18n: TemplateI18nMap };

function normalizeLocale(locale: string): string {
  return String(locale || DEFAULT_LOCALE).trim().toLowerCase().replace('_', '-').split('-')[0] || DEFAULT_LOCALE;
}

function i18nMapFor(
  templateId: string,
  rows: { template_id: string; locale: string; name: string; description: string | null }[],
): TemplateI18nMap {
  const map: TemplateI18nMap = {};
  for (const row of rows) {
    if (row.template_id !== templateId) continue;
    map[normalizeLocale(row.locale)] = { name: row.name, description: row.description ?? null };
  }
  return map;
}

function resolveLocale(base: ServiceTemplate, map: TemplateI18nMap, locale?: string): ServiceTemplate {
  const wanted = locale ? normalizeLocale(locale) : DEFAULT_LOCALE;
  const pick = map[wanted] || map[DEFAULT_LOCALE] || Object.values(map)[0] || null;
  if (!pick) return base;
  return { ...base, name: pick.name, description: pick.description };
}

async function loadI18n(templateIds: string[]) {
  if (!templateIds.length) return [] as { template_id: string; locale: string; name: string; description: string | null }[];
  return db
    .select({
      template_id: serviceTemplatesI18n.template_id,
      locale: serviceTemplatesI18n.locale,
      name: serviceTemplatesI18n.name,
      description: serviceTemplatesI18n.description,
    })
    .from(serviceTemplatesI18n)
    .where(inArray(serviceTemplatesI18n.template_id, templateIds));
}

export async function list(opts?: {
  category_slug?: string;
  activeOnly?: boolean;
  locale?: string;
}): Promise<ServiceTemplate[]> {
  const where = [
    opts?.category_slug ? eq(serviceTemplates.category_slug, opts.category_slug) : undefined,
    opts?.activeOnly ? eq(serviceTemplates.is_active, 1) : undefined,
  ].filter(Boolean);

  const bases = await db
    .select()
    .from(serviceTemplates)
    .where(where.length ? and(...(where as any)) : undefined)
    .orderBy(asc(serviceTemplates.category_slug), asc(serviceTemplates.sort_order), asc(serviceTemplates.name));
  const i18n = await loadI18n(bases.map((base) => base.id));
  return bases.map((base) => resolveLocale(base, i18nMapFor(base.id, i18n), opts?.locale));
}

export async function listWithI18n(opts?: { category_slug?: string; activeOnly?: boolean }): Promise<TemplateWithI18n[]> {
  const where = [
    opts?.category_slug ? eq(serviceTemplates.category_slug, opts.category_slug) : undefined,
    opts?.activeOnly ? eq(serviceTemplates.is_active, 1) : undefined,
  ].filter(Boolean);

  const bases = await db
    .select()
    .from(serviceTemplates)
    .where(where.length ? and(...(where as any)) : undefined)
    .orderBy(asc(serviceTemplates.category_slug), asc(serviceTemplates.sort_order), asc(serviceTemplates.name));
  const i18n = await loadI18n(bases.map((base) => base.id));
  return bases.map((base) => ({ ...base, i18n: i18nMapFor(base.id, i18n) }));
}

export async function getById(id: string): Promise<ServiceTemplate | undefined> {
  const [row] = await db.select().from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
  return row;
}

export async function getByIdWithI18n(id: string): Promise<TemplateWithI18n | undefined> {
  const base = await getById(id);
  if (!base) return undefined;
  const i18n = await loadI18n([id]);
  return { ...base, i18n: i18nMapFor(id, i18n) };
}

async function upsertI18n(templateId: string, i18n: TemplateI18nMap): Promise<void> {
  for (const [localeRaw, text] of Object.entries(i18n)) {
    const locale = normalizeLocale(localeRaw);
    if (!text?.name?.trim()) continue;
    const [existing] = await db
      .select({ id: serviceTemplatesI18n.id })
      .from(serviceTemplatesI18n)
      .where(sql`${serviceTemplatesI18n.template_id} = ${templateId} AND ${serviceTemplatesI18n.locale} = ${locale}`)
      .limit(1);
    const values = { name: text.name.trim(), description: text.description ?? null };
    if (existing) {
      await db.update(serviceTemplatesI18n).set(values).where(eq(serviceTemplatesI18n.id, existing.id));
    } else {
      await db.insert(serviceTemplatesI18n).values({
        id: randomUUID(),
        template_id: templateId,
        locale,
        ...values,
      });
    }
  }
}

export async function create(data: NewServiceTemplate, i18n?: TemplateI18nMap): Promise<void> {
  await db.insert(serviceTemplates).values(data);
  if (i18n && Object.keys(i18n).length) await upsertI18n(data.id as string, i18n);
}

export async function update(id: string, patch: Partial<NewServiceTemplate>, i18n?: TemplateI18nMap): Promise<void> {
  if (Object.keys(patch).length) await db.update(serviceTemplates).set(patch).where(eq(serviceTemplates.id, id));
  if (i18n && Object.keys(i18n).length) await upsertI18n(id, i18n);
}

export async function remove(id: string): Promise<void> {
  await db.delete(serviceTemplatesI18n).where(eq(serviceTemplatesI18n.template_id, id));
  await db.delete(serviceTemplates).where(eq(serviceTemplates.id, id));
}
