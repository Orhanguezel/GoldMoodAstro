// =============================================================
// FILE: src/modules/announcements/controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";

import { repoGetById, repoListPublic } from "./repository";
import { idParamSchema, publicListQuerySchema } from "./validation";
import type { AnnouncementRow } from "./schema";

function toPublic(row: AnnouncementRow) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    starts_at: row.starts_at ?? null,
    ends_at: row.ends_at ?? null,
    created_at: row.created_at,
  };
}

export async function listAnnouncements(req: FastifyRequest, reply: FastifyReply) {
  const q = publicListQuerySchema.parse(req.query);
  const rows = await repoListPublic(q);
  reply.header("x-total-count", String(rows.length));
  return reply.send(rows.map(toPublic));
}

export async function getAnnouncement(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(req.params);
  const row = await repoGetById(id);
  if (!row || row.is_active !== 1) return reply.code(404).send({ error: "not_found" });
  return reply.send(toPublic(row));
}
