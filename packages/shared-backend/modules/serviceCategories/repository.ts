import { asc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../../db/client';
import {
  serviceCategories,
  serviceCategoriesI18n,
  type NewServiceCategory,
  type ServiceCategory,
} from './schema';
import { serviceTemplates } from '../serviceTemplates/schema';

export const DEFAULT_LOCALE = 'tr';

export type LocaleText = { name: string; description: string | null };
export type CategoryI18nMap = Record<string, LocaleText>;
export type CategoryWithI18n = ServiceCategory & { i18n: CategoryI18nMap };

function i18nMapFor(categoryId: string, rows: { category_id: string; locale: string; name: string; description: string | null }[]): CategoryI18nMap {
  const map: CategoryI18nMap = {};
  for (const r of rows) {
    if (r.category_id !== categoryId) continue;
    map[r.locale] = { name: r.name, description: r.description ?? null };
  }
  return map;
}

// Seçili locale (yoksa tr, o da yoksa ana tablodaki name) çözümlemesi.
function resolveLocale(base: ServiceCategory, map: CategoryI18nMap, locale?: string): ServiceCategory {
  const pick = (locale && map[locale]) || map[DEFAULT_LOCALE] || null;
  if (!pick) return base;
  return { ...base, name: pick.name, description: pick.description };
}

async function loadI18n(categoryIds: string[]) {
  if (!categoryIds.length) return [] as { category_id: string; locale: string; name: string; description: string | null }[];
  return db
    .select({
      category_id: serviceCategoriesI18n.category_id,
      locale: serviceCategoriesI18n.locale,
      name: serviceCategoriesI18n.name,
      description: serviceCategoriesI18n.description,
    })
    .from(serviceCategoriesI18n)
    .where(inArray(serviceCategoriesI18n.category_id, categoryIds));
}

// Public/liste: seçili locale'e çözümlenmiş name/description (geriye uyumlu shape).
export async function list(opts?: { activeOnly?: boolean; locale?: string }): Promise<ServiceCategory[]> {
  const bases = await db
    .select()
    .from(serviceCategories)
    .where(opts?.activeOnly ? eq(serviceCategories.is_active, 1) : undefined)
    .orderBy(asc(serviceCategories.sort_order), asc(serviceCategories.name));
  const i18n = await loadI18n(bases.map((b) => b.id));
  return bases.map((b) => resolveLocale(b, i18nMapFor(b.id, i18n), opts?.locale));
}

// Admin liste: her kategori + tüm dillerin i18n map'i (form 3 dili göstersin).
export async function listWithI18n(opts?: { activeOnly?: boolean }): Promise<CategoryWithI18n[]> {
  const bases = await db
    .select()
    .from(serviceCategories)
    .where(opts?.activeOnly ? eq(serviceCategories.is_active, 1) : undefined)
    .orderBy(asc(serviceCategories.sort_order), asc(serviceCategories.name));
  const i18n = await loadI18n(bases.map((b) => b.id));
  return bases.map((b) => ({ ...b, i18n: i18nMapFor(b.id, i18n) }));
}

export async function getById(id: string): Promise<ServiceCategory | undefined> {
  const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id)).limit(1);
  return row;
}

export async function getByIdWithI18n(id: string): Promise<CategoryWithI18n | undefined> {
  const base = await getById(id);
  if (!base) return undefined;
  const i18n = await loadI18n([id]);
  return { ...base, i18n: i18nMapFor(id, i18n) };
}

export async function getBySlug(slug: string): Promise<ServiceCategory | undefined> {
  const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug)).limit(1);
  return row;
}

async function upsertI18n(categoryId: string, i18n: CategoryI18nMap): Promise<void> {
  for (const [locale, text] of Object.entries(i18n)) {
    if (!text?.name?.trim()) continue;
    const [existing] = await db
      .select({ id: serviceCategoriesI18n.id })
      .from(serviceCategoriesI18n)
      .where(sql`${serviceCategoriesI18n.category_id} = ${categoryId} AND ${serviceCategoriesI18n.locale} = ${locale}`)
      .limit(1);
    if (existing) {
      await db
        .update(serviceCategoriesI18n)
        .set({ name: text.name, description: text.description ?? null })
        .where(eq(serviceCategoriesI18n.id, existing.id));
    } else {
      await db.insert(serviceCategoriesI18n).values({
        id: randomUUID(),
        category_id: categoryId,
        locale,
        name: text.name,
        description: text.description ?? null,
      });
    }
  }
}

export async function create(data: NewServiceCategory, i18n?: CategoryI18nMap): Promise<void> {
  await db.insert(serviceCategories).values(data);
  if (i18n && Object.keys(i18n).length) await upsertI18n(data.id as string, i18n);
}

export async function update(id: string, patch: Partial<NewServiceCategory>, i18n?: CategoryI18nMap): Promise<void> {
  if (Object.keys(patch).length) await db.update(serviceCategories).set(patch).where(eq(serviceCategories.id, id));
  if (i18n && Object.keys(i18n).length) await upsertI18n(id, i18n);
}

export async function remove(id: string): Promise<void> {
  await db.delete(serviceCategoriesI18n).where(eq(serviceCategoriesI18n.category_id, id));
  await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
}

export async function countTemplatesForSlug(categorySlug: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(serviceTemplates)
    .where(eq(serviceTemplates.category_slug, categorySlug));
  return Number(row?.c ?? 0);
}
