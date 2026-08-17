// =============================================================
// FILE: modules/invoices/admin.controller.ts
//
// Admin fatura uçları: listele, PDF indir, yeniden gönder.
// PDF dosya sisteminden okunur; kayıp dosya için PDF yeniden ÜRETİLMEZ —
// belge numarası ve içeriği sabit olmalı, yeniden üretim tarih/kur farkıyla
// farklı bir belge doğurabilir. Kayıpsa 404 döner ve durum görünür olur.
// =============================================================
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { sendInvoiceMail } from './mail';

function rowsOf(result: unknown): any[] {
  const r = result as any;
  return (Array.isArray(r?.[0]) ? r[0] : Array.isArray(r) ? r : []) as any[];
}

/** GET /admin/invoices */
export async function listInvoicesAdmin(req: FastifyRequest, reply: FastifyReply) {
  const query = ((req as any).query ?? {}) as Record<string, unknown>;
  const limit = Math.min(Math.max(Number(query.limit ?? 50) || 50, 1), 200);
  const page = Math.max(Number(query.page ?? 1) || 1, 1);
  const offset = (page - 1) * limit;
  const search = String(query.q ?? '').trim();

  const like = `%${search}%`;
  const rows = rowsOf(
    await db.execute(sql`
      SELECT id, invoice_number, order_id, user_id, customer_name, customer_email,
             description, amount, currency, pdf_path, issued_at, emailed_at
      FROM invoices
      ${search ? sql`WHERE invoice_number LIKE ${like} OR customer_name LIKE ${like} OR customer_email LIKE ${like}` : sql``}
      ORDER BY issued_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
  );

  const totalRow = rowsOf(
    await db.execute(sql`
      SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS sum_amount
      FROM invoices
      ${search ? sql`WHERE invoice_number LIKE ${like} OR customer_name LIKE ${like} OR customer_email LIKE ${like}` : sql``}
    `),
  )[0] as any;

  return reply.send({
    data: rows,
    page,
    limit,
    total: Number(totalRow?.total ?? rows.length),
    totals: { amount: Number(totalRow?.sum_amount ?? 0) },
  });
}

/** GET /admin/invoices/:id/pdf */
export async function downloadInvoiceAdmin(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as { id?: string })?.id ?? '').trim();
  const row = rowsOf(await db.execute(sql`SELECT invoice_number, pdf_path FROM invoices WHERE id = ${id} LIMIT 1`))[0] as any;
  if (!row?.pdf_path) return reply.code(404).send({ error: { message: 'invoice_pdf_not_found' } });

  try {
    const buf = await readFile(join(process.cwd(), String(row.pdf_path)));
    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${row.invoice_number}.pdf"`)
      .send(buf);
  } catch {
    // Dosya diskte yok: arşiv kaybı. Sessizce yeniden üretmiyoruz.
    return reply.code(404).send({ error: { message: 'invoice_file_missing' } });
  }
}

/** POST /admin/invoices/:id/resend */
export async function resendInvoiceAdmin(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as { id?: string })?.id ?? '').trim();
  const row = rowsOf(
    await db.execute(sql`
      SELECT invoice_number, pdf_path, customer_name, customer_email FROM invoices WHERE id = ${id} LIMIT 1
    `),
  )[0] as any;
  if (!row) return reply.code(404).send({ error: { message: 'invoice_not_found' } });
  if (!row.customer_email) return reply.code(400).send({ error: { message: 'customer_email_missing' } });
  if (!row.pdf_path) return reply.code(404).send({ error: { message: 'invoice_pdf_not_found' } });

  try {
    await sendInvoiceMail({
      to: String(row.customer_email),
      customerName: String(row.customer_name || 'Danışan'),
      invoiceNumber: String(row.invoice_number),
      pdfPath: String(row.pdf_path),
    });
    await db.execute(sql`UPDATE invoices SET emailed_at = NOW(3) WHERE id = ${id}`);
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, id }, 'invoice_resend_failed');
    return reply.code(502).send({ error: { message: 'invoice_resend_failed' } });
  }
}
