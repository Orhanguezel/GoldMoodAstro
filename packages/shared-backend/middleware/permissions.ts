// src/middleware/permissions.ts
// Permission-based admin guard

import { requireAuth } from './auth';
import { requireAdmin } from './roles';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Admin permission guard factory.
 * Şimdilik requireAuth + requireAdmin kullanır.
 * İleride granüler permission sistemi eklenebilir.
 */
export function makeAdminPermissionGuard(_permission: string) {
  return [requireAuth, requireAdmin] as const;
}
