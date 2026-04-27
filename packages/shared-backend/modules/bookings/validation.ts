// =============================================================
// FILE: src/modules/bookings/validation.ts
// FINAL — Bookings validation (NO i18n, locale only)
// =============================================================

import { z } from 'zod';
import { boolLike } from '../_shared/common';
import {
  bookingStatusEnum, safeTrim, uuid36Schema,
  dateYmdSchema, timeHmSchema, LOCALE_SCHEMA,
 } from '../_shared';

export const bookingStatusSchema = z.enum(bookingStatusEnum as unknown as [string, ...string[]]);


export const listBookingsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.string().trim().optional(),
  is_read: boolLike.optional(),

  appointment_date: dateYmdSchema.optional(),
  appointment_time: timeHmSchema.optional(),

  service_id: uuid36Schema.optional(),
  resource_id: uuid36Schema.optional(),

  locale: LOCALE_SCHEMA.optional(),

  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const nonEmptyTrimmed = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((v) => safeTrim(v));

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(190)
  .transform((v) => safeTrim(v));
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .transform((v) => safeTrim(v));
const mediaTypeSchema = z.enum(['audio', 'video']).default('audio');

/** PUBLIC create: always reserves slot (status=pending_payment)
 *  Mobile auth'lu kullanıcılar için consultant_id + session bilgisi zorunlu.
 *  name/email/phone opsiyonel — eksikse backend req.user profiliinden doldurur.
 */
export const publicCreateBookingSchema = z.object({
  locale: LOCALE_SCHEMA.optional(),

  // Authenticated users don't need to send these; filled from user profile
  name: nonEmptyTrimmed(2, 120).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),

  // GoldMoodAstro required fields
  consultant_id: uuid36Schema,
  session_price: z.string().trim().min(1).max(12).optional(),
  session_duration: z.coerce.number().int().min(15).max(480).optional(),
  media_type: mediaTypeSchema,

  appointment_date: dateYmdSchema,
  appointment_time: timeHmSchema,

  resource_id: uuid36Schema,

  service_id: uuid36Schema.optional(),
  customer_message: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => safeTrim(v)),
});

export type PublicCreateBookingBody = z.infer<typeof publicCreateBookingSchema>;

/** ADMIN create */
export const adminCreateBookingSchema = publicCreateBookingSchema.extend({
  // Admin is creating on behalf of a user — contact fields required
  name: nonEmptyTrimmed(2, 120),
  email: emailSchema,
  phone: phoneSchema,
  session_price: z.string().trim().min(1).max(12),
  media_type: mediaTypeSchema.optional(),

  // GoldMoodAstro: consultant optional for admin (can fill manually)
  consultant_id: uuid36Schema.optional(),
  // Admin can assign to a specific user
  user_id: uuid36Schema.optional(),

  status: bookingStatusSchema.optional(),
  is_read: boolLike.optional(),
  admin_note: z
    .string()
    .trim()
    .max(8000)
    .optional()
    .transform((v) => safeTrim(v)),
});

export type AdminCreateBookingBody = z.infer<typeof adminCreateBookingSchema>;

export const adminUpdateBookingSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(190).optional(),
    phone: z.string().trim().min(7).max(32).optional(),

    locale: LOCALE_SCHEMA.optional(),

    customer_message: z.string().trim().max(4000).optional().nullable(),

    service_id: uuid36Schema.optional().nullable(),
    resource_id: uuid36Schema.optional().nullable(),

    appointment_date: dateYmdSchema.optional(),
    appointment_time: timeHmSchema.optional().nullable(),

    status: bookingStatusSchema.optional(),
    is_read: boolLike.optional(),

    admin_note: z.string().trim().max(8000).optional().nullable(),
    decision_note: z.string().trim().max(8000).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No-op body' });

export type AdminUpdateBookingBody = z.infer<typeof adminUpdateBookingSchema>;

/** Capacity is held for these statuses */
export function isActiveForCapacity(status: string | null | undefined) {
  return status === 'new' || status === 'booked' || status === 'confirmed';
}

export const adminDecisionSchema = z
  .object({
    // template dili için opsiyonel override (istersen kullanırsın)
    locale: LOCALE_SCHEMA.optional(),

    decision_note: z
      .string()
      .trim()
      .max(8000)
      .optional()
      .transform((v) => safeTrim(v)),
  })
  .optional()
  .default({});
