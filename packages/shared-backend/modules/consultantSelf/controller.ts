// packages/shared-backend/modules/consultantSelf/controller.ts
// T30-1: Danışmanın kendi paneli için endpoint'ler.
// /me/consultant — kendi profilini görür/günceller, randevuları, istatistikleri.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import type { MultipartFile } from '@fastify/multipart';
import { z } from 'zod';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { db } from '../../db/client';
import { consultants } from '../consultants/schema';
import { bookings } from '../bookings/schema';
import { users } from '../auth/schema';
import { chat_threads, chat_messages, chat_participants } from '../chat/schema';
import { createUserNotification } from '../notifications/service';
import { dispatchPushToUser } from '../notifications/push';
import { sendTemplatedEmail } from '../emailTemplates/mailer';
import { getDefaultLocale } from '../_shared';
import { overrideDaySlots } from '../availability/repository';
import { releaseSlotTx } from '../bookings/repository';
import { consultantServices } from '../consultantServices/schema';
import { serviceCategories } from '../serviceCategories/schema';
import { languages } from '../languages/schema';
import { buildPublicUrl, getCloudinaryConfig, repoInsert as insertStorageAsset, uploadBufferAuto } from '../storage';
import { repoPersistAuditEvent } from '../audit/repository';
import * as customPagesRepo from '../customPages/repository';
// wallets/walletTransactions: bu projede DB schema farklı (consultant_id), raw SQL kullanılıyor.

const profilePatchSchema = z.object({
  bio: z.string().trim().max(5000).nullable().optional(),
  expertise: z.array(z.string().trim().toLowerCase().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'slug_format')).min(1).max(20).optional(),
  // Eski kayıtlardaki bozuk dil değerlerini (boş string, locale tag "tr-TR" vs.) sessizce
  // ele: trim+lowercase ve invalid olanları filtre. Geriye kalan dizi normal kurala uyar.
  languages: z.preprocess(
    (v) => Array.isArray(v)
      ? Array.from(new Set(
          v
            .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
            .filter((s) => /^[a-z]{2,8}$/.test(s)),
        ))
      : v,
    z.array(z.string().regex(/^[a-z]+$/, 'slug_format').min(2).max(8)).min(1).max(10),
  ).optional(),
  // Eski kayıtlarda kalan 'chat' / 'sms' gibi enum dışı değerleri sessizce at.
  // UI sadece audio/video gösteriyor; kullanıcı yanlış değer gönderemez ama legacy
  // data'da olabiliyor (önceki şema farklıydı).
  meeting_platforms: z.preprocess(
    (v) => Array.isArray(v) ? v.filter((s) => s === 'audio' || s === 'video') : v,
    z.array(z.enum(['audio', 'video'])).max(2),
  ).optional(),
  social_links: z.record(z.string().trim().max(1000)).optional(),
  bank_name: z.string().trim().max(120).nullable().optional(),
  bank_iban: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z
      .string()
      .trim()
      .transform(normalizeIban)
      .refine((value) => /^TR\d{24}$/.test(value), 'invalid_tr_iban')
      .nullable()
      .optional(),
  ),
  bank_account_holder: z.string().trim().max(160).nullable().optional(),
  account_type: z.enum(['individual', 'company']).nullable().optional(),
  identity_number: z.string().trim().regex(/^\d{11}$/, 'invalid_identity_number').nullable().optional(),
  tax_number: z.string().trim().regex(/^\d{10,11}$/, 'invalid_tax_number').nullable().optional(),
  tax_office: z.string().trim().max(120).nullable().optional(),
  company_name: z.string().trim().max(200).nullable().optional(),
  billing_address: z.string().trim().max(5000).nullable().optional(),
  avatar_url: z.string().trim().max(1000).nullable().optional(),
  is_available: z.coerce.number().int().min(0).max(1).optional(),
  supports_video: z.coerce.number().int().min(0).max(1).optional(),
  session_price: z.coerce.number().nonnegative().max(appConfig.consultants.maxSessionPrice).optional(),
  session_duration: z.coerce.number().int().positive().max(appConfig.consultants.maxSessionDurationMinutes).optional(),
  video_session_price: z.coerce.number().nonnegative().max(appConfig.consultants.maxSessionPrice).optional(),
});

const blogPostSchema = z.object({
  locale: z.string().min(2).max(8).default('tr'),
  title: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/i, 'slug must be url-safe'),
  content: z.string().max(200000).default(''),
  summary: z.string().trim().max(2000).nullable().optional(),
  featured_image: z.string().trim().max(500).nullable().optional(),
  featured_image_alt: z.string().trim().max(255).nullable().optional(),
  meta_title: z.string().trim().max(255).nullable().optional(),
  meta_description: z.string().trim().max(500).nullable().optional(),
  tags: z.string().trim().max(500).nullable().optional(),
  featured: z.coerce.boolean().optional(),
});

const blogPatchSchema = blogPostSchema.partial();

const hhMmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid_time_format');

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function getCallerUserId(req: FastifyRequest): string | null {
  const u = (req as any).user as { sub?: string; id?: string } | undefined;
  return (u?.id ?? u?.sub) ? String(u?.id ?? u?.sub) : null;
}

async function getCallerConsultant(req: FastifyRequest) {
  const userId = getCallerUserId(req);
  if (!userId) return null;
  const [row] = await db.select().from(consultants).where(eq(consultants.user_id, userId)).limit(1);
  return row ?? null;
}

function consultantBlogMarker(consultantId: string): string {
  return `author_consultant:${consultantId}`;
}

function mergeConsultantBlogTags(raw: string | null | undefined, consultantId: string): string {
  const marker = consultantBlogMarker(consultantId);
  const tags = String(raw || '')
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (!tags.includes(marker)) tags.push(marker);
  return tags.join(', ');
}

function belongsToConsultantBlog(row: { module_key?: string | null; tags?: string | null }, consultantId: string): boolean {
  return row.module_key === 'blog' && String(row.tags || '').split(/[;,]/).map((tag) => tag.trim()).includes(consultantBlogMarker(consultantId));
}

function rowsFromExecute<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatYearMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), max);
}

const KYC_DOCUMENT_TYPES = ['id_front', 'id_back', 'tax_certificate', 'other'] as const;
const kycDocumentTypeSchema = z.enum(KYC_DOCUMENT_TYPES);
const kycRejectSchema = z.object({
  rejection_reason: z.string().trim().min(2).max(2000),
});

type KycDocument = {
  type: (typeof KYC_DOCUMENT_TYPES)[number];
  url: string;
  storage_asset_id?: string;
  name?: string;
  mime?: string;
  size?: number;
  uploaded_at: string;
};

function isValidTurkishIdentityNumber(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  return digits[9] === (((oddSum * 7) - evenSum) % 10) && digits[10] === (digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10);
}

function kycValidationError(c: Record<string, unknown>): { message: string; field?: string } | null {
  const accountType = c.account_type === 'company' ? 'company' : c.account_type === 'individual' ? 'individual' : null;
  if (!accountType) return { message: 'account_type_required', field: 'account_type' };

  const bankHolder = String(c.bank_account_holder ?? '').trim();
  if (!bankHolder) return { message: 'bank_account_holder_required', field: 'bank_account_holder' };

  if (accountType === 'individual') {
    const identityNumber = String(c.identity_number ?? '').trim();
    return isValidTurkishIdentityNumber(identityNumber) ? null : { message: 'invalid_identity_number', field: 'identity_number' };
  }

  const taxNumber = String(c.tax_number ?? '').trim();
  if (!/^\d{10,11}$/.test(taxNumber)) return { message: 'invalid_tax_number', field: 'tax_number' };
  if (!String(c.tax_office ?? '').trim()) return { message: 'tax_office_required', field: 'tax_office' };
  if (!String(c.company_name ?? '').trim()) return { message: 'company_name_required', field: 'company_name' };
  return null;
}

async function logKycAudit(args: {
  req: FastifyRequest;
  topic: string;
  message: string;
  consultantId: string;
  meta?: Record<string, unknown>;
}) {
  await repoPersistAuditEvent({
    ts: new Date().toISOString(),
    level: 'info',
    topic: args.topic,
    message: args.message,
    actor_user_id: getCallerUserId(args.req),
    ip: args.req.ip ?? null,
    entity: { type: 'consultant', id: args.consultantId },
    meta: args.meta ?? {},
  });
}

function uniqueSlugs(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}

async function findInactiveOrMissingServiceCategorySlugs(slugs: string[]): Promise<string[]> {
  const unique = uniqueSlugs(slugs);
  if (unique.length === 0) return [];

  const rows = await db
    .select({ slug: serviceCategories.slug })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.is_active, 1), inArray(serviceCategories.slug, unique)));
  const allowed = new Set(rows.map((row) => row.slug));
  return unique.filter((slug) => !allowed.has(slug));
}

async function findInactiveOrMissingLanguageSlugs(slugs: string[]): Promise<string[]> {
  const unique = uniqueSlugs(slugs);
  if (unique.length === 0) return [];

  const rows = await db
    .select({ slug: languages.slug })
    .from(languages)
    .where(and(eq(languages.is_active, 1), inArray(languages.slug, unique)));
  const allowed = new Set(rows.map((row) => row.slug));
  return unique.filter((slug) => !allowed.has(slug));
}

/* ─── GET /me/consultant — profil ─── */
export async function getProfile(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // user info de getir
  const [u] = await db
    .select({ full_name: users.full_name, email: users.email, phone: users.phone, avatar_url: users.avatar_url })
    .from(users)
    .where(eq(users.id, c.user_id))
    .limit(1);

  return reply.send({
    data: {
      ...c,
      user: u ?? null,
    },
  });
}

/* ─── PATCH /me/consultant — profil güncelle ─── */
export async function updateProfile(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const data = { ...parsed.data };
  if (data.expertise) {
    data.expertise = uniqueSlugs(data.expertise);
    const invalid = await findInactiveOrMissingServiceCategorySlugs(data.expertise);
    if (invalid.length > 0) {
      return reply.code(400).send({ error: { message: 'invalid_expertise_slug', invalid } });
    }
  }
  if (data.languages) {
    data.languages = uniqueSlugs(data.languages);
    const invalid = await findInactiveOrMissingLanguageSlugs(data.languages);
    if (invalid.length > 0) {
      return reply.code(400).send({ error: { message: 'invalid_language_slug', invalid } });
    }
  }

  // Profil kaydında KYC completeness (bank_holder zorunlu + TC checksum) DAYATILMAZ —
  // bu, yeni danışmanın bio/uzmanlık gibi alanları KYC'siz kaydetmesini engelliyordu.
  // Completeness yalnızca submitKyc'te (satır ~412) kontrol edilir. Burada sadece
  // GÖNDERİLEN ve DOLU olan alanların FORMATI doğrulanır (bozuk veri kaydını önlemek için).
  const idNum = data.identity_number != null ? String(data.identity_number).trim() : '';
  if (idNum && !isValidTurkishIdentityNumber(idNum)) {
    return reply.code(400).send({ error: { message: 'invalid_identity_number', field: 'identity_number' } });
  }
  const taxNum = data.tax_number != null ? String(data.tax_number).trim() : '';
  if (taxNum && !/^\d{10,11}$/.test(taxNum)) {
    return reply.code(400).send({ error: { message: 'invalid_tax_number', field: 'tax_number' } });
  }

  const patch: Record<string, unknown> = {};
  const userPatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (k === 'avatar_url') {
      userPatch.avatar_url = v;
      continue;
    }
    patch[k] = v;
  }
  if (Object.keys(patch).length === 0 && Object.keys(userPatch).length === 0) {
    return reply.send({ data: { id: c.id, noop: true } });
  }

  if (Object.keys(patch).length > 0) {
    await db.update(consultants).set(patch as any).where(eq(consultants.id, c.id));
  }
  if (Object.keys(userPatch).length > 0) {
    await db.update(users).set(userPatch as any).where(eq(users.id, c.user_id));
  }
  return reply.send({ data: { id: c.id } });
}

