// =============================================================
// FILE: modules/invoices/service.ts
//
// Satış faturası: numara üretimi + PDF + arşiv + müşteriye e-posta.
//
// KURALLAR
// - Numara SIRA ATLAMAZ: yıllık sayaç transaction içinde artırılır
//   (AUTO_INCREMENT değil — rollback'te numara yakılır, vergi dairesi için
//   açıklanması gereken boşluk oluşur).
// - Bir sipariş için TEK fatura: invoices.order_id UNIQUE. Webhook tekrar
//   teslimatı ikinci belge üretemez.
// - Kleinunternehmer (§19 UStG): KDV gösterilmez, notu faturaya YAZILIR.
//   Not metni belgeyle birlikte saklanır (yasa değişirse eski belge değişmez).
// - Satıcı künyesi site_settings.company_brand'den okunur; ikinci bir yerde
//   adres/VAT tutulmaz.
// =============================================================
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { siteSettings } from '../siteSettings/schema';

export interface SellerIdentity {
  legalName: string;
  address: string;
  vatId: string;
  email: string;
  phone: string;
  brandName: string;
}

const DEFAULT_SELLER: SellerIdentity = {
  legalName: 'Orhan Güzel – Softwareentwicklung',
  address: 'Stralsunder Str. 38, 41515 Grevenbroich, Deutschland',
  vatId: 'DE463832419',
  email: 'goldmoodastro@gmail.com',
  phone: '',
  brandName: 'GoldMoodAstro',
};

export const TAX_NOTE_DE = 'Kein Ausweis von Umsatzsteuer gemäß § 19 UStG (Kleinunternehmer).';
export const TAX_NOTE_TR = 'Almanya Kleinunternehmer düzenlemesi (§19 UStG) gereği faturada KDV gösterilmez.';
export const TAX_NOTE_EN = 'No VAT is charged under the German small business rule (§ 19 UStG).';

export async function getSellerIdentity(): Promise<SellerIdentity> {
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(and(eq(siteSettings.key, 'company_brand'), eq(siteSettings.locale, '*')))
      .limit(1);
    let v: any = row?.value;
    if (typeof v === 'string') v = JSON.parse(v);
    if (!v || typeof v !== 'object') return DEFAULT_SELLER;
    return {
      legalName: String(v.legal_name || DEFAULT_SELLER.legalName),
      address: String(v.address || DEFAULT_SELLER.address),
      vatId: String(v.vat_id || DEFAULT_SELLER.vatId),
      email: String(v.email || DEFAULT_SELLER.email),
      phone: String(v.phone || ''),
      brandName: String(v.name || DEFAULT_SELLER.brandName),
    };
  } catch {
    return DEFAULT_SELLER;
  }
}

/**
 * Yıllık sayaçtan bir sonraki fatura numarasını alır.
 * Transaction içinde çağrılmalı — sayaç satırı kilitlenerek artırılır.
 */
async function nextInvoiceNumber(tx: any, year: number): Promise<{ seq: number; number: string }> {
  await tx.execute(sql`
    INSERT INTO invoice_counters (year, last_number) VALUES (${year}, 0)
    ON DUPLICATE KEY UPDATE year = year
  `);
  await tx.execute(sql`UPDATE invoice_counters SET last_number = last_number + 1 WHERE year = ${year}`);
  const res = await tx.execute(sql`SELECT last_number FROM invoice_counters WHERE year = ${year}`);
  const row = ((res as any)?.[0] ?? res ?? [])[0] as any;
  const seq = Number(row?.last_number ?? 0);
  return { seq, number: `GM-${year}-${String(seq).padStart(5, '0')}` };
}

export interface CreateInvoiceArgs {
  orderId: string;
  bookingId?: string | null;
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  description: string;
  amount: number;
  currency: string;
  locale?: string;
}

export type CreateInvoiceResult =
  | { status: 'exists'; invoiceNumber: string; id: string }
  | { status: 'created'; invoiceNumber: string; id: string; pdfPath: string };

export async function createInvoiceForOrder(args: CreateInvoiceArgs): Promise<CreateInvoiceResult> {
  const existingRes = await db.execute(sql`
    SELECT id, invoice_number FROM invoices WHERE order_id = ${args.orderId} LIMIT 1
  `);
  const existing = ((existingRes as any)?.[0] ?? existingRes ?? [])[0] as any;
  if (existing) {
    return { status: 'exists', invoiceNumber: String(existing.invoice_number), id: String(existing.id) };
  }

  const seller = await getSellerIdentity();
  const year = new Date().getFullYear();
  const locale = String(args.locale || 'tr').slice(0, 2).toLowerCase();
  const taxNote = locale === 'de' ? TAX_NOTE_DE : locale === 'en' ? TAX_NOTE_EN : TAX_NOTE_TR;

  const id = randomUUID();
  let invoiceNumber = '';
  let seq = 0;

  await db.transaction(async (tx) => {
    const next = await nextInvoiceNumber(tx, year);
    invoiceNumber = next.number;
    seq = next.seq;

    await tx.execute(sql`
      INSERT INTO invoices (
        id, invoice_number, year, seq, order_id, booking_id, user_id,
        customer_name, customer_email, customer_address,
        description, amount, currency, tax_note, issued_at
      ) VALUES (
        ${id}, ${invoiceNumber}, ${year}, ${seq}, ${args.orderId}, ${args.bookingId ?? null}, ${args.userId ?? null},
        ${args.customerName}, ${args.customerEmail ?? null}, ${args.customerAddress ?? null},
        ${args.description}, ${args.amount.toFixed(2)}, ${args.currency}, ${taxNote}, NOW(3)
      )
    `);
  });

  const pdf = await renderInvoicePdf({
    invoiceNumber,
    issuedAt: new Date(),
    seller,
    customerName: args.customerName,
    customerEmail: args.customerEmail ?? null,
    customerAddress: args.customerAddress ?? null,
    description: args.description,
    amount: args.amount,
    currency: args.currency,
    taxNote,
    locale,
  });

  const dir = join(process.cwd(), 'uploads', 'invoices');
  await mkdir(dir, { recursive: true });
  const fileName = `${invoiceNumber}.pdf`;
  await writeFile(join(dir, fileName), pdf);
  const pdfPath = `uploads/invoices/${fileName}`;

  await db.execute(sql`UPDATE invoices SET pdf_path = ${pdfPath} WHERE id = ${id}`);

  return { status: 'created', invoiceNumber, id, pdfPath };
}

