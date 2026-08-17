// FILE: modules/invoices/admin.routes.ts
// adminApi zaten /admin ile prefix'li.
import type { FastifyInstance } from 'fastify';
import * as controller from './admin.controller';

export async function registerInvoicesAdmin(app: FastifyInstance) {
  const BASE = '/invoices';
  app.get(BASE, controller.listInvoicesAdmin);
  app.get<{ Params: { id: string } }>(`${BASE}/:id/pdf`, controller.downloadInvoiceAdmin);
  app.post<{ Params: { id: string } }>(`${BASE}/:id/resend`, controller.resendInvoiceAdmin);
}