/* ─── KYC: belge yükle / gönder ─── */
type FileRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>;
};

function cleanFileName(value: string): string {
  return (value || 'document').replace(/[^\w.\-]+/g, '_').slice(0, 160);
}

export async function uploadKycDocument(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const typeParsed = kycDocumentTypeSchema.safeParse(String((req.query as any)?.type || '').trim());
  if (!typeParsed.success) return reply.code(400).send({ error: { message: 'invalid_document_type' } });

  let mp: MultipartFile | undefined;
  try {
    mp = await (req as FileRequest).file?.();
  } catch {
    return reply.code(400).send({ error: { message: 'invalid_multipart_body' } });
  }
  if (!mp) return reply.code(400).send({ error: { message: 'file_required' } });

  const mime = String(mp.mimetype || '').toLowerCase();
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(mime)) {
    return reply.code(400).send({ error: { message: 'invalid_kyc_document_mime' } });
  }

  const buf = await mp.toBuffer();
  if (buf.length > 10 * 1024 * 1024) {
    return reply.code(400).send({ error: { message: 'kyc_document_max_10mb' } });
  }

  const cfg = await getCloudinaryConfig();
  if (!cfg) return reply.code(501).send({ error: { message: 'storage_not_configured' } });

  const bucket = 'consultant_kyc';
  const folder = `${bucket}/${c.id}`;
  const assetId = randomUUID();
  const originalName = `${assetId.slice(0, 8)}-${cleanFileName(mp.filename || `${typeParsed.data}`)}`;
  const publicId = `${typeParsed.data}-${Date.now()}-${assetId.slice(0, 8)}`;
  const uploaded = await uploadBufferAuto(cfg, buf, { folder, publicId, mime });
  const path = `${folder}/${originalName}`;
  const url = buildPublicUrl(bucket, path, uploaded.secure_url || null, cfg);

  await insertStorageAsset({
    id: assetId,
    user_id: c.user_id,
    name: originalName,
    bucket,
    path,
    folder,
    mime,
    size: uploaded.bytes ?? buf.length,
    url,
    provider: cfg.driver === 'local' ? 'local' : 'cloudinary',
    provider_public_id: uploaded.public_id ?? null,
    provider_resource_type: uploaded.resource_type ?? null,
    provider_format: uploaded.format ?? null,
    provider_version: uploaded.version ?? null,
    etag: uploaded.etag ?? null,
    metadata: { consultant_id: c.id, kyc_document_type: typeParsed.data },
  } as any);

  const doc: KycDocument = {
    type: typeParsed.data,
    url,
    storage_asset_id: assetId,
    name: originalName,
    mime,
    size: uploaded.bytes ?? buf.length,
    uploaded_at: new Date().toISOString(),
  };
  const documents = Array.isArray((c as any).kyc_documents) ? ([...(c as any).kyc_documents] as KycDocument[]) : [];
  documents.push(doc);

  await db.update(consultants).set({ kyc_documents: documents, updated_at: new Date() } as any).where(eq(consultants.id, c.id));
  await logKycAudit({ req, topic: 'kyc.document_uploaded', message: 'kyc_document_uploaded', consultantId: c.id, meta: { type: doc.type, storage_asset_id: assetId } });

  return reply.code(201).send({ data: doc });
}

export async function submitKyc(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  if ((c as any).kyc_status === 'pending') return reply.code(409).send({ error: { message: 'kyc_already_pending' } });
  if ((c as any).kyc_status === 'approved') return reply.code(409).send({ error: { message: 'kyc_already_approved' } });

  const error = kycValidationError(c as any);
  if (error) return reply.code(400).send({ error });

  await db.update(consultants).set({
    kyc_status: 'pending',
    kyc_submitted_at: new Date(),
    kyc_reviewed_at: null,
    kyc_rejection_reason: null,
    updated_at: new Date(),
  } as any).where(eq(consultants.id, c.id));

  const adminUserId = String((process.env.KYC_ADMIN_USER_ID || process.env.BOOKING_ADMIN_USER_ID || '')).trim();
  if (adminUserId.length === 36) {
    await createUserNotification({
      userId: adminUserId,
      type: 'custom',
      title: 'Yeni KYC başvurusu',
      message: `Danışman KYC başvurusu bekliyor: ${c.id}`,
    }).catch(() => undefined);
  }
  await logKycAudit({ req, topic: 'kyc.submitted', message: 'kyc_submitted', consultantId: c.id });

  return reply.send({ data: { id: c.id, kyc_status: 'pending' } });
}

/* ─── Admin KYC ─── */
export async function listPendingKyc(req: FastifyRequest, reply: FastifyReply) {
  const result = await db.execute(sql`
    SELECT
      c.id, c.user_id, c.account_type, c.identity_number, c.tax_number, c.tax_office,
      c.company_name, c.billing_address, c.bank_name, c.bank_iban, c.bank_account_holder,
      c.kyc_status, c.kyc_submitted_at, c.kyc_reviewed_at, c.kyc_rejection_reason, c.kyc_documents,
      u.full_name, u.email, u.phone, u.avatar_url
    FROM consultants c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.kyc_status = 'pending'
    ORDER BY c.kyc_submitted_at ASC, c.updated_at ASC
  `);
  return reply.send({ data: rowsFromExecute(result) });
}

async function getConsultantForKycAdmin(consultantId: string) {
  const result = await db.execute(sql`
    SELECT c.id, c.user_id, c.kyc_status, u.email, u.full_name
    FROM consultants c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.id = ${consultantId}
    LIMIT 1
  `);
  return rowsFromExecute(result)[0] ?? null;
}

export async function approveKycAdmin(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = String((req.params as any)?.consultantId || '').trim();
  if (consultantId.length !== 36) return reply.code(400).send({ error: { message: 'invalid_consultant_id' } });

  const row = await getConsultantForKycAdmin(consultantId);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  await db.update(consultants).set({
    kyc_status: 'approved',
    kyc_reviewed_at: new Date(),
    kyc_rejection_reason: null,
    updated_at: new Date(),
  } as any).where(eq(consultants.id, consultantId));

  await logKycAudit({
    req,
    topic: 'kyc.approved',
    message: 'kyc_approved',
    consultantId,
    meta: { reviewed_by: getCallerUserId(req) },
  });

  return reply.send({ data: { id: consultantId, kyc_status: 'approved' } });
}

export async function rejectKycAdmin(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = String((req.params as any)?.consultantId || '').trim();
  if (consultantId.length !== 36) return reply.code(400).send({ error: { message: 'invalid_consultant_id' } });

  const parsed = kycRejectSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const row = await getConsultantForKycAdmin(consultantId);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  await db.update(consultants).set({
    kyc_status: 'rejected',
    kyc_reviewed_at: new Date(),
    kyc_rejection_reason: parsed.data.rejection_reason,
    updated_at: new Date(),
  } as any).where(eq(consultants.id, consultantId));

  await logKycAudit({
    req,
    topic: 'kyc.rejected',
    message: 'kyc_rejected',
    consultantId,
    meta: { reviewed_by: getCallerUserId(req), rejection_reason: parsed.data.rejection_reason },
  });

  if ((row as any).email) {
    const defaultLocale = await getDefaultLocale();
    await sendTemplatedEmail({
      to: String((row as any).email),
      key: 'kyc_rejected_consultant',
      locale: defaultLocale,
      defaultLocale,
      params: {
        consultant_name: String((row as any).full_name || 'Danışman'),
        rejection_reason: parsed.data.rejection_reason,
      },
      allowMissing: true,
    }).catch(() => undefined);
  }

  return reply.send({ data: { id: consultantId, kyc_status: 'rejected' } });
}

/* ─── Blog taslakları (/me/consultant/blog-posts) ─── */
export async function listBlogPosts(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const locale = String((req.query as any)?.locale || 'tr');
  const rows = await customPagesRepo.listCustomPages({
    module_key: 'blog',
    locale,
    sort: 'created_at',
    orderDir: 'desc',
    limit: 500,
  });

  return reply.send({
    data: rows.filter((row) => belongsToConsultantBlog(row, c.id)),
  });
}

export async function createBlogPost(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const input = parsed.data;
  const created = await customPagesRepo.createCustomPage({
    ...input,
    module_key: 'blog',
    is_published: false,
    featured: input.featured ?? false,
    image_url: input.featured_image ?? null,
    tags: mergeConsultantBlogTags(input.tags, c.id),
  });

  return reply.code(201).send({ data: created });
}

export async function updateBlogPost(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const existing = await customPagesRepo.getCustomPageById(id, String((req.query as any)?.locale || 'tr'));
  if (!existing || !belongsToConsultantBlog(existing, c.id)) {
    return reply.code(404).send({ error: { message: 'blog_post_not_found' } });
  }

  const parsed = blogPatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const patch = parsed.data;
  const updated = await customPagesRepo.updateCustomPage(id, {
    ...patch,
    module_key: 'blog',
    // Kapak kaldırma: featured_image açıkça null/'' gönderilirse image_url temizlenir;
    // hiç gönderilmezse (absent) mevcut kapak korunur.
    image_url: Object.prototype.hasOwnProperty.call(patch, 'featured_image')
      ? (patch.featured_image || null)
      : undefined,
    tags: patch.tags !== undefined ? mergeConsultantBlogTags(patch.tags, c.id) : undefined,
    // Danışman düzenlemesi yazıyı yeniden moderasyona düşürür (yayınlanmış içeriğin
    // onay sonrası serbestçe değiştirilmesini önler).
    is_published: false,
  });

  return reply.send({ data: updated });
}

export async function deleteBlogPost(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const existing = await customPagesRepo.getCustomPageById(id);
  if (!existing || !belongsToConsultantBlog(existing, c.id)) {
    return reply.code(404).send({ error: { message: 'blog_post_not_found' } });
  }
  // Yayınlanmış yazı danışman tarafından silinemez (admin moderasyonu); yalnız taslak.
  if ((existing as any).is_published === 1 || (existing as any).is_published === true) {
    return reply.code(409).send({ error: { message: 'published_post_delete_forbidden' } });
  }

  await customPagesRepo.deleteCustomPage(id);
  return reply.send({ data: { id, ok: true } });
}

