import { randomUUID } from 'crypto';
import { and, asc, desc, eq, gt, gte, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { resources } from '@goldmood/shared-backend/modules/resources/schema';
import {
  resourceSlots,
  slotReservations,
} from '@goldmood/shared-backend/modules/availability/schema';
import { consultants } from './schema';
import type {
  AdminListConsultantsQuery,
  ListConsultantsQuery,
  RegisterConsultantBody,
} from './validation';

const SUPPORTED_LOCALES = new Set(['tr', 'en', 'de']);

function normalizeLocale(locale?: string | null) {
  const short = String(locale ?? 'tr').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.has(short) ? short : 'tr';
}

function localizedBioSelect(locale?: string | null) {
  const loc = normalizeLocale(locale);
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ci.bio FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ci_tr.bio FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      ${consultants.bio}
    )
  `;
}

function localizedHeadlineSelect(locale?: string | null) {
  const loc = normalizeLocale(locale);
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ci.headline FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ci_tr.headline FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      NULL
    )
  `;
}

function localizedMetaSelect(column: 'meta_title' | 'meta_description' | 'og_image', locale?: string | null) {
  const loc = normalizeLocale(locale);
  // Meta alanları boşsa OTOMATİK doldur (danışman elle girmese de SEO boş kalmasın):
  //  - og_image → profil fotoğrafı (avatar)
  //  - meta_title → "İsim · Astroloji ve Doğum Haritası Danışmanı"
  //  - meta_description → isim + hizmet özeti (120-160 karakter)
  const fallback =
    column === 'og_image'
      ? sql`NULLIF(${users.avatar_url}, '')`
      : column === 'meta_title'
        ? sql`CONCAT(${users.full_name}, ' · Astroloji ve Doğum Haritası Danışmanı')`
        : column === 'meta_description'
          ? sql`CONCAT(${users.full_name}, ' ile astroloji, doğum haritası ve ruhsal rehberlik seansları. İlişki, kariyer ve yaşam yolunda kişiye özel online danışmanlık.')`
          : sql`NULL`;
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ${sql.raw(column)} FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ${sql.raw(column)} FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      ${fallback}
    )
  `;
}

function favoriteCountSelect() {
  return sql<number>`(SELECT COUNT(*) FROM user_favorites uf_count WHERE uf_count.consultant_id = ${consultants.id})`;
}

function isFavoritedSelect(userId?: string | null) {
  return userId
    ? sql<number>`EXISTS(SELECT 1 FROM user_favorites uf_me WHERE uf_me.consultant_id = ${consultants.id} AND uf_me.user_id = ${userId})`
    : sql<number>`0`;
}

function isOnlineSelect() {
  return sql<number>`EXISTS(
    SELECT 1
    FROM consultant_presence cp
    WHERE cp.consultant_id = ${consultants.id}
      AND cp.last_heartbeat_at > (NOW(3) - INTERVAL 2 MINUTE)
  )`;
}

// Danışmanın aktif ÜCRETLİ hizmetlerinin en düşük fiyatı (yoksa null). Temel
// session_price=0 olsa da kartta "…'den başlayan" fiyatı göstermek için kullanılır.
function minServicePriceSelect() {
  return sql<string | null>`(
    SELECT MIN(cs.price)
    FROM consultant_services cs
    WHERE cs.consultant_id = ${consultants.id}
      AND cs.is_active = 1 AND cs.is_free = 0 AND cs.price > 0
  )`;
}

// Yayınlanabilirlik fiyat şartı: temel seans ücreti > 0 VEYA aktif fiyatlı hizmeti var.
function hasSellablePricePredicate() {
  return sql`(${consultants.session_price} > 0 OR EXISTS(
    SELECT 1 FROM consultant_services cs
    WHERE cs.consultant_id = ${consultants.id}
      AND cs.is_active = 1 AND cs.is_free = 0 AND cs.price > 0
  ))`;
}

function withUserSelect(locale?: string | null, userId?: string | null) {
  return {
    id: consultants.id,
    user_id: consultants.user_id,
    slug: consultants.slug,
    full_name: users.full_name,
    email: users.email,
    phone: users.phone,
    avatar_url: users.avatar_url,
    headline: localizedHeadlineSelect(locale),
    bio: localizedBioSelect(locale),
    meta_title: localizedMetaSelect('meta_title', locale),
    meta_description: localizedMetaSelect('meta_description', locale),
    og_image: localizedMetaSelect('og_image', locale),
    expertise: consultants.expertise,
    languages: consultants.languages,
    gallery: consultants.gallery,
    session_price: consultants.session_price,
    session_duration: consultants.session_duration,
    supports_video: consultants.supports_video,
    currency: consultants.currency,
    approval_status: consultants.approval_status,
    rejection_reason: consultants.rejection_reason,
    is_available: consultants.is_available,
    rating_avg: consultants.rating_avg,
    rating_count: consultants.rating_count,
    total_sessions: consultants.total_sessions,
    favorite_count: favoriteCountSelect(),
    is_favorited: isFavoritedSelect(userId),
    is_online: isOnlineSelect(),
    min_service_price: minServicePriceSelect(),
    created_at: consultants.created_at,
    updated_at: consultants.updated_at,
  };
}

function lightSelect(locale?: string | null, userId?: string | null) {
  return {
    id: consultants.id,
    user_id: consultants.user_id,
    slug: consultants.slug,
    full_name: users.full_name,
    avatar_url: users.avatar_url,
    headline: localizedHeadlineSelect(locale),
    bio: localizedBioSelect(locale),
    meta_title: localizedMetaSelect('meta_title', locale),
    meta_description: localizedMetaSelect('meta_description', locale),
    og_image: localizedMetaSelect('og_image', locale),
    expertise: consultants.expertise,
    languages: consultants.languages,
    gallery: consultants.gallery,
    session_price: consultants.session_price,
    session_duration: consultants.session_duration,
    supports_video: consultants.supports_video,
    currency: consultants.currency,
    approval_status: consultants.approval_status,
    is_available: consultants.is_available,
    rating_avg: consultants.rating_avg,
    rating_count: consultants.rating_count,
    total_sessions: consultants.total_sessions,
    favorite_count: favoriteCountSelect(),
    is_favorited: isFavoritedSelect(userId),
    is_online: isOnlineSelect(),
    min_service_price: minServicePriceSelect(),
    created_at: consultants.created_at,
  };
}

function expertisePredicate(expertise?: string): SQL | undefined {
  const value = expertise?.trim();
  if (!value) return undefined;
  return sql`JSON_CONTAINS(${consultants.expertise}, JSON_QUOTE(${value}))`;
}

export async function listApprovedConsultants(filters: ListConsultantsQuery, locale?: string | null, userId?: string | null) {
  const sort = filters.sort ?? 'featured';
  const onlineOnly = filters.onlineOnly === true || sort === 'online';

  const where = [
    eq(consultants.approval_status, 'approved'),
    // NOT: is_available (Online/Offline toggle) ARTIK listelemeyi ENGELLEMEZ. Danışman
    // onaylı + fiyatlı + slug'lı ise her zaman listede kalır; toggle yalnızca "şu an
    // müsait/değil" rozetini etkiler (randevu gelecek slot'lara göre alınır). Danışmanlar
    // toggle'ı yanlışlıkla kapatınca sitede kaybolmuyor artık. "Sadece online" filtresi
    // is_online (heartbeat) üzerinden çalışır (aşağıdaki onlineOnly).
    // Temel seans ücreti > 0 VEYA aktif fiyatlı hizmeti olan danışmanlar yayınlanır.
    hasSellablePricePredicate(),
    onlineOnly ? sql`${isOnlineSelect()} = 1` : undefined,
    expertisePredicate(filters.expertise),
    filters.minPrice != null ? gte(consultants.session_price, String(filters.minPrice)) : undefined,
    filters.maxPrice != null ? lte(consultants.session_price, String(filters.maxPrice)) : undefined,
    filters.minRating != null ? gte(consultants.rating_avg, String(filters.minRating)) : undefined,
  ].filter(Boolean) as SQL[];

  const orderBy = (() => {
    switch (sort) {
      case 'popular':
        return [desc(consultants.total_sessions), desc(consultants.rating_avg), asc(users.full_name)];
      case 'new':
        return [desc(consultants.created_at), desc(consultants.rating_avg)];
      case 'online':
        return [desc(isOnlineSelect()), desc(consultants.rating_avg), desc(consultants.total_sessions)];
      case 'featured':
      default:
        return [desc(consultants.rating_avg), desc(consultants.total_sessions), asc(users.full_name)];
    }
  })();

  const q = db
    .select(filters.light ? lightSelect(locale, userId) : withUserSelect(locale, userId))
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .where(and(...where))
    .orderBy(...orderBy);

  return filters.limit != null ? q.limit(filters.limit) : q;
}

export async function listConsultantsAdmin(filters: AdminListConsultantsQuery) {
  const where = filters.approval_status
    ? eq(consultants.approval_status, filters.approval_status)
    : undefined;

  const query = db.select(withUserSelect('tr')).from(consultants).innerJoin(users, eq(users.id, consultants.user_id));

  return where
    ? query.where(where).orderBy(desc(consultants.created_at))
    : query.orderBy(desc(consultants.created_at));
}

// UUID v4 formatı: 8-4-4-4-12 hex blokları. Slug'lar bu kalıba uymaz.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function getConsultantById(idOrSlug: string, locale?: string | null, userId?: string | null) {
  const where = UUID_RE.test(idOrSlug)
    ? or(eq(consultants.id, idOrSlug), eq(consultants.slug, idOrSlug))
    : eq(consultants.slug, idOrSlug);

  const [row] = await db
    .select({
      ...withUserSelect(locale, userId),
      resource_id: resources.id,
      resource_title: resources.title,
    })
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .leftJoin(resources, eq(resources.external_ref_id, consultants.id))
    .where(where)
    .limit(1);

  return row ?? null;
}

export async function getApprovedConsultantById(id: string, locale?: string | null, userId?: string | null) {
  const row = await getConsultantById(id, locale, userId);
  if (!row || row.approval_status !== 'approved') return null;
  return row;
}

export async function getConsultantSlots(id: string, date: string, locale?: string | null) {
  const consultant = await getApprovedConsultantById(id, locale);
  if (!consultant?.resource_id) return { consultant, slots: [] };

  const slots = await db
    .select({
      id: resourceSlots.id,
      resource_id: resourceSlots.resource_id,
      slot_date: resourceSlots.slot_date,
      slot_time: resourceSlots.slot_time,
      capacity: resourceSlots.capacity,
      reserved_count: sql<number>`COALESCE(${slotReservations.reserved_count}, 0)`,
      is_active: resourceSlots.is_active,
    })
    .from(resourceSlots)
    .leftJoin(slotReservations, eq(slotReservations.slot_id, resourceSlots.id))
    .where(
      and(
        eq(resourceSlots.resource_id, consultant.resource_id),
        eq(resourceSlots.is_active, 1),
        sql`${resourceSlots.slot_date} = ${date}`,
        sql`COALESCE(${slotReservations.reserved_count}, 0) < ${resourceSlots.capacity}`,
      ),
    )
    .orderBy(asc(resourceSlots.slot_time));

  return { consultant, slots };
}

// Türkçe-uyumlu slug (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u).
function slugifyTr(input: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };
  return (input || '')
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (m) => map[m] ?? m)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

// İsimden benzersiz slug üretir (çakışırsa -2, -3 ...).
export async function generateUniqueConsultantSlug(name: string, excludeId?: string): Promise<string> {
  const root = slugifyTr(name) || 'danisman';
  let candidate = root;
  for (let i = 2; i < 200; i += 1) {
    const [existing] = await db.select({ id: consultants.id }).from(consultants).where(eq(consultants.slug, candidate)).limit(1);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${randomUUID().slice(0, 6)}`;
}

