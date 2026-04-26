// src/modules/_shared/route-helpers.ts
// Fastify route helper utilities

import type { FastifyReply, FastifyRequest } from 'fastify';

/** Genel route error handler — loglama + 500 dönüş */
export function handleRouteError(
  reply: FastifyReply,
  reqOrErr: FastifyRequest | unknown,
  errOrLabel?: unknown,
  label?: string,
) {
  // Support both (reply, req, err, label) and (reply, err, label)
  const err = label !== undefined ? errOrLabel : reqOrErr;
  const tag = label ?? (typeof errOrLabel === 'string' ? errOrLabel : 'route_error');

  const statusCode =
    typeof (err as any)?.statusCode === 'number' ? (err as any).statusCode : 500;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Internal Server Error';

  reply.log.error({ err, label: tag }, message);
  return reply.status(statusCode).send({ error: message });
}

/** 404 helper */
export function sendNotFound(reply: FastifyReply, message = 'Not found') {
  return reply.status(404).send({ error: message });
}

/** Auth user id'sini request'ten çıkar */
export function getAuthUserId(req: FastifyRequest): string {
  const user = (req as any).user;
  if (!user) throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  return String(user.sub || user.id || '');
}

/** Content-Range header'ı set et (react-admin uyumlu) */
export function setContentRange(
  reply: FastifyReply,
  offsetOrResource: string | number,
  limitOrOffset: number,
  totalOrLimit: number,
  totalMaybe?: number,
) {
  // Support both (reply, resource, offset, limit, total) and (reply, offset, limit, total)
  if (typeof offsetOrResource === 'string') {
    const resource = offsetOrResource;
    const offset = limitOrOffset;
    const limit = totalOrLimit;
    const total = totalMaybe ?? 0;
    reply.header('Content-Range', `${resource} ${offset}-${offset + limit}/${total}`);
  } else {
    const offset = offsetOrResource;
    const limit = limitOrOffset;
    const total = totalOrLimit;
    reply.header('Content-Range', `items ${offset}-${offset + limit}/${total}`);
  }
  reply.header('Access-Control-Expose-Headers', 'Content-Range');
}
