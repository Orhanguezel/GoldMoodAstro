import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import authPlugin from './plugins/authPlugin';
import mysqlPlugin from '@/plugins/mysql';
import staticUploads from './plugins/staticUploads';
import { localeMiddleware } from '@goldmood/shared-backend/middleware/locale';
import { requestLoggerPlugin } from '@goldmood/shared-backend/modules/audit/requestLogger.plugin';

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
    trustProxy: true,
  }) as FastifyInstance;

  // Fastify rejects `content-type: application/json` with an empty body before route
  // handlers run. Fire-and-forget browser APIs and some crawlers occasionally do this;
  // accepting it as `{}` keeps telemetry/view endpoints from polluting audit metrics
  // with parser-level 400s while still rejecting malformed non-empty JSON.
  app.removeContentTypeParser?.('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const raw = String(body ?? '');
    if (!raw.trim()) return done(null, {});
    try {
      return done(null, JSON.parse(raw));
    } catch (error) {
      const path = String(req?.url ?? '').split('?')[0] || '/';
      const isFireAndForgetTelemetry =
        path === '/api/track' || /^\/api\/consultants\/[^/]+\/view$/.test(path);
      if (isFireAndForgetTelemetry) return done(null, {});

      const parseError = error as Error & { statusCode?: number; code?: string };
      parseError.statusCode = 400;
      parseError.code = 'FST_ERR_CTP_INVALID_JSON_BODY';
      return done(parseError);
    }
  });

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
    (globalThis as any).Bun?.env?.COOKIE_SECRET ?? process.env.COOKIE_SECRET ?? (() => { throw new Error('Missing required env: COOKIE_SECRET'); })();

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

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    hook: 'onRequest',
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        message: 'rate_limit_exceeded',
        retry_after: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  app.addHook('onRequest', localeMiddleware);

  await app.register(authPlugin);
  await app.register(mysqlPlugin);

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(staticUploads);

  // Audit request logger — onResponse hook TÜM route'larda çalışsın diye fp() ile
  // kök instance'a bağlanır (fp yoksa hook encapsulate olur → audit_request_logs
  // boş kalır → /admin/audit map/metrics/funnel/cohort hepsi boş). geoip-lite ile
  // country doldurulur; nginx x-real-ip/x-forwarded-for iletmeli.
  await app.register(fp(requestLoggerPlugin));

  // Hata/404 yakalayıcıları route'lardan ÖNCE kaydet. Fastify'da encapsulated
  // route plugin'leri, register edildikleri ANDAKI error handler'ı devralır;
  // handler sonra set edilirse önceden kaydolan route'lara ULAŞMAZ (ZodError'lar
  // varsayılan 500'e düşüyordu). Bu yüzden önce handler, sonra route.
  registerErrorHandlers(app);

  // All routes: shared (@goldmood/shared-backend) + project-specific
  await registerAllRoutes(app);

  return app;
}