/* ─── GET /me/consultant/bookings ─── */
export async function listBookings(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const status = ((req.query as any)?.status as string | undefined)?.trim();

  const where = status
    ? and(eq(bookings.consultant_id, c.id), eq(bookings.status, status))
    : eq(bookings.consultant_id, c.id);

  const rows = await db
    .select({
      id: bookings.id,
      user_id: bookings.user_id,
      service_id: bookings.service_id,
      appointment_date: bookings.appointment_date,
      appointment_time: bookings.appointment_time,
      session_duration: bookings.session_duration,
      session_price: bookings.session_price,
      media_type: bookings.media_type,
      status: bookings.status,
      customer_message: bookings.customer_message,
      customer_note: bookings.customer_note,
      admin_note: bookings.admin_note,
      decision_note: bookings.decision_note,
      name: bookings.name,
      email: bookings.email,
      phone: bookings.phone,
      customer_avatar_url: users.avatar_url,
      service_title: consultantServices.name,
      created_at: bookings.created_at,
    })
    .from(bookings)
    .leftJoin(users, eq(users.id, bookings.user_id))
    .leftJoin(consultantServices, eq(consultantServices.id, bookings.service_id))
    .where(where)
    .orderBy(desc(bookings.created_at))
    .limit(200);

  return reply.send({ data: rows });
}

/* ─── POST /me/consultant/bookings/:id/approve ─── */
export async function approveBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  // Statü guard: yalnız beklemedeki/ödeme bekleyen/anlık talepler onaylanabilir.
  // (cancelled/rejected/completed/confirmed onayı → çifte rezervasyon / ödemesiz onay riski.)
  const APPROVABLE = new Set(['pending', 'pending_payment', 'requested_now']);
  if (!APPROVABLE.has(String(b.status))) {
    return reply.code(409).send({ error: { message: 'booking_not_approvable', status: b.status } });
  }
  // Anlık talep 5 dakikadan eskiyse onaylanamaz (timeout).
  if (b.status === 'requested_now') {
    const created = b.created_at ? new Date(b.created_at as any).getTime() : 0;
    if (!created || Date.now() - created > 5 * 60 * 1000) {
      return reply.code(409).send({ error: { message: 'instant_request_expired' } });
    }
  }

  await db.update(bookings).set({ status: 'confirmed' } as any).where(eq(bookings.id, id));

  // Danışana bildirim + email — fire-and-forget
  if (b.user_id) {
    const isInstant = b.status === 'requested_now';
    const title = isInstant ? '✅ Anlık Görüşmeniz Onaylandı' : '✅ Randevunuz Onaylandı';
    const message = isInstant
      ? 'Danışman talebinizi kabul etti. Hemen görüşmeye geçebilirsiniz.'
      : `${b.appointment_date} ${b.appointment_time?.slice(0, 5) ?? ''} için randevunuz onaylandı.`;

    const [consultantUser] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, c.user_id))
      .limit(1);
    const consultantName = consultantUser?.full_name || 'Danışman';
    const locale = (b as any).locale || (await getDefaultLocale());

    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: {
          type: isInstant ? 'booking_approved_instant' : 'booking_approved',
          booking_id: id,
          url: isInstant ? `/booking/${id}/call` : '/dashboard?tab=bookings',
        },
      }),
      b.email
        ? sendTemplatedEmail({
            to: b.email,
            key: 'booking_accepted_customer',
            locale,
            defaultLocale: await getDefaultLocale(),
            params: {
              customer_name: b.name || 'Değerli danışanımız',
              consultant_name: consultantName,
              appointment_date: b.appointment_date || '',
              appointment_time: b.appointment_time?.slice(0, 5) || '',
              decision_note: '',
            },
            allowMissing: true,
          })
        : Promise.resolve(null),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'confirmed' } });
}

/* ─── POST /me/consultant/bookings/:id/reject ─── */
const rejectSchema = z.object({ reason: z.string().trim().min(2).max(2000).optional() });

export async function rejectBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = rejectSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  // Statü guard: yalnız bekleyen talepler reddedilebilir. Onaylanmış/tamamlanmış
  // (ödenmiş) randevu reject edilirse iade akışı olmadan slot boşaltılır → cancel akışı kullanılmalı.
  const REJECTABLE = new Set(['pending', 'pending_payment', 'requested_now']);
  if (!REJECTABLE.has(String(b.status))) {
    return reply.code(409).send({ error: { message: 'booking_not_rejectable', status: b.status } });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'rejected',
        decision_note: parsed.data.reason ?? null,
        decided_by: c.user_id,
        decided_at: new Date(),
      } as any)
      .where(eq(bookings.id, id));

    if (b.slot_id) await releaseSlotTx(tx, { slot_id: b.slot_id });
  });

  // Danışana bildirim + email — fire-and-forget
  if (b.user_id) {
    const title = '❌ Randevunuz Reddedildi';
    const reason = parsed.data.reason ? ` Sebep: ${parsed.data.reason}` : '';
    const message = `Danışman randevu talebinizi reddetti.${reason}`;

    const [consultantUser] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, c.user_id))
      .limit(1);
    const consultantName = consultantUser?.full_name || 'Danışman';
    const locale = (b as any).locale || (await getDefaultLocale());

    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: { type: 'booking_rejected', booking_id: id, url: '/dashboard?tab=bookings' },
      }),
      b.email
        ? sendTemplatedEmail({
            to: b.email,
            key: 'booking_rejected_customer',
            locale,
            defaultLocale: await getDefaultLocale(),
            params: {
              customer_name: b.name || 'Değerli danışanımız',
              consultant_name: consultantName,
              appointment_date: b.appointment_date || '',
              appointment_time: b.appointment_time?.slice(0, 5) || '',
              decision_note: parsed.data.reason || '',
            },
            allowMissing: true,
          })
        : Promise.resolve(null),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'rejected' } });
}

/* ─── POST /me/consultant/bookings/:id/cancel ─── */
const cancelSchema = z.object({ reason: z.string().trim().min(5).max(2000) });

export async function cancelBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = cancelSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  const cancellable = ['requested_now', 'pending_payment', 'pending', 'booked', 'confirmed'];
  if (!cancellable.includes(String(b.status))) {
    return reply.code(409).send({ error: { message: 'booking_not_cancellable' } });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'cancelled',
        decision_note: parsed.data.reason,
        decided_by: c.user_id,
        decided_at: new Date(),
      } as any)
      .where(eq(bookings.id, id));

    if (b.slot_id) await releaseSlotTx(tx, { slot_id: b.slot_id });
  });

  if (b.user_id) {
    const title = 'Randevunuz İptal Edildi';
    const message = `Danışman randevunuzu iptal etti. Sebep: ${parsed.data.reason}`;
    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: { type: 'booking_cancelled_by_consultant', booking_id: id, url: '/dashboard?tab=bookings' },
      }),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'cancelled' } });
}

/* ─── PATCH /me/consultant/bookings/:id/notes ─── */
const notesSchema = z.object({ notes: z.string().trim().max(8000).nullable() });

export async function updateBookingNotes(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = notesSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select({ id: bookings.id }).from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  await db
    .update(bookings)
    .set({ admin_note: parsed.data.notes || null } as any)
    .where(eq(bookings.id, id));

  return reply.send({ data: { id, notes: parsed.data.notes || null } });
}

/* ─── GET /me/consultant/stats ─── */
// T30-9: Geniş stats — bu ay, geçen ay (delta), 7-günlük trend, bekleyen mesaj sayısı
export async function getStats(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const now = new Date();
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
  const twoMonthsAgo = new Date(now); twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

  // Bu ay seans + kazanç (confirmed/completed)
  const [thisMonthRow] = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${bookings.session_price}),0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.consultant_id, c.id),
        gte(bookings.created_at, monthAgo),
        sql`${bookings.status} IN ('confirmed','completed')`,
      ),
    );

  // Geçen ay (60-30 gün arası) — % delta için
  const [lastMonthRow] = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${bookings.session_price}),0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.consultant_id, c.id),
        gte(bookings.created_at, twoMonthsAgo),
        sql`${bookings.created_at} < ${monthAgo}`,
        sql`${bookings.status} IN ('confirmed','completed')`,
      ),
    );

  // Bekleyen randevu sayısı (requested_now dahil — anlık talepler en kritik)
  const [pendingRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(eq(bookings.consultant_id, c.id), sql`${bookings.status} IN ('pending_payment','pending','requested_now')`));

  // T29-4: Anlık görüşme talebi sayısı (5dk timeout) — süresi geçmiş talepler sayılmaz.
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const [requestedNowRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(
      eq(bookings.consultant_id, c.id),
      sql`${bookings.status} = 'requested_now'`,
      gte(bookings.created_at, fiveMinAgo),
    ));

  // 7-günlük trend (her gün için seans sayısı)
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const dailyRows = await db.execute(
    sql`SELECT DATE(created_at) AS day, COUNT(*) AS count, COALESCE(SUM(session_price),0) AS earnings
        FROM bookings
        WHERE consultant_id = ${c.id}
          AND created_at >= ${sevenDaysAgo}
          AND status IN ('confirmed','completed')
        GROUP BY DATE(created_at)
        ORDER BY day ASC`,
  );
  const dailyArr = (Array.isArray((dailyRows as any)?.[0]) ? (dailyRows as any)[0] : (dailyRows as any)) as any[];
  const dailyMap = new Map<string, { count: number; earnings: number }>();
  for (const r of dailyArr || []) {
    const key = String(r.day).slice(0, 10); // 'YYYY-MM-DD'
    dailyMap.set(key, { count: Number(r.count ?? 0), earnings: Number(r.earnings ?? 0) });
  }
  const last7Days: Array<{ date: string; count: number; earnings: number }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const v = dailyMap.get(key) ?? { count: 0, earnings: 0 };
    last7Days.push({ date: key, count: v.count, earnings: v.earnings });
  }

  // Yanıt süresi (chat threads) — basit ortalama: gelen danışan mesajından danışman cevabına kadar geçen ms
  let avgResponseMinutes = 0;
  try {
    const respRows = await db.execute(
      sql`
        SELECT AVG(TIMESTAMPDIFF(MINUTE, m1.created_at, m2.created_at)) AS avg_min
        FROM chat_threads t
        JOIN chat_messages m1 ON m1.thread_id = t.id AND m1.sender_user_id <> ${c.user_id}
        JOIN chat_messages m2 ON m2.thread_id = t.id AND m2.sender_user_id = ${c.user_id}
          AND m2.created_at = (
            SELECT MIN(m3.created_at) FROM chat_messages m3
            WHERE m3.thread_id = t.id AND m3.sender_user_id = ${c.user_id} AND m3.created_at > m1.created_at
          )
        WHERE t.context_type = 'consultant_lead' AND t.context_id = ${c.id}
      `,
    );
    const arr = Array.isArray((respRows as any)?.[0]) ? (respRows as any)[0] : (respRows as any);
    avgResponseMinutes = Number((arr as any[])?.[0]?.avg_min ?? 0);
  } catch {
    avgResponseMinutes = 0;
  }

  // Bekleyen mesaj sayısı — son mesajı danışandan gelen thread'ler (henüz cevap yok)
  let pendingMessages = 0;
  try {
    const pmRows = await db.execute(
      sql`
        SELECT COUNT(*) AS cnt FROM (
          SELECT t.id, MAX(m.created_at) AS last_at,
            (SELECT sender_user_id FROM chat_messages m2 WHERE m2.thread_id = t.id ORDER BY m2.created_at DESC LIMIT 1) AS last_sender
          FROM chat_threads t
          JOIN chat_messages m ON m.thread_id = t.id
          WHERE t.context_type = 'consultant_lead' AND t.context_id = ${c.id}
          GROUP BY t.id
        ) x WHERE x.last_sender <> ${c.user_id}
      `,
    );
    const arr = Array.isArray((pmRows as any)?.[0]) ? (pmRows as any)[0] : (pmRows as any);
    pendingMessages = Number((arr as any[])?.[0]?.cnt ?? 0);
  } catch {
    pendingMessages = 0;
  }

  // Delta hesapla (% değişim)
  const thisCount = Number(thisMonthRow?.count ?? 0);
  const lastCount = Number(lastMonthRow?.count ?? 0);
  const thisTotal = Number(thisMonthRow?.total ?? 0);
  const lastTotal = Number(lastMonthRow?.total ?? 0);
  const sessionDelta = lastCount > 0 ? Math.round(((thisCount - lastCount) / lastCount) * 100) : (thisCount > 0 ? 100 : 0);
  const earningsDelta = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : (thisTotal > 0 ? 100 : 0);

  return reply.send({
    data: {
      this_month_session_count: thisCount,
      this_month_earnings: thisTotal,
      last_month_session_count: lastCount,
      last_month_earnings: lastTotal,
      session_delta_pct: sessionDelta,
      earnings_delta_pct: earningsDelta,
      pending_bookings: Number(pendingRow?.count ?? 0),
      requested_now_count: Number(requestedNowRow?.count ?? 0),
      pending_messages: pendingMessages,
      avg_response_minutes: Math.round(avgResponseMinutes),
      rating_avg: Number(c.rating_avg ?? 0),
      rating_count: Number(c.rating_count ?? 0),
      total_sessions: Number(c.total_sessions ?? 0),
      is_available: Number(c.is_available ?? 0),
      last_7_days: last7Days,
    },
  });
}

