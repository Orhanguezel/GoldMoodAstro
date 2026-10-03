import { describe, expect, test } from 'bun:test';
import { assertChatReportTarget, assertChatSendState, assertSafeChatText, requireChatPeer } from './safety';
import { ReportChatMessageBodySchema } from './validation';

describe('direct chat safety', () => {
  test('allows an ordinary booking question', () => {
    expect(() => assertSafeChatText('Yarınki görüşmemiz için saat uygun mu?')).not.toThrow();
  });

  test('rejects prohibited claims through the canonical message moderation rule', () => {
    expect(() => assertSafeChatText('Bana banko kupon ver')).toThrow('message_content_not_allowed');
  });

  test('rejects reporting malformed message IDs and unsupported reasons', () => {
    expect(ReportChatMessageBodySchema.safeParse({ message_id: 'not-an-id', reason: 'spam' }).success).toBe(false);
    expect(ReportChatMessageBodySchema.safeParse({ message_id: '00000000-0000-4000-8000-000000000001', reason: 'anything' }).success).toBe(false);
  });

  test('blocked sender or receiver cannot send after terms acceptance', () => {
    expect(() => assertChatSendState({ terms_accepted: true, blocked_by_me: false, blocked_by_peer: true })).toThrow('chat_blocked');
    expect(() => assertChatSendState({ terms_accepted: true, blocked_by_me: true, blocked_by_peer: false })).toThrow('chat_blocked');
    expect(() => assertChatSendState({ terms_accepted: false, blocked_by_me: false, blocked_by_peer: false })).toThrow('chat_terms_acceptance_required');
  });

  test('nonparticipant and own-message report are denied', () => {
    expect(() => requireChatPeer(false, 'peer')).toThrow('forbidden_thread_membership');
    expect(() => assertChatReportTarget('me', 'me')).toThrow('cannot_report_own_message');
    expect(() => assertChatReportTarget('peer', 'me')).not.toThrow();
  });
});
