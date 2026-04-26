// =============================================================
// FILE: src/modules/announcements/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  adminListAnnouncements,
  adminGetAnnouncement,
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
  adminSetPublished,
} from "./admin.controller";

export async function registerAnnouncementsAdmin(app: FastifyInstance) {
  const B = "/announcements";

  app.get<{ Querystring: unknown }>(
    `${B}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListAnnouncements
  );

  app.get<{ Params: { id: string } }>(
    `${B}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetAnnouncement
  );

  app.post<{ Body: unknown }>(
    `${B}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateAnnouncement
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${B}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateAnnouncement
  );

  app.delete<{ Params: { id: string } }>(
    `${B}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteAnnouncement
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${B}/:id/publish`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetPublished
  );
}
