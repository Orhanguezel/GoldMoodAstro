// =============================================================
// FILE: src/modules/bookings/admin.controller.ts
// FINAL — Admin bookings controller (NO i18n, locale only)
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import {
  listBookingsMerged,
  getBookingMergedById,
  getBookingMergedByIdTx,
  createBookingAdmin,
  deleteBookingByIdTx,
  reserveSlotTx,
  releaseSlotTx,
  moveSlotReservationTx,
  updateBookingByIdTx,
} from './repository';

import {
  listBookingsQuerySchema,
  adminCreateBookingSchema,
  adminUpdateBookingSchema,
  isActiveForCapacity,
  adminDecisionSchema,
} from './validation';

import { sendTemplatedEmail } from '@goldmood/shared-backend/modules/emailTemplates/mailer';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';

import { db } from '../../db/client';
import { ensureLocalesLoadedFromSettings, getRuntimeDefaultLocale } from '../../core/i18n';
import { siteSettings } from '@goldmood/shared-backend/modules/siteSettings/schema';
import { bookings as bookingsTable } from './schema';
import { to01, getDefaultLocale } from '../_shared';

const safeText = (v: unknown) => String(v ?? '').trim();
const now = () => new Date();
const FALLBACK_SITE_NAME = process.env.APP_NAME || 'Platform';



async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  const val = row?.value == null ? null : String(row.value).trim();
  return val ? val : null;
}

async function getSiteName(): Promise<string> {
  return (
    (await getSettingValue('site_title')) ||
    (await getSettingValue('footer_company_name')) ||
    FALLBACK_SITE_NAME
  );
}

async function getBookingAdminUserId(): Promise<string | null> {
  const v = await getSettingValue('booking_admin_user_id');
  const s = (v ?? '').trim();
  return s && s.length === 36 ? s : null;
}

function getAdminIdentity(req: any): string {
  const u = req.user;
  if (!u || typeof u !== 'object') return 'admin';
  if ((u as any).email) return String((u as any).email);
  if ((u as any).name) return String((u as any).name);
  return 'admin';
}

async function trackEmailSuccess(args: {
  bookingId: string;
  to: string;
  templateKey: string;
  subject?: string;
}) {
  await db
    .update(bookingsTable)
    .set({
      email_last_sent_at: now(),
      email_last_template_key: args.templateKey,
      email_last_to: args.to,
      email_last_subject: args.subject ?? null,
      email_last_error: null,
      updated_at: now(),
    } as any)
    .where(eq(bookingsTable.id, args.bookingId));
}

async function trackEmailError(args: {
  bookingId: string;
  to: string;
  templateKey: string;
  error: string;
}) {
  await db
    .update(bookingsTable)
    .set({
      email_last_template_key: args.templateKey,
      email_last_to: args.to,
      email_last_error: args.error,
      updated_at: now(),
    } as any)
    .where(eq(bookingsTable.id, args.bookingId));
}

/** GET /admin/bookings */
export const listBookingsAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const q = listBookingsQuerySchema.parse((req as any).query ?? {});
    const limit = q.limit != null ? Math.min(Number(q.limit), 200) : 50;
    const offset = q.offset != null ? Math.max(Number(q.offset), 0) : 0;

    const rows = await listBookingsMerged(
      {
        q: q.q,
        status: q.status,
        is_read: q.is_read,
        appointment_date: q.appointment_date,
        appointment_time: q.appointment_time,
        service_id: q.service_id,
        resource_id: q.resource_id,
        locale: q.locale,
      },
      { limit, offset },
    );

    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'bookings_list_failed' } });
  }
};

/** GET /admin/bookings/:id */
export const getBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const locale = safeText(((req as any).query ?? {}).locale) || undefined;

    const row = await getBookingMergedById({ id, locale });
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_get_failed' } });
  }
};

