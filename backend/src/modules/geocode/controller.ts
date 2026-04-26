import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';
import { geocodeQuerySchema } from './validation';

export async function handleSearch(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { q } = geocodeQuerySchema.parse(req.query ?? {});
    const result = await repo.searchGeocode(q);
    if (!result) return reply.code(404).send({ error: { message: 'geocode_not_found' } });
    return reply.send({ data: result });
  } catch (error) {
    const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 400);
    return reply.code(statusCode).send({
      error: { message: error instanceof Error ? error.message : 'geocode_failed' },
    });
  }
}
