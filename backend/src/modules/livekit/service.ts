import { AccessToken, WebhookReceiver, type VideoGrant, type WebhookEvent } from 'livekit-server-sdk';
import { env } from '@/core/env';

export function makeRoomName(bookingId: string) {
  return `goldmood-${bookingId}`;
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

export async function receiveLiveKitWebhook(body: string, authHeader?: string) {
  assertLiveKitConfigured();
  const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
  return receiver.receive(body, authHeader) as Promise<WebhookEvent>;
}