/* ─── GET /me/consultant/wallet/monthly-stats ─── */
export async function getWalletMonthlyStats(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const months = parsePositiveInt((req.query as { months?: string | number } | undefined)?.months, 24, 36);
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - (months - 1));

  // Önce caller'ın wallet'ını bul (getMyWallet ile aynı pattern). user_id'ye göre
  // doğrudan filtre olası null/eksik durumda boş döner; wallet_id daha güvenli.
  let byMonth = new Map<string, { earnings: number; sessions: number }>();
  try {
    const walletResult = await db.execute(
      sql`SELECT id FROM wallets WHERE consultant_id = ${c.id} OR user_id = ${c.user_id} ORDER BY CASE WHEN consultant_id = ${c.id} THEN 0 ELSE 1 END, created_at ASC LIMIT 1`,
    );
    const walletRows = Array.isArray((walletResult as any)?.[0]) ? (walletResult as any)[0] : (walletResult as any);
    const w = (walletRows as any[])?.[0];
    if (w?.id) {
      const result = await db.execute(
        sql`
          SELECT DATE_FORMAT(created_at, '%Y-%m') AS year_month,
                 COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) AS earnings,
                 COALESCE(SUM(CASE WHEN type='credit' THEN 1 ELSE 0 END), 0) AS sessions
          FROM wallet_transactions
          WHERE wallet_id = ${w.id}
            AND created_at >= ${start}
            AND payment_status = 'completed'
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY year_month ASC
        `,
      );
      byMonth = new Map(rowsFromExecute(result).map((row: any) => [
        String(row.year_month),
        { earnings: Number(row.earnings ?? 0), sessions: Number(row.sessions ?? 0) },
      ]));
    }
  } catch (err) {
    req.log.warn({ err, consultantId: c.id }, 'monthly_stats_query_failed');
    // Sessizce boş döneriz — UI 0'la grafik çizer.
  }

  const data: Array<{ year_month: string; earnings: number; sessions: number }> = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start);
    d.setUTCMonth(start.getUTCMonth() + i);
    const yearMonth = formatYearMonth(d);
    const v = byMonth.get(yearMonth) ?? { earnings: 0, sessions: 0 };
    data.push({ year_month: yearMonth, ...v });
  }

  return reply.send({ data });
}

/* ─── GET /me/consultant/profile-views ─── */
export async function getProfileViews(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const range = String((req.query as { range?: string } | undefined)?.range ?? '180d');
  const days = Math.min(Math.max(Number(range.replace(/d$/i, '')) || 180, 1), 365);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  const result = await db.execute(
    sql`
      SELECT DATE(viewed_at) AS view_date, COUNT(*) AS count
      FROM consultant_profile_views
      WHERE consultant_id = ${c.id}
        AND viewed_at >= ${start}
      GROUP BY DATE(viewed_at)
      ORDER BY view_date ASC
    `,
  );
  const byDate = new Map(rowsFromExecute(result).map((row: any) => [
    String(row.view_date).slice(0, 10),
    Number(row.count ?? 0),
  ]));

  const data: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = formatDateKey(d);
    data.push({ date: key, count: byDate.get(key) ?? 0 });
  }

  return reply.send({ data });
}

/* ─── GET /me/consultant/clients ─── */
export async function listClients(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const q = String((req.query as { q?: string } | undefined)?.q ?? '').trim();
  const limit = parsePositiveInt((req.query as { limit?: string | number } | undefined)?.limit, 50, 100);
  const offset = Math.max(Number((req.query as { offset?: string | number } | undefined)?.offset ?? 0) || 0, 0);
  const like = `%${q}%`;

  const result = await db.execute(
    q
      ? sql`
          SELECT b.user_id, u.full_name, u.email, u.avatar_url,
                 MAX(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00'))) AS last_booking_at,
                 COUNT(*) AS booking_count
          FROM bookings b
          INNER JOIN users u ON u.id = b.user_id
          WHERE b.consultant_id = ${c.id}
            AND (u.full_name LIKE ${like} OR u.email LIKE ${like})
          GROUP BY b.user_id, u.full_name, u.email, u.avatar_url
          ORDER BY last_booking_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : sql`
          SELECT b.user_id, u.full_name, u.email, u.avatar_url,
                 MAX(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00'))) AS last_booking_at,
                 COUNT(*) AS booking_count
          FROM bookings b
          INNER JOIN users u ON u.id = b.user_id
          WHERE b.consultant_id = ${c.id}
          GROUP BY b.user_id, u.full_name, u.email, u.avatar_url
          ORDER BY last_booking_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
  );

  return reply.send({
    data: rowsFromExecute(result).map((row: any) => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      avatar_url: row.avatar_url,
      last_booking_at: row.last_booking_at,
      booking_count: Number(row.booking_count ?? 0),
    })),
  });
}

/* ─── GET /me/consultant/clients/:userId ─── */
export async function getClientDetail(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const userId = String((req.params as { userId?: string })?.userId ?? '').trim();
  if (!userId) return reply.code(400).send({ error: { message: 'user_id_required' } });

  const userResult = await db.execute(
    sql`
      SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url
      FROM users u
      WHERE u.id = ${userId}
        AND EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.consultant_id = ${c.id})
      LIMIT 1
    `,
  );
  const user = rowsFromExecute(userResult)[0];
  if (!user) return reply.code(404).send({ error: { message: 'client_not_found' } });

  const bookingsResult = await db.execute(
    sql`
      SELECT id, service_id, appointment_date, appointment_time, session_duration,
             session_price, media_type, status, customer_message, created_at
      FROM bookings
      WHERE consultant_id = ${c.id} AND user_id = ${userId}
      ORDER BY appointment_date DESC, appointment_time DESC, created_at DESC
      LIMIT 100
    `,
  );

  return reply.send({ data: { user, bookings: rowsFromExecute(bookingsResult) } });
}

