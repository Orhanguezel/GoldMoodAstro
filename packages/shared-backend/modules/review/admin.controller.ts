// =============================================================
// FILE: src/modules/review/admin.controller.ts (ADMIN)
// =============================================================
import type { FastifyRequest } from "fastify";

// Zod şemaları (runtime değerler)
import {
  ReviewListParamsSchema,
  ReviewCreateSchema,
  ReviewUpdateSchema,
  ReviewBulkModerationSchema,
  IdParamSchema,
} from "./validation";

// Tipler gerekiyorsa ayrıca import type ile alabilirsin
// import type { ReviewCreateInput, ReviewUpdateInput } from "./validation";

import {
  repoListReviewsAdmin,
  repoGetReviewAdmin,
  repoCreateReviewAdmin,
  repoUpdateReviewAdmin,
  repoDeleteReviewAdmin,
  repoBulkModerateReviewsAdmin,
} from "./repository";
import { DEFAULT_LOCALE, type Locale } from '../../core/i18n';

export async function listReviewsAdmin(req: FastifyRequest) {
  const q = ReviewListParamsSchema.parse(req.query);

  const locale: Locale =
    (q.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoListReviewsAdmin(
    req.server,
    q,
    locale,
    DEFAULT_LOCALE,
  );
}

export async function getReviewAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);

  const locale: Locale =
    ((req as any).locale as Locale | undefined) ?? DEFAULT_LOCALE;

  return await repoGetReviewAdmin(
    req.server,
    id,
    locale,
    DEFAULT_LOCALE,
  );
}

export async function createReviewAdmin(req: FastifyRequest) {
  const body = ReviewCreateSchema.parse((req as any).body);

  const locale: Locale =
    (body.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoCreateReviewAdmin(req.server, body, locale);
}

export async function updateReviewAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const body = ReviewUpdateSchema.parse((req as any).body);

  const locale: Locale =
    (body.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoUpdateReviewAdmin(
    req.server,
    id,
    body,
    locale,
    DEFAULT_LOCALE,
  );
}

export async function removeReviewAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const ok = await repoDeleteReviewAdmin(req.server, id);
  return { ok };
}

// T17-7 — Toplu moderasyon
export async function bulkModerateReviewsAdmin(req: FastifyRequest) {
  const body = ReviewBulkModerationSchema.parse((req as any).body);
  const result = await repoBulkModerateReviewsAdmin(req.server, body.ids, body.approved);
  return { ok: true, ...result };
}