/** POST /admin/bookings */
export const createBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const input = adminCreateBookingSchema.parse(req.body ?? {});
    const id = randomUUID();

    const defaultLocale = await getDefaultLocale();
    const locale = safeText(input.locale) || defaultLocale;
    const status = input.status ? safeText(input.status) : 'new';
    const isRead01 = typeof input.is_read === 'undefined' ? 0 : to01(input.is_read) ?? 0;

    if (isActiveForCapacity(status)) {
      if (!input.resource_id || !input.appointment_time) {
        return reply.code(400).send({ error: { message: 'slot_required_for_active_status' } });
      }
    }

    const created = await createBookingAdmin({
      booking: {
        id,
        name: safeText(input.name),
        email: safeText(input.email),
        phone: safeText(input.phone),
        locale,

        customer_message: input.customer_message ? safeText(input.customer_message) : null,

        service_id: input.service_id ? safeText(input.service_id) : null,
        resource_id: safeText(input.resource_id),

        appointment_date: safeText(input.appointment_date),
        appointment_time: safeText(input.appointment_time),

        status,
        is_read: isRead01,

        admin_note: input.admin_note ? safeText(input.admin_note) : null,

        created_at: now(),
        updated_at: now(),
      } as any,
    });

    const merged = await getBookingMergedById({ id: created.id, locale });
    return reply.code(201).send(merged ?? created);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (String(e?.code || e?.message) === 'slot_not_available')
      return reply.code(409).send({ error: { message: 'slot_not_available' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_create_failed' } });
  }
};

/**
 * PATCH /admin/bookings/:id
 * Slot policy:
 * - active -> inactive: release old slot + clear slot_id
 * - inactive -> active: reserve new slot + set slot_id
 * - active & (resource/date/time change): move reservation (or reserve if old missing)
 */
export const updateBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const body = adminUpdateBookingSchema.parse(req.body ?? {});
    const defaultLocale = await getDefaultLocale();
    const localeHint =
      safeText(body.locale) || safeText(((req as any).query ?? {}).locale) || undefined;

    const existing = await getBookingMergedById({ id, locale: localeHint });
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });

    const adminIdentity = getAdminIdentity(req);

    const statusBefore = String(existing.status);
    const statusAfter = body.status ? safeText(body.status) : statusBefore;

    const beforeActive = isActiveForCapacity(statusBefore);
    const afterActive = isActiveForCapacity(statusAfter);

    // compute next values
    const nextServiceId =
      body.service_id === undefined
        ? existing.service_id ?? null
        : body.service_id
        ? safeText(body.service_id)
        : null;

    const nextResourceId =
      body.resource_id === undefined
        ? existing.resource_id ?? null
        : body.resource_id
        ? safeText(body.resource_id)
        : null;

    const nextDate =
      body.appointment_date === undefined
        ? existing.appointment_date
        : safeText(body.appointment_date);
    const nextTime =
      body.appointment_time === undefined
        ? existing.appointment_time ?? null
        : body.appointment_time
        ? safeText(body.appointment_time)
        : null;

    if (afterActive) {
      if (!nextResourceId || !nextDate || !nextTime) {
        return reply.code(400).send({ error: { message: 'slot_required_for_active_status' } });
      }
    }

    const isStatusChanged = statusAfter !== statusBefore;
    const isRead01 = body.is_read === undefined ? undefined : to01(body.is_read);

    const updated = await db.transaction(async (tx) => {
      // lock booking row for consistent slot ops
      const [core] = await tx
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          slot_id: bookingsTable.slot_id,
          resource_id: bookingsTable.resource_id,
          appointment_date: bookingsTable.appointment_date,
          appointment_time: bookingsTable.appointment_time,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, id))
        .limit(1);

      if (!core) return null;

      const oldSlotId = (core as any).slot_id ? String((core as any).slot_id) : null;

      const resourceChanged =
        String((core as any).resource_id) !== String(nextResourceId ?? '') ||
        String((core as any).appointment_date) !== String(nextDate ?? '') ||
        String((core as any).appointment_time ?? '') !== String(nextTime ?? '');

      // active -> inactive
      if (beforeActive && !afterActive) {
        if (oldSlotId) await releaseSlotTx(tx, { slot_id: oldSlotId });
        await tx
          .update(bookingsTable)
          .set({ slot_id: null, updated_at: now() } as any)
          .where(eq(bookingsTable.id, id));
      }

      // inactive -> active
      if (!beforeActive && afterActive) {
        const r = await reserveSlotTx(tx, {
          resource_id: nextResourceId!,
          dateYmd: nextDate!,
          timeHm: nextTime!,
        });
        if (!r.ok) {
          const err: any = new Error('slot_not_available');
          err.code = 'slot_not_available';
          throw err;
        }
        await tx
          .update(bookingsTable)
          .set({ slot_id: r.slot_id, updated_at: now() } as any)
          .where(eq(bookingsTable.id, id));
      }

      // active & changed
      if (beforeActive && afterActive && resourceChanged) {
        if (!oldSlotId) {
          const r = await reserveSlotTx(tx, {
            resource_id: nextResourceId!,
            dateYmd: nextDate!,
            timeHm: nextTime!,
          });
          if (!r.ok) {
            const err: any = new Error('slot_not_available');
            err.code = 'slot_not_available';
            throw err;
          }
          await tx
            .update(bookingsTable)
            .set({ slot_id: r.slot_id, updated_at: now() } as any)
            .where(eq(bookingsTable.id, id));
        } else {
          const moved = await moveSlotReservationTx(tx, {
            from_slot_id: oldSlotId,
            to: { resource_id: nextResourceId!, dateYmd: nextDate!, timeHm: nextTime! },
          });
          if (!moved.ok) {
            const err: any = new Error('slot_not_available');
            err.code = 'slot_not_available';
            throw err;
          }
          await tx
            .update(bookingsTable)
            .set({ slot_id: moved.to_slot_id, updated_at: now() } as any)
            .where(eq(bookingsTable.id, id));
        }
      }

      const patch: any = {
        updated_at: now(),

        ...(body.name !== undefined ? { name: safeText(body.name) } : {}),
        ...(body.email !== undefined ? { email: safeText(body.email) } : {}),
        ...(body.phone !== undefined ? { phone: safeText(body.phone) } : {}),

        ...(body.locale !== undefined ? { locale: safeText(body.locale) || defaultLocale } : {}),

        ...(body.customer_message !== undefined
          ? { customer_message: body.customer_message ? safeText(body.customer_message) : null }
          : {}),

        ...(body.service_id !== undefined ? { service_id: nextServiceId } : {}),
        ...(body.resource_id !== undefined ? { resource_id: nextResourceId } : {}),
        ...(body.appointment_date !== undefined ? { appointment_date: nextDate } : {}),
        ...(body.appointment_time !== undefined ? { appointment_time: nextTime } : {}),

        ...(body.admin_note !== undefined
          ? { admin_note: body.admin_note ? safeText(body.admin_note) : null }
          : {}),
        ...(body.decision_note !== undefined
          ? { decision_note: body.decision_note ? safeText(body.decision_note) : null }
          : {}),

        ...(body.status !== undefined ? { status: statusAfter } : {}),
        ...(typeof isRead01 !== 'undefined' ? { is_read: isRead01 } : {}),
      };

      if (isStatusChanged) {
        patch.decided_at = now();
        patch.decided_by = adminIdentity;
      }

      await updateBookingByIdTx(tx, id, patch);

      const outLocale = String(patch.locale ?? existing.locale ?? defaultLocale);
      return await getBookingMergedByIdTx(tx, { id, locale: outLocale });
    });

    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    // Side effects on status change (best-effort)
    if (isStatusChanged) {
      const siteName = await getSiteName();
      const customerLocale = String((updated as any).locale || defaultLocale);

      try {
        const rendered = await sendTemplatedEmail({
          to: (updated as any).email,
          key: 'booking_status_changed_customer',
          locale: customerLocale,
          defaultLocale,
          params: {
            site_name: siteName,

            booking_id: (updated as any).id,
            customer_name: (updated as any).name,
            customer_email: (updated as any).email,
            customer_phone: (updated as any).phone,

            appointment_date: (updated as any).appointment_date,
            appointment_time: (updated as any).appointment_time ?? '',

            service_title: (updated as any).service_title ?? '',
            resource_title: (updated as any).resource_title ?? '',
            customer_message: (updated as any).customer_message ?? '',

            status_before: statusBefore,
            status_after: statusAfter,
            decision_note: (updated as any).decision_note ?? '',
          },
          allowMissing: true,
        });

        await trackEmailSuccess({
          bookingId: (updated as any).id,
          to: (updated as any).email,
          templateKey: 'booking_status_changed_customer',
          subject: rendered?.subject,
        });
      } catch (e: any) {
        await trackEmailError({
          bookingId: (updated as any).id,
          to: (updated as any).email,
          templateKey: 'booking_status_changed_customer',
          error: String(e?.message || 'mail_failed'),
        });
      }

      const adminUserId = await getBookingAdminUserId();
      if (adminUserId) {
        try {
          await createUserNotification({
            userId: adminUserId,
            type: 'custom',
            title: 'Randevu durumu güncellendi',
            message: `Randevu: ${(updated as any).name} • ${(updated as any).appointment_date}${
              (updated as any).appointment_time ? ' ' + (updated as any).appointment_time : ''
            } • ${statusBefore} → ${statusAfter}`,
          });
        } catch {
          // ignore
        }
      }
    }

    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (String(e?.code || e?.message) === 'slot_not_available')
      return reply.code(409).send({ error: { message: 'slot_not_available' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_update_failed' } });
  }
};

/** POST /admin/bookings/:id/read */
export const markBookingReadAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const updated = await db.transaction(async (tx) => {
      await tx
        .update(bookingsTable)
        .set({ is_read: 1, updated_at: now() } as any)
        .where(eq(bookingsTable.id, id));
      return await getBookingMergedByIdTx(tx, { id });
    });

    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(updated);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_mark_read_failed' } });
  }
};

