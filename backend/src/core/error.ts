// src/core/error.ts
// Fastify v5 ile bazı projelerde TS çözümlemesi şaşabiliyor.
// Burada 'any' verip üretimi engelleyen tip sürtünmesini kesiyoruz.
export function registerErrorHandlers(app: any) {
  // 404
  app.setNotFoundHandler((req: any, reply: any) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: 'Not Found', path: req.url },
    });
  });

  // Genel hata yakalayıcı
  app.setErrorHandler((err: any, req: any, reply: any) => {
    const path = String(req?.url ?? '').split('?')[0] || '/';
    const isEmptyJsonBody = err?.code === 'FST_ERR_CTP_EMPTY_JSON_BODY';
    const isFireAndForgetTelemetry =
      path === '/api/track' || /^\/api\/consultants\/[^/]+\/view$/.test(path);

    // Telemetry/profile-view endpoints do not need a request body. Some crawlers or
    // clients send `content-type: application/json` with an empty body; Fastify rejects
    // it before the handler. Treat that as ignored telemetry instead of a real 4xx.
    if (isEmptyJsonBody && isFireAndForgetTelemetry) {
      return reply.code(202).send({ ok: true, ignored: true, reason: 'empty_body' });
    }

    const status = err?.statusCode ?? err?.status ?? (err?.validation ? 400 : 500);

    const payload: Record<string, any> = {
      error: {
        code: err?.validation
          ? 'VALIDATION_ERROR'
          : err?.code ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
        message: err?.message ?? 'Server Error',
      },
    };

    if (err?.validation) payload.error.details = err.validation;
    if (err?.errors) payload.error.details = err.errors;

    if (process.env.NODE_ENV !== 'production' && err?.stack) {
      payload.error.stack = err.stack;
    }

    req.log?.error?.(err, 'request_failed');
    reply.code(status).send(payload);
  });
}
