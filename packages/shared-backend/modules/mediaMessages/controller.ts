import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { buildPublicUrl } from '../storage/util';
import { getCloudinaryConfig } from '../storage/cloudinary';
import { repoGetByBucketPath } from '../storage/repository';
import {
  createMediaMessageSchema,
  replyMediaMessageSchema,
  updateMediaSettingsSchema,
} from './validation';
import {
  createQuestion,
  createReply,
  getConsultantForUser,
  getMediaMessageForUser,
  getMediaMessageById,
  getAdminMediaMessageStats,
  getPublicMediaSettings,
  listAdminMediaMessages,
  listConsultantMessages,
  listCustomerMessages,
  upsertMediaSettings,
} from './repository';

function userIdFromRequest(req: FastifyRequest) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

const consultantIdParams = z.object({ id: z.string().trim().min(1).max(80) });
const messageIdParams = z.object({ id: z.string().trim().min(1).max(36) });

export async function getConsultantMediaSettingsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = consultantIdParams.parse(req.params ?? {});
  const data = await getPublicMediaSettings(id);
  if (!data) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data });
}

export async function updateMyMediaSettingsHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const consultant = await getConsultantForUser(userId);
  if (!consultant) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const body = updateMediaSettingsSchema.parse(req.body ?? {});
  const data = await upsertMediaSettings(consultant.id, body);
  return reply.send({ data });
}

export async function createMediaMessageHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const body = createMediaMessageSchema.parse(req.body ?? {});
  const result = await createQuestion(userId, body);
  if (result.status === 'not_found') return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  if (result.status === 'disabled') return reply.code(409).send({ error: { message: 'media_message_disabled' } });
  if (result.status === 'insufficient') return reply.code(402).send({ error: { message: 'insufficient_credits', detail: result.consume } });
  return reply.send({ data: result.data });
}

export async function listMyMediaMessagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const data = await listCustomerMessages(userId);
  return reply.send({ data });
}

export async function listMyConsultantMediaMessagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const consultant = await getConsultantForUser(userId);
  if (!consultant) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const data = await listConsultantMessages(consultant.id);
  return reply.send({ data });
}

export async function replyMediaMessageHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const consultant = await getConsultantForUser(userId);
  if (!consultant) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { id } = messageIdParams.parse(req.params ?? {});
  const body = replyMediaMessageSchema.parse(req.body ?? {});
  const result = await createReply(consultant.id, consultant.user_id, id, body);
  if (result.status === 'not_found') return reply.code(404).send({ error: { message: 'not_found' } });
  if (result.status === 'not_answerable') return reply.code(409).send({ error: { message: 'not_answerable' } });
  return reply.send({ data: result.data });
}

export async function getMediaMessageFileHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const { id } = messageIdParams.parse(req.params ?? {});
  const message = await getMediaMessageForUser(id, userId);
  if (!message) return reply.code(404).send({ error: { message: 'not_found' } });

  const rawPath = String(message.storage_path || '').replace(/^\/+/, '');
  const candidates = rawPath.startsWith('media_messages/')
    ? [rawPath, rawPath.slice('media_messages/'.length)]
    : [rawPath, `media_messages/${rawPath}`];
  let asset = null as Awaited<ReturnType<typeof repoGetByBucketPath>> | null;
  for (const candidate of candidates) {
    asset = await repoGetByBucketPath('media_messages', candidate);
    if (asset) break;
  }
  if (!asset) return reply.code(404).send({ error: { message: 'file_not_found' } });

  const cfg = await getCloudinaryConfig();
  const url = buildPublicUrl('media_messages', asset.path, asset.url, cfg ?? undefined);
  return reply.redirect(url, 302);
}

async function redirectMediaMessageFile(message: any, reply: FastifyReply) {
  const rawPath = String(message.storage_path || '').replace(/^\/+/, '');
  const candidates = rawPath.startsWith('media_messages/')
    ? [rawPath, rawPath.slice('media_messages/'.length)]
    : [rawPath, `media_messages/${rawPath}`];
  let asset = null as Awaited<ReturnType<typeof repoGetByBucketPath>> | null;
  for (const candidate of candidates) {
    asset = await repoGetByBucketPath('media_messages', candidate);
    if (asset) break;
  }
  if (!asset) return reply.code(404).send({ error: { message: 'file_not_found' } });

  const cfg = await getCloudinaryConfig();
  const url = buildPublicUrl('media_messages', asset.path, asset.url, cfg ?? undefined);
  return reply.redirect(url, 302);
}

export async function getAdminMediaMessageFileHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = messageIdParams.parse(req.params ?? {});
  const message = await getMediaMessageById(id);
  if (!message) return reply.code(404).send({ error: { message: 'not_found' } });
  return redirectMediaMessageFile(message, reply);
}

export async function listAdminMediaMessagesHandler(req: FastifyRequest, reply: FastifyReply) {
  const status = (req.query as { status?: string } | undefined)?.status || null;
  const data = await listAdminMediaMessages(status);
  return reply.send({ data });
}

export async function getAdminMediaMessageStatsHandler(_req: FastifyRequest, reply: FastifyReply) {
  const data = await getAdminMediaMessageStats();
  return reply.send({ data });
}
