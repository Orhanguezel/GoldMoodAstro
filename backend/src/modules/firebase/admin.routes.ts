import type { FastifyInstance } from 'fastify';
import {
  listPushCampaignsHandler,
  sendManualPushHandler,
  sendPushCampaignHandler,
} from './admin.controller';

export async function registerFirebaseAdmin(app: FastifyInstance) {
  app.get('/push/campaigns', { config: { auth: true, rateLimit: { max: 60, timeWindow: '1 minute' } } }, listPushCampaignsHandler);
  app.post('/push/campaigns/:slug/send', { config: { auth: true, rateLimit: { max: 10, timeWindow: '1 minute' } } }, sendPushCampaignHandler);
  app.post('/push/send', { config: { auth: true, rateLimit: { max: 10, timeWindow: '1 minute' } } }, sendManualPushHandler);
}
