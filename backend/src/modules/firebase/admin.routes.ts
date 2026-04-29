import type { FastifyInstance } from 'fastify';
import {
  listPushCampaignsHandler,
  sendManualPushHandler,
  sendPushCampaignHandler,
} from './admin.controller';

export async function registerFirebaseAdmin(app: FastifyInstance) {
  app.get('/push/campaigns', { config: { auth: true } }, listPushCampaignsHandler);
  app.post('/push/campaigns/:slug/send', { config: { auth: true } }, sendPushCampaignHandler);
  app.post('/push/send', { config: { auth: true } }, sendManualPushHandler);
}
