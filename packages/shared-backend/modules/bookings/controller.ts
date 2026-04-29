// =============================================================
// FILE: src/modules/bookings/controller.ts
// FINAL — Public bookings controller (MAIL HARDENED)
// Fixes:
//  - Template param mismatch: send BOTH message + customer_message (+ service_slug)
//  - Treat "not sent" (null result) as error even with allowMissing
//  - Track admin mail result too
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import { publicCreateBookingSchema } from './validation';
import {
  createBookingPublic,
  getBookingMergedById,
  listBookingsMerged,
  updateBookingByIdTx,
  releaseSlotTx,
} from './repository';
import { sendTemplatedEmail } from '@goldmood/shared-backend/modules/emailTemplates/mailer';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';

import { db } from '../../db/client';
import { siteSettings } from '@goldmood/shared-backend/modules/siteSettings/schema';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { bookings as bookingsTable } from './schema';
import { consultants } from '../consultants/schema';
import { normalizeSettingBool, getGlobalSettingValue } from '../siteSettings/helpers';
import { getDefaultLocale } from '../_shared';

const safeText = (v: unknown) => String(v ?? '').trim();
const now = () => new Date();
const FALLBACK_SITE_NAME = process.env.APP_NAME || 'Platform';
const VIDEO_PRICE_FALLBACK_RATE = 1.4;

function parseMoney(v: unknown): number {
  const n = Number(safeText(v));
  return Number.isFinite(n) ? n : 0;
}

function toMoneyString(v: unknown): string {
  return parseMoney(v).toFixed(2);
}

function resolveRequestedMediaType(input: unknown): 'audio' | 'video' {
  const mediaType = safeText(input);
  return mediaType === 'video' ? 'video' : 'audio';
}