/** DELETE /admin/bookings/:id */
export const deleteBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          slot_id: bookingsTable.slot_id,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, id))
        .limit(1);

      if (!row) return;

      const active = isActiveForCapacity(String((row as any).status));
      const slotId = (row as any).slot_id ? String((row as any).slot_id) : null;

      if (active && slotId) await releaseSlotTx(tx, { slot_id: slotId });

      await deleteBookingByIdTx(tx, id);
    });

    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_delete_failed' } });
  }
};

/** POST /admin/bookings/:id/reminder */
export const sendBookingReminderAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const body = adminDecisionSchema.parse(req.body ?? {});
    const defaultLocale = await getDefaultLocale();
    const booking = await getBookingMergedById({ id, locale: body.locale });
    if (!booking) return reply.code(404).send({ error: { message: 'not_found' } });

    const siteName = await getSiteName();
    const locale = safeText(body.locale) || String((booking as any).locale || defaultLocale);

    try {
      const rendered = await sendTemplatedEmail({
        to: String((booking as any).email),
        key: 'booking_reminder',
        locale,
        defaultLocale,
        params: {
          site_name: siteName,
          booking_id: String((booking as any).id),
          customer_name: String((booking as any).name),
          customer_email: String((booking as any).email),
          customer_phone: String((booking as any).phone),
          appointment_date: String((booking as any).appointment_date),
          appointment_time: String((booking as any).appointment_time ?? ''),
          service_title: String((booking as any).service_title ?? ''),
          resource_title: String((booking as any).resource_title ?? ''),
          decision_note: safeText(body.decision_note),
        },
        allowMissing: true,
      });

      await trackEmailSuccess({
        bookingId: String((booking as any).id),
        to: String((booking as any).email),
        templateKey: 'booking_reminder',
        subject: rendered?.subject,
      });
    } catch (e: any) {
      await trackEmailError({
        bookingId: String((booking as any).id),
        to: String((booking as any).email),
        templateKey: 'booking_reminder',
        error: String(e?.message || 'mail_failed'),
      });
    }

    const updated = await getBookingMergedById({ id, locale });
    return reply.send(updated ?? booking);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_reminder_failed' } });
  }
};


