// packages/shared-backend/modules/consultantServices/repository.ts
import { db } from '../../db/client';
import { consultantServices, type ConsultantService, type NewConsultantService } from './schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { consultants } from '../consultants/schema';
import { serviceCategories } from '../serviceCategories/schema';
import { serviceTemplates, type ServiceTemplate } from '../serviceTemplates/schema';

export async function listByConsultant(
  consultantId: string,
  opts?: { activeOnly?: boolean; locale?: string },
): Promise<Array<ConsultantService & { is_boosted?: number; boost_ends_at?: Date | null }>> {
  // Locale çözümü: tr (default) danışmanın kendi metnini kullanır (özelleştirme korunur);
  // en/de gibi dillerde şablondan türetilen servisler service_templates_i18n'den çevrilir,
  // çeviri yoksa danışman metnine düşülür. (cs.* sonrası aynı adlı alias override eder.)
  const locale = (opts?.locale || '').trim().toLowerCase();
  const useI18n = Boolean(locale && locale !== 'tr');
  const localeJoin = useI18n
    ? sql`LEFT JOIN service_templates_i18n sti ON sti.template_id = cs.template_id AND sti.locale = ${locale}`
    : sql``;
  const localeSelect = useI18n
    ? sql`, COALESCE(sti.name, cs.name) AS name, COALESCE(sti.description, cs.description) AS description`
    : sql``;
  const result = await db.execute(
    opts?.activeOnly
      ? sql`
          SELECT cs.*,
                 CASE WHEN sb.id IS NULL THEN 0 ELSE 1 END AS is_boosted,
                 sb.ends_at AS boost_ends_at
                 ${localeSelect}
          FROM consultant_services cs
          LEFT JOIN service_boosts sb
            ON sb.consultant_service_id = cs.id
           AND sb.status = 'active'
           AND sb.ends_at > NOW(3)
          ${localeJoin}
          WHERE cs.consultant_id = ${consultantId}
            AND cs.is_active = 1
          ORDER BY is_boosted DESC, cs.sort_order ASC, cs.created_at ASC
        `
      : sql`
          SELECT cs.*,
                 CASE WHEN sb.id IS NULL THEN 0 ELSE 1 END AS is_boosted,
                 sb.ends_at AS boost_ends_at
                 ${localeSelect}
          FROM consultant_services cs
          LEFT JOIN service_boosts sb
            ON sb.consultant_service_id = cs.id
           AND sb.status = 'active'
           AND sb.ends_at > NOW(3)
          ${localeJoin}
          WHERE cs.consultant_id = ${consultantId}
          ORDER BY is_boosted DESC, cs.sort_order ASC, cs.created_at ASC
        `,
  );
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as Array<
    ConsultantService & { is_boosted?: number; boost_ends_at?: Date | null }
  >;
}

export async function getById(id: string): Promise<ConsultantService | undefined> {
  const [row] = await db.select().from(consultantServices).where(eq(consultantServices.id, id)).limit(1);
  return row;
}

export async function getByIdForConsultant(id: string, consultantId: string): Promise<ConsultantService | undefined> {
  const [row] = await db
    .select()
    .from(consultantServices)
    .where(and(eq(consultantServices.id, id), eq(consultantServices.consultant_id, consultantId)))
    .limit(1);
  return row;
}

export async function getByTemplateForConsultant(templateId: string, consultantId: string): Promise<ConsultantService | undefined> {
  const [row] = await db
    .select()
    .from(consultantServices)
    .where(and(eq(consultantServices.template_id, templateId), eq(consultantServices.consultant_id, consultantId)))
    .limit(1);
  return row;
}

export async function getTemplateById(id: string): Promise<ServiceTemplate | undefined> {
  const [row] = await db.select().from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
  return row;
}

