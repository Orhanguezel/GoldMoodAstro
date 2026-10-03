import { randomUUID } from 'crypto';
import { and, eq, ne, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { checkContent } from '../_shared/contentModeration';
import { chat_blocks, chat_messages, chat_participants, chat_reports } from './schema';
import { users } from '../auth/schema';

function fail(code: string, statusCode: number): never {
  throw Object.assign(new Error(code), { statusCode });
}

export function requireChatPeer(member: boolean, peerUserId: string | null): string {
  if (!member) fail('forbidden_thread_membership', 403);
  if (!peerUserId) fail('chat_peer_not_found', 409);
  return peerUserId;
}

export function assertChatSendState(state: { terms_accepted: boolean; blocked_by_me: boolean; blocked_by_peer: boolean }) {
  if (!state.terms_accepted) fail('chat_terms_acceptance_required', 403);
  if (state.blocked_by_me || state.blocked_by_peer) fail('chat_blocked', 403);
}

export function assertChatReportTarget(senderUserId: string | null, reporterUserId: string) {
  if (!senderUserId) fail('message_not_found', 404);
  if (senderUserId === reporterUserId) fail('cannot_report_own_message', 400);
}

export function assertSafeChatText(text: string): void {
  if (!checkContent(text, 'message').safe) fail('message_content_not_allowed', 422);
}

export async function getChatPeer(threadId: string, userId: string): Promise<string> {
  const [member] = await db.select({ user_id: chat_participants.user_id }).from(chat_participants)
    .where(and(eq(chat_participants.thread_id, threadId), eq(chat_participants.user_id, userId))).limit(1);
  const [peer] = await db.select({ user_id: chat_participants.user_id }).from(chat_participants)
    .where(and(eq(chat_participants.thread_id, threadId), ne(chat_participants.user_id, userId))).limit(1);
  return requireChatPeer(Boolean(member), peer?.user_id ?? null);
}

export async function getChatBlockState(threadId: string, userId: string) {
  const peerUserId = await getChatPeer(threadId, userId);
  const [account] = await db.select({ rules_accepted_at: users.rules_accepted_at }).from(users).where(eq(users.id, userId)).limit(1);
  const rows = await db.select({ blocker_user_id: chat_blocks.blocker_user_id }).from(chat_blocks)
    .where(or(
      and(eq(chat_blocks.blocker_user_id, userId), eq(chat_blocks.blocked_user_id, peerUserId)),
      and(eq(chat_blocks.blocker_user_id, peerUserId), eq(chat_blocks.blocked_user_id, userId)),
    ));
  return { peer_user_id: peerUserId, blocked_by_me: rows.some((r) => r.blocker_user_id === userId), blocked_by_peer: rows.some((r) => r.blocker_user_id === peerUserId), terms_accepted: Boolean(account?.rules_accepted_at) };
}

export async function assertChatSendAllowed(threadId: string, userId: string, text: string) {
  assertSafeChatText(text);
  const state = await getChatBlockState(threadId, userId);
  assertChatSendState(state);
}

export async function acceptChatTerms(userId: string) {
  await db.update(users).set({ rules_accepted_at: new Date() }).where(and(eq(users.id, userId), sql`rules_accepted_at IS NULL`));
  return { ok: true };
}

export async function setChatBlock(threadId: string, userId: string, blocked: boolean) {
  const peerUserId = await getChatPeer(threadId, userId);
  if (blocked) {
    await db.insert(chat_blocks).values({ id: randomUUID(), blocker_user_id: userId, blocked_user_id: peerUserId, created_at: new Date() })
      .onDuplicateKeyUpdate({ set: { blocker_user_id: userId } });
  } else {
    await db.delete(chat_blocks).where(and(eq(chat_blocks.blocker_user_id, userId), eq(chat_blocks.blocked_user_id, peerUserId)));
  }
  return getChatBlockState(threadId, userId);
}

export async function reportChatMessage(threadId: string, userId: string, messageId: string, reason: string, details?: string) {
  await getChatPeer(threadId, userId);
  const [message] = await db.select({ sender_user_id: chat_messages.sender_user_id }).from(chat_messages)
    .where(and(eq(chat_messages.id, messageId), eq(chat_messages.thread_id, threadId))).limit(1);
  assertChatReportTarget(message?.sender_user_id ?? null, userId);
  await db.insert(chat_reports).values({ id: randomUUID(), thread_id: threadId, message_id: messageId, reporter_user_id: userId, reported_user_id: message.sender_user_id, reason, details: details ?? null, status: 'open', created_at: new Date() })
    .onDuplicateKeyUpdate({ set: { reason, details: details ?? null, status: 'open' } });
  return { ok: true };
}