// ----------------------------- decision helpers -----------------------------

async function sendDecisionEmailAndNotify(args: {
  booking: any;
  statusBefore: string;
  statusAfter: string;
  templateKey: string;
  req: any;
  defaultLocale: string;
}) {
  const b = args.booking;
  const statusBefore = args.statusBefore;
  const statusAfter = args.statusAfter;

  const siteName = await getSiteName();
  const customerLocale = String(b.locale || args.defaultLocale);

  // Email (best-effort)
  try {
    const rendered = await sendTemplatedEmail({
      to: String(b.email),
      key: args.templateKey,
      locale: customerLocale,
      defaultLocale: args.defaultLocale,
      params: {
        site_name: siteName,

        booking_id: String(b.id),
        customer_name: String(b.name),
        customer_email: String(b.email),
        customer_phone: String(b.phone),

        appointment_date: String(b.appointment_date),
        appointment_time: String(b.appointment_time ?? ''),

        service_title: String(b.service_title ?? ''),
        resource_title: String(b.resource_title ?? ''),
        customer_message: String(b.customer_message ?? ''),

        status_before: statusBefore,
        status_after: statusAfter,
        decision_note: String(b.decision_note ?? ''),
      },
      allowMissing: true,
    });

    await trackEmailSuccess({
      bookingId: String(b.id),
      to: String(b.email),
      templateKey: args.templateKey,
      subject: rendered?.subject,
    });
  } catch (e: any) {
    await trackEmailError({
      bookingId: String(b.id),
      to: String(b.email),
      templateKey: args.templateKey,
      error: String(e?.message || 'mail_failed'),
    });
  }

  // Admin notification (best-effort)
  const adminUserId = await getBookingAdminUserId();
  if (adminUserId) {
    try {
      await createUserNotification({
        userId: adminUserId,
        type: 'custom',
        title: 'Randevu kararı verildi',
        message: `Randevu: ${String(b.name)} • ${String(b.appointment_date)}${
          b.appointment_time ? ' ' + String(b.appointment_time) : ''
        } • ${statusBefore} → ${statusAfter}`,
      });
    } catch {
      // ignore
    }
  }
}

