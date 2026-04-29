import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { WebhookEvent } from 'livekit-server-sdk';
import { db } from '@/db/client';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { userCredits, creditTransactions } from '@goldmood/shared-backend/modules/credits/schema';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';
import { consultants } from '@/modules/consultants/schema';
import { sendPushNotification } from '@/modules/firebase/service';
import { liveSessions } from './schema';
import { buildLiveKitToken, getLiveKitUrl, makeRoomName } from './service';

type ParticipantKind = 'user' | 'consultant';
function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calcCreditCost(args: { sessionPrice: string | null; durationSeconds: number | null }) {
  const sessionPrice = toSafeNumber(args.sessionPrice);
  const durationSeconds = Number(args.durationSeconds ?? 0);

  if (sessionPrice <= 0 || durationSeconds <= 0) return 0;

  const durationMinutes = Math.ceil(durationSeconds / 60);
  const rawCost = sessionPrice * durationMinutes;
  return Math.max(0, Math.ceil(rawCost));
}

async function getBookingBillingContext(bookingId: string) {
  const [row] = await db
    .select({
      booking_id: bookings.id,
      user_id: bookings.user_id,
      booking_status: bookings.status,
      session_price: bookings.session_price,
      fcm_token: users.fcm_token,
    })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.user_id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return row ?? null;
}

async function settleBookingCredits(args: {
  bookingId: string;
  sessionPrice: string | null;
  durationSeconds: number | null;
}) {
  const durationSeconds = args.durationSeconds == null ? 0 : Number(args.durationSeconds);
  const amount = calcCreditCost({
    sessionPrice: args.sessionPrice,
    durationSeconds,
  });

  const context = await getBookingBillingContext(args.bookingId);
  if (!context) return { status: 'no_charge' as const, amount: 0, available_balance: 0 };

  if (amount <= 0) {
    return { status: 'no_charge' as const, amount: 0, available_balance: 0 };
  }

  return await db.transaction(async (tx) => {
    const [alreadyConsumed] = await tx
      .select({ id: creditTransactions.id })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.referenceType, 'booking'),
          eq(creditTransactions.referenceId, args.bookingId),
          eq(creditTransactions.type, 'consumption'),
        ),
      )
      .limit(1);

    if (alreadyConsumed) {
      return { status: 'already_consumed' as const };
    }

    let [wallet] = await tx
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, context.user_id))
      .limit(1);

    if (!wallet) {
      const walletId = randomUUID();
      await tx.insert(userCredits).values({
        id: walletId,
        userId: context.user_id,
        balance: 0,
      } as any);
      [wallet] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.id, walletId))
        .limit(1);
    }

    const currentBalance = toSafeNumber(wallet?.balance);
    if (currentBalance < amount) {
      return {
        status: 'insufficient' as const,
        amount,
        available_balance: currentBalance,
      };
    }

    const balanceAfter = currentBalance - amount;
    await tx.update(userCredits).set({ balance: balanceAfter, updatedAt: new Date() }).where(eq(userCredits.id, wallet.id));

    await tx.insert(creditTransactions).values({
      id: randomUUID(),
      userId: context.user_id,
      type: 'consumption',
      amount: -amount,
      balanceAfter,
      referenceType: 'booking',
      referenceId: args.bookingId,
      orderId: null,
      description: `Live görüşme ${durationSeconds} sn`,
    } as any);

    return {
      status: 'consumed' as const,
      amount,
      available_balance: currentBalance,
      balance_after: balanceAfter,
    };
  });
}

function parseAppointment(date: string, time?: string | null) {
  const safeTime = time?.trim() || '00:00';
  return new Date(`${date}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`);
}

