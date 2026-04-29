// src/modules/customPages/controller.ts
// Public + Admin handlers for custom_pages
import type { FastifyRequest, FastifyReply } from "fastify";
import {
  ListQuerySchema,
  CreateSchema,
  UpdateSchema,
  ReorderSchema,
  IdParamSchema,
  SlugParamSchema,
} from "./validation";
import * as repo from "./repository";

function parseOrderArg(orderStr?: string, fallback: "asc" | "desc" = "asc"): "asc" | "desc" {
  if (!orderStr) return fallback;
  const dir = (orderStr.split(".")[1] || fallback).toLowerCase();
  return dir === "desc" ? "desc" : "asc";
}

function parseOrderField(orderStr?: string): "created_at" | "updated_at" | "display_order" | "order_num" | undefined {
  if (!orderStr) return undefined;
  const f = orderStr.split(".")[0];
  if (f === "created_at" || f === "updated_at" || f === "display_order" || f === "order_num") return f;
  return undefined;
}

// ---------- PUBLIC ------------------------------------------------------

export async function listPublic(req: FastifyRequest, reply: FastifyReply) {
  const q = ListQuerySchema.parse(req.query);
  const rows = await repo.listCustomPages({
    q: q.q,
    slug: q.slug,
    module_key: q.module_key,
    is_published: q.is_published ?? true,
    featured: q.featured,
    locale: q.locale,
    default_locale: q.default_locale,
    sort: q.sort ?? parseOrderField(q.order),
    orderDir: q.orderDir ?? parseOrderArg(q.order, "asc"),
    limit: q.limit,
    offset: q.offset,
  });
  reply.header("x-total-count", String(rows.length));
  return rows;
}

export async function getByIdPublic(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const { locale, default_locale } = (req.query as any) || {};
  const item = await repo.getCustomPageById(id, locale, default_locale);
  if (!item) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  if (item.is_published !== 1) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  return item;
}

export async function getBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = SlugParamSchema.parse(req.params);
  const { locale, default_locale } = (req.query as any) || {};
  const item = await repo.getCustomPageBySlug(slug, locale, default_locale);
  if (!item) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  if (item.is_published !== 1) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  return item;
}

// ---------- ADMIN -------------------------------------------------------

export async function listAdmin(req: FastifyRequest, reply: FastifyReply) {
  const q = ListQuerySchema.parse(req.query);
  const rows = await repo.listCustomPages({
    q: q.q,
    slug: q.slug,
    module_key: q.module_key,
    is_published: q.is_published,
    featured: q.featured,
    locale: q.locale,
    default_locale: q.default_locale,
    sort: q.sort ?? parseOrderField(q.order),
    orderDir: q.orderDir ?? parseOrderArg(q.order, "asc"),
    limit: q.limit,
    offset: q.offset,
  });
  reply.header("x-total-count", String(rows.length));
  return rows;
}

export async function getByIdAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const { locale, default_locale } = (req.query as any) || {};
  const item = await repo.getCustomPageById(id, locale, default_locale);
  if (!item) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  return item;
}

export async function getBySlugAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = SlugParamSchema.parse(req.params);
  const { locale, default_locale } = (req.query as any) || {};
  const item = await repo.getCustomPageBySlug(slug, locale, default_locale);
  if (!item) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  return item;
}

export async function create(req: FastifyRequest) {
  const body = CreateSchema.parse((req as any).body);
  return await repo.createCustomPage(body);
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = IdParamSchema.parse(req.params);
  const body = UpdateSchema.parse((req as any).body);
  const updated = await repo.updateCustomPage(id, body);
  if (!updated) return reply.code(404).send({ error: { message: "custom_page_not_found" } });
  return updated;
}

export async function remove(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  await repo.deleteCustomPage(id);
  return { ok: true };
}

export async function reorder(req: FastifyRequest) {
  const body = ReorderSchema.parse((req as any).body);
  await repo.reorderCustomPages(body.items);
  return { ok: true };
}
