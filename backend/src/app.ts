import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import authPlugin from './plugins/authPlugin';
import mysqlPlugin from '@/plugins/mysql';
import staticUploads from './plugins/staticUploads';
import { localeMiddleware } from '@goldmood/shared-backend/middleware/locale';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';
import { registerAllRoutes } from './routes';
import { parseCorsOrigins } from './app.helpers';

export async function createApp() {
  const { default: buildFastify } = (await import('fastify')) as unknown as {
    default: (opts?: Parameters<FastifyInstance['log']['child']>[0]) => FastifyInstance;
  };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  }) as FastifyInstance;

  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: `${env.APP_NAME} API`,
          version: '0.1.0',
          description: 'Danisman randevu platformu API',
        },
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN as any),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-lang',
      'Prefer',
      'Accept',
      'Accept-Language',
      'X-Locale',
      'x-skip-auth',
      'Range',
    ],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ?? process.env.COOKIE_SECRET ?? 'cookie-secret';

  await app.register(cookie, {
    secret: cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  app.addHook('onRequest', localeMiddleware);

  await app.register(authPlugin);
  await app.register(mysqlPlugin);

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(staticUploads);

  // All routes: shared (@goldmood/shared-backend) + project-specific
  await registerAllRoutes(app);

  registerErrorHandlers(app);
  return app;
}
