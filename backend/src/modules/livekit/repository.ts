import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { WebhookEvent } from 'livekit-server-sdk';
import { db } from '@/db/client';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { consultants } from '@/modules/consultants/schema';
import { liveSessions } from './schema';
import { buildLiveKitToken, getLiveKitUrl, makeRoomName } from './service';

type ParticipantKind = 'user' | 'consultant';

function parseAppointment(date: string, time?: string | null) {
  const safeTime = time?.trim() || '00:00';
  return new Date(`${date}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`);
}

function assertBookingWindow(booking: {
  appointment_date: string;
  appointment_time: string | null;
  session_duration: number;
}) {
  const start = parseAppointment(booking.appointment_date, booking.appointment_time);
  if (Number.isNaN(start.getTime())) {
    const error = new Error('invalid_booking_time');
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  const now = Date.now();
  const startsAt = start.getTime();
  const endsAt = startsAt + Number(booking.session_duration ?? 30) * 60_000;
  const buffer = 15 * 60_000;

  if (now < startsAt - buffer || now > endsAt + buffer) {
    const error = new Error('booking_not_in_call_window');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

async function getBookingForParticipant(bookingId: string, userId: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      user_id: bookings.user_id,
      consultant_id: bookings.consultant_id,
      appointment_date: bookings.appointment_date,
      appointment_time: bookings.appointment_time,
      session_duration: bookings.session_duration,
      status: bookings.status,
      consultant_user_id: consultants.user_id,
    })
    .from(bookings)
    .innerJoin(consultants, eq(consultants.id, bookings.consultant_id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return null;

  let participant: ParticipantKind | null = null;
  if (row.user_id === userId) participant = 'user';
  if (row.consultant_user_id === userId) participant = 'consultant';

  return participant ? { booking: row, participant } : null;
}

export async function issueLiveKitToken(bookingId: string, userId: string) {
  const access = await getBookingForParticipant(bookingId, userId);
  if (!access) {
    const error = new Error('booking_not_found_or_forbidden');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (!['booked', 'confirmed', 'active'].includes(access.booking.status)) {
    const error = new Error('booking_not_ready_for_call');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  assertBookingWindow(access.booking);

  const roomName = makeRoomName(bookingId);
  const identity = `${userId}|${access.participant === 'consultant' ? 'host' : 'guest'}`;
  const ttlSeconds = 60 * 60;
  const token = await buildLiveKitToken({
    roomName,
    identity,
    role: access.participant === 'consultant' ? 'host' : 'guest',
    ttlSeconds,
  });
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const tokenPatch =
    access.participant === 'consultant' ? { host_token: token } : { guest_token: token };

  await db
    .insert(liveSessions)
    .values({
      id: randomUUID(),
      booking_id: bookingId,
      room_name: roomName,
      media_type: 'audio',
      status: 'active',
      started_at: new Date(),
      ...tokenPatch,
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        room_name: roomName,
        status: 'active',
        started_at: sql`COALESCE(${liveSessions.started_at}, NOW())`,
        ...tokenPatch,
      } as any,
    });

  return {
    token,
    room: roomName,
    ws_url: getLiveKitUrl(),
    expires_at: expiresAt.toISOString(),
  };
}

export async function endLiveKitSession(bookingId: string, userId: string) {
  const access = await getBookingForParticipant(bookingId, userId);
  if (!access) {
    const error = new Error('booking_not_found_or_forbidden');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  await db
    .update(liveSessions)
    .set({
      status: 'ended',
      ended_at: new Date(),
      duration_seconds: sql`CASE
        WHEN started_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
      END`,
    } as any)
    .where(and(eq(liveSessions.booking_id, bookingId), eq(liveSessions.status, 'active')));

  const [row] = await db
    .select()
    .from(liveSessions)
    .where(eq(liveSessions.booking_id, bookingId))
    .limit(1);

  return row ?? null;
}

export async function handleLiveKitWebhook(event: WebhookEvent) {
  const roomName = event.room?.name;
  if (!roomName?.startsWith('goldmood-')) return { ignored: true };

  const bookingId = roomName.replace(/^goldmood-/, '');

  if (event.event === 'room_started' || event.event === 'participant_joined') {
    await db
      .update(liveSessions)
      .set({
        status: 'active',
        started_at: sql`COALESCE(${liveSessions.started_at}, NOW())`,
      } as any)
      .where(eq(liveSessions.booking_id, bookingId));
  }

  if (event.event === 'room_finished') {
    await db
      .update(liveSessions)
      .set({
        status: 'ended',
        ended_at: new Date(),
        duration_seconds: sql`CASE
          WHEN started_at IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
        END`,
      } as any)
      .where(eq(liveSessions.booking_id, bookingId));

    await db.update(bookings).set({ status: 'completed' } as any).where(eq(bookings.id, bookingId));
  }

  return { ok: true, event: event.event, booking_id: bookingId };
}
