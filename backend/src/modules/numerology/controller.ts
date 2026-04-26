// backend/src/modules/numerology/controller.ts

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as logic from './logic';

export async function handleCalculate(req: FastifyRequest, reply: FastifyReply) {
  const { dob } = req.query as { dob: string };
  if (!dob) return reply.status(400).send({ error: 'Doğum tarihi (dob) eksik.' });
  
  const lifePath = logic.calculateLifePath(dob);
  return reply.send({ data: { lifePath } });
}
