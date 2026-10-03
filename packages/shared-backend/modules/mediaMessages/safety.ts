import { randomUUID } from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../auth/schema';
import { chat_blocks } from '../chat/schema';
import { assertChatReportTarget, assertChatSendState, assertSafeChatText } from '../chat/safety';
import { consultants } from '../consultants/schema';
import { mediaMessages, mediaReports } from './schema';

function fail(code: string, statusCode: number): never {
  throw Object.assign(new Error(code), { statusCode });
}

export async function mediaPair(consultantId: string, customerId: string) {
  const [consultant] = await db.select({ user_id: consultants.user_id }).from(consultants)
    .where(eq(consultants.id, consultantId)).limit(1);
  if (!consultant) fail('consultant_not_found', 404);
  if (consultant.user_id === customerId) fail('cannot_message_self', 400);
  return consultant.user_id;
}

export function assertMediaParticipant(actorId: string, customerId: string, consultantUserId: string) {
  if (actorId !== customerId && actorId !== consultantUserId) fail('media_participant_required', 403);
}

export function mediaSenderUserId(direction: 'question' | 'reply', customerId: string, consultantUserId: string) {
  return direction === 'question' ? customerId : consultantUserId;
}

export async function mediaSafetyState(consultantId: string, customerId: string, actorId: string) {
  const consultantUserId = await mediaPair(consultantId, customerId);
  assertMediaParticipant(actorId, customerId, consultantUserId);
  const peerUserId = actorId === customerId ? consultantUserId : customerId;
  const [account] = await db.select({ rules_accepted_at: users.rules_accepted_at }).from(users).where(eq(users.id, actorId)).limit(1);
  const blocks = await db.select({ blocker_user_id: chat_blocks.blocker_user_id }).from(chat_blocks).where(or(
    and(eq(chat_blocks.blocker_user_id, actorId), eq(chat_blocks.blocked_user_id, peerUserId)),
    and(eq(chat_blocks.blocker_user_id, peerUserId), eq(chat_blocks.blocked_user_id, actorId)),
  ));
  return {
    peer_user_id: peerUserId,
    blocked_by_me: blocks.some((row) => row.blocker_user_id === actorId),
    blocked_by_peer: blocks.some((row) => row.blocker_user_id === peerUserId),
    terms_accepted: Boolean(account?.rules_accepted_at),
  };
}

export async function assertMediaSendAllowed(consultantId: string, customerId: string, actorId: string, note?: string | null) {
  if (note) assertSafeChatText(note);
  assertChatSendState(await mediaSafetyState(consultantId, customerId, actorId));
}

export async function setMediaBlock(messageId: string, actorId: string, blocked: boolean) {
  const message = await participantMessage(messageId, actorId);
  const state = await mediaSafetyState(message.consultant_id, message.user_id, actorId);
  if (blocked) {
    await db.insert(chat_blocks).values({ id: randomUUID(), blocker_user_id: actorId, blocked_user_id: state.peer_user_id, created_at: new Date() })
      .onDuplicateKeyUpdate({ set: { blocker_user_id: actorId } });
  } else {
    await db.delete(chat_blocks).where(and(eq(chat_blocks.blocker_user_id, actorId), eq(chat_blocks.blocked_user_id, state.peer_user_id)));
  }
  return mediaSafetyState(message.consultant_id, message.user_id, actorId);
}

export async function participantMessage(messageId: string, actorId: string) {
  const [message] = await db.select().from(mediaMessages).where(eq(mediaMessages.id, messageId)).limit(1);
  if (!message) fail('media_message_not_found', 404);
  const consultantUserId = await mediaPair(message.consultant_id, message.user_id);
  assertMediaParticipant(actorId, message.user_id, consultantUserId);
  return { ...message, consultant_user_id: consultantUserId };
}

export async function reportMediaMessage(messageId: string, actorId: string, reason: string, details?: string) {
  const message = await participantMessage(messageId, actorId);
  const senderId = mediaSenderUserId(message.direction, message.user_id, message.consultant_user_id);
  assertChatReportTarget(senderId, actorId);
  await db.insert(mediaReports).values({ id: randomUUID(), message_id: message.id, reporter_user_id: actorId,
    reported_user_id: senderId, reason, details: details ?? null, status: 'open', created_at: new Date() })
    .onDuplicateKeyUpdate({ set: { reason, details: details ?? null, status: 'open' } });
  return { ok: true };
}
