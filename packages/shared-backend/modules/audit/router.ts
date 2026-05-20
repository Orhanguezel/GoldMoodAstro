// =============================================================
// FILE: src/modules/audit/router.ts
// corporate-backend – Audit Module Router (public scope)
//   - requestLoggerPlugin is registered in app.ts /api scope
//   - admin.routes.ts + stream.routes.ts are registered
//     under /admin scope in app.ts (with auth+admin guards)
//   - This file is kept for potential future public audit endpoints
// =============================================================

import type { FastifyInstance } from 'fastify';
import { tryAuth } from '../../middleware/auth';
import { trackEventPublic } from './funnel.controller';

export async function registerAudit(api: FastifyInstance, _opts?: unknown) {
  api.post('/track', { preHandler: tryAuth }, trackEventPublic);
  // Admin endpoints and SSE stream are registered under /admin scope in app.ts.
}
