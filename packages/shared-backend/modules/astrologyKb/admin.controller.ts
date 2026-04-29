// =============================================================
// FILE: modules/astrologyKb/admin.controller.ts
// FAZ 19 / T19-3 — Admin astrology_kb CRUD + bulk import
// =============================================================
import type { FastifyRequest } from "fastify";
import {
  IdParamSchema,
  KbBulkImportSchema,
  KbCreateSchema,
  KbListParamsSchema,
  KbTranslationDraftSchema,
  KbUpdateSchema,
} from "./validation";
import {
  approveKb,
  bulkImportKb,
  createKb,
  createTranslationDrafts,
  deleteKb,
  getKbById,
  listKb,
  rejectKb,
  updateKb,
} from "./repository";

function reviewerId(req: FastifyRequest): string | null {
  const user = (req as any).user;
  const id = user?.id ?? user?.sub;
  return id ? String(id) : null;
}

export async function listKbAdmin(req: FastifyRequest) {
  const q = KbListParamsSchema.parse(req.query);
  return await listKb(req.server, q);
}

export async function getKbAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const item = await getKbById(req.server, id);
  if (!item) {
    const err: any = new Error("kb_not_found");
    err.statusCode = 404;
    throw err;
  }
  return item;
}

export async function createKbAdmin(req: FastifyRequest) {
  const body = KbCreateSchema.parse((req as any).body);
  return await createKb(req.server, body, reviewerId(req));
}

export async function updateKbAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const body = KbUpdateSchema.parse((req as any).body);
  const updated = await updateKb(req.server, id, body, reviewerId(req));
  if (!updated) {
    const err: any = new Error("kb_not_found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

export async function deleteKbAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const ok = await deleteKb(req.server, id);
  return { ok };
}

export async function approveKbAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const item = await approveKb(req.server, id, reviewerId(req));
  if (!item) {
    const err: any = new Error("kb_not_found");
    err.statusCode = 404;
    throw err;
  }
  return item;
}

export async function rejectKbAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const item = await rejectKb(req.server, id, reviewerId(req));
  if (!item) {
    const err: any = new Error("kb_not_found");
    err.statusCode = 404;
    throw err;
  }
  return item;
}

export async function bulkImportKbAdmin(req: FastifyRequest) {
  const body = KbBulkImportSchema.parse((req as any).body);
  const result = await bulkImportKb(req.server, body, reviewerId(req));
  return { ok: true, ...result };
}

export async function createTranslationDraftsAdmin(req: FastifyRequest) {
  const body = KbTranslationDraftSchema.parse((req as any).body);
  const result = await createTranslationDrafts(req.server, body);
  return { ok: true, ...result };
}
