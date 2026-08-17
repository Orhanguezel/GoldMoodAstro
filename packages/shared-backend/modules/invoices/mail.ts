// =============================================================
// FILE: modules/invoices/mail.ts
//
// Fatura e-postası — PDF EK olarak gider. Link yerine ek tercih edildi:
// müşteri belgeyi indirmek için siteye girmek/oturum açmak zorunda kalmasın,
// ve belge e-posta kutusunda kalıcı olsun.
// =============================================================
import { readFile } from 'fs/promises';
import { join } from 'path';
import { sendMailRaw } from '../mail/service';

export async function sendInvoiceMail(args: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  pdfPath: string;
  locale?: string;
}): Promise<void> {
  const absolute = join(process.cwd(), args.pdfPath);
  const pdf = await readFile(absolute);

  const subject = `GoldMoodAstro — Fatura ${args.invoiceNumber}`;
  const text = [
    `Merhaba ${args.customerName},`,
    '',
    `${args.invoiceNumber} numaralı faturanız ektedir.`,
    '',
    'Almanya Kleinunternehmer düzenlemesi (§19 UStG) gereği faturada KDV gösterilmez.',
    '',
    'GoldMoodAstro',
  ].join('\n');

  await sendMailRaw({
    to: args.to,
    subject,
    text,
    html: `<p>Merhaba ${args.customerName},</p>
<p><strong>${args.invoiceNumber}</strong> numaralı faturanız ektedir.</p>
<p style="color:#666;font-size:13px">Almanya Kleinunternehmer düzenlemesi (§19 UStG) gereği faturada KDV gösterilmez.</p>
<p>GoldMoodAstro</p>`,
    attachments: [
      {
        filename: `${args.invoiceNumber}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  } as any);
}
