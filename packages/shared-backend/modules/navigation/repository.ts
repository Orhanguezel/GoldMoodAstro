// src/modules/navigation/repository.ts
// Drizzle queries — menu_items + footer_sections (with i18n)
import { and, eq, sql, asc, desc, inArray, type SQL } from "drizzle-orm";
import { db } from "../../db/client";
import { menuItems, menuItemsI18n, footerSections, footerSectionsI18n } from "./schema";

type WhereClause = SQL<unknown>;

const FALLBACK_LOCALE = "tr";

// ---------- helpers -----------------------------------------------------

function pickTranslated<T extends { locale: string }>(rows: T[], locale: string): T | undefined {
  return rows.find((r) => r.locale === locale) || rows.find((r) => r.locale === FALLBACK_LOCALE) || rows[0];
}

// ---------- MENU ITEMS - PUBLIC -----------------------------------------

export type MenuItemPublicRow = {
  id: string;
  title: string;
  url: string;
  href: string;
  slug: string | null;
  section_id: string | null;
  parent_id: string | null;
  icon: string | null;
  is_active: boolean;
  position: number;
  order_num: number;
  display_order: number;
  locale: string | null;
  created_at: string;
  updated_at: string;
  children?: MenuItemPublicRow[];
};

export async function listMenuItems(opts: {
  location?: "header" | "footer";
  parent_id?: string | null;
  section_id?: string | null;
  is_active?: boolean;
  locale?: string;
  nested?: boolean;
  limit?: number;
  offset?: number;
}): Promise<MenuItemPublicRow[]> {
  const locale = opts.locale || FALLBACK_LOCALE;

  const where: WhereClause[] = [];
  if (opts.location) where.push(eq(menuItems.location, opts.location));
  if (typeof opts.is_active === "boolean") where.push(eq(menuItems.is_active, opts.is_active ? 1 : 0));
  if (opts.parent_id === null) where.push(sql`${menuItems.parent_id} IS NULL`);
  else if (typeof opts.parent_id === "string") where.push(eq(menuItems.parent_id, opts.parent_id));
  if (opts.section_id === null) where.push(sql`${menuItems.section_id} IS NULL`);
  else if (typeof opts.section_id === "string") where.push(eq(menuItems.section_id, opts.section_id));

  // For "nested" we want all matching rows (parents + their children) in one query, then build tree.
  // For non-nested + no parent_id specified on header, return only top-level (parent IS NULL).
  if (opts.nested && !opts.location) {
    // safety: nested without location is fine, returns flat tree of all
  } else if (opts.nested && opts.location === "header" && opts.parent_id === undefined) {
    // include both parents & children — drop parent_id filter
  } else if (!opts.nested && opts.location === "header" && opts.parent_id === undefined) {
    where.push(sql`${menuItems.parent_id} IS NULL`);
  }

  const rows = await db
    .select()
    .from(menuItems)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(menuItems.display_order))
    .limit(opts.limit ?? 500)
    .offset(opts.offset ?? 0);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const i18nRows = await db
    .select()
    .from(menuItemsI18n)
    .where(inArray(menuItemsI18n.menu_item_id, ids));

  const i18nByItem = new Map<string, typeof i18nRows>();
  for (const r of i18nRows) {
    const arr = i18nByItem.get(r.menu_item_id) ?? [];
    arr.push(r);
    i18nByItem.set(r.menu_item_id, arr);
  }

  const enriched: MenuItemPublicRow[] = rows.map((r) => {
    const tr = pickTranslated(i18nByItem.get(r.id) ?? [], locale);
    const url = r.url ?? "";
    return {
      id: r.id,
      title: tr?.title ?? "",
      url,
      href: url,
      slug: null,
      section_id: r.section_id ?? null,
      parent_id: r.parent_id ?? null,
      icon: r.icon ?? null,
      is_active: r.is_active === 1,
      position: r.display_order,
      order_num: r.display_order,
      display_order: r.display_order,
      locale: tr?.locale ?? null,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    };
  });

  if (!opts.nested) return enriched;

  // Build tree (only for header — footer items have section_id, not parent_id nesting)
  const byId = new Map<string, MenuItemPublicRow>();
  for (const item of enriched) {
    item.children = [];
    byId.set(item.id, item);
  }
  const roots: MenuItemPublicRow[] = [];
  for (const item of enriched) {
    if (item.parent_id && byId.has(item.parent_id)) {
      byId.get(item.parent_id)!.children!.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

export async function getMenuItem(id: string, locale = FALLBACK_LOCALE): Promise<MenuItemPublicRow | null> {
  const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!row) return null;
  const i18nRows = await db
    .select()
    .from(menuItemsI18n)
    .where(eq(menuItemsI18n.menu_item_id, id));
  const tr = pickTranslated(i18nRows, locale);
  const url = row.url ?? "";
  return {
    id: row.id,
    title: tr?.title ?? "",
    url,
    href: url,
    slug: null,
    section_id: row.section_id ?? null,
    parent_id: row.parent_id ?? null,
    icon: row.icon ?? null,
    is_active: row.is_active === 1,
    position: row.display_order,
    order_num: row.display_order,
    display_order: row.display_order,
    locale: tr?.locale ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

// ---------- MENU ITEMS - ADMIN ------------------------------------------

export type MenuItemAdminRow = MenuItemPublicRow & {
  type: "page" | "custom";
  page_id: string | null;
  location: "header" | "footer";
};

export async function listMenuItemsAdmin(opts: {
  q?: string;
  location?: "header" | "footer";
  section_id?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
  sort?: "display_order" | "created_at" | "title";
  order?: "asc" | "desc";
  locale?: string;
  nested?: boolean;
  limit?: number;
  offset?: number;
}): Promise<MenuItemAdminRow[]> {
  const locale = opts.locale || FALLBACK_LOCALE;
  const where: WhereClause[] = [];
  if (opts.location) where.push(eq(menuItems.location, opts.location));
  if (typeof opts.is_active === "boolean") where.push(eq(menuItems.is_active, opts.is_active ? 1 : 0));
  if (opts.parent_id === null) where.push(sql`${menuItems.parent_id} IS NULL`);
  else if (typeof opts.parent_id === "string") where.push(eq(menuItems.parent_id, opts.parent_id));
  if (opts.section_id === null) where.push(sql`${menuItems.section_id} IS NULL`);
  else if (typeof opts.section_id === "string") where.push(eq(menuItems.section_id, opts.section_id));

  const rows = await db
    .select()
    .from(menuItems)
    .where(where.length ? and(...where) : undefined)
    .orderBy(opts.order === "desc" ? desc(menuItems.display_order) : asc(menuItems.display_order))
    .limit(opts.limit ?? 500)
    .offset(opts.offset ?? 0);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const i18nRows = await db.select().from(menuItemsI18n).where(inArray(menuItemsI18n.menu_item_id, ids));
  const i18nByItem = new Map<string, typeof i18nRows>();
  for (const r of i18nRows) {
    const arr = i18nByItem.get(r.menu_item_id) ?? [];
    arr.push(r);
    i18nByItem.set(r.menu_item_id, arr);
  }

  let result: MenuItemAdminRow[] = rows.map((r) => {
    const tr = pickTranslated(i18nByItem.get(r.id) ?? [], locale);
    const url = r.url ?? "";
    let title = tr?.title ?? "";
    if (opts.q) {
      // simple in-memory filter on translated title (kept after sort/limit for compat)
    }
    return {
      id: r.id,
      title,
      url,
      href: url,
      slug: null,
      type: r.type,
      page_id: r.page_id ?? null,
      location: r.location,
      section_id: r.section_id ?? null,
      parent_id: r.parent_id ?? null,
      icon: r.icon ?? null,
      is_active: r.is_active === 1,
      position: r.display_order,
      order_num: r.display_order,
      display_order: r.display_order,
      locale: tr?.locale ?? null,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    };
  });

  if (opts.q) {
    const needle = opts.q.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(needle) || (r.url ?? "").toLowerCase().includes(needle));
  }

  if (opts.nested) {
    const byId = new Map<string, MenuItemAdminRow>();
    for (const item of result) {
      (item as any).children = [];
      byId.set(item.id, item);
    }
    const roots: MenuItemAdminRow[] = [];
    for (const item of result) {
      if (item.parent_id && byId.has(item.parent_id)) {
        (byId.get(item.parent_id)! as any).children.push(item);
      } else {
        roots.push(item);
      }
    }
    return roots;
  }
  return result;
}

export async function createMenuItem(input: {
  title: string;
  url?: string | null;
  type?: "page" | "custom";
  page_id?: string | null;
  parent_id?: string | null;
  location: "header" | "footer";
  icon?: string | null;
  section_id?: string | null;
  is_active?: boolean;
  display_order?: number;
  locale?: string;
}): Promise<MenuItemAdminRow> {
  const id = crypto.randomUUID();
  const i18nId = crypto.randomUUID();
  const locale = input.locale || FALLBACK_LOCALE;

  await db.insert(menuItems).values({
    id,
    location: input.location,
    section_id: input.section_id ?? null,
    parent_id: input.parent_id ?? null,
    type: input.type ?? "custom",
    page_id: input.page_id ?? null,
    url: input.url ?? null,
    icon: input.icon ?? null,
    is_active: input.is_active === false ? 0 : 1,
    display_order: input.display_order ?? 0,
  });

  await db.insert(menuItemsI18n).values({
    id: i18nId,
    menu_item_id: id,
    locale,
    title: input.title,
  });

  const created = await getMenuItemAdmin(id, locale);
  return created!;
}

export async function getMenuItemAdmin(id: string, locale = FALLBACK_LOCALE): Promise<MenuItemAdminRow | null> {
  const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  if (!row) return null;
  const i18nRows = await db.select().from(menuItemsI18n).where(eq(menuItemsI18n.menu_item_id, id));
  const tr = pickTranslated(i18nRows, locale);
  const url = row.url ?? "";
  return {
    id: row.id,
    title: tr?.title ?? "",
    url,
    href: url,
    slug: null,
    type: row.type,
    page_id: row.page_id ?? null,
    location: row.location,
    section_id: row.section_id ?? null,
    parent_id: row.parent_id ?? null,
    icon: row.icon ?? null,
    is_active: row.is_active === 1,
    position: row.display_order,
    order_num: row.display_order,
    display_order: row.display_order,
    locale: tr?.locale ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function updateMenuItem(
  id: string,
  patch: Partial<{
    title: string;
    url: string | null;
    type: "page" | "custom";
    page_id: string | null;
    parent_id: string | null;
    location: "header" | "footer";
    icon: string | null;
    section_id: string | null;
    is_active: boolean;
    display_order: number;
    locale: string;
  }>,
): Promise<MenuItemAdminRow | null> {
  const updates: any = {};
  if (patch.url !== undefined) updates.url = patch.url;
  if (patch.type !== undefined) updates.type = patch.type;
  if (patch.page_id !== undefined) updates.page_id = patch.page_id;
  if (patch.parent_id !== undefined) updates.parent_id = patch.parent_id;
  if (patch.location !== undefined) updates.location = patch.location;
  if (patch.icon !== undefined) updates.icon = patch.icon;
  if (patch.section_id !== undefined) updates.section_id = patch.section_id;
  if (patch.is_active !== undefined) updates.is_active = patch.is_active ? 1 : 0;
  if (patch.display_order !== undefined) updates.display_order = patch.display_order;

  if (Object.keys(updates).length > 0) {
    await db.update(menuItems).set(updates).where(eq(menuItems.id, id));
  }

  if (typeof patch.title === "string") {
    const locale = patch.locale || FALLBACK_LOCALE;
    const [existingI18n] = await db
      .select()
      .from(menuItemsI18n)
      .where(and(eq(menuItemsI18n.menu_item_id, id), eq(menuItemsI18n.locale, locale)))
      .limit(1);
    if (existingI18n) {
      await db.update(menuItemsI18n).set({ title: patch.title }).where(eq(menuItemsI18n.id, existingI18n.id));
    } else {
      await db.insert(menuItemsI18n).values({
        id: crypto.randomUUID(),
        menu_item_id: id,
        locale,
        title: patch.title,
      });
    }
  }

  return await getMenuItemAdmin(id, patch.locale);
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const result = await db.delete(menuItems).where(eq(menuItems.id, id));
  return Array.isArray(result) ? true : true;
}

export async function reorderMenuItems(items: Array<{ id: string; display_order: number }>): Promise<void> {
  for (const it of items) {
    await db.update(menuItems).set({ display_order: it.display_order }).where(eq(menuItems.id, it.id));
  }
}

// ---------- FOOTER SECTIONS ---------------------------------------------

export type FooterSectionRow = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  is_active: 0 | 1;
  display_order: number;
  locale_resolved: string | null;
  created_at: string;
  updated_at: string;
};

export async function listFooterSections(opts: {
  q?: string;
  slug?: string;
  is_active?: boolean;
  locale?: string;
  limit?: number;
  offset?: number;
  orderDir?: "asc" | "desc";
}): Promise<FooterSectionRow[]> {
  const locale = opts.locale || FALLBACK_LOCALE;
  const where: WhereClause[] = [];
  if (typeof opts.is_active === "boolean") where.push(eq(footerSections.is_active, opts.is_active ? 1 : 0));
  if (opts.slug) where.push(eq(footerSections.slug, opts.slug));

  const rows = await db
    .select()
    .from(footerSections)
    .where(where.length ? and(...where) : undefined)
    .orderBy(opts.orderDir === "desc" ? desc(footerSections.display_order) : asc(footerSections.display_order))
    .limit(opts.limit ?? 500)
    .offset(opts.offset ?? 0);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const i18nRows = await db
    .select()
    .from(footerSectionsI18n)
    .where(inArray(footerSectionsI18n.footer_section_id, ids));

  const i18nByItem = new Map<string, typeof i18nRows>();
  for (const r of i18nRows) {
    const arr = i18nByItem.get(r.footer_section_id) ?? [];
    arr.push(r);
    i18nByItem.set(r.footer_section_id, arr);
  }

  let result: FooterSectionRow[] = rows.map((r) => {
    const tr = pickTranslated(i18nByItem.get(r.id) ?? [], locale);
    return {
      id: r.id,
      slug: r.slug,
      title: tr?.title ?? null,
      description: tr?.description ?? null,
      is_active: r.is_active as 0 | 1,
      display_order: r.display_order,
      locale_resolved: tr?.locale ?? null,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    };
  });

  if (opts.q) {
    const needle = opts.q.toLowerCase();
    result = result.filter((r) => (r.title ?? "").toLowerCase().includes(needle) || r.slug.toLowerCase().includes(needle));
  }

  return result;
}

export async function getFooterSection(id: string, locale = FALLBACK_LOCALE): Promise<FooterSectionRow | null> {
  const [row] = await db.select().from(footerSections).where(eq(footerSections.id, id)).limit(1);
  if (!row) return null;
  const i18nRows = await db
    .select()
    .from(footerSectionsI18n)
    .where(eq(footerSectionsI18n.footer_section_id, id));
  const tr = pickTranslated(i18nRows, locale);
  return {
    id: row.id,
    slug: row.slug,
    title: tr?.title ?? null,
    description: tr?.description ?? null,
    is_active: row.is_active as 0 | 1,
    display_order: row.display_order,
    locale_resolved: tr?.locale ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function getFooterSectionBySlug(slug: string, locale = FALLBACK_LOCALE): Promise<FooterSectionRow | null> {
  const [row] = await db.select().from(footerSections).where(eq(footerSections.slug, slug)).limit(1);
  if (!row) return null;
  return getFooterSection(row.id, locale);
}

export async function createFooterSection(input: {
  title: string;
  slug: string;
  description?: string | null;
  locale?: string;
  is_active?: boolean;
  display_order?: number;
}): Promise<FooterSectionRow> {
  const id = crypto.randomUUID();
  const locale = input.locale || FALLBACK_LOCALE;

  await db.insert(footerSections).values({
    id,
    slug: input.slug,
    is_active: input.is_active === false ? 0 : 1,
    display_order: input.display_order ?? 0,
  });

  await db.insert(footerSectionsI18n).values({
    id: crypto.randomUUID(),
    footer_section_id: id,
    locale,
    title: input.title,
    description: input.description ?? null,
  });

  return (await getFooterSection(id, locale))!;
}

export async function updateFooterSection(
  id: string,
  patch: Partial<{
    title: string;
    slug: string;
    description: string | null;
    locale: string;
    is_active: boolean;
    display_order: number;
  }>,
): Promise<FooterSectionRow | null> {
  const updates: any = {};
  if (patch.slug !== undefined) updates.slug = patch.slug;
  if (patch.is_active !== undefined) updates.is_active = patch.is_active ? 1 : 0;
  if (patch.display_order !== undefined) updates.display_order = patch.display_order;

  if (Object.keys(updates).length > 0) {
    await db.update(footerSections).set(updates).where(eq(footerSections.id, id));
  }

  if (typeof patch.title === "string" || patch.description !== undefined) {
    const locale = patch.locale || FALLBACK_LOCALE;
    const [existing] = await db
      .select()
      .from(footerSectionsI18n)
      .where(and(eq(footerSectionsI18n.footer_section_id, id), eq(footerSectionsI18n.locale, locale)))
      .limit(1);
    if (existing) {
      const i18nUpdate: any = {};
      if (typeof patch.title === "string") i18nUpdate.title = patch.title;
      if (patch.description !== undefined) i18nUpdate.description = patch.description;
      if (Object.keys(i18nUpdate).length > 0) {
        await db.update(footerSectionsI18n).set(i18nUpdate).where(eq(footerSectionsI18n.id, existing.id));
      }
    } else if (typeof patch.title === "string") {
      await db.insert(footerSectionsI18n).values({
        id: crypto.randomUUID(),
        footer_section_id: id,
        locale,
        title: patch.title,
        description: patch.description ?? null,
      });
    }
  }

  return await getFooterSection(id, patch.locale);
}

export async function deleteFooterSection(id: string): Promise<boolean> {
  await db.delete(footerSections).where(eq(footerSections.id, id));
  return true;
}
