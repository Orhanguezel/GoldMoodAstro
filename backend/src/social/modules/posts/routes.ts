import type { FastifyInstance } from "fastify";
import * as ctrl from "./controller";

export async function postsRoutes(app: FastifyInstance) {
  app.get("/", ctrl.list);
  app.get("/queue", ctrl.queue);
  app.get("/history", ctrl.history);
  app.get("/stats", ctrl.stats);
  app.get("/x/inbox", ctrl.xInbox);
  app.post("/x/mentions/sync", ctrl.syncXMentions);
  app.get("/x/own-tweets", ctrl.listXOwnTweets);
  app.post("/x/own-tweets/sync", ctrl.syncXOwnTweets);
  app.patch("/x/comments/:commentId/draft", ctrl.updateXReplyDraft);
  app.post("/x/comments/:commentId/reply", ctrl.publishXReply);
  // Uyumluluk denetimi — :id route'larından ÖNCE kayıtlı olmalı, yoksa
  // "/compliance" bir id sanılır (Fastify statik segmenti önceler ama sıra
  // netliği için burada; bkz. api_error_handler_order dersi).
  app.get("/compliance", ctrl.complianceList);
  app.get("/:id/compliance", ctrl.complianceOne);
  app.get("/:id/details", ctrl.details);
  app.get("/:id", ctrl.getById);
  app.post("/x/thread", ctrl.createXThread);
  app.post("/upload-image", ctrl.uploadImage);
  app.post("/", ctrl.create);
  app.patch("/:id", ctrl.update);
  app.delete("/:id", ctrl.remove);
  app.post("/:id/schedule", ctrl.schedule);
  app.post("/:id/publish-now", ctrl.publishNow);
  app.post("/:id/refresh-metrics", ctrl.refreshMetrics);
  app.post("/:id/auto-edit", ctrl.startAutoEdit);
  app.get("/:id/auto-edit/status", ctrl.getAutoEditStatus);
  app.post("/:id/auto-edit/approve", ctrl.approveAutoEdit);
  app.post("/:id/auto-edit/retry", ctrl.retryAutoEdit);
  app.post("/:id/cancel", ctrl.cancel);
  app.post("/:id/duplicate", ctrl.duplicate);
}
