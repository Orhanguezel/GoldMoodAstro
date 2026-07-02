// FILE: src/plugins/staticUploads.ts
import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { env } from '../core/env';

export default fp(async (app: FastifyInstance) => {
  const uploadsDir = env.LOCAL_STORAGE_ROOT
    ? path.resolve(env.LOCAL_STORAGE_ROOT)
    : path.resolve(process.cwd(), 'uploads');

  app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });
});