async function resolveMediaAllowedForConsultant(args: { consultantId: string; mediaType: 'audio' | 'video' }) {
  const { consultantId, mediaType } = args;

  const [consultant] = await db
    .select({
      session_price: consultants.session_price,
      video_session_price: consultants.video_session_price,
      supports_video: consultants.supports_video,
    })
    .from(consultants)
    .where(eq(consultants.id, consultantId))
    .limit(1);

  if (!consultant) {
    const error = new Error('consultant_not_found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const audioPrice = parseMoney(consultant.session_price);
  const videoPrice = parseMoney(consultant.video_session_price);

  if (mediaType === 'audio') {
    return {
      mediaType,
      resolvedPrice: toMoneyString(audioPrice),
      audioPrice,
      videoPrice,
    };
  }

  const featureEnabled = normalizeSettingBool(await getGlobalSettingValue('feature_video_enabled'));
  if (!featureEnabled) {
    const error = new Error('video_feature_disabled');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  if (Number(consultant.supports_video) !== 1) {
    const error = new Error('video_not_supported');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const finalVideoPrice = videoPrice > 0 ? videoPrice : audioPrice * VIDEO_PRICE_FALLBACK_RATE;
  return {
    mediaType,
    resolvedPrice: toMoneyString(finalVideoPrice),
    audioPrice,
    videoPrice,
  };
}


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

async function getAdminBookingEmail(): Promise<string | null> {
  return (
    (await getSettingValue('booking_admin_email')) ||
    (await getSettingValue('contact_receiver_email')) ||
    (await getSettingValue('footer_company_email')) ||
    null
  );
}

async function getBookingAdminUserId(): Promise<string | null> {
  const v = await getSettingValue('booking_admin_user_id');
  const s = (v ?? '').trim();
  return s && s.length === 36 ? s : null;
}

async function updateEmailTracking(args: {
  bookingId: string;
  to: string;
  templateKey: string;
  subject?: string | null;
  error?: string | null;
}) {
  await db
    .update(bookingsTable)
    .set({
      email_last_sent_at: args.error ? null : now(),
      email_last_template_key: args.templateKey,
      email_last_to: args.to,
      email_last_subject: args.subject ?? null,
      email_last_error: args.error ?? null,
      updated_at: now(),
    } as any)
    .where(eq(bookingsTable.id, args.bookingId));
}

function asEmailError(e: any) {
  const msg = String(e?.message || e?.code || 'mail_failed');
  return msg.length > 2000 ? msg.slice(0, 2000) : msg;
}

/** PUBLIC: POST /bookings (requires auth — mobile/user only) */
export const createBookingPublicHandler: RouteHandler = async (req, reply) => {
  try {
    const jwtUser = (req as any).user as { sub?: string; email?: string } | undefined;
    const userId = safeText(jwtUser?.sub);
    if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

    const input = publicCreateBookingSchema.parse(req.body ?? {});
    const id = randomUUID();

    const defaultLocale = await getDefaultLocale();
    const locale = safeText(input.locale) || defaultLocale;

    // Fill name/email/phone from user profile if not provided in body
    let userName = input.name ? safeText(input.name) : '';
    let userEmail = input.email ? safeText(input.email) : '';
    let userPhone = input.phone ? safeText(input.phone) : '';

    if (!userName || !userEmail) {
      const [userRow] = await db
        .select({ full_name: users.full_name, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRow) {
        if (!userName) userName = safeText(userRow.full_name);
        if (!userEmail) userEmail = safeText(userRow.email);
        if (!userPhone) userPhone = safeText(userRow.phone);
      }
    }

    const mediaType = resolveRequestedMediaType(input.media_type);
    const { resolvedPrice } = await resolveMediaAllowedForConsultant({
      consultantId: safeText(input.consultant_id),
      mediaType,
    });

    const created = await createBookingPublic({
      booking: {
        id,
        user_id: userId,
        consultant_id: safeText(input.consultant_id),

        name: userName,
        email: userEmail,
        phone: userPhone,
        locale,

        customer_message: input.customer_message ? safeText(input.customer_message) : null,

        service_id: input.service_id ? safeText(input.service_id) : null,
        resource_id: safeText(input.resource_id),

        appointment_date: safeText(input.appointment_date),
        appointment_time: safeText(input.appointment_time),

        session_price: resolvedPrice,
        media_type: mediaType,
        session_duration: input.session_duration ?? 30,
        source_type: input.source_type ?? null,
        source_id: input.source_id ?? null,

        status: 'pending_payment',
        is_read: 0,

        created_at: now(),
        updated_at: now(),
      } as any,
    });

    const merged = await getBookingMergedById({ id: created.id, locale });

    const siteName = await getSiteName();
    const adminTo = await getAdminBookingEmail();
    const adminUserId = await getBookingAdminUserId();

    const msg = created.customer_message ?? '';

    const mailParams = {
      site_name: siteName,

      booking_id: created.id,
      customer_name: created.name,
      customer_email: created.email,
      customer_phone: created.phone,

      appointment_date: created.appointment_date,
      appointment_time: created.appointment_time ?? '',

      // GoldMoodAstro: consultant name used in email templates
      consultant_name: merged?.resource_title ?? '',

      // service fields (backward compat)
      service_title: merged?.service_title ?? '',
      service_slug: (merged as any)?.service_slug ?? '',
      resource_title: merged?.resource_title ?? '',

      // message keys (support both placeholders)
      message: msg,
      customer_message: msg,

      status: created.status,
    };

    // ---------------- customer mail (best-effort but tracked) ----------------
    try {
      const rendered = await sendTemplatedEmail({
        to: created.email,
        key: 'booking_created_customer',
        locale,
        defaultLocale,
        params: mailParams,
        allowMissing: true,
      });

      // If mailer returns null/undefined => treat as failure (usually missing template or SMTP disabled)
      if (!rendered) {
        const err = 'mail_not_sent_or_template_missing';
        req.log.error(
          { err, key: 'booking_created_customer', to: created.email },
          'booking mail not sent',
        );
        await updateEmailTracking({
          bookingId: created.id,
          to: created.email,
          templateKey: 'booking_created_customer',
          subject: null,
          error: err,
        });
      } else {
        await updateEmailTracking({
          bookingId: created.id,
          to: created.email,
          templateKey: 'booking_created_customer',
          subject: (rendered as any)?.subject ?? null,
          error: null,
        });
      }
    } catch (e: any) {
      const err = asEmailError(e);
      req.log.error(
        { err, key: 'booking_created_customer', to: created.email },
        'booking customer mail failed',
      );
      await updateEmailTracking({
        bookingId: created.id,
        to: created.email,
        templateKey: 'booking_created_customer',
        subject: null,
        error: err,
      });
    }

    // ---------------- admin mail (best-effort + tracked) ----------------
    if (adminTo) {
      try {
        const rendered = await sendTemplatedEmail({
          to: adminTo,
          key: 'booking_created_admin',
          locale,
          defaultLocale,
          params: mailParams,
          allowMissing: true,
        });

        if (!rendered) {
          const err = 'admin_mail_not_sent_or_template_missing';
          req.log.error(
            { err, key: 'booking_created_admin', to: adminTo },
            'booking admin mail not sent',
          );
          await updateEmailTracking({
            bookingId: created.id,
            to: adminTo,
            templateKey: 'booking_created_admin',
            subject: null,
            error: err,
          });
        } else {
          await updateEmailTracking({
            bookingId: created.id,
            to: adminTo,
            templateKey: 'booking_created_admin',
            subject: (rendered as any)?.subject ?? null,
            error: null,
          });
        }
      } catch (e: any) {
        const err = asEmailError(e);
        req.log.error(
          { err, key: 'booking_created_admin', to: adminTo },
          'booking admin mail failed',
        );
        await updateEmailTracking({
          bookingId: created.id,
          to: adminTo,
          templateKey: 'booking_created_admin',
          subject: null,
          error: err,
        });
      }
    }

    // ---------------- admin notification (best-effort) ----------------
    if (adminUserId) {
      try {
        await createUserNotification({
          userId: adminUserId,
          type: 'custom',
          title: 'Yeni rezervasyon talebi',
          message: `Yeni rezervasyon: ${created.name} • ${created.appointment_date} ${
            created.appointment_time ?? ''
          }${merged?.service_title ? ' • ' + merged.service_title : ''}`,
        });
      } catch {
        // ignore
      }
    }

    return reply.code(201).send({ ok: true, id: created.id, status: created.status });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (String(e?.message || '').includes('consultant_not_found')) {
      return reply.code(404).send({ error: { message: 'consultant_not_found' } });
    }
    if (String(e?.message || '').includes('video_not_supported')) {
      return reply.code(403).send({ error: { message: 'consultant_does_not_support_video' } });
    }
    if (String(e?.message || '').includes('video_feature_disabled')) {
      return reply.code(403).send({ error: { message: 'video_feature_disabled' } });
    }
    if (String(e?.code || e?.message) === 'slot_not_available') {
      return reply.code(409).send({ error: { message: 'slot_not_available' } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_create_failed' } });
  }
};

/** GET /bookings/me — authenticated user's own bookings */
export const listMyBookingsHandler: RouteHandler = async (req, reply) => {
  try {
    const jwtUser = (req as any).user as { sub?: string } | undefined;
    const userId = safeText(jwtUser?.sub);
    if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

    const query = (req.query ?? {}) as Record<string, string>;
    const status = query.status ? String(query.status).trim() : undefined;
    const defaultLocale = await getDefaultLocale();

    const items = await listBookingsMerged(
      { user_id: userId, status, locale: defaultLocale },
      { limit: 100, offset: 0 },
    );

    return reply.send({ items });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'bookings_list_failed' } });
  }
};

/** GET /bookings/:id — authenticated user's own booking detail */
export const getMyBookingHandler: RouteHandler = async (req, reply) => {
  try {
    const jwtUser = (req as any).user as { sub?: string } | undefined;
    const userId = safeText(jwtUser?.sub);
    if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

    const { id } = (req.params as { id: string });
    const defaultLocale = await getDefaultLocale();
    const booking = await getBookingMergedById({ id, locale: defaultLocale });

    if (!booking) return reply.code(404).send({ error: { message: 'booking_not_found' } });
    if ((booking as any).user_id !== userId)
      return reply.code(403).send({ error: { message: 'forbidden' } });

    return reply.send(booking);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_get_failed' } });
  }
};

/** PATCH /bookings/:id/cancel — authenticated user cancels their own booking */
export const cancelMyBookingHandler: RouteHandler = async (req, reply) => {
  try {
    const jwtUser = (req as any).user as { sub?: string } | undefined;
    const userId = safeText(jwtUser?.sub);
    if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

    const { id } = (req.params as { id: string });
    const defaultLocale = await getDefaultLocale();
    const booking = await getBookingMergedById({ id, locale: defaultLocale });

    if (!booking) return reply.code(404).send({ error: { message: 'booking_not_found' } });
    if ((booking as any).user_id !== userId)
      return reply.code(403).send({ error: { message: 'forbidden' } });

    const cancellable = ['pending_payment', 'booked', 'confirmed', 'new'];
    if (!cancellable.includes(String(booking.status)))
      return reply.code(409).send({ error: { message: 'booking_not_cancellable' } });

    await db.transaction(async (tx) => {
      await updateBookingByIdTx(tx, id, { status: 'cancelled' } as any);
      if (booking.slot_id) await releaseSlotTx(tx, { slot_id: booking.slot_id });
    });

    return reply.send({ ok: true, id, status: 'cancelled' });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'booking_cancel_failed' } });
  }
};