/* ─── GET /me/consultant/profile-completion ─── */
export async function getProfileCompletion(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const [u] = await db
    .select({ avatar_url: users.avatar_url })
    .from(users)
    .where(eq(users.id, c.user_id))
    .limit(1);

  const statsResult = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM consultant_services WHERE consultant_id = ${c.id} AND is_active = 1) AS service_count,
      (SELECT COUNT(*) FROM consultant_services WHERE consultant_id = ${c.id} AND is_active = 1 AND is_free = 1) AS free_service_count,
      (SELECT COUNT(*) FROM resource_slots rs
        INNER JOIN resources r ON r.id = rs.resource_id
        WHERE r.external_ref_id = ${c.id} AND rs.is_active = 1) AS availability_count,
      (SELECT COUNT(*) FROM reviews WHERE target_type='consultant' AND target_id = ${c.id} AND is_approved = 1) AS review_count
  `);
  const stats = rowsFromExecute(statsResult)[0] as any;
  const expertise = Array.isArray(c.expertise) ? c.expertise : [];
  const languages = Array.isArray(c.languages) ? c.languages : [];
  const bankIban = typeof (c as any).bank_iban === 'string' ? normalizeIban((c as any).bank_iban) : '';

  const items = [
    { id: 'avatar', label: 'Profil fotoğrafı yüklenmiş', done: Boolean(u?.avatar_url), weight: 10 },
    { id: 'bio_500', label: 'Kendinizi anlatın metni 500 karakter veya daha uzun', done: String(c.bio ?? '').trim().length >= 500, weight: 15 },
    { id: 'multi_package', label: 'En az 2 hizmet paketi var', done: Number(stats?.service_count ?? 0) >= 2, weight: 20 },
    { id: 'free_intro', label: 'Ücretsiz tanışma paketi var', done: Number(stats?.free_service_count ?? 0) >= 1, weight: 10 },
    { id: 'expertise_3', label: 'En az 3 uzmanlık seçilmiş', done: expertise.length >= 3, weight: 10 },
    { id: 'language_1', label: 'En az 1 dil seçilmiş', done: languages.length >= 1, weight: 5 },
    { id: 'availability', label: 'Müsaitlik saatleri tanımlı', done: Number(stats?.availability_count ?? 0) >= 1, weight: 15 },
    { id: 'bank_iban', label: 'Banka IBAN bilgisi tanımlı', done: /^TR\d{24}$/.test(bankIban), weight: 10 },
    { id: 'approved_review', label: 'En az 1 onaylı yorum var', done: Number(stats?.review_count ?? 0) >= 1, weight: 5 },
  ];
  const score = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const status = score >= 90 ? 'excellent' : score >= 70 ? 'improvable' : 'incomplete';

  return reply.send({ data: { score, status, items } });
}

/* ─── GET /me/consultant/threads ─── */
// Bu danışmana gelen consultant_lead thread'lerini listele.
// Her thread için son mesaj + okunmamış sayısı dönülür.
export async function listMessageThreads(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // context_type='consultant_lead' olanlar + bu danışmanın booking thread'leri
  const threads = await db
    .select({
      id: chat_threads.id,
      context_type: chat_threads.context_type,
      context_id: chat_threads.context_id,
      created_by_user_id: chat_threads.created_by_user_id,
      created_at: chat_threads.created_at,
      updated_at: chat_threads.updated_at,
    })
    .from(chat_threads)
    .where(
      sql`(
        (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
        OR (
          ${chat_threads.context_type} = 'booking'
          AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = ${chat_threads.context_id}
              AND b.consultant_id = ${c.id}
          )
        )
      )`,
    )
    .orderBy(desc(chat_threads.updated_at));

  // Her thread için: son mesaj + danışan adı
  const enriched = await Promise.all(
    threads.map(async (t) => {
      // Son mesaj
      const [last] = await db
        .select({
          id: chat_messages.id,
          text: chat_messages.text,
          sender_user_id: chat_messages.sender_user_id,
          created_at: chat_messages.created_at,
        })
        .from(chat_messages)
        .where(eq(chat_messages.thread_id, t.id))
        .orderBy(desc(chat_messages.created_at))
        .limit(1);

      // Danışan adı (created_by_user_id'den)
      let customer = null as null | { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
      if (t.created_by_user_id) {
        const [u] = await db
          .select({
            id: users.id,
            full_name: users.full_name,
            email: users.email,
            avatar_url: users.avatar_url,
          })
          .from(users)
          .where(eq(users.id, t.created_by_user_id))
          .limit(1);
        if (u) customer = u;
      }

      const [participant] = await db
        .select({ last_read_at: chat_participants.last_read_at })
        .from(chat_participants)
        .where(and(eq(chat_participants.thread_id, t.id), eq(chat_participants.user_id, c.user_id)))
        .limit(1);

      const unreadRows = await db.execute(
        sql`
          SELECT COUNT(*) AS cnt
          FROM chat_messages
          WHERE thread_id = ${t.id}
            AND sender_user_id <> ${c.user_id}
            AND (${participant?.last_read_at ?? null} IS NULL OR created_at > ${participant?.last_read_at ?? null})
        `,
      );
      const unreadArr = Array.isArray((unreadRows as any)?.[0]) ? (unreadRows as any)[0] : (unreadRows as any);
      const unreadCount = Number((unreadArr as any[])?.[0]?.cnt ?? 0);

      return {
        thread_id: t.id,
        context_type: t.context_type,
        context_id: t.context_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        customer,
        unread_count: unreadCount,
        last_message: last
          ? {
              id: last.id,
              text: last.text,
              sender_user_id: last.sender_user_id,
              created_at: last.created_at,
              from_consultant: last.sender_user_id === c.user_id,
            }
          : null,
      };
    }),
  );

  return reply.send({ data: enriched });
}

/* ─── GET /me/consultant/threads/:id/messages ─── */
export async function listMessagesInThread(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };

  // Thread bu consultant'a mı ait kontrol et
  const [t] = await db
    .select()
    .from(chat_threads)
    .where(
      and(
        eq(chat_threads.id, id),
        sql`(
          (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
          OR (
            ${chat_threads.context_type} = 'booking'
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id = ${chat_threads.context_id}
                AND b.consultant_id = ${c.id}
            )
          )
        )`,
      ),
    )
    .limit(1);
  if (!t) return reply.code(404).send({ error: { message: 'not_found' } });

  const messages = await db
    .select({
      id: chat_messages.id,
      thread_id: chat_messages.thread_id,
      sender_user_id: chat_messages.sender_user_id,
      text: chat_messages.text,
      created_at: chat_messages.created_at,
    })
    .from(chat_messages)
    .where(eq(chat_messages.thread_id, id))
    .orderBy(chat_messages.created_at);

  await db.execute(
    sql`
      INSERT INTO chat_participants (id, thread_id, user_id, role, joined_at, last_read_at)
      VALUES (${randomUUID()}, ${id}, ${c.user_id}, 'consultant', NOW(), NOW())
      ON DUPLICATE KEY UPDATE last_read_at = NOW()
    `,
  );

  return reply.send({
    data: {
      thread_id: id,
      messages: messages.map((m) => ({
        ...m,
        from_consultant: m.sender_user_id === c.user_id,
      })),
    },
  });
}

/* ─── POST /me/consultant/messages/:id/mark-read ─── */
export async function markThreadRead(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const [t] = await db
    .select({ id: chat_threads.id })
    .from(chat_threads)
    .where(
      and(
        eq(chat_threads.id, id),
        sql`(
          (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
          OR (
            ${chat_threads.context_type} = 'booking'
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id = ${chat_threads.context_id}
                AND b.consultant_id = ${c.id}
            )
          )
        )`,
      ),
    )
    .limit(1);
  if (!t) return reply.code(404).send({ error: { message: 'not_found' } });

  const now = new Date();
  await db.execute(
    sql`
      INSERT INTO chat_participants (id, thread_id, user_id, role, joined_at, last_read_at)
      VALUES (${randomUUID()}, ${id}, ${c.user_id}, 'consultant', ${now}, ${now})
      ON DUPLICATE KEY UPDATE last_read_at = ${now}
    `,
  );

  return reply.send({ data: { ok: true, thread_id: id, last_read_at: now, unread_count: 0 } });
}

/* ─── POST /me/consultant/threads/:id/reply ─── */
const replySchema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function replyInThread(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [t] = await db
    .select()
    .from(chat_threads)
    .where(
      and(
        eq(chat_threads.id, id),
        sql`(
          (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
          OR (
            ${chat_threads.context_type} = 'booking'
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id = ${chat_threads.context_id}
                AND b.consultant_id = ${c.id}
            )
          )
        )`,
      ),
    )
    .limit(1);
  if (!t) return reply.code(404).send({ error: { message: 'not_found' } });

  const messageId = randomUUID();
  const now = new Date();
  await db.insert(chat_messages).values({
    id: messageId,
    thread_id: id,
    sender_user_id: c.user_id,
    text: parsed.data.text,
    created_at: now,
  } as any);

  // Thread updated_at'i güncelle
  await db.update(chat_threads).set({ updated_at: now } as any).where(eq(chat_threads.id, id));

  // Karşı tarafa (danışan) bildirim + push — reply'lar önceden hiç bildirim üretmiyordu.
  try {
    const recip = await db.execute(
      sql`SELECT sender_user_id FROM chat_messages WHERE thread_id = ${id} AND sender_user_id <> ${c.user_id} ORDER BY created_at ASC LIMIT 1`,
    );
    const recipArr = Array.isArray((recip as any)?.[0]) ? (recip as any)[0] : (recip as any);
    const recipientId = (recipArr as any[])?.[0]?.sender_user_id;
    if (recipientId) {
      const [cu] = await db.select({ full_name: users.full_name }).from(users).where(eq(users.id, c.user_id)).limit(1);
      const title = `💬 ${cu?.full_name || 'Danışman'}`;
      const body = parsed.data.text.slice(0, 120);
      Promise.allSettled([
        createUserNotification({ userId: String(recipientId), title, message: body, type: 'message' }),
        dispatchPushToUser({ userId: String(recipientId), title, body, data: { type: 'chat_message', thread_id: id, url: '/dashboard?tab=messages' } }),
      ]).catch(() => undefined);
    }
  } catch { /* bildirim best-effort */ }

  return reply.send({
    data: {
      id: messageId,
      thread_id: id,
      sender_user_id: c.user_id,
      text: parsed.data.text,
      created_at: now,
      from_consultant: true,
    },
  });
}

/* ─── GET /me/consultant/wallet ─── */
// T30-7: Cüzdan bakiyesi + son işlemler.
// Raw SQL ile direkt sorguluyoruz: wallet shared modülü user_id, danışman paneli ise consultant_id ile ilişki kuruyor.
export async function getMyWallet(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // Cüzdan kaydı (consultant_id = bu danışman)
  const walletResult = await db.execute(
    sql`SELECT id, user_id, consultant_id, balance, pending_balance, currency, created_at, updated_at
        FROM wallets
        WHERE consultant_id = ${c.id} OR user_id = ${c.user_id}
        ORDER BY CASE WHEN consultant_id = ${c.id} THEN 0 ELSE 1 END, created_at ASC
        LIMIT 1`,
  );
  const walletRows = Array.isArray((walletResult as any)?.[0]) ? (walletResult as any)[0] : (walletResult as any);
  const w = (walletRows as any[])?.[0];

  if (!w) {
    // Cüzdan yoksa boş kaydı oluştur
    const newId = randomUUID();
    await db.execute(
      sql`INSERT INTO wallets (id, user_id, consultant_id, balance, pending_balance, currency)
          VALUES (${newId}, ${c.user_id}, ${c.id}, 0.00, 0.00, 'TRY')
          ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)`,
    );
    return reply.send({
      data: {
        wallet: {
          id: newId,
          balance: '0.00',
          pending_balance: '0.00',
          currency: 'TRY',
        },
        transactions: [],
        this_month: { credits: 0, debits: 0, net: 0 },
      },
    });
  }

  if (!w.consultant_id) {
    await db.execute(sql`UPDATE wallets SET consultant_id = ${c.id} WHERE id = ${w.id}`);
  }

  // İşlem geçmişi (varsa wallet_transactions tablosundan)
  let transactions: any[] = [];
  let monthCredits = 0;
  let monthDebits = 0;
  try {
    const query = req.query as {
      from?: string;
      to?: string;
      page?: string | number;
      page_size?: string | number;
      type?: string;
    };
    const page = parsePositiveInt(query?.page, 1, 100000);
    const pageSize = parsePositiveInt(query?.page_size, 50, 100);
    const offset = (page - 1) * pageSize;
    const from = query?.from && /^\d{4}-\d{2}-\d{2}$/.test(String(query.from)) ? `${query.from} 00:00:00` : null;
    const to = query?.to && /^\d{4}-\d{2}-\d{2}$/.test(String(query.to)) ? `${query.to} 23:59:59` : null;
    const type = query?.type === 'credit' || query?.type === 'debit' ? query.type : null;
    const txResult = await db.execute(
      sql`SELECT id, wallet_id, user_id, amount, currency, type, purpose, description, payment_method, payment_status, transaction_ref, is_admin_created, created_at
          FROM wallet_transactions
          WHERE wallet_id = ${w.id}
            AND (${from} IS NULL OR created_at >= ${from})
            AND (${to} IS NULL OR created_at <= ${to})
            AND (${type} IS NULL OR type = ${type})
          ORDER BY created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}`,
    );
    const txRows = Array.isArray((txResult as any)?.[0]) ? (txResult as any)[0] : (txResult as any);
    transactions = (txRows as any[]) ?? [];

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sumResult = await db.execute(
      sql`SELECT
          COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) AS credits,
          COALESCE(SUM(CASE WHEN type='debit' THEN amount ELSE 0 END), 0) AS debits
          FROM wallet_transactions
          WHERE wallet_id = ${w.id} AND created_at >= ${monthAgo} AND payment_status = 'completed'`,
    );
    const sumRows = Array.isArray((sumResult as any)?.[0]) ? (sumResult as any)[0] : (sumResult as any);
    const sumRow = (sumRows as any[])?.[0];
    monthCredits = Number(sumRow?.credits ?? 0);
    monthDebits = Number(sumRow?.debits ?? 0);
  } catch {
    // Eski local DB'lerde wallet_transactions yoksa boş işlem listesiyle devam et.
    transactions = [];
  }

  return reply.send({
    data: {
      wallet: {
        id: w.id,
        balance: w.balance,
        pending_balance: w.pending_balance,
        currency: w.currency,
      },
      transactions,
      this_month: { credits: monthCredits, debits: monthDebits, net: monthCredits - monthDebits },
    },
  });
}

/* ─── POST /me/consultant/wallet/withdraw ─── */
// T30-7: Para çekme talebi (admin onaylı).
const withdrawSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().trim().max(500).optional(),
});

const withdrawalAdminActionSchema = z.object({
  admin_note: z.string().trim().max(1000).optional(),
  rejection_reason: z.string().trim().min(2).max(2000).optional(),
  transfer_reference: z.string().trim().max(120).optional(),
});

function requestUserIsAdmin(req: FastifyRequest): boolean {
  const user = (req as any).user as { role?: unknown; roles?: unknown; is_admin?: unknown } | undefined;
  return user?.is_admin === true || user?.role === 'admin' || (Array.isArray(user?.roles) && user.roles.includes('admin'));
}

function parseJsonSetting<T extends Record<string, unknown>>(raw: unknown): T | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as T;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

async function getPayoutCycleSetting(): Promise<{ intervalDays: number; minThreshold: number; mode: string }> {
  const result = await db.execute(sql`
    SELECT value
    FROM site_settings
    WHERE \`key\` = 'payout_cycle' AND locale = '*'
    LIMIT 1
  `);
  const row = rowsFromExecute<{ value: unknown }>(result)[0];
  const value = parseJsonSetting(row?.value);
  const intervalDays = Number(value?.interval_days);
  const minThreshold = Number(value?.min_threshold);
  return {
    intervalDays: Number.isFinite(intervalDays) && intervalDays > 0 ? Math.floor(intervalDays) : 30,
    minThreshold: Number.isFinite(minThreshold) && minThreshold > 0 ? minThreshold : 100,
    mode: typeof value?.mode === 'string' && value.mode ? value.mode : 'monthly',
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function emailWithdrawalStatus(row: any, status: 'approved' | 'paid' | 'rejected', extra?: Record<string, unknown>) {
  if (!row?.email) return Promise.resolve(null);
  const key = `withdrawal_${status}_consultant`;
  return sendTemplatedEmail({
    to: String(row.email),
    key,
    locale: 'tr',
    defaultLocale: 'tr',
    params: {
      consultant_name: String(row.full_name || 'Danışman'),
      amount: String(row.amount || ''),
      currency: String(row.currency || 'TRY'),
      bank_iban: String(row.bank_iban || ''),
      transfer_reference: String(row.transfer_reference || ''),
      rejection_reason: String(row.rejection_reason || ''),
      ...(extra ?? {}),
    },
    allowMissing: true,
  }).catch(() => null);
}

export async function requestWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  if ((c as any).kyc_status !== 'approved') {
    return reply.code(403).send({ error: { message: 'kyc_required_for_withdrawal' } });
  }

  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const payoutCycle = await getPayoutCycleSetting();
  if (parsed.data.amount < payoutCycle.minThreshold) {
    return reply.code(400).send({
      error: { message: 'below_min_withdrawal_amount' },
      min_amount: payoutCycle.minThreshold,
    });
  }

  const force = ((req.query || {}) as { force?: string | boolean }).force;
  const bypassCycle = requestUserIsAdmin(req) && (force === true || force === 'true' || force === '1');
  if (!bypassCycle && payoutCycle.intervalDays > 0) {
    const lastResult = await db.execute(sql`
      SELECT id, status, requested_at
      FROM withdrawal_requests
      WHERE consultant_id = ${c.id}
        AND status IN ('approved', 'paid', 'pending')
      ORDER BY requested_at DESC
      LIMIT 1
    `);
    const last = rowsFromExecute<{ id: string; status: string; requested_at: string | Date }>(lastResult)[0];
    if (last?.requested_at) {
      const requestedAt = new Date(last.requested_at);
      const nextRequestAt = addDays(requestedAt, payoutCycle.intervalDays);
      if (!Number.isNaN(nextRequestAt.getTime()) && nextRequestAt.getTime() > Date.now()) {
        return reply.code(429).send({
          error: {
            message: 'withdrawal_too_soon',
            next_request_at: nextRequestAt.toISOString(),
            last_requested_at: requestedAt.toISOString(),
          },
          // Top-level mirrors kept for backwards-compatibility with any
          // earlier client that may already consume them.
          next_request_at: nextRequestAt.toISOString(),
          last_request_at: requestedAt.toISOString(),
          interval_days: payoutCycle.intervalDays,
        });
      }
    }
  }

  // Wallet'i bul; varsa user cüzdanını danışman cüzdanı olarak bağla.
  const wResult = await db.execute(
    sql`SELECT id, consultant_id, balance, currency
        FROM wallets
        WHERE consultant_id = ${c.id} OR user_id = ${c.user_id}
        ORDER BY CASE WHEN consultant_id = ${c.id} THEN 0 ELSE 1 END, created_at ASC
        LIMIT 1`,
  );
  const wRows = Array.isArray((wResult as any)?.[0]) ? (wResult as any)[0] : (wResult as any);
  const w = (wRows as any[])?.[0];

  if (!w) return reply.code(400).send({ error: { message: 'wallet_not_found' } });
  if (!w.consultant_id) {
    await db.execute(sql`UPDATE wallets SET consultant_id = ${c.id} WHERE id = ${w.id}`);
  }

  const balance = Number(w.balance);
  if (parsed.data.amount > balance) {
    return reply.code(400).send({ error: { message: 'insufficient_balance', balance } });
  }

  const bankIban = typeof (c as any).bank_iban === 'string' ? normalizeIban((c as any).bank_iban) : '';
  if (!/^TR\d{24}$/.test(bankIban)) {
    return reply.code(400).send({ error: { message: 'bank_iban_required' } });
  }

  const txId = randomUUID();
  const withdrawalId = randomUUID();
  const bankHolder = String((c as any).bank_account_holder || '').trim();
  const bankName = String((c as any).bank_name || '').trim();
  if (!bankHolder) return reply.code(400).send({ error: { message: 'bank_account_holder_required' } });
  const desc = [
    parsed.data.notes,
    `Withdrawal: ${withdrawalId}`,
    `IBAN: ${bankIban}`,
    bankHolder ? `Hesap sahibi: ${bankHolder}` : null,
    bankName ? `Banka: ${bankName}` : null,
  ].filter(Boolean).join(' | ');
  try {
    await db.transaction(async (tx) => {
      // Bakiye düşümü koşullu (WHERE balance >= amount). 0 satır etkilenirse
      // (yarış durumu / yetersiz bakiye) tx'i abort et → talep/debit oluşmasın.
      const upd = await tx.execute(sql`
        UPDATE wallets
        SET balance = balance - ${String(parsed.data.amount)},
            total_withdrawn = total_withdrawn + ${String(parsed.data.amount)},
            updated_at = NOW(3)
        WHERE id = ${w.id} AND balance >= ${String(parsed.data.amount)}
      `);
      const affected = Number(
        (upd as any)?.affectedRows
        ?? (Array.isArray(upd) ? (upd[0] as any)?.affectedRows : 0)
        ?? 0,
      );
      if (affected < 1) throw new Error('insufficient_balance_race');

      await tx.execute(sql`
        INSERT INTO withdrawal_requests (
          id, consultant_id, user_id, amount, currency, bank_iban, bank_holder, bank_name, status, requested_at, admin_note
        )
        VALUES (
          ${withdrawalId}, ${c.id}, ${c.user_id}, ${String(parsed.data.amount)}, ${w.currency || 'TRY'},
          ${bankIban}, ${bankHolder}, ${bankName || null}, 'pending', NOW(3), ${parsed.data.notes ?? null}
        )
      `);

      await tx.execute(
        sql`INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, currency, purpose, description, payment_status, transaction_ref, is_admin_created)
            VALUES (${txId}, ${w.id}, ${c.user_id}, 'debit', ${String(parsed.data.amount)}, ${w.currency}, 'withdrawal', ${desc}, 'pending', ${withdrawalId}, 0)`,
      );
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'insufficient_balance_race') {
      return reply.code(400).send({ error: { message: 'insufficient_balance', balance } });
    }
    return reply.code(500).send({ error: { message: 'withdrawal_request_failed' } });
  }

  return reply.send({
    data: {
      id: withdrawalId,
      transaction_id: txId,
      status: 'pending',
      amount: parsed.data.amount,
      currency: w.currency,
      message: 'Para çekme talebiniz alındı. Admin onayından sonra hesabınıza geçecektir.',
    },
  });
}

export async function listMyWithdrawals(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const result = await db.execute(sql`
    SELECT id, consultant_id, amount, currency, bank_iban, bank_holder, status,
           requested_at, reviewed_at, paid_at, rejection_reason, admin_note, transfer_reference
    FROM withdrawal_requests
    WHERE consultant_id = ${c.id}
    ORDER BY requested_at DESC
    LIMIT 100
  `);
  return reply.send({ data: rowsFromExecute(result) });
}

export async function listWithdrawalsAdmin(req: FastifyRequest, reply: FastifyReply) {
  const status = String((req.query as any)?.status || '').trim();
  const statusSql = ['pending', 'approved', 'paid', 'rejected', 'cancelled'].includes(status)
    ? sql`AND wr.status = ${status}`
    : sql``;
  const result = await db.execute(sql`
    SELECT wr.*, u.full_name, u.email, u.phone
    FROM withdrawal_requests wr
    INNER JOIN consultants c ON c.id = wr.consultant_id
    INNER JOIN users u ON u.id = c.user_id
    WHERE 1=1 ${statusSql}
    ORDER BY wr.requested_at DESC
    LIMIT 300
  `);
  return reply.send({ data: rowsFromExecute(result) });
}

async function getWithdrawalForAdmin(id: string) {
  const result = await db.execute(sql`
    SELECT wr.*, w.id AS wallet_id, u.id AS user_id, u.full_name, u.email
    FROM withdrawal_requests wr
    INNER JOIN consultants c ON c.id = wr.consultant_id
    INNER JOIN users u ON u.id = c.user_id
    LEFT JOIN wallets w ON w.consultant_id = c.id OR w.user_id = c.user_id
    WHERE wr.id = ${id}
    LIMIT 1
  `);
  return rowsFromExecute(result)[0] ?? null;
}

export async function approveWithdrawalAdmin(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as any)?.id || '').trim();
  if (id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_withdrawal_id' } });
  const parsed = withdrawalAdminActionSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const row = await getWithdrawalForAdmin(id);
  if (!row) return reply.code(404).send({ error: { message: 'withdrawal_not_found' } });
  if ((row as any).status !== 'pending') return reply.code(409).send({ error: { message: 'invalid_withdrawal_status' } });

  await db.execute(sql`
    UPDATE withdrawal_requests
    SET status = 'approved',
        reviewed_at = NOW(3),
        reviewed_by = ${getCallerUserId(req)},
        admin_note = ${parsed.data.admin_note ?? null},
        updated_at = NOW(3)
    WHERE id = ${id}
  `);
  await db.execute(sql`
    UPDATE wallet_transactions
    SET payment_status = 'completed', approved_by = ${getCallerUserId(req)}, approved_at = NOW(3), updated_at = NOW(3)
    WHERE transaction_ref = ${id} AND purpose = 'withdrawal' AND payment_status = 'pending'
  `);
  await logKycAudit({ req, topic: 'withdrawal.approved', message: 'withdrawal_approved', consultantId: String((row as any).consultant_id), meta: { withdrawal_id: id } });
  await emailWithdrawalStatus(row, 'approved', parsed.data);

  return reply.send({ data: { id, status: 'approved' } });
}

