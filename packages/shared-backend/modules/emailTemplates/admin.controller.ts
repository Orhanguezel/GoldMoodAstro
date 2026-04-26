// =============================================================
// FILE: src/modules/email-templates/admin.controller.ts
// FINAL — Fix ZodError import + unknown catch handling (TS strict)
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, desc, eq, like, or, type SQL } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  emailTemplates,
  emailTemplatesI18n,
  type NewEmailTemplateRow,
  type NewEmailTemplateI18nRow,
  type EmailTemplateRow,
  type EmailTemplateI18nRow,
} from './schema';
import {
  emailTemplateCreateSchema,
  emailTemplateUpdateSchema,
  listQuerySchema,
} from './validation';
import {
  extractVariablesFromText,
  parseVariablesColumn,
  toBool,
  now,
  normalizeVariablesInput,
} from './utils';
import { DEFAULT_LOCALE } from '../../core/i18n';
import { z } from 'zod';

type ListQuery = {
  q?: string;
  locale?: string | null;
  is_active?: string | number | boolean;
};

// and(...) her koşulda SQL döndürsün (union yok)
const andNonEmpty = (conds: SQL[]): SQL => and(...conds) as SQL;

// -------------------------------------------
// Zod error guard (TS strict, catch unknown)
// -------------------------------------------
function isZodError(e: unknown): e is z.ZodError {
  // ZodError runtime class exists on z.ZodError
  return e instanceof z.ZodError;
}

/* -------------------------------------------
   i18n helper: upsert (template_id + locale)
   ------------------------------------------- */
async function upsertEmailTemplateI18n(
  templateId: string,
  locale: string,
  data: {
    template_name?: string;
    subject?: string;
    content?: string;
  },
) {
  const insertVals: NewEmailTemplateI18nRow = {
    id: randomUUID(),
    template_id: templateId,
    locale,
    template_name: data.template_name ?? '',
    subject: data.subject ?? '',
    content: data.content ?? '',
    created_at: now(),
    updated_at: now(),
  };

  const setObj: Partial<EmailTemplateI18nRow> = { updated_at: now() };

  if (typeof data.template_name !== 'undefined') {
    setObj.template_name = data.template_name;
  }
  if (typeof data.subject !== 'undefined') {
    setObj.subject = data.subject;
  }
  if (typeof data.content !== 'undefined') {
    setObj.content = data.content;
  }

  // Sadece updated_at varsa, update etmeye gerek yok
  if (Object.keys(setObj).length === 1) return;

  await db
    .insert(emailTemplatesI18n)
    .values(insertVals)
    .onDuplicateKeyUpdate({ set: setObj as any });
}

/** GET /admin/email_templates */
export const listEmailTemplatesAdmin: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse((req as any).query);
    const qdata: ListQuery = parsed.success ? parsed.data : {};

    const filters: SQL[] = [];

    if (qdata.q && qdata.q.trim()) {
      const q = qdata.q.trim();
      const likeQ = `%${q}%`;
      filters.push(
        or(
          like(emailTemplates.template_key, likeQ),
          like(emailTemplatesI18n.template_name, likeQ),
          like(emailTemplatesI18n.subject, likeQ),
        ) as SQL,
      );
    }

    if (typeof qdata.is_active !== 'undefined') {
      filters.push(eq(emailTemplates.is_active, toBool(qdata.is_active) ? 1 : 0) as SQL);
    }

    let rows: {
      id: string;
      template_key: string;
      is_active: number;
      variables: string | null;
      created_at: Date;
      updated_at: Date;
      locale: string | null;
      template_name: string | null;
      subject: string | null;
      content: string | null;
    }[];

    const baseWhere = filters.length > 0 ? (andNonEmpty(filters) as SQL) : (undefined as any);

    if (qdata.locale) {
      rows = await db
        .select({
          id: emailTemplates.id,
          template_key: emailTemplates.template_key,
          is_active: emailTemplates.is_active,
          variables: emailTemplates.variables,
          created_at: emailTemplates.created_at,
          updated_at: emailTemplates.updated_at,
          locale: emailTemplatesI18n.locale,
          template_name: emailTemplatesI18n.template_name,
          subject: emailTemplatesI18n.subject,
          content: emailTemplatesI18n.content,
        })
        .from(emailTemplates)
        .leftJoin(
          emailTemplatesI18n,
          and(
            eq(emailTemplatesI18n.template_id, emailTemplates.id),
            eq(emailTemplatesI18n.locale, qdata.locale),
          ),
        )
        .where(baseWhere as any)
        .orderBy(desc(emailTemplates.updated_at), desc(emailTemplatesI18n.locale));
    } else {
      rows = await db
        .select({
          id: emailTemplates.id,
          template_key: emailTemplates.template_key,
          is_active: emailTemplates.is_active,
          variables: emailTemplates.variables,
          created_at: emailTemplates.created_at,
          updated_at: emailTemplates.updated_at,
          locale: emailTemplatesI18n.locale,
          template_name: emailTemplatesI18n.template_name,
          subject: emailTemplatesI18n.subject,
          content: emailTemplatesI18n.content,
        })
        .from(emailTemplates)
        .leftJoin(emailTemplatesI18n, eq(emailTemplatesI18n.template_id, emailTemplates.id))
        .where(baseWhere as any)
        .orderBy(desc(emailTemplates.updated_at), desc(emailTemplatesI18n.locale));
    }

    const out = rows.map((r) => ({
      id: r.id,
      template_key: r.template_key,
      template_name: r.template_name,
      subject: r.subject,
      content: r.content,
      locale: r.locale,
      variables: parseVariablesColumn(r.variables),
      detected_variables: r.content ? extractVariablesFromText(r.content) : [],
      is_active: toBool(r.is_active),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return reply.send(out);
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: 'email_templates_list_failed' } });
  }
};

