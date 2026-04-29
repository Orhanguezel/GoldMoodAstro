// src/modules/navigation/controller.ts
// Public + Admin handlers for menu_items and footer_sections
import type { FastifyRequest, FastifyReply } from "fastify";
import {
  PublicMenuListQuerySchema,
  AdminMenuListQuerySchema,
  MenuItemCreateSchema,
  MenuItemUpdateSchema,
  MenuItemReorderSchema,
  FooterListQuerySchema,
  FooterCreateSchema,
  FooterUpdateSchema,
  IdParamSchema,
  SlugParamSchema,
} from "./validation";
import * as repo from "./repository";

// ---------- MENU ITEMS - PUBLIC -----------------------------------------

export async function listMenuItemsPublic(req: FastifyRequest, reply: FastifyReply) {
  const q = PublicMenuListQuerySchema.parse(req.query);
  const rows = await repo.listMenuItems({
    location: q.location,
    parent_id: q.parent_id,
    section_id: q.section_id,
    is_active: q.is_active ?? true,
    locale: q.locale,
    nested: q.nested,
    limit: q.limit,
    offset: q.offset,
  });
  if (rows.length > 0) {
    reply.header("x-total-count", String(rows.length));
  }
  return rows;
}

export async function getMenuItemPublic(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const { locale } = (req.query as any) || {};
  const item = await repo.getMenuItem(id, locale);
  if (!item) return reply.code(404).send({ error: { message: "menu_item_not_found" } });
  return item;
}

// ---------- MENU ITEMS - ADMIN ------------------------------------------

export async function listMenuItemsAdmin(req: FastifyRequest, reply: FastifyReply) {
  const q = AdminMenuListQuerySchema.parse(req.query);
  const rows = await repo.listMenuItemsAdmin({
    q: q.q,
    location: q.location,
    section_id: q.section_id,
    parent_id: q.parent_id,
    is_active: q.is_active,
    sort: q.sort,
    order: q.order,
    locale: q.locale,
    nested: q.nested,
    limit: q.limit,
    offset: q.offset,
  });
  reply.header("x-total-count", String(rows.length));
  return rows;
}

export async function getMenuItemAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const { locale } = (req.query as any) || {};
  const item = await repo.getMenuItemAdmin(id, locale);
  if (!item) return reply.code(404).send({ error: { message: "menu_item_not_found" } });
  return item;
}

export async function createMenuItem(req: FastifyRequest) {
  const body = MenuItemCreateSchema.parse((req as any).body);
  return await repo.createMenuItem(body);
}

export async function updateMenuItem(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = MenuItemUpdateSchema.parse((req as any).body);
  const updated = await repo.updateMenuItem(id, body);
  if (!updated) return reply.code(404).send({ error: { message: "menu_item_not_found" } });
  return updated;
}

export async function deleteMenuItem(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  await repo.deleteMenuItem(id);
  return { ok: true };
}

export async function reorderMenuItems(req: FastifyRequest) {
  const body = MenuItemReorderSchema.parse((req as any).body);
  await repo.reorderMenuItems(body.items);
  return { ok: true };
}

// ---------- FOOTER SECTIONS - PUBLIC ------------------------------------

function parseOrderArg(orderStr?: string, fallback: "asc" | "desc" = "asc"): "asc" | "desc" {
  if (!orderStr) return fallback;
  const parts = orderStr.split(".");
  const dir = (parts[1] || fallback).toLowerCase();
  return dir === "desc" ? "desc" : "asc";
}

export async function listFooterSectionsPublic(req: FastifyRequest, reply: FastifyReply) {
  const q = FooterListQuerySchema.parse(req.query);
  const rows = await repo.listFooterSections({
    q: q.q,
    slug: q.slug,
    is_active: q.is_active ?? true,
    locale: q.locale,
    limit: q.limit,
    offset: q.offset,
    orderDir: q.orderDir ?? parseOrderArg(q.order, "asc"),
  });
  reply.header("x-total-count", String(rows.length));
  return rows;
}

export async function getFooterSectionPublic(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const { locale } = (req.query as any) || {};
  const item = await repo.getFooterSection(id, locale);
  if (!item) return reply.code(404).send({ error: { message: "footer_section_not_found" } });
  return item;
}

export async function getFooterSectionBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = SlugParamSchema.parse(req.params);
  const { locale } = (req.query as any) || {};
  const item = await repo.getFooterSectionBySlug(slug, locale);
  if (!item) return reply.code(404).send({ error: { message: "footer_section_not_found" } });
  return item;
}

// ---------- FOOTER SECTIONS - ADMIN -------------------------------------

export async function listFooterSectionsAdmin(req: FastifyRequest, reply: FastifyReply) {
  const q = FooterListQuerySchema.parse(req.query);
  const rows = await repo.listFooterSections({
    q: q.q,
    slug: q.slug,
    is_active: q.is_active,
    locale: q.locale,
    limit: q.limit,
    offset: q.offset,
    orderDir: q.orderDir ?? parseOrderArg(q.order, "asc"),
  });
  reply.header("x-total-count", String(rows.length));
  return rows;
}

export async function createFooterSection(req: FastifyRequest) {
  const body = FooterCreateSchema.parse((req as any).body);
  return await repo.createFooterSection(body);
}

export async function updateFooterSection(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = FooterUpdateSchema.parse((req as any).body);
  const updated = await repo.updateFooterSection(id, body);
  if (!updated) return reply.code(404).send({ error: { message: "footer_section_not_found" } });
  return updated;
}

export async function deleteFooterSection(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  await repo.deleteFooterSection(id);
  return { ok: true };
}