export async function rejectWithdrawalAdmin(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as any)?.id || '').trim();
  if (id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_withdrawal_id' } });
  const parsed = withdrawalAdminActionSchema.safeParse(req.body ?? {});
  if (!parsed.success || !parsed.data.rejection_reason) {
    return reply.code(400).send({ error: { message: 'rejection_reason_required' } });
  }

  const row = await getWithdrawalForAdmin(id);
  if (!row) return reply.code(404).send({ error: { message: 'withdrawal_not_found' } });
  if (!['pending', 'approved'].includes(String((row as any).status))) {
    return reply.code(409).send({ error: { message: 'invalid_withdrawal_status' } });
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE withdrawal_requests
      SET status = 'rejected',
          reviewed_at = NOW(3),
          reviewed_by = ${getCallerUserId(req)},
          rejection_reason = ${parsed.data.rejection_reason},
          admin_note = ${parsed.data.admin_note ?? null},
          updated_at = NOW(3)
      WHERE id = ${id}
    `);
    if ((row as any).wallet_id) {
      await tx.execute(sql`
        UPDATE wallets
        SET balance = balance + ${String((row as any).amount)},
            total_withdrawn = GREATEST(total_withdrawn - ${String((row as any).amount)}, 0),
            updated_at = NOW(3)
        WHERE id = ${(row as any).wallet_id}
      `);
    }
    await tx.execute(sql`
      UPDATE wallet_transactions
      SET payment_status = 'failed', updated_at = NOW(3)
      WHERE transaction_ref = ${id} AND purpose = 'withdrawal'
    `);
  });
  await logKycAudit({ req, topic: 'withdrawal.rejected', message: 'withdrawal_rejected', consultantId: String((row as any).consultant_id), meta: { withdrawal_id: id, rejection_reason: parsed.data.rejection_reason } });
  await emailWithdrawalStatus({ ...row, rejection_reason: parsed.data.rejection_reason }, 'rejected', parsed.data);

  return reply.send({ data: { id, status: 'rejected' } });
}

export async function markWithdrawalPaidAdmin(req: FastifyRequest, reply: FastifyReply) {
  const id = String((req.params as any)?.id || '').trim();
  if (id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_withdrawal_id' } });
  const parsed = withdrawalAdminActionSchema.safeParse(req.body ?? {});
  if (!parsed.success || !parsed.data.transfer_reference) {
    return reply.code(400).send({ error: { message: 'transfer_reference_required' } });
  }

  const row = await getWithdrawalForAdmin(id);
  if (!row) return reply.code(404).send({ error: { message: 'withdrawal_not_found' } });
  if (!['pending', 'approved'].includes(String((row as any).status))) {
    return reply.code(409).send({ error: { message: 'invalid_withdrawal_status' } });
  }

  await db.execute(sql`
    UPDATE withdrawal_requests
    SET status = 'paid',
        reviewed_at = COALESCE(reviewed_at, NOW(3)),
        reviewed_by = COALESCE(reviewed_by, ${getCallerUserId(req)}),
        paid_at = NOW(3),
        transfer_reference = ${parsed.data.transfer_reference},
        admin_note = ${parsed.data.admin_note ?? null},
        updated_at = NOW(3)
    WHERE id = ${id}
  `);
  await db.execute(sql`
    UPDATE wallet_transactions
    SET payment_status = 'completed',
        transaction_ref = ${id},
        approved_by = ${getCallerUserId(req)},
        approved_at = COALESCE(approved_at, NOW(3)),
        updated_at = NOW(3)
    WHERE transaction_ref = ${id} AND purpose = 'withdrawal'
  `);
  await logKycAudit({ req, topic: 'withdrawal.paid', message: 'withdrawal_paid', consultantId: String((row as any).consultant_id), meta: { withdrawal_id: id, transfer_reference: parsed.data.transfer_reference } });
  await emailWithdrawalStatus({ ...row, transfer_reference: parsed.data.transfer_reference }, 'paid', parsed.data);

  return reply.send({ data: { id, status: 'paid' } });
}

/* ─── GET /me/consultant/reviews ─── */
// T30-8: Bu danışmana yazılmış yorumları listele (cevap dahil).
export async function listMyReviews(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const status = String((req.query as { status?: string } | undefined)?.status ?? '').trim();
  const statusSql =
    status === 'approved'
      ? sql`AND r.is_approved = 1`
      : status === 'pending'
        ? sql`AND r.is_approved = 0`
        : status === 'replied'
          ? sql`AND i.consultant_reply IS NOT NULL AND i.consultant_reply <> ''`
          : status === 'unreplied'
            ? sql`AND (i.consultant_reply IS NULL OR i.consultant_reply = '')`
            : sql``;

  // reviews + review_i18n LEFT JOIN — yorum metni + danışman cevabı
  const rows = await db.execute(
    sql`
      SELECT
        r.id,
        r.target_type,
        r.target_id,
        r.user_id,
        r.name,
        r.email,
        r.rating,
        r.is_active,
        r.is_approved,
        r.is_verified,
        r.helpful_count,
        r.created_at,
        i.comment,
        i.consultant_reply,
        i.consultant_replied_at,
        i.locale
      FROM reviews r
      LEFT JOIN review_i18n i ON i.review_id = r.id AND i.locale = r.submitted_locale
      WHERE r.target_type = 'consultant'
        AND r.target_id COLLATE utf8mb4_unicode_ci = ${c.id} COLLATE utf8mb4_unicode_ci
        AND r.is_active = 1
        ${statusSql}
      ORDER BY r.created_at DESC
      LIMIT 200
    `,
  );
  const arr = (Array.isArray((rows as any)?.[0]) ? (rows as any)[0] : (rows as any)) as any[];
  return reply.send({ data: arr ?? [] });
}

/* ─── POST /me/consultant/reviews/:id/reply ─── */
const reviewReplySchema = z.object({ reply: z.string().trim().min(1).max(2000) });

export async function replyToReview(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = reviewReplySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  // Yorumun bu danışmana ait olup olmadığını doğrula
  const ownCheck = await db.execute(
    sql`SELECT id FROM reviews WHERE id = ${id}
        AND target_type = 'consultant'
        AND target_id COLLATE utf8mb4_unicode_ci = ${c.id} COLLATE utf8mb4_unicode_ci
        LIMIT 1`,
  );
  const ownArr = Array.isArray((ownCheck as any)?.[0]) ? (ownCheck as any)[0] : (ownCheck as any);
  if (!(ownArr as any[])?.[0]) return reply.code(404).send({ error: { message: 'not_found' } });

  // review_i18n'a cevap yaz (varsa update, yoksa insert — sessiz kayıp fix)
  const now = new Date();
  const upd = await db.execute(
    sql`
      UPDATE review_i18n
      SET consultant_reply = ${parsed.data.reply},
          consultant_replied_at = ${now}
      WHERE review_id = ${id}
    `,
  );
  const affected = Number(
    (upd as any)?.affectedRows
    ?? (Array.isArray(upd) ? (upd[0] as any)?.affectedRows : 0)
    ?? 0,
  );
  if (affected < 1) {
    // i18n satırı yok → review'ın submitted_locale'i ile ekle (comment NOT NULL → '').
    const rev = await db.execute(sql`SELECT submitted_locale FROM reviews WHERE id = ${id} LIMIT 1`);
    const revArr = Array.isArray((rev as any)?.[0]) ? (rev as any)[0] : (rev as any);
    const loc = String((revArr as any[])?.[0]?.submitted_locale || 'tr');
    await db.execute(
      sql`INSERT INTO review_i18n (id, review_id, locale, comment, consultant_reply, consultant_replied_at)
          VALUES (UUID(), ${id}, ${loc}, '', ${parsed.data.reply}, ${now})
          ON DUPLICATE KEY UPDATE consultant_reply = VALUES(consultant_reply), consultant_replied_at = VALUES(consultant_replied_at)`,
    );
  }

  return reply.send({
    data: {
      id,
      consultant_reply: parsed.data.reply,
      consultant_replied_at: now,
    },
  });
}

/* ─── GET /me/consultant/availability ─── */
// T30-4: Haftalık çalışma saatleri (resource_working_hours).
export async function getMyAvailability(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // Resource'u bul (external_ref_id = consultant.id)
  const rRes = await db.execute(
    sql`SELECT id, title FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) {
    return reply.send({ data: { resource_id: null, working_hours: [] } });
  }

  const whRes = await db.execute(
    sql`SELECT id, CASE WHEN dow = 0 THEN 7 ELSE dow END AS dow, start_time, end_time, slot_minutes, capacity, is_active
        FROM resource_working_hours WHERE resource_id = ${resource.id} ORDER BY dow ASC, start_time ASC`,
  );
  const whArr = (Array.isArray((whRes as any)?.[0]) ? (whRes as any)[0] : (whRes as any)) as any[];

  return reply.send({
    data: {
      resource_id: resource.id,
      resource_title: resource.title,
      working_hours: whArr ?? [],
    },
  });
}

