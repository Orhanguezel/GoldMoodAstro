import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { consultants } from '@/modules/consultants/schema';
import { voiceSessions } from './schema';
import { buildRtcToken, getAgoraAppId, makeAgoraUid, makeChannelName } from './service';

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

export async function issueAgoraToken(bookingId: string, userId: string) {
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

  const channelName = makeChannelName(bookingId);
  const uid = makeAgoraUid(userId);
  const expiresInSeconds = (Number(access.booking.session_duration ?? 30) + 30) * 60;
  const token = buildRtcToken({ channelName, uid, expiresInSeconds });

  const tokenPatch =
    access.participant === 'consultant' ? { token_consultant: token } : { token_user: token };

  await db
    .insert(voiceSessions)
    .values({
      id: randomUUID(),
      booking_id: bookingId,
      channel_name: channelName,
      status: 'active',
      started_at: new Date(),
      ...tokenPatch,
    } as any)
    .onDuplicateKeyUpdate({
      set: {
        channel_name: channelName,
        status: 'active',
        started_at: sql`COALESCE(${voiceSessions.started_at}, NOW())`,
        ...tokenPatch,
      } as any,
    });

  return {
    channel_name: channelName,
    token,
    app_id: getAgoraAppId(),
    uid,
  };
}

export async function endAgoraSession(bookingId: string, userId: string) {
  const access = await getBookingForParticipant(bookingId, userId);
  if (!access) {
    const error = new Error('booking_not_found_or_forbidden');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  await db
    .update(voiceSessions)
    .set({
      status: 'ended',
      ended_at: new Date(),
      duration_seconds: sql`CASE
        WHEN started_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, started_at, NOW())
      END`,
    } as any)
    .where(and(eq(voiceSessions.booking_id, bookingId), eq(voiceSessions.status, 'active')));

  const [row] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.booking_id, bookingId))
    .limit(1);

  return row ?? null;
}