/** GET /admin/email_templates/:id  (parent + tüm translations) */
export const getEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const [parent] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!parent) return reply.code(404).send({ error: { message: 'not_found' } });

    const translations = await db
      .select()
      .from(emailTemplatesI18n)
      .where(eq(emailTemplatesI18n.template_id, id));

    return reply.send({
      id: parent.id,
      template_key: parent.template_key,
      variables: parseVariablesColumn(parent.variables),
      is_active: toBool(parent.is_active),
      created_at: parent.created_at,
      updated_at: parent.updated_at,
      translations: translations.map((tr) => ({
        id: tr.id,
        locale: tr.locale,
        template_name: tr.template_name,
        subject: tr.subject,
        content: tr.content,
        detected_variables: tr.content ? extractVariablesFromText(tr.content) : [],
        created_at: tr.created_at,
        updated_at: tr.updated_at,
      })),
    });
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: 'email_template_get_failed' } });
  }
};

/** POST /admin/email_templates */
export const createEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const input = emailTemplateCreateSchema.parse(req.body ?? {});
    const id = randomUUID();
    const nowDate = now();

    const parent: NewEmailTemplateRow = {
      id,
      template_key: input.template_key,
      variables: normalizeVariablesInput(input.variables),
      is_active: typeof input.is_active === 'undefined' ? 1 : toBool(input.is_active) ? 1 : 0,
      created_at: nowDate,
      updated_at: nowDate,
    };

    await db.insert(emailTemplates).values(parent);

    const baseLocale = (input.locale || DEFAULT_LOCALE) as string;

    await upsertEmailTemplateI18n(id, baseLocale, {
      template_name: input.template_name,
      subject: input.subject,
      content: input.content,
    });

    const [createdParent] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    const translations = await db
      .select()
      .from(emailTemplatesI18n)
      .where(eq(emailTemplatesI18n.template_id, id));

    return reply.code(201).send({
      id: createdParent.id,
      template_key: createdParent.template_key,
      variables: parseVariablesColumn(createdParent.variables),
      is_active: toBool(createdParent.is_active),
      created_at: createdParent.created_at,
      updated_at: createdParent.updated_at,
      translations: translations.map((tr) => ({
        id: tr.id,
        locale: tr.locale,
        template_name: tr.template_name,
        subject: tr.subject,
        content: tr.content,
        detected_variables: tr.content ? extractVariablesFromText(tr.content) : [],
        created_at: tr.created_at,
        updated_at: tr.updated_at,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? '');

    if (msg.includes('ux_email_tpl_key_locale') || msg.includes('ux_email_tpl_key')) {
      return reply.code(409).send({ error: { message: 'key_exists_for_locale' } });
    }

    if (isZodError(e)) {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }

    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: 'email_template_create_failed' } });
  }
};

/** PATCH /admin/email_templates/:id */
export const updateEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const patch = emailTemplateUpdateSchema.parse(req.body ?? {});
    const [parent] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!parent) return reply.code(404).send({ error: { message: 'not_found' } });

    const updateData: Partial<EmailTemplateRow> = { updated_at: now() };

    if (typeof patch.template_key !== 'undefined') updateData.template_key = patch.template_key;
    if (typeof patch.variables !== 'undefined') {
      updateData.variables = normalizeVariablesInput(patch.variables);
    }
    if (typeof patch.is_active !== 'undefined')
      updateData.is_active = toBool(patch.is_active) ? 1 : 0;

    if (Object.keys(updateData).length > 1) {
      await db.update(emailTemplates).set(updateData).where(eq(emailTemplates.id, id));
    }

    const anyI18n =
      typeof patch.template_name !== 'undefined' ||
      typeof patch.subject !== 'undefined' ||
      typeof patch.content !== 'undefined';

    if (anyI18n) {
      const loc = (patch.locale || DEFAULT_LOCALE) as string;
      await upsertEmailTemplateI18n(id, loc, {
        template_name: patch.template_name,
        subject: patch.subject,
        content: patch.content,
      });
    }

    const [updatedParent] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    const translations = await db
      .select()
      .from(emailTemplatesI18n)
      .where(eq(emailTemplatesI18n.template_id, id));

    return reply.send({
      id: updatedParent.id,
      template_key: updatedParent.template_key,
      variables: parseVariablesColumn(updatedParent.variables),
      is_active: toBool(updatedParent.is_active),
      created_at: updatedParent.created_at,
      updated_at: updatedParent.updated_at,
      translations: translations.map((tr) => ({
        id: tr.id,
        locale: tr.locale,
        template_name: tr.template_name,
        subject: tr.subject,
        content: tr.content,
        detected_variables: tr.content ? extractVariablesFromText(tr.content) : [],
        created_at: tr.created_at,
        updated_at: tr.updated_at,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? '');

    if (msg.includes('ux_email_tpl_key_locale') || msg.includes('ux_email_tpl_key')) {
      return reply.code(409).send({ error: { message: 'key_exists_for_locale' } });
    }

    if (isZodError(e)) {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }

    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: 'email_template_update_failed' } });
  }
};

/** DELETE /admin/email_templates/:id */
export const deleteEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: 'invalid_id' } });

    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return reply.code(204).send();
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: 'email_template_delete_failed' } });
  }
};
