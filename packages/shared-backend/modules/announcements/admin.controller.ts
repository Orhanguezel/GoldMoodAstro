// =============================================================
// FILE: src/modules/announcements/admin.controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoListAdmin,
  repoSetActive,
  repoUpdate,
} from "./repository";
import {
  adminListQuerySchema,
  createSchema,
  idParamSchema,
  setStatusSchema,
  updateSchema,
} from "./validation";
import type { AnnouncementRow } from "./schema";

function toView(row: AnnouncementRow) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    is_active: row.is_active === 1,
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function adminListAnnouncements(req: FastifyRequest, reply: FastifyReply) {
  const q = adminListQuerySchema.parse(req.query);
  const rows = await repoListAdmin(q);
  return reply.send(rows.map(toView));
}

export async function adminGetAnnouncement(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(req.params);
  const row = await repoGetById(id);
  if (!row) return reply.code(404).send({ error: "not_found" });
  return reply.send(toView(row));
}

export async function adminCreateAnnouncement(req: FastifyRequest, reply: FastifyReply) {
  const body = createSchema.parse(req.body);
  const row = await repoCreate(body);
  return reply.code(201).send(toView(row));
}

export async function adminUpdateAnnouncement(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(req.params);
  const body = updateSchema.parse(req.body);
  const row = await repoUpdate(id, body);
  if (!row) return reply.code(404).send({ error: "not_found" });
  return reply.send(toView(row));
}

export async function adminDeleteAnnouncement(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(req.params);
  await repoDelete(id);
  return reply.code(204).send();
}

export async function adminSetPublished(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(req.params);
  const { is_active } = setStatusSchema.parse(req.body);
  const row = await repoSetActive(id, is_active);
  if (!row) return reply.code(404).send({ error: "not_found" });
  return reply.send(toView(row));
}
