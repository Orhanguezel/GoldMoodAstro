import { describe, expect, test } from 'bun:test';
import { assertMediaParticipant, mediaSenderUserId } from './safety';
import { assertChatReportTarget, assertChatSendState, assertSafeChatText } from '../chat/safety';

describe('media UGC safety', () => {
  test('only the customer and consultant can access actions', () => {
    expect(() => assertMediaParticipant('customer', 'customer', 'consultant')).not.toThrow();
    expect(() => assertMediaParticipant('consultant', 'customer', 'consultant')).not.toThrow();
    expect(() => assertMediaParticipant('outsider', 'customer', 'consultant')).toThrow('media_participant_required');
  });
  test('each side can report only incoming media', () => {
    expect(mediaSenderUserId('question', 'customer', 'consultant')).toBe('customer');
    expect(mediaSenderUserId('reply', 'customer', 'consultant')).toBe('consultant');
    expect(() => assertChatReportTarget(mediaSenderUserId('question', 'customer', 'consultant'), 'customer')).toThrow('cannot_report_own_message');
    expect(() => assertChatReportTarget(mediaSenderUserId('reply', 'customer', 'consultant'), 'customer')).not.toThrow();
  });
  test('terms, either direction block, and forbidden note stop media send', () => {
    expect(() => assertChatSendState({ terms_accepted: false, blocked_by_me: false, blocked_by_peer: false })).toThrow('chat_terms_acceptance_required');
    expect(() => assertChatSendState({ terms_accepted: true, blocked_by_me: true, blocked_by_peer: false })).toThrow('chat_blocked');
    expect(() => assertChatSendState({ terms_accepted: true, blocked_by_me: false, blocked_by_peer: true })).toThrow('chat_blocked');
    expect(() => assertSafeChatText('Kısa bir astroloji sorusu')).not.toThrow();
    expect(() => assertSafeChatText('Kesin sonuç garantisi veriyorum')).toThrow('message_content_not_allowed');
  });
});
