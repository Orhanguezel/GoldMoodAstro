import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../middleware/auth';
import {
  createMediaMessageHandler,
  getAdminMediaMessageStatsHandler,
  getAdminMediaMessageFileHandler,
  getConsultantMediaSettingsHandler,
  getConsultantMediaSafetyHandler,
  getMediaSafetyHandler,
  setMediaBlockHandler,
  reportMediaHandler,
  listAdminMediaReportsHandler,
  reviewAdminMediaReportHandler,
  getMediaMessageFileHandler,
  listAdminMediaMessagesHandler,
  listMyConsultantMediaMessagesHandler,
  listMyMediaMessagesHandler,
  replyMediaMessageHandler,
  updateMyMediaSettingsHandler,
} from './controller';

export async function registerMediaMessages(app: FastifyInstance) {
  app.get('/consultants/:id/media-settings', getConsultantMediaSettingsHandler);

  const guard = { preHandler: [requireAuth] };
  app.put('/me/consultant/media-settings', guard, updateMyMediaSettingsHandler);
  app.get('/me/consultant/media-messages', guard, listMyConsultantMediaMessagesHandler);
  app.post('/me/consultant/media-messages/:id/reply', guard, replyMediaMessageHandler);
  app.post('/me/media-messages', guard, createMediaMessageHandler);
  app.get('/me/consultants/:id/media-safety', guard, getConsultantMediaSafetyHandler);
  app.get('/me/media-messages', guard, listMyMediaMessagesHandler);
  app.get('/me/media-messages/:id/safety', guard, getMediaSafetyHandler);
  app.post('/me/media-messages/:id/block', guard, setMediaBlockHandler);
  app.delete('/me/media-messages/:id/block', guard, setMediaBlockHandler);
  app.post('/me/media-messages/:id/reports', guard, reportMediaHandler);
  app.get('/me/media-messages/:id/file', guard, getMediaMessageFileHandler);
}

export async function registerMediaMessagesAdmin(app: FastifyInstance) {
  app.get('/media-messages', listAdminMediaMessagesHandler);
  app.get('/media-messages/stats', getAdminMediaMessageStatsHandler);
  app.get('/media-messages/reports', listAdminMediaReportsHandler);
  app.patch('/media-messages/reports/:id', reviewAdminMediaReportHandler);
  app.get('/media-messages/:id/file', getAdminMediaMessageFileHandler);
}