export async function getConsultantExpertise(consultantId: string): Promise<string[]> {
  const [row] = await db
    .select({ expertise: consultants.expertise })
    .from(consultants)
    .where(eq(consultants.id, consultantId))
    .limit(1);
  const raw = row?.expertise;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export type ConsultantServiceTemplate = ServiceTemplate & {
  adopted: boolean;
  adopted_service_id: string | null;
};

export async function listTemplatesForConsultant(consultantId: string): Promise<ConsultantServiceTemplate[]> {
  const expertise = await getConsultantExpertise(consultantId);
  if (expertise.length === 0) return [];

  const categories = await db
    .select({ slug: serviceCategories.slug })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.is_active, 1), inArray(serviceCategories.slug, expertise)));
  const categorySlugs = categories.map((row) => row.slug);
  if (categorySlugs.length === 0) return [];

  const templates = await db
    .select()
    .from(serviceTemplates)
    .where(and(eq(serviceTemplates.is_active, 1), inArray(serviceTemplates.category_slug, categorySlugs)))
    .orderBy(asc(serviceTemplates.category_slug), asc(serviceTemplates.sort_order), asc(serviceTemplates.name));
  if (templates.length === 0) return [];

  const adopted = await db
    .select({ id: consultantServices.id, template_id: consultantServices.template_id })
    .from(consultantServices)
    .where(and(eq(consultantServices.consultant_id, consultantId), inArray(consultantServices.template_id, templates.map((t) => t.id))));
  const adoptedByTemplate = new Map(adopted.filter((row) => row.template_id).map((row) => [row.template_id!, row.id]));

  return templates.map((template) => ({
    ...template,
    adopted: adoptedByTemplate.has(template.id),
    adopted_service_id: adoptedByTemplate.get(template.id) ?? null,
  }));
}

export async function create(data: NewConsultantService): Promise<void> {
  await db.insert(consultantServices).values(data);
}

export async function update(id: string, patch: Partial<NewConsultantService>): Promise<void> {
  await db.update(consultantServices).set(patch).where(eq(consultantServices.id, id));
}

export async function remove(id: string): Promise<void> {
  await db.delete(consultantServices).where(eq(consultantServices.id, id));
}

export async function reorder(consultantId: string, items: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const it of items) {
    await db
      .update(consultantServices)
      .set({ sort_order: it.sort_order })
      .where(and(eq(consultantServices.id, it.id), eq(consultantServices.consultant_id, consultantId)));
  }
}

export async function nextSortOrder(consultantId: string): Promise<number> {
  const [row] = await db
    .select({ sort_order: consultantServices.sort_order })
    .from(consultantServices)
    .where(eq(consultantServices.consultant_id, consultantId))
    .orderBy(desc(consultantServices.sort_order))
    .limit(1);
  return Number(row?.sort_order ?? -1) + 1;
}

export async function slugExistsForConsultant(consultantId: string, slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: consultantServices.id })
    .from(consultantServices)
    .where(and(eq(consultantServices.consultant_id, consultantId), eq(consultantServices.slug, slug)))
    .limit(1);
  return Boolean(row);
}

/**
 * T39-3: Syncs the 'supports_video' flag on the consultant profile
 * based on whether they have at least one active video-capable service.
 */
async function syncConsultantFlags(consultantId: string): Promise<void> {
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(consultantServices)
    .where(
      and(
        eq(consultantServices.consultant_id, consultantId),
        eq(consultantServices.is_active, 1),
        eq(consultantServices.media_type, 'video')
      )
    );

  const hasVideo = (result?.count ?? 0) > 0;

  await db
    .update(consultants)
    .set({ supports_video: hasVideo ? 1 : 0 } as any)
    .where(eq(consultants.id, consultantId));
}

// Wrappers to include sync
export async function createWithSync(data: NewConsultantService): Promise<void> {
  await create(data);
  await syncConsultantFlags(data.consultant_id);
}

export async function updateWithSync(id: string, consultantId: string, patch: Partial<NewConsultantService>): Promise<void> {
  await update(id, patch);
  await syncConsultantFlags(consultantId);
}

export async function removeWithSync(id: string, consultantId: string): Promise<void> {
  await remove(id);
  await syncConsultantFlags(consultantId);
}