export async function approveConsultant(id: string) {
  await db
    .update(consultants)
    .set({ approval_status: 'approved', rejection_reason: null, updated_at: new Date() } as any)
    .where(eq(consultants.id, id));
  // Slug yoksa isimden üret — public URL (/consultants/<slug>) için gerekli;
  // slug'sız danışman frontend'de düzgün görünmüyordu.
  try {
    const [c] = await db
      .select({ slug: consultants.slug, name: users.full_name })
      .from(consultants)
      .innerJoin(users, eq(users.id, consultants.user_id))
      .where(eq(consultants.id, id))
      .limit(1);
    if (c && !c.slug) {
      const slug = await generateUniqueConsultantSlug(c.name || 'danisman', id);
      await db.update(consultants).set({ slug } as any).where(eq(consultants.id, id));
    }
  } catch (e) {
    console.error('[approveConsultant] slug generation failed:', e);
  }
  // Onaylanan danışman cron'u beklemeden randevu alabilir olsun:
  // resource + default mesai + 30 günlük slotları hemen üret (idempotent).
  try {
    const { runSlotGeneratorJob } = await import('@/cron/slot-generator');
    await runSlotGeneratorJob();
  } catch (e) {
    console.error('[approveConsultant] slot generation failed:', e);
  }
  return getConsultantById(id);
}

