import {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
  type VideoGrant,
  type WebhookEvent,
} from 'livekit-server-sdk';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { env } from '@/core/env';

export function makeRoomName(bookingId: string) {
  return `${appConfig.livekit.roomPrefix}-${bookingId}`;
}

export function assertLiveKitConfigured() {
  if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    const error = new Error('livekit_not_configured');
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }
}

export async function buildLiveKitToken(params: {
  roomName: string;
  identity: string;
  role: 'host' | 'guest';
  ttlSeconds?: number;
}) {
  assertLiveKitConfigured();

  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: params.identity,
    ttl: params.ttlSeconds ?? 3600,
    metadata: JSON.stringify({ role: params.role }),
  });

  const grant: VideoGrant = {
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };
  token.addGrant(grant);
  return token.toJwt();
}

export function getLiveKitUrl() {
  assertLiveKitConfigured();
  return env.LIVEKIT_URL;
}

/**
 * Odayı sunucu tarafında kapatır: içerideki tüm katılımcılar anında düşer.
 * Süresi dolan seansları otomatik sonlandıran cron kullanır (M1-b).
 *
 * Oda zaten yoksa LiveKit 404 döner; bu bir hata değil (görüşme kendiliğinden
 * bitmiş demektir), o yüzden sessizce başarı sayılır.
 */
export async function closeLiveKitRoom(roomName: string): Promise<'closed' | 'already_gone'> {
  assertLiveKitConfigured();
  const client = new RoomServiceClient(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
  try {
    await client.deleteRoom(roomName);
    return 'closed';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|404|does not exist/i.test(message)) return 'already_gone';
    throw err;
  }
}

export async function receiveLiveKitWebhook(body: string, authHeader?: string) {
  assertLiveKitConfigured();
  const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
  return receiver.receive(body, authHeader) as Promise<WebhookEvent>;
}
