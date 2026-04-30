import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';

export async function getZodiacSign(req: FastifyRequest, reply: FastifyReply) {
  const { sign } = req.params as { sign: string };
  const { locale } = req.query as { locale?: string };

  const profile = await repo.getZodiacProfile(sign, locale);
  if (!profile) {
    return reply.code(404).send({ error: { message: 'zodiac_sign_not_found' } });
  }

  return reply.send({ data: profile });
}