export async function rejectConsultant(id: string, rejectionReason: string) {
  await db
    .update(consultants)
    .set({
      approval_status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date(),
    } as any)
    .where(eq(consultants.id, id));
  return getConsultantById(id);
}

type DeleteConsultantResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'not_rejected' | 'has_dependencies' };

/**
 * Reddedilmiş danışman kaydını siler. Güvenlik için yalnızca approval_status='rejected'.
 * createConsultantForUser'ın tersi: consultant + resource silinir, consultant rolü geri alınır.
 * Kullanıcı ve başvuru geçmişi (consultant_applications) korunur.
 */
export async function deleteConsultant(id: string): Promise<DeleteConsultantResult> {
  const [row] = await db
    .select({
      id: consultants.id,
      userId: consultants.user_id,
      status: consultants.approval_status,
    })
    .from(consultants)
    .where(eq(consultants.id, id))
    .limit(1);

  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status !== 'rejected') return { ok: false, reason: 'not_rejected' };

  try {
    await db.transaction(async (tx) => {
      await tx.delete(resources).where(eq(resources.external_ref_id, id));
      await tx.delete(consultants).where(eq(consultants.id, id));
      await tx.execute(
        sql`DELETE FROM user_roles WHERE user_id = ${row.userId} AND role = 'consultant'`,
      );
      // users.role temizliği: admin yetkisi user_roles 'admin'den geldiği için bu güvenli.
      await tx.execute(
        sql`UPDATE users SET role = 'user', updated_at = NOW(3) WHERE id = ${row.userId} AND role = 'consultant'`,
      );
    });
    return { ok: true };
  } catch {
    // FK kısıtı (randevu/ödeme vb. bağlı kayıt) varsa
    return { ok: false, reason: 'has_dependencies' };
  }
}