// ----------------------------- ACCEPT -----------------------------

export const acceptBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const body = adminDecisionSchema.parse(req.body ?? {});
    const adminIdentity = getAdminIdentity(req);
    const defaultLocale = await getDefaultLocale();

    const existing = await getBookingMergedById({ id, locale: body.locale });
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });

    const statusBefore = String(existing.status);
    const statusAfter = 'confirmed';

    // Idempotency: already confirmed => just return current row
    if (statusBefore === statusAfter) return reply.send(existing);

    const updated = await db.transaction(async (tx) => {
      // lock booking for consistency
      const [core] = await tx
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          slot_id: bookingsTable.slot_id,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, id))
        .for('update')
        .limit(1);

      if (!core) return null;

      // Accept DOES NOT change slot reservation (public create already reserved on "new")
      // We only update status + decision fields.
      await updateBookingByIdTx(tx, id, {
        status: statusAfter,
        decision_note: body.decision_note ? safeText(body.decision_note) : null,
        decided_at: now(),
        decided_by: adminIdentity,
      } as any);

      const loc = safeText(body.locale) || String(existing.locale || defaultLocale);
      return await getBookingMergedByIdTx(tx, { id, locale: loc });
    });

    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    // side-effects (best-effort)
    await sendDecisionEmailAndNotify({
      booking: updated,
      statusBefore,
      statusAfter,
      templateKey: 'booking_accepted_customer',
      req,
      defaultLocale,
    });

    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_accept_failed' } });
  }
};

// ----------------------------- REJECT -----------------------------

export const rejectBookingAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const body = adminDecisionSchema.parse(req.body ?? {});
    const adminIdentity = getAdminIdentity(req);
    const defaultLocale = await getDefaultLocale();

    const existing = await getBookingMergedById({ id, locale: body.locale });
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });

    const statusBefore = String(existing.status);
    const statusAfter = 'rejected';

    // Idempotency: already rejected => just return
    if (statusBefore === statusAfter) return reply.send(existing);

    const updated = await db.transaction(async (tx) => {
      // lock booking for consistent slot release
      const [core] = await tx
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          slot_id: bookingsTable.slot_id,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, id))
        .for('update')
        .limit(1);

      if (!core) return null;

      const beforeActive = isActiveForCapacity(String((core as any).status));
      const afterActive = isActiveForCapacity(statusAfter); // rejected => false

      const oldSlotId = (core as any).slot_id ? String((core as any).slot_id) : null;

      // active -> inactive => release + clear slot_id
      if (beforeActive && !afterActive) {
        if (oldSlotId) await releaseSlotTx(tx, { slot_id: oldSlotId });
        await tx
          .update(bookingsTable)
          .set({ slot_id: null, updated_at: now() } as any)
          .where(eq(bookingsTable.id, id));
      }

      await updateBookingByIdTx(tx, id, {
        status: statusAfter,
        decision_note: body.decision_note ? safeText(body.decision_note) : null,
        decided_at: now(),
        decided_by: adminIdentity,
      } as any);

      const loc = safeText(body.locale) || String(existing.locale || defaultLocale);
      return await getBookingMergedByIdTx(tx, { id, locale: loc });
    });

    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    await sendDecisionEmailAndNotify({
      booking: updated,
      statusBefore,
      statusAfter,
      templateKey: 'booking_rejected_customer',
      req,
      defaultLocale,
    });

    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_reject_failed' } });
  }
};
