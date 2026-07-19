import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { hash as argonHash } from 'argon2';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { db } from '../../db/client';
import { users } from '../auth/schema';
import { consultants } from '../consultants/schema';
import { userRoles } from '../userRoles/schema';
import { createUserNotification } from '../notifications/service';
import { resources } from '../resources/schema';
import { consultantApplications, type ConsultantApplication } from './schema';
import type {
  CreateConsultantApplicationInput,
  ListConsultantApplicationsInput,
  RejectConsultantApplicationInput,
} from './validation';

export async function createApplication(
  input: CreateConsultantApplicationInput & { user_id?: string | null },
): Promise<ConsultantApplication> {
  const id = randomUUID();
  await db.insert(consultantApplications).values({
    id,
    user_id: input.user_id ?? null,
    email: input.email,
    full_name: input.full_name,
    phone: input.phone ?? null,
    bio: input.bio ?? null,
    expertise: input.expertise,
    languages: input.languages,
    experience_years: input.experience_years ?? null,
    certifications: input.certifications ?? null,
    work_experience: input.work_experience ?? null,
    cv_url: input.cv_url ?? null,
    sample_chart_url: input.sample_chart_url ?? null,
    sample_review: input.sample_review ?? null,
    status: 'pending',
  });
  const row = await getApplication(id);
  if (!row) throw new Error('application_create_failed');

  // T28-1: Admin panele başvuru notification.
  // Adminler hem user_roles (role='admin') hem users.role='admin' üzerinden bulunur;
  // birinde kayıt yoksa diğeri devreye girer (sessiz kaçırma engellenir).
  try {
    const [roleAdmins, userAdmins] = await Promise.all([
      db.select({ userId: userRoles.user_id }).from(userRoles).where(eq(userRoles.role, 'admin')),
      db.select({ userId: users.id }).from(users).where(eq(users.role, 'admin')),
    ]);
    const adminIds = [...new Set([...roleAdmins, ...userAdmins].map((a) => a.userId))];
    for (const userId of adminIds) {
      await createUserNotification({
        userId,
        title: 'Yeni Danışman Başvurusu',
        message: `${input.full_name} danışmanlık başvurusu yaptı. Danışmanlar → Bekleyenler sekmesinden inceleyebilirsiniz.`,
        type: 'system',
      });
    }
  } catch (err) {
    console.error('Admin notification failed for consultant application', err);
  }

  return row;
}

export async function listApplications(
  params: ListConsultantApplicationsInput,
): Promise<ConsultantApplication[]> {
  const query = db.select().from(consultantApplications);
  const filtered = params.status
    ? query.where(eq(consultantApplications.status, params.status))
    : query;
  return await filtered
    .orderBy(desc(consultantApplications.created_at))
    .limit(params.limit)
    .offset(params.offset);
}

export async function getApplication(id: string): Promise<ConsultantApplication | null> {
  const [row] = await db
    .select()
    .from(consultantApplications)
    .where(eq(consultantApplications.id, id))
    .limit(1);
  return row ?? null;
}

async function resolveUserId(app: ConsultantApplication): Promise<string | null> {
  if (app.user_id) return app.user_id;
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, app.email))
    .limit(1);
  return user?.id ?? null;
}

/**
 * Başvurudaki email için users tablosunda kayıt yoksa, application alanlarından
 * (full_name + phone) yeni bir user oluşturur. Random argon2 hash ile şifre kilitli;
 * kullanıcı email'le gönderilen şifre belirleme bağlantısından kendi şifresini set
 * etmek zorundadır. Onaylama akışı anonim form gönderimlerini buradan çözer.
 */
async function createUserForApplication(app: ConsultantApplication): Promise<string> {
  const id = randomUUID();
  const password_hash = await argonHash(randomUUID());
  await db.insert(users).values({
    id,
    email: app.email,
    password_hash,
    full_name: app.full_name,
    phone: app.phone ?? null,
    role: 'consultant',
    is_active: 1,
    email_verified: 0,
  } as any);
  return id;
}

export type ApproveApplicationResult = {
  application: ConsultantApplication;
  user_id: string;
  /** approveApplication içinde yeni user oluştuysa true. Controller bunu görür ve
   *  "şifre belirleme" davet maili gönderir; aksi takdirde sade onay maili gider. */
  created_new_user: boolean;
};

export async function approveApplication(
  id: string,
  reviewerId: string | null,
): Promise<ApproveApplicationResult | null> {
  const app = await getApplication(id);
  if (!app) return null;

  let userId = await resolveUserId(app);
  let createdNewUser = false;
  if (!userId) {
    userId = await createUserForApplication(app);
    createdNewUser = true;
  }

  await db.transaction(async (tx) => {
    const [existingConsultant] = await tx
      .select({ id: consultants.id })
      .from(consultants)
      .where(eq(consultants.user_id, userId))
      .limit(1);

    let consultantId: string;
    if (!existingConsultant) {
      consultantId = randomUUID();
      await tx.insert(consultants).values({
        id: consultantId,
        user_id: userId,
        bio: app.bio,
        expertise: app.expertise ?? [],
        languages: app.languages ?? appConfig.consultants.defaultLanguages,
        session_price: appConfig.consultants.defaultSessionPrice,
        session_duration: appConfig.consultants.defaultSessionDurationMinutes,
        currency: appConfig.consultants.defaultCurrency,
        agreement_accepted_at: app.created_at ?? new Date(),
        approval_status: 'approved',
        is_available: 1,
      });
    } else {
      consultantId = existingConsultant.id;
      await tx
        .update(consultants)
        .set({ agreement_accepted_at: app.created_at ?? new Date(), updated_at: new Date() } as any)
        .where(eq(consultants.id, consultantId));
    }

    await tx.update(users).set({ role: 'consultant', updated_at: new Date() }).where(eq(users.id, userId));

    const [existingRole] = await tx
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.user_id, userId), eq(userRoles.role, 'consultant')))
      .limit(1);
    if (!existingRole) {
      await tx.insert(userRoles).values({ id: randomUUID(), user_id: userId, role: 'consultant' });
    }

    // Yeni: her consultant'a kendi resource'unu garanti et. Booking + müsaitlik
    // akışları resources tablosu üzerinden ilerliyor; onaylanan danışmanın orada
    // yoksa otomatik olarak eklenir. Title kullanıcının full_name'i; yoksa fallback.
    const [existingResource] = await tx
      .select({ id: resources.id })
      .from(resources)
      .where(and(eq(resources.external_ref_id, consultantId), eq(resources.type, 'consultant')))
      .limit(1);
    if (!existingResource) {
      await tx.insert(resources).values({
        id: randomUUID(),
        type: 'consultant',
        title: (app.full_name || '').trim() || `Danışman ${consultantId.slice(0, 8)}`,
        capacity: 1,
        external_ref_id: consultantId,
        is_active: 1,
      } as any);
    }

    await tx
      .update(consultantApplications)
      .set({
        user_id: userId,
        status: 'approved',
        rejection_reason: null,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(consultantApplications.id, id));
  });

  const fresh = await getApplication(id);
  if (!fresh) return null;
  return { application: fresh, user_id: userId, created_new_user: createdNewUser };
}

export async function rejectApplication(
  id: string,
  reviewerId: string | null,
  body: RejectConsultantApplicationInput,
): Promise<ConsultantApplication | null> {
  const app = await getApplication(id);
  if (!app) return null;

  await db
    .update(consultantApplications)
    .set({
      status: 'rejected',
      rejection_reason: body.rejection_reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(consultantApplications.id, id));

  return getApplication(id);
}
