// =============================================================
// FILE: src/modules/announcements/router.ts  — Public
// =============================================================
import type { FastifyInstance } from "fastify";
import { listAnnouncements, getAnnouncement } from "./controller";

export async function registerAnnouncements(app: FastifyInstance) {
  const B = "/announcements";

  const pub = { config: { public: true } };
  app.get(`${B}`,       pub, listAnnouncements);
  app.get(`${B}/:id`, pub, getAnnouncement);
}
