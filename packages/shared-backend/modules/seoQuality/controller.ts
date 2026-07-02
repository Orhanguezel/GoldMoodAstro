import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  detailParamsSchema,
  detailQuerySchema,
  gscInspectSchema,
  listSeoQualityQuerySchema,
  recalculateSeoSchema,
  updateSeoIndexSchema,
} from './validation';
import { getGscSummary, getScore, inspectGscUrls, listScores, recalculateScores, setSeoIndex } from './repository';

export async function listSeoQualityAdmin(req: FastifyRequest, reply: FastifyReply) {
  const q = listSeoQualityQuerySchema.parse(req.query);
  const data = await listScores(q);
  return reply.send({ data });
}

export async function getSeoQualityDetailAdmin(req: FastifyRequest, reply: FastifyReply) {
  const params = detailParamsSchema.parse(req.params);
  const query = detailQuerySchema.parse(req.query);
  let row = await getScore(params.type, params.id, query.locale);
  if (!row) {
    await recalculateScores({ type: params.type, id: params.id, locale: query.locale });
    row = await getScore(params.type, params.id, query.locale);
  }
  if (!row) return reply.code(404).send({ error: { message: 'seo_quality_not_found' } });
  return reply.send({ data: row });
}

export async function recalculateSeoAdmin(req: FastifyRequest, reply: FastifyReply) {
  const body = recalculateSeoSchema.parse(req.body ?? {});
  void recalculateScores({ type: body.type, id: body.id, locale: body.locale }).catch((err) => {
    console.error('[seo-quality] recalculation failed:', err);
  });
  return reply.send({ data: { running: true } });
}

export async function updateSeoQualityAdmin(req: FastifyRequest, reply: FastifyReply) {
  const params = detailParamsSchema.parse(req.params);
  const body = updateSeoIndexSchema.parse(req.body ?? {});
  const result = await setSeoIndex(params.type, params.id, body.seo_index as 0 | 1);
  return reply.send({ data: result });
}

export async function getGscSummaryAdmin(_req: FastifyRequest, reply: FastifyReply) {
  const data = await getGscSummary();
  return reply.send({ data });
}

export async function inspectGscUrlsAdmin(req: FastifyRequest, reply: FastifyReply) {
  const body = gscInspectSchema.parse(req.body ?? {});
  const urls = body.urls?.length ? body.urls : body.url ? [body.url] : [];
  const data = await inspectGscUrls(urls);
  return reply.send({ data });
}
