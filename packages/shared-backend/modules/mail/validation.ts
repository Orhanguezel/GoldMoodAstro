// ===================================================================
// FILE: src/modules/mail/validation.ts
// ===================================================================

import { z } from "zod";

export const mailAttachmentSchema = z
  .object({
    filename: z.string().min(1).optional(),
    content: z.any().optional(), // Buffer | string
    path: z.string().min(1).optional(), // local path or URL
    contentType: z.string().optional(),
    cid: z.string().optional(), // inline attachments için
  })
  .refine((v) => v.content || v.path, {
    message: "attachment must include either content or path",
  });

export const sendMailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(mailAttachmentSchema).optional(),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;

/**
 * Sipariş oluşturma maili için payload
 *
 * NOT:
 *  - email_templates → "order_received" template payload'ına uygun:
 *      customer_name, order_number, final_amount, status, site_name?, locale?
 *  - site_name çağıran için OPSİYONEL.
 *  - locale, email-templates / tarih formatı vs. için opsiyonel.
 */
export const orderCreatedMailSchema = z.object({
  to: z.string().email(),
  customer_name: z.string().min(1),
  order_number: z.string().min(1),
  final_amount: z.string().min(1), // "199.90" gibi string
  status: z.string().min(1), // "pending" | "processing" | ...
  site_name: z.string().min(1).optional(),
  locale: z.string().max(10).optional(),
});

export type OrderCreatedMailInput = z.infer<typeof orderCreatedMailSchema>;