/* ─── PUT /me/consultant/availability ─── */
// T30-4: Bulk replace — gönderilen array yeni working_hours.
const availSchema = z.object({
  hours: z.array(z.object({
    dow: z.coerce.number().int().min(0).max(7).transform((dow) => (dow === 0 ? 7 : dow)),
    start_time: hhMmSchema,
    end_time: hhMmSchema,
    slot_minutes: z.coerce.number().int().positive().max(appConfig.consultants.maxSessionDurationMinutes).default(appConfig.consultants.defaultSessionDurationMinutes),
    capacity: z.coerce.number().int().positive().max(100).default(1),
    is_active: z.coerce.number().int().min(0).max(1).default(1),
  }).superRefine((h, ctx) => {
    const start = toMinutes(h.start_time);
    const end = toMinutes(h.end_time);
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'end_time_must_be_after_start_time',
        path: ['end_time'],
      });
      return;
    }
    const duration = end - start;
    if (h.slot_minutes > duration || duration % h.slot_minutes !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'slot_minutes_must_divide_time_range',
        path: ['slot_minutes'],
      });
    }
  })).max(50),
}).superRefine((data, ctx) => {
  const byDow = new Map<number, Array<{ index: number; start: number; end: number }>>();
  data.hours.forEach((h, index) => {
    if (h.is_active !== 1) return;
    const start = toMinutes(h.start_time);
    const end = toMinutes(h.end_time);
    if (end <= start) return;
    const list = byDow.get(h.dow) ?? [];
    list.push({ index, start, end });
    byDow.set(h.dow, list);
  });
  for (const slots of byDow.values()) {
    slots.sort((a, b) => a.start - b.start);
    for (let i = 1; i < slots.length; i += 1) {
      if (slots[i]!.start < slots[i - 1]!.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'availability_slots_overlap',
          path: ['hours', slots[i]!.index, 'start_time'],
        });
      }
    }
  }
});

