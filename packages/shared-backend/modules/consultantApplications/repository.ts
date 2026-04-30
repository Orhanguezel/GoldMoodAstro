import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../auth/schema';
import { consultants } from '../consultants/schema';
import { userRoles } from '../userRoles/schema';
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
    cv_url: input.cv_url ?? null,
    sample_chart_url: input.sample_chart_url ?? null,
    status: 'pending',
  });
  const row = await getApplication(id);
  if (!row) throw new Error('application_create_failed');
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

export async function approveApplication(
  id: string,
  reviewerId: string | null,
): Promise<ConsultantApplication | null> {
  const app = await getApplication(id);
  if (!app) return null;

  const userId = await resolveUserId(app);
  if (!userId) {
    throw Object.assign(new Error('user_required_for_approval'), { statusCode: 400 });
  }

  await db.transaction(async (tx) => {
    const [existingConsultant] = await tx
      .select({ id: consultants.id })
      .from(consultants)
      .where(eq(consultants.user_id, userId))
      .limit(1);

    if (!existingConsultant) {
      await tx.insert(consultants).values({
        id: randomUUID(),
        user_id: userId,
        bio: app.bio,
        expertise: app.expertise ?? [],
        languages: app.languages ?? ['tr'],
        session_price: '0.00',
        session_duration: 30,
        currency: 'TRY',
        approval_status: 'approved',
        is_available: 1,
      });
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

  return getApplication(id);
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