export async function createConsultantForUser(userId: string, input: RegisterConsultantBody) {
  const id = randomUUID();
  const resourceId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(consultants).values({
      id,
      user_id: userId,
      bio: input.bio ?? null,
      expertise: input.expertise ?? ['astrology'],
      languages: input.languages ?? ['tr'],
      session_price: String(input.session_price),
      session_duration: input.session_duration,
      supports_video: 0,
      currency: input.currency.toUpperCase(),
      agreement_accepted_at: input.agreement_accepted === true ? now : null,
      approval_status: 'pending',
      is_available: 1,
      created_at: now,
      updated_at: now,
    } as any);

    await tx.insert(resources).values({
      id: resourceId,
      type: 'consultant',
      title: `Consultant ${userId.slice(0, 8)}`,
      capacity: 1,
      external_ref_id: id,
      is_active: 0,
      created_at: now,
      updated_at: now,
    } as any);

    await tx.execute(sql`UPDATE users SET role = 'consultant', updated_at = NOW(3) WHERE id = ${userId}`);
    await tx.execute(sql`
      INSERT INTO user_roles (id, user_id, role)
      VALUES (${randomUUID()}, ${userId}, 'consultant')
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `);
  });

  return getConsultantById(id);
}

// db.execute sonucundan satırları çıkar (mysql2 [rows, fields] veya doğrudan dizi).
function execRows<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

