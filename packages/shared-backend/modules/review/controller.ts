// =============================================================
// FILE: src/modules/review/controller.ts (PUBLIC)
// =============================================================
import type { FastifyRequest } from "fastify";
import {
  ReviewListParamsSchema,
  ReviewCreateSchema,
  IdParamSchema,
  // ReviewReactionSchema  // ❌ artık kullanmıyoruz
} from "./validation";

import {
  repoListReviewsPublic,
  repoGetReviewPublic,
  repoCreateReviewPublic,
  repoAddReactionPublic,
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

/** Public form submit */
export async function createReviewPublic(req: FastifyRequest) {
  const body = ReviewCreateSchema.parse((req as any).body);

  const locale: Locale =
    (body.locale as Locale) ??
    ((req as any).locale as Locale | undefined) ??
    DEFAULT_LOCALE;

  return await repoCreateReviewPublic(req.server, body, locale);
}

/** Public reaction (like/helpful) */
export async function addReviewReactionPublic(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);

  // Şimdilik body'deki type'ı (like/dislike) kullanmıyoruz.
  // Eğer ileride ihtiyacın olursa burada ReviewReactionSchema.parse ile
  // parse edip repoAddReactionPublic'e type geçirirsin.

  const locale: Locale =
    ((req as any).locale as Locale | undefined) ?? DEFAULT_LOCALE;

  return await repoAddReactionPublic(
    req.server,
    id,
    locale,
    DEFAULT_LOCALE,
  );
}