function assertBookingWindow(booking: {
  appointment_date: string;
  appointment_time: string | null;
  session_duration: number;
}) {
  // DEV: Mock payment / test akışında zaman penceresi kontrolünü bypass et.
  if (process.env.PAYMENT_MOCK_MODE === 'true' || process.env.LIVEKIT_SKIP_WINDOW_CHECK === 'true') {
    return;
  }

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
      media_type: bookings.media_type,
      consultant_user_id: consultants.user_id,
      consultant_supports_video: consultants.supports_video,
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

/**
 * T11-1 — Video feature flag check
 * media_type='video' ise:
 *   - feature_video_enabled site_setting toggle ON olmalı (admin'in livekit-tab.tsx'ten yönettiği key)
 *   - consultants.supports_video=1 olmalı (consultant tarafı)
 * Aksi halde 403.
 */
async function assertVideoCallAllowed(args: {
  mediaType: 'audio' | 'video';
  consultantSupportsVideo: number | null | undefined;
}) {
  if (args.mediaType !== 'video') return;

  // site_settings.feature_video_enabled — admin paneldeki LiveKit tab toggle bunu set eder
  const flagRows = await db.execute(sql`
    SELECT value FROM site_settings WHERE \`key\` = 'feature_video_enabled' LIMIT 1
  `);
  const arr = Array.isArray((flagRows as unknown as unknown[])?.[0]) ? (flagRows as unknown as unknown[][])[0] : flagRows;
  const row = (Array.isArray(arr) ? arr[0] : null) as { value?: string | number | boolean } | null;
  // Tolerate '1'/'true'/true/1 (admin yazar 'true', seed yazar '0')
  const raw = row?.value;
  const flagOn =
    raw === true || raw === 1 ||
    String(raw ?? '').trim().toLowerCase() === 'true' ||
    String(raw ?? '').trim() === '1';

  if (!flagOn) {
    const error = new Error('video_call_feature_disabled');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  if (!args.consultantSupportsVideo || Number(args.consultantSupportsVideo) === 0) {
    const error = new Error('consultant_does_not_support_video');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
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

  // T11-1 — Video feature flag check
  await assertVideoCallAllowed({
    mediaType: access.booking.media_type === 'video' ? 'video' : 'audio',
    consultantSupportsVideo: access.booking.consultant_supports_video,
  });

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
  const mediaType = access.booking.media_type === 'video' ? 'video' : 'audio';

  await db
    .insert(liveSessions)
    .values({
      id: randomUUID(),
      booking_id: bookingId,
      room_name: roomName,
      media_type: mediaType,
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
    const booking = await getBookingBillingContext(bookingId);
    if (!booking) {
      return { ignored: true, event: event.event, booking_id: bookingId };
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
      .where(eq(liveSessions.booking_id, bookingId));

    const [session] = await db
      .select({
        duration_seconds: liveSessions.duration_seconds,
      })
      .from(liveSessions)
      .where(eq(liveSessions.booking_id, bookingId))
      .limit(1);

    const settlement = await settleBookingCredits({
      bookingId,
      sessionPrice: booking.session_price,
      durationSeconds: (session?.duration_seconds as number | null) ?? null,
    });

    const nextBookingStatus =
      booking.booking_status === 'completed' ||
      booking.booking_status === 'cancelled' ||
      booking.booking_status === 'timed_out' ||
      booking.booking_status === 'no_show'
        ? booking.booking_status
        : settlement.status === 'insufficient'
          ? 'timed_out'
          : 'completed';
    await db.update(bookings).set({ status: nextBookingStatus } as any).where(eq(bookings.id, bookingId));

    if (settlement.status === 'insufficient') {
      const title = 'Görüşme Bitişi';
      const message =
        'Kredi bakiyeniz görüşme süresini karşılamaya yetmedi. Kredi yükleyerek tekrar deneyebilirsiniz.';
      const payload = { type: 'booking_credit_insufficient', booking_id: bookingId };
      void createUserNotification({
        userId: booking.user_id,
        title,
        message,
        type: 'system',
      }).catch(() => undefined);
      if (booking.fcm_token) {
        void sendPushNotification({
          token: booking.fcm_token,
          title,
          body: message,
          data: payload,
        }).catch(() => undefined);
      }
    }
  }

  return { ok: true, event: event.event, booking_id: bookingId };
}
