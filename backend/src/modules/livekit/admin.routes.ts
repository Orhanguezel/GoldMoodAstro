import type { FastifyInstance } from 'fastify';
import { getLiveKitAdminStatusHandler } from './admin.controller';

export async function registerLiveKitAdmin(app: FastifyInstance) {
  app.get('/livekit/status', { config: { auth: true } }, getLiveKitAdminStatusHandler);
}