interface RenderArgs {
  invoiceNumber: string;
  issuedAt: Date;
  seller: SellerIdentity;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  description: string;
  amount: number;
  currency: string;
  taxNote: string;
  locale: string;
}

const L: Record<string, Record<string, string>> = {
  tr: {
    invoice: 'FATURA', number: 'Fatura No', date: 'Tarih', seller: 'Satıcı', buyer: 'Alıcı',
    desc: 'Açıklama', amount: 'Tutar', total: 'TOPLAM', vat: 'KDV', thanks: 'Teşekkür ederiz.',
  },
  en: {
    invoice: 'INVOICE', number: 'Invoice No', date: 'Date', seller: 'Seller', buyer: 'Bill to',
    desc: 'Description', amount: 'Amount', total: 'TOTAL', vat: 'VAT', thanks: 'Thank you.',
  },
  de: {
    invoice: 'RECHNUNG', number: 'Rechnungsnr.', date: 'Datum', seller: 'Verkäufer', buyer: 'Rechnung an',
    desc: 'Beschreibung', amount: 'Betrag', total: 'GESAMT', vat: 'USt.', thanks: 'Vielen Dank.',
  },
};

/** PDF'i bellekte üretir. Türkçe karakterler için gömülü DejaVu kullanılır. */
export async function renderInvoicePdf(a: RenderArgs): Promise<Buffer> {
  const { default: PDFDocument } = await import('pdfkit');
  const t = L[a.locale] ?? L.tr;

  const fontDir = join(process.cwd(), 'assets', 'fonts');
  const doc = new PDFDocument({ size: 'A4', margin: 56 });

  // pdfkit'in yerleşik fontları WinAnsi: ı/ş/ğ bozuk çıkıyor. Gömülü font şart.
  try {
    doc.registerFont('body', join(fontDir, 'DejaVuSans.ttf'));
    doc.registerFont('bold', join(fontDir, 'DejaVuSans-Bold.ttf'));
  } catch {
    /* font yoksa yerleşik fontla devam — belge yine üretilsin */
  }

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const money = (v: number) => {
    try {
      return new Intl.NumberFormat(a.locale === 'de' ? 'de-DE' : a.locale === 'en' ? 'en-US' : 'tr-TR', {
        style: 'currency',
        currency: a.currency || 'TRY',
      }).format(v);
    } catch {
      return `${v.toFixed(2)} ${a.currency}`;
    }
  };

  const useFont = (name: 'body' | 'bold') => {
    try { doc.font(name); } catch { doc.font(name === 'bold' ? 'Helvetica-Bold' : 'Helvetica'); }
  };

  useFont('bold');
  doc.fontSize(22).text(a.seller.brandName, { align: 'left' });
  doc.moveDown(0.2);
  useFont('body');
  doc.fontSize(9).fillColor('#555')
    .text(a.seller.legalName)
    .text(a.seller.address)
    .text(`USt-IdNr: ${a.seller.vatId}`)
    .text(a.seller.email);

  doc.moveDown(1.4);
  useFont('bold');
  doc.fontSize(16).fillColor('#000').text(t.invoice);
  doc.moveDown(0.4);
  useFont('body');
  doc.fontSize(10)
    .text(`${t.number}: ${a.invoiceNumber}`)
    .text(`${t.date}: ${a.issuedAt.toISOString().slice(0, 10)}`);

  doc.moveDown(1.2);
  useFont('bold');
  doc.fontSize(11).text(t.buyer);
  useFont('body');
  doc.fontSize(10).text(a.customerName);
  if (a.customerAddress) doc.text(a.customerAddress);
  if (a.customerEmail) doc.text(a.customerEmail);

  doc.moveDown(1.4);
  const tableTop = doc.y;
  useFont('bold');
  doc.fontSize(10).text(t.desc, 56, tableTop).text(t.amount, 400, tableTop, { width: 140, align: 'right' });
  doc.moveTo(56, tableTop + 16).lineTo(539, tableTop + 16).strokeColor('#ccc').stroke();

  useFont('body');
  const rowY = tableTop + 26;
  doc.fontSize(10).fillColor('#000')
    .text(a.description, 56, rowY, { width: 320 })
    .text(money(a.amount), 400, rowY, { width: 140, align: 'right' });

  const afterRow = Math.max(doc.y, rowY + 18);
  doc.moveTo(56, afterRow + 8).lineTo(539, afterRow + 8).strokeColor('#ccc').stroke();

  useFont('bold');
  doc.fontSize(12).text(t.total, 56, afterRow + 18).text(money(a.amount), 400, afterRow + 18, { width: 140, align: 'right' });

  doc.moveDown(2.5);
  useFont('body');
  doc.fontSize(9).fillColor('#555').text(a.taxNote, 56, doc.y, { width: 483 });
  doc.moveDown(0.6);
  doc.text(t.thanks);

  doc.end();
  return done;
}
