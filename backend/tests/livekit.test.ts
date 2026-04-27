import { createHash } from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';
import { expect, test } from 'bun:test';
import { env } from '@/core/env';
import {
  buildLiveKitToken,
  makeRoomName,
  receiveLiveKitWebhook,
} from '@/modules/livekit/service';

type LiveKitConfig = {
  LIVEKIT_URL: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
};

type MutableConfig = Record<string, unknown> & LiveKitConfig;

const baseline: LiveKitConfig = {
  LIVEKIT_URL: env.LIVEKIT_URL,
  LIVEKIT_API_KEY: env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET,
};

function setLiveKitEnv(next: Partial<LiveKitConfig>) {
  const mutable = env as MutableConfig;
  Object.assign(mutable, next);
}

function resetLiveKitEnv() {
  setLiveKitEnv(baseline);
}

function buildWebhookAuthHeader(body: string) {
  const bodySha256 = createHash('sha256').update(body).digest('base64');
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    ttl: 60,
  });
  token.sha256 = bodySha256;
  return token.toJwt();
}

test('buildLiveKitToken returns a valid JWT-like token', async () => {
  setLiveKitEnv({
    LIVEKIT_URL: 'wss://test.livekit.local',
    LIVEKIT_API_KEY: 'test-api-key',
    LIVEKIT_API_SECRET: 'test-api-secret',
  });

  const token = await buildLiveKitToken({
    roomName: makeRoomName('booking-001'),
    identity: 'user-001|guest',
    role: 'guest',
    ttlSeconds: 120,
  });

  expect(token.split('.')).toHaveLength(3);
  expect(token).toContain('.');
  resetLiveKitEnv();
});

test('receiveLiveKitWebhook validates signature and rejects bad auth header', async () => {
  setLiveKitEnv({
    LIVEKIT_URL: 'wss://test.livekit.local',
    LIVEKIT_API_KEY: 'test-api-key',
    LIVEKIT_API_SECRET: 'test-api-secret',
  });

  const payload = JSON.stringify({
    event: 'room_finished',
    room: {
      name: makeRoomName('booking-001'),
    },
  });

  const goodAuth = await buildWebhookAuthHeader(payload);
  const event = await receiveLiveKitWebhook(payload, goodAuth);

  expect(event.event).toBe('room_finished');
  expect(event.room?.name).toBe(makeRoomName('booking-001'));

  await expect(receiveLiveKitWebhook(payload, undefined)).rejects.toThrow(
    'authorization header is empty',
  );
  await expect(receiveLiveKitWebhook(payload, 'invalid-token')).rejects.toThrow();
  resetLiveKitEnv();
});

test('buildLiveKitToken throws when livekit is not configured', async () => {
  setLiveKitEnv({
    LIVEKIT_URL: '',
    LIVEKIT_API_KEY: '',
    LIVEKIT_API_SECRET: '',
  });

  await expect(
    buildLiveKitToken({
      roomName: makeRoomName('booking-002'),
      identity: 'user-002|guest',
      role: 'guest',
    }),
  ).rejects.toThrow('livekit_not_configured');

  resetLiveKitEnv();
});
