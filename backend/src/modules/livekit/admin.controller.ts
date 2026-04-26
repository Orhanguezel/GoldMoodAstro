import type { RouteHandler } from 'fastify';
import { RoomServiceClient } from 'livekit-server-sdk';
import { env } from '@/core/env';

function mask(value: string) {
  if (!value) return '';
  if (value.length <= 8) return `${value.slice(0, 2)}****`;
  return `${value.slice(0, 6)}****${value.slice(-4)}`;
}

function liveKitHttpUrl(url: string) {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
}

export const getLiveKitAdminStatusHandler: RouteHandler = async () => {
  const configured = Boolean(env.LIVEKIT_URL && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET);
  let activeRooms: number | null = null;
  let roomsError: string | null = null;

  if (configured) {
    try {
      const client = new RoomServiceClient(
        liveKitHttpUrl(env.LIVEKIT_URL),
        env.LIVEKIT_API_KEY,
        env.LIVEKIT_API_SECRET,
      );
      const rooms = await client.listRooms();
      activeRooms = rooms.length;
    } catch (error) {
      roomsError = error instanceof Error ? error.message : 'livekit_rooms_failed';
    }
  }

  return {
    data: {
      configured,
      livekit_url: env.LIVEKIT_URL,
      api_key_masked: mask(env.LIVEKIT_API_KEY),
      webhook_signing_key_configured: Boolean(env.LIVEKIT_API_SECRET),
      active_rooms: activeRooms,
      rooms_error: roomsError,
    },
  };
};
