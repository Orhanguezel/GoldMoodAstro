// src/modules/storage/router.ts
import type { FastifyInstance } from "fastify";
import { publicServe, uploadToBucket, signPut, signMultipart } from "./controller";
import { tryAuth } from "../../middleware/auth";

export async function registerStorage(app: FastifyInstance) {
  const B = "/storage";

  // GET serve public. Yüklemelerde tryAuth ile kullanıcı (varsa) iliştirilir;
  // hassas bucket'lar (blog/avatar/kyc) controller'da auth zorunlu kılar, anonim
  // başvuru (uploads) ve fal (coffee) akışları açık kalır.
  app.get(`${B}/:bucket/*`, publicServe);
  app.post(`${B}/:bucket/upload`, { preHandler: [tryAuth] }, uploadToBucket);
  app.post(`${B}/uploads/sign-put`, { preHandler: [tryAuth] }, signPut);
  app.post(`${B}/uploads/sign-multipart`, { preHandler: [tryAuth] }, signMultipart);
}