export async function updateMyAvailability(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = availSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const rRes = await db.execute(
    sql`SELECT id FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) return reply.code(400).send({ error: { message: 'resource_not_found' } });

  // Replace strategy: sil + yeniden ekle. Transaction içinde → ortada hata olursa
  // danışmanın tüm çalışma saatleri kaybolmaz (atomik). capacity 1:1 seans → sabit 1.
  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM resource_working_hours WHERE resource_id = ${resource.id}`);
    for (const h of parsed.data.hours) {
      await tx.execute(
        sql`INSERT INTO resource_working_hours (id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
            VALUES (UUID(), ${resource.id}, ${h.dow}, ${h.start_time}, ${h.end_time}, ${h.slot_minutes}, 0, 1, ${h.is_active})`,
      );
    }
  });

  return reply.send({ data: { resource_id: resource.id, count: parsed.data.hours.length } });
}

/* ─── POST /me/consultant/availability/day ─── */
// T30-4: Tek seferlik gün kapatma/açma. Mevcut availability override altyapısını kullanır.
const availabilityDayOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.coerce.number().int().min(0).max(1),
});

export async function overrideMyAvailabilityDay(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = availabilityDayOverrideSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  }

  const rRes = await db.execute(
    sql`SELECT id FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) return reply.code(400).send({ error: { message: 'resource_not_found' } });

  try {
    const out = await overrideDaySlots({
      resource_id: String(resource.id),
      dateYmd: parsed.data.date,
      is_active: parsed.data.is_active as 0 | 1,
    });

    return reply.send({
      data: {
        resource_id: String(resource.id),
        date: parsed.data.date,
        is_active: parsed.data.is_active,
        ...out,
      },
    });
  } catch (e: any) {
    if (String(e?.code || '') === 'slot_has_reservations') {
      return reply.code(409).send({ error: { message: 'slot_has_reservations', details: e?.details } });
    }
    throw e;
  }
}

/* =============================================================================
 * CUSTOMER (NON-CONSULTANT) MESSAGE INBOX
 * Kullanıcı tarafı: danışan /me/customer/threads* endpoint'leri.
 * Mirror of consultant's /me/consultant/threads but viewing from buyer's
 * perspective — returns thread with `consultant` info (not customer).
 * ===========================================================================*/

/* ─── GET /me/customer/threads ─── */
export async function listCustomerThreads(req: FastifyRequest, reply: FastifyReply) {
  const userId = getCallerUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthenticated' } });

  try {
  // chat_participants joinli: kullanıcı thread'in member'ı olduğu tüm threadler.
  const rows = await db
    .select({
      id: chat_threads.id,
      context_type: chat_threads.context_type,
      context_id: chat_threads.context_id,
      created_by_user_id: chat_threads.created_by_user_id,
      created_at: chat_threads.created_at,
      updated_at: chat_threads.updated_at,
      participant_last_read_at: chat_participants.last_read_at,
    })
    .from(chat_participants)
    .innerJoin(chat_threads, eq(chat_threads.id, chat_participants.thread_id))
    .where(eq(chat_participants.user_id, userId))
    .orderBy(desc(chat_threads.updated_at));

  // Booking + consultant_lead context'leri için consultant info çek.
  const enriched = await Promise.all(
    rows.map(async (t) => {
      let consultant: null | { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } = null;

      if (t.context_type === 'booking') {
        const [b] = await db.execute(
          sql`SELECT b.consultant_id, c.display_name, u.full_name, u.avatar_url
              FROM bookings b
              INNER JOIN consultants c ON c.id = b.consultant_id
              INNER JOIN users u ON u.id = c.user_id
              WHERE b.id = ${t.context_id}
              LIMIT 1`,
        );
        const row = Array.isArray(b) ? (b as any)[0] : (b as any);
        if (row) {
          consultant = {
            id: row.consultant_id,
            display_name: row.display_name ?? null,
            full_name: row.full_name ?? null,
            avatar_url: row.avatar_url ?? null,
          };
        }
      } else if (t.context_type === 'consultant_lead') {
        const [c] = await db.execute(
          sql`SELECT c.id AS consultant_id, c.display_name, u.full_name, u.avatar_url
              FROM consultants c
              INNER JOIN users u ON u.id = c.user_id
              WHERE c.id = ${t.context_id}
              LIMIT 1`,
        );
        const row = Array.isArray(c) ? (c as any)[0] : (c as any);
        if (row) {
          consultant = {
            id: row.consultant_id,
            display_name: row.display_name ?? null,
            full_name: row.full_name ?? null,
            avatar_url: row.avatar_url ?? null,
          };
        }
      }

      // Son mesaj
      const [last] = await db
        .select({
          id: chat_messages.id,
          text: chat_messages.text,
          sender_user_id: chat_messages.sender_user_id,
          created_at: chat_messages.created_at,
        })
        .from(chat_messages)
        .where(eq(chat_messages.thread_id, t.id))
        .orderBy(desc(chat_messages.created_at))
        .limit(1);

      // Unread sayısı (caller'ın last_read_at'inden sonra gelen, kendi göndermediği)
      const unreadRows = await db.execute(
        sql`
          SELECT COUNT(*) AS cnt
          FROM chat_messages
          WHERE thread_id = ${t.id}
            AND sender_user_id <> ${userId}
            AND (${t.participant_last_read_at ?? null} IS NULL OR created_at > ${t.participant_last_read_at ?? null})
        `,
      );
      const unreadArr = Array.isArray((unreadRows as any)?.[0]) ? (unreadRows as any)[0] : (unreadRows as any);
      const unreadCount = Number((unreadArr as any[])?.[0]?.cnt ?? 0);

      return {
        thread_id: t.id,
        context_type: t.context_type,
        context_id: t.context_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        consultant,
        unread_count: unreadCount,
        last_message: last
          ? {
              id: last.id,
              text: last.text,
              sender_user_id: last.sender_user_id,
              created_at: last.created_at,
              from_self: last.sender_user_id === userId,
            }
          : null,
      };
    }),
  );

  return reply.send({ data: enriched });
  } catch (err: any) {
    req.log.error(err);
    const code = String(err?.code ?? '').trim();
    const message = String(err?.message ?? '').trim();
    if (
      code === 'ER_NO_SUCH_TABLE' ||
      code === 'ER_BAD_FIELD_ERROR' ||
      message.includes("doesn't exist") ||
      message.includes('Unknown column')
    ) {
      return reply.send({ data: [] });
    }
    return reply.code(500).send({ error: { message: 'customer_threads_failed' } });
  }
}

/* ─── GET /me/customer/threads/:id/messages ─── */
export async function listCustomerThreadMessages(req: FastifyRequest, reply: FastifyReply) {
  const userId = getCallerUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthenticated' } });

  const { id } = req.params as { id: string };
  // Member kontrolü
  const [member] = await db
    .select({ user_id: chat_participants.user_id })
    .from(chat_participants)
    .where(and(eq(chat_participants.thread_id, id), eq(chat_participants.user_id, userId)))
    .limit(1);
  if (!member) return reply.code(404).send({ error: { message: 'not_found' } });

  const messages = await db
    .select({
      id: chat_messages.id,
      thread_id: chat_messages.thread_id,
      sender_user_id: chat_messages.sender_user_id,
      text: chat_messages.text,
      created_at: chat_messages.created_at,
    })
    .from(chat_messages)
    .where(eq(chat_messages.thread_id, id))
    .orderBy(chat_messages.created_at);

  // Her mesaja çağıran kullanıcıya göre from_self ekle (FE balon hizalaması için).
  const messagesWithSelf = messages.map((m) => ({ ...m, from_self: m.sender_user_id === userId }));

  // Görüntüleme = okundu say
  const now = new Date();
  await db.execute(
    sql`
      INSERT INTO chat_participants (id, thread_id, user_id, role, joined_at, last_read_at)
      VALUES (${randomUUID()}, ${id}, ${userId}, 'customer', ${now}, ${now})
      ON DUPLICATE KEY UPDATE last_read_at = ${now}
    `,
  );

  return reply.send({ data: { thread_id: id, messages: messagesWithSelf, last_read_at: now } });
}

/* ─── POST /me/customer/threads/:id/mark-read ─── */
export async function markCustomerThreadRead(req: FastifyRequest, reply: FastifyReply) {
  const userId = getCallerUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthenticated' } });

  const { id } = req.params as { id: string };
  const [member] = await db
    .select({ user_id: chat_participants.user_id })
    .from(chat_participants)
    .where(and(eq(chat_participants.thread_id, id), eq(chat_participants.user_id, userId)))
    .limit(1);
  if (!member) return reply.code(404).send({ error: { message: 'not_found' } });

  const now = new Date();
  await db.execute(
    sql`
      INSERT INTO chat_participants (id, thread_id, user_id, role, joined_at, last_read_at)
      VALUES (${randomUUID()}, ${id}, ${userId}, 'customer', ${now}, ${now})
      ON DUPLICATE KEY UPDATE last_read_at = ${now}
    `,
  );

  return reply.send({ data: { ok: true, thread_id: id, last_read_at: now, unread_count: 0 } });
}

/* ─── POST /me/customer/threads/:id/reply ─── */
const customerReplySchema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function replyAsCustomer(req: FastifyRequest, reply: FastifyReply) {
  const userId = getCallerUserId(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthenticated' } });

  const { id } = req.params as { id: string };
  const parsed = customerReplySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [member] = await db
    .select({ user_id: chat_participants.user_id })
    .from(chat_participants)
    .where(and(eq(chat_participants.thread_id, id), eq(chat_participants.user_id, userId)))
    .limit(1);
  if (!member) return reply.code(404).send({ error: { message: 'not_found' } });

  const messageId = randomUUID();
  const now = new Date();
  await db.insert(chat_messages).values({
    id: messageId,
    thread_id: id,
    sender_user_id: userId,
    text: parsed.data.text,
    created_at: now,
  } as any);

  await db.update(chat_threads).set({ updated_at: now } as any).where(eq(chat_threads.id, id));

  // Karşı tarafa (danışman) bildirim + push.
  try {
    const recip = await db.execute(
      sql`SELECT sender_user_id FROM chat_messages WHERE thread_id = ${id} AND sender_user_id <> ${userId} ORDER BY created_at ASC LIMIT 1`,
    );
    const recipArr = Array.isArray((recip as any)?.[0]) ? (recip as any)[0] : (recip as any);
    const recipientId = (recipArr as any[])?.[0]?.sender_user_id;
    if (recipientId) {
      const [su] = await db.select({ full_name: users.full_name }).from(users).where(eq(users.id, userId)).limit(1);
      const title = `💬 ${su?.full_name || 'Danışan'}`;
      const body = parsed.data.text.slice(0, 120);
      Promise.allSettled([
        createUserNotification({ userId: String(recipientId), title, message: body, type: 'message' }),
        dispatchPushToUser({ userId: String(recipientId), title, body, data: { type: 'chat_message', thread_id: id, url: '/me/consultant?tab=messages' } }),
      ]).catch(() => undefined);
    }
  } catch { /* bildirim best-effort */ }

  return reply.send({
    data: {
      id: messageId,
      thread_id: id,
      sender_user_id: userId,
      text: parsed.data.text,
      created_at: now,
      from_self: true,
    },
  });
}