// Admin danışman detay tab'ı: KYC + cüzdan + istatistik + son para çekme talepleri.
// Hepsi tek yerde raw SQL — self-only getStats'ı ve shared wallet/withdrawal
// controller'larını bozmadan. wallets/withdrawal_requests bu projede consultant_id
// ile anahtarlı (Drizzle şeması user_id; canlıda ek kolonlar var), o yüzden raw.
export async function getConsultantOverview(id: string) {
  const [base] = execRows<any>(
    await db.execute(sql`
      SELECT c.id, c.kyc_status, c.kyc_submitted_at, c.kyc_reviewed_at, c.kyc_rejection_reason, c.kyc_documents,
             c.account_type, c.identity_number, c.tax_number, c.tax_office, c.company_name, c.billing_address,
             c.bank_name, c.bank_iban, c.bank_account_holder, c.user_id,
             c.rating_avg, c.rating_count, c.total_sessions, c.is_available, c.approval_status,
             u.full_name, u.email, u.phone
      FROM consultants c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.id = ${id}
      LIMIT 1
    `),
  );
  if (!base) return null;

  // kyc_documents JSON string olarak gelebilir → diziye çevir.
  let kycDocs: Array<Record<string, unknown>> = [];
  if (Array.isArray(base.kyc_documents)) kycDocs = base.kyc_documents;
  else if (typeof base.kyc_documents === 'string' && base.kyc_documents.trim()) {
    try {
      const p = JSON.parse(base.kyc_documents);
      if (Array.isArray(p)) kycDocs = p;
    } catch { /* yok say */ }
  }

  // Cüzdan (consultant_id öncelikli, yoksa user_id).
  let wallet: any = null;
  try {
    const [w] = execRows<any>(
      await db.execute(sql`
        SELECT id, balance, pending_balance, currency, created_at, updated_at
        FROM wallets
        WHERE consultant_id = ${id} OR user_id = ${base.user_id}
        ORDER BY CASE WHEN consultant_id = ${id} THEN 0 ELSE 1 END, created_at ASC
        LIMIT 1
      `),
    );
    if (w) {
      wallet = {
        balance: Number(w.balance ?? 0),
        pending_balance: Number(w.pending_balance ?? 0),
        currency: w.currency ?? 'TRY',
      };
    }
  } catch { wallet = null; }

  // Favori sayısı — consultants tablosunda kolon YOK (prod'da da), user_favorites'tan
  // sayılır. Tablo yoksa 0 (getStats ile aynı guard'lı kalıp).
  let favoriteCount = 0;
  try {
    const [fav] = execRows<any>(
      await db.execute(sql`SELECT COUNT(*) AS cnt FROM user_favorites WHERE consultant_id = ${id}`),
    );
    favoriteCount = Number(fav?.cnt ?? 0);
  } catch { favoriteCount = 0; }

  // Randevu istatistikleri (getStats ile aynı 'confirmed'/'completed' kazanç kuralı).
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const [stat] = execRows<any>(
    await db.execute(sql`
      SELECT
        COUNT(*) AS total_bookings,
        SUM(status = 'completed') AS completed_count,
        SUM(status IN ('pending_payment','pending','requested_now')) AS pending_count,
        SUM(CASE WHEN status IN ('confirmed','completed') THEN session_price ELSE 0 END) AS lifetime_earnings,
        SUM(CASE WHEN status IN ('confirmed','completed') AND created_at >= ${monthAgo} THEN session_price ELSE 0 END) AS month_earnings,
        SUM(CASE WHEN status IN ('confirmed','completed') AND created_at >= ${monthAgo} THEN 1 ELSE 0 END) AS month_sessions
      FROM bookings
      WHERE consultant_id = ${id}
    `),
  );

  // Para çekme talepleri (varsa) + özet.
  let withdrawals: any[] = [];
  let withdrawalSummary = { total_paid: 0, pending_amount: 0 };
  try {
    withdrawals = execRows<any>(
      await db.execute(sql`
        SELECT id, amount, currency, status, requested_at, reviewed_at, paid_at,
               rejection_reason, bank_iban, bank_name, bank_holder, transfer_reference
        FROM withdrawal_requests
        WHERE consultant_id = ${id}
        ORDER BY requested_at DESC
        LIMIT 20
      `),
    ).map((w) => ({ ...w, amount: Number(w.amount ?? 0) }));
    const [ws] = execRows<any>(
      await db.execute(sql`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_paid,
          COALESCE(SUM(CASE WHEN status IN ('pending','approved') THEN amount ELSE 0 END), 0) AS pending_amount
        FROM withdrawal_requests
        WHERE consultant_id = ${id}
      `),
    );
    if (ws) withdrawalSummary = { total_paid: Number(ws.total_paid ?? 0), pending_amount: Number(ws.pending_amount ?? 0) };
  } catch { withdrawals = []; }

  return {
    id: base.id,
    full_name: base.full_name,
    email: base.email,
    phone: base.phone,
    approval_status: base.approval_status,
    kyc: {
      kyc_status: base.kyc_status ?? 'none',
      kyc_submitted_at: base.kyc_submitted_at ?? null,
      kyc_reviewed_at: base.kyc_reviewed_at ?? null,
      kyc_rejection_reason: base.kyc_rejection_reason ?? null,
      kyc_documents: kycDocs,
      account_type: base.account_type ?? null,
      identity_number: base.identity_number ?? null,
      tax_number: base.tax_number ?? null,
      tax_office: base.tax_office ?? null,
      company_name: base.company_name ?? null,
      billing_address: base.billing_address ?? null,
      bank_name: base.bank_name ?? null,
      bank_iban: base.bank_iban ?? null,
      bank_account_holder: base.bank_account_holder ?? null,
    },
    wallet,
    stats: {
      total_bookings: Number(stat?.total_bookings ?? 0),
      completed_count: Number(stat?.completed_count ?? 0),
      pending_count: Number(stat?.pending_count ?? 0),
      lifetime_earnings: Number(stat?.lifetime_earnings ?? 0),
      month_earnings: Number(stat?.month_earnings ?? 0),
      month_sessions: Number(stat?.month_sessions ?? 0),
      total_sessions: Number(base.total_sessions ?? 0),
      rating_avg: Number(base.rating_avg ?? 0),
      rating_count: Number(base.rating_count ?? 0),
      favorite_count: favoriteCount,
    },
    withdrawals,
    withdrawal_summary: withdrawalSummary,
  };
}
