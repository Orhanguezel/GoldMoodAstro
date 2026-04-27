// =============================================================
// FILE: src/modules/review/controller.ts (PUBLIC)
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ReviewListParamsSchema,
  ReviewCreateSchema,
  IdParamSchema,
  ConsultantReplySchema,
  // ReviewReactionSchema  // ❌ artık kullanmıyoruz
} from "./validation";

import {
  repoListReviewsPublic,
  repoGetReviewPublic,
  repoCreateReviewPublic,
  repoAddReactionPublic,
  repoConsultantReply,
} from "./repository";
import { DEFAULT_LOCALE, type Locale } from '../../core/i18n';

export async function listReviewsPublic(req: FastifyRequest) {
  const q = ReviewListParamsSchema.parse(req.query);

  const locale: Locale =
    (q.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoListReviewsPublic(
    req.server,
    q,
    locale,
    DEFAULT_LOCALE,
  );
}

export async function getReviewPublic(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);

  const locale: Locale =
    ((req as any).locale as Locale | undefined) ?? DEFAULT_LOCALE;

  return await repoGetReviewPublic(
    req.server,
    id,
    locale,
    DEFAULT_LOCALE,
  );
}

/** POST /reviews
 * - consultant hedefinde authentication zorunlu
 * - consultant için body.user_id sunucuda req.user.id ile override edilir
 * - consultant için booking doğrulaması repository'de yapılır
 */
export async function createReviewPublic(req: FastifyRequest, reply: FastifyReply) {
  const parsedBody = ReviewCreateSchema.parse((req as any).body);

  const locale: Locale =
    (parsedBody.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  const targetType = parsedBody.target_type || "consultant";
  const authUser = (req as any).user as { id?: string; sub?: string } | undefined;
  const authUserId = authUser?.id ?? authUser?.sub;

  if (targetType === "consultant" && !authUserId) {
    const err: any = new Error("unauthorized");
    err.statusCode = 401;
    throw err;
  }

  const body =
    targetType === "consultant"
      ? ({ ...parsedBody, user_id: authUserId } as typeof parsedBody)
      : parsedBody;

  const created = await repoCreateReviewPublic(
    req.server,
    body,
    locale,
    { enforceConsultantReviewGuard: targetType === "consultant" },
  );

  reply.code(201);
  return created;
}

/** Public reaction (like/helpful) */
export async function addReviewReactionPublic(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);

  // Şimdilik body'deki type'ı (like/dislike) kullanmıyoruz.

  const locale: Locale =
    ((req as any).locale as Locale | undefined) ?? DEFAULT_LOCALE;

  return await repoAddReactionPublic(
    req.server,
    id,
    locale,
    DEFAULT_LOCALE,
  );
}

/**
 * T17-2 — Astrolog kendi review'ına cevap.
 * Auth gerekli. review.target_id === current_user.consultant_id eşleşmesi
 * repository tarafında yapılır.
 */
export async function consultantReplyPublic(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const body = ConsultantReplySchema.parse((req as any).body);

  const user = (req as any).user as { id?: string; sub?: string } | undefined;
  const userId = user?.id ?? user?.sub;
  if (!userId) {
    const err: any = new Error("unauthorized");
    err.statusCode = 401;
    throw err;
  }

  const locale: Locale =
    (body.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoConsultantReply(req.server, id, userId, body.consultant_reply, locale);
}
