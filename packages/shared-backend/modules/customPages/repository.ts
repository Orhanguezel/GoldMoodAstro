// src/modules/customPages/repository.ts
// Drizzle repo: i18n merging + JSON content packing
import { and, eq, sql, asc, desc, inArray, type SQL } from "drizzle-orm";
import { db } from "../../db/client";
import { customPages, customPagesI18n } from "./schema";

type WhereClause = SQL<unknown>;
const FALLBACK_LOCALE = "tr";

// ---------- helpers -----------------------------------------------------

function pickI18n<T extends { locale: string }>(
  rows: T[],
  locale: string,
  defaultLocale = FALLBACK_LOCALE,
): T | undefined {
  return rows.find((r) => r.locale === locale) || rows.find((r) => r.locale === defaultLocale) || rows[0];
}

function packContent(html: string): string {
  // Backend convention: store as JSON {"html":"..."}
  if (!html) return JSON.stringify({ html: "" });
  // Already JSON?
  const trimmed = html.trim();
  if (trimmed.startsWith("{") && trimmed.includes('"html"')) return html;
  return JSON.stringify({ html });
}

function toIsoString(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function arrayToJson(v: string[] | null | undefined): unknown {
  if (!v || v.length === 0) return null;
  return v;
}

// ---------- merged row shape (matches frontend ApiCustomPage) -----------

export type CustomPageMergedRow = {
  id: string;
  module_key: string;
  is_published: 0 | 1;
  featured: 0 | 1;
  featured_image: string | null;
  featured_image_asset_id: string | null;
  display_order: number;
  order_num: number;
  image_url: string | null;
  storage_asset_id: string | null;
  images: string[] | null;
  storage_image_ids: string[] | null;
  created_at: string;
  updated_at: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  summary: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string | null;
  locale_resolved: string | null;
};

function buildMerged(parent: typeof customPages.$inferSelect, i18n?: typeof customPagesI18n.$inferSelect): CustomPageMergedRow {
  return {
    id: parent.id,
    module_key: parent.module_key,
    is_published: parent.is_published as 0 | 1,
    featured: parent.featured as 0 | 1,
    featured_image: parent.featured_image ?? null,
    featured_image_asset_id: parent.featured_image_asset_id ?? null,
    display_order: parent.display_order,
    order_num: parent.order_num,
    image_url: parent.image_url ?? null,
    storage_asset_id: parent.storage_asset_id ?? null,
    images: (parent.images as string[] | null) ?? null,
    storage_image_ids: (parent.storage_image_ids as string[] | null) ?? null,
    created_at: toIsoString(parent.created_at),
    updated_at: toIsoString(parent.updated_at),
    title: i18n?.title ?? null,
    slug: i18n?.slug ?? null,
    content: i18n?.content ?? null,
    summary: i18n?.summary ?? null,
    featured_image_alt: i18n?.featured_image_alt ?? null,
    meta_title: i18n?.meta_title ?? null,
    meta_description: i18n?.meta_description ?? null,
    tags: i18n?.tags ?? null,
    locale_resolved: i18n?.locale ?? null,
  };
}

// ---------- LIST --------------------------------------------------------

export async function listCustomPages(opts: {
  q?: string;
  slug?: string;
  module_key?: string;
  is_published?: boolean;
  featured?: boolean;
  locale?: string;
  default_locale?: string;
  sort?: "created_at" | "updated_at" | "display_order" | "order_num";
  orderDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<CustomPageMergedRow[]> {
  const locale = opts.locale || FALLBACK_LOCALE;
  const defaultLocale = opts.default_locale || FALLBACK_LOCALE;

  const where: WhereClause[] = [];
  if (typeof opts.is_published === "boolean") where.push(eq(customPages.is_published, opts.is_published ? 1 : 0));
  if (typeof opts.featured === "boolean") where.push(eq(customPages.featured, opts.featured ? 1 : 0));
  if (opts.module_key) where.push(eq(customPages.module_key, opts.module_key));

  const sortCol =
    opts.sort === "created_at"
      ? customPages.created_at
      : opts.sort === "updated_at"
      ? customPages.updated_at
      : opts.sort === "order_num"
      ? customPages.order_num
      : customPages.display_order;
  const orderFn = opts.orderDir === "desc" ? desc : asc;

  const parents = await db
    .select()
    .from(customPages)
    .where(where.length ? and(...where) : undefined)
    .orderBy(orderFn(sortCol))
    .limit(opts.limit ?? 200)
    .offset(opts.offset ?? 0);

  if (parents.length === 0) return [];

  const ids = parents.map((p) => p.id);
  const i18nRows = await db
    .select()
    .from(customPagesI18n)
    .where(inArray(customPagesI18n.custom_page_id, ids));

  const i18nByPid = new Map<string, typeof i18nRows>();
  for (const row of i18nRows) {
    const arr = i18nByPid.get(row.custom_page_id) ?? [];
    arr.push(row);
    i18nByPid.set(row.custom_page_id, arr);
  }

  let result: CustomPageMergedRow[] = parents.map((p) => {
    const tr = pickI18n(i18nByPid.get(p.id) ?? [], locale, defaultLocale);
    return buildMerged(p, tr);
  });

  if (opts.slug) {
    result = result.filter((r) => r.slug === opts.slug);
  }
  if (opts.q) {
    const needle = opts.q.toLowerCase();
    result = result.filter(
      (r) =>
        (r.title ?? "").toLowerCase().includes(needle) ||
        (r.slug ?? "").toLowerCase().includes(needle),
    );
  }

  return result;
}

// ---------- BY ID -------------------------------------------------------

export async function getCustomPageById(
  id: string,
  locale = FALLBACK_LOCALE,
  defaultLocale = FALLBACK_LOCALE,
): Promise<CustomPageMergedRow | null> {
  const [parent] = await db.select().from(customPages).where(eq(customPages.id, id)).limit(1);
  if (!parent) return null;
  const i18nRows = await db.select().from(customPagesI18n).where(eq(customPagesI18n.custom_page_id, id));
  const tr = pickI18n(i18nRows, locale, defaultLocale);
  return buildMerged(parent, tr);
}

// ---------- BY SLUG -----------------------------------------------------

export async function getCustomPageBySlug(
  slug: string,
  locale = FALLBACK_LOCALE,
  defaultLocale = FALLBACK_LOCALE,
): Promise<CustomPageMergedRow | null> {
  // Find any i18n row matching the slug (could be any locale variant of the same page)
  const matches = await db
    .select()
    .from(customPagesI18n)
    .where(eq(customPagesI18n.slug, slug))
    .limit(5);

  if (matches.length === 0) return null;

  // Collect parent ids and pick the row whose locale matches our preference
  const pid = matches[0]!.custom_page_id;
  const [parent] = await db.select().from(customPages).where(eq(customPages.id, pid)).limit(1);
  if (!parent) return null;

  const allI18n = await db
    .select()
    .from(customPagesI18n)
    .where(eq(customPagesI18n.custom_page_id, pid));

  const tr = pickI18n(allI18n, locale, defaultLocale);
  return buildMerged(parent, tr);
}

// ---------- CREATE ------------------------------------------------------

export async function createCustomPage(input: {
  locale?: string;
  title: string;
  slug: string;
  content: string;
  summary?: string | null;
  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string | null;
  module_key?: string;
  is_published?: boolean;
  featured?: boolean;
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  display_order?: number;
  order_num?: number;
  image_url?: string | null;
  storage_asset_id?: string | null;
  images?: string[] | null;
  storage_image_ids?: string[] | null;
}): Promise<CustomPageMergedRow> {
  const id = crypto.randomUUID();
  const i18nId = crypto.randomUUID();
  const locale = input.locale || FALLBACK_LOCALE;

  await db.insert(customPages).values({
    id,
    module_key: input.module_key ?? "page",
    is_published: input.is_published === false ? 0 : 1,
    featured: input.featured ? 1 : 0,
    featured_image: input.featured_image ?? null,
    featured_image_asset_id: input.featured_image_asset_id ?? null,
    display_order: input.display_order ?? 0,
    order_num: input.order_num ?? input.display_order ?? 0,
    image_url: input.image_url ?? null,
    storage_asset_id: input.storage_asset_id ?? null,
    images: arrayToJson(input.images),
    storage_image_ids: arrayToJson(input.storage_image_ids),
  });

  await db.insert(customPagesI18n).values({
    id: i18nId,
    custom_page_id: id,
    locale,
    title: input.title,
    slug: input.slug,
    content: packContent(input.content),
    summary: input.summary ?? null,
    featured_image_alt: input.featured_image_alt ?? null,
    meta_title: input.meta_title ?? null,
    meta_description: input.meta_description ?? null,
    tags: input.tags ?? null,
  });

  return (await getCustomPageById(id, locale))!;
}

// ---------- UPDATE ------------------------------------------------------

export async function updateCustomPage(
  id: string,
  patch: Partial<{
    locale: string;
    title: string;
    slug: string;
    content: string;
    summary: string | null;
    featured_image_alt: string | null;
    meta_title: string | null;
    meta_description: string | null;
    tags: string | null;
    module_key: string;
    is_published: boolean;
    featured: boolean;
    featured_image: string | null;
    featured_image_asset_id: string | null;
    display_order: number;
    order_num: number;
    image_url: string | null;
    storage_asset_id: string | null;
    images: string[] | null;
    storage_image_ids: string[] | null;
  }>,
): Promise<CustomPageMergedRow | null> {
  const parentUpdates: any = {};
  if (patch.module_key !== undefined) parentUpdates.module_key = patch.module_key;
  if (patch.is_published !== undefined) parentUpdates.is_published = patch.is_published ? 1 : 0;
  if (patch.featured !== undefined) parentUpdates.featured = patch.featured ? 1 : 0;
  if (patch.featured_image !== undefined) parentUpdates.featured_image = patch.featured_image;
  if (patch.featured_image_asset_id !== undefined)
    parentUpdates.featured_image_asset_id = patch.featured_image_asset_id;
  if (patch.display_order !== undefined) parentUpdates.display_order = patch.display_order;
  if (patch.order_num !== undefined) parentUpdates.order_num = patch.order_num;
  if (patch.image_url !== undefined) parentUpdates.image_url = patch.image_url;
  if (patch.storage_asset_id !== undefined) parentUpdates.storage_asset_id = patch.storage_asset_id;
  if (patch.images !== undefined) parentUpdates.images = arrayToJson(patch.images);
  if (patch.storage_image_ids !== undefined)
    parentUpdates.storage_image_ids = arrayToJson(patch.storage_image_ids);

  if (Object.keys(parentUpdates).length > 0) {
    await db.update(customPages).set(parentUpdates).where(eq(customPages.id, id));
  }

  const i18nFieldsTouched =
    patch.title !== undefined ||
    patch.slug !== undefined ||
    patch.content !== undefined ||
    patch.summary !== undefined ||
    patch.featured_image_alt !== undefined ||
    patch.meta_title !== undefined ||
    patch.meta_description !== undefined ||
    patch.tags !== undefined;

  if (i18nFieldsTouched) {
    const locale = patch.locale || FALLBACK_LOCALE;
    const [existing] = await db
      .select()
      .from(customPagesI18n)
      .where(and(eq(customPagesI18n.custom_page_id, id), eq(customPagesI18n.locale, locale)))
      .limit(1);

    if (existing) {
      const i18nUpdates: any = {};
      if (patch.title !== undefined) i18nUpdates.title = patch.title;
      if (patch.slug !== undefined) i18nUpdates.slug = patch.slug;
      if (patch.content !== undefined) i18nUpdates.content = packContent(patch.content);
      if (patch.summary !== undefined) i18nUpdates.summary = patch.summary;
      if (patch.featured_image_alt !== undefined)
        i18nUpdates.featured_image_alt = patch.featured_image_alt;
      if (patch.meta_title !== undefined) i18nUpdates.meta_title = patch.meta_title;
      if (patch.meta_description !== undefined) i18nUpdates.meta_description = patch.meta_description;
      if (patch.tags !== undefined) i18nUpdates.tags = patch.tags;
      if (Object.keys(i18nUpdates).length > 0) {
        await db.update(customPagesI18n).set(i18nUpdates).where(eq(customPagesI18n.id, existing.id));
      }
    } else if (patch.title && patch.slug) {
      // create new i18n row for this locale
      await db.insert(customPagesI18n).values({
        id: crypto.randomUUID(),
        custom_page_id: id,
        locale,
        title: patch.title,
        slug: patch.slug,
        content: packContent(patch.content ?? ""),
        summary: patch.summary ?? null,
        featured_image_alt: patch.featured_image_alt ?? null,
        meta_title: patch.meta_title ?? null,
        meta_description: patch.meta_description ?? null,
        tags: patch.tags ?? null,
      });
    }
  }

  return await getCustomPageById(id, patch.locale);
}

// ---------- DELETE ------------------------------------------------------

export async function deleteCustomPage(id: string): Promise<boolean> {
  await db.delete(customPages).where(eq(customPages.id, id));
  return true;
}

// ---------- REORDER -----------------------------------------------------

export async function reorderCustomPages(items: Array<{ id: string; display_order: number }>): Promise<void> {
  for (const it of items) {
    await db.update(customPages).set({ display_order: it.display_order }).where(eq(customPages.id, it.id));
  }
}
