import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { FastifyReply, FastifyRequest } from 'fastify';

process.env.JWT_SECRET ??= 'credits-auth-test-secret';
process.env.COOKIE_SECRET ??= 'credits-auth-test-cookie-secret';

const balanceUsers: string[] = [];
const historyUsers: string[] = [];

mock.module('./repository', () => ({
  getUserBalance: async (userId: string) => {
    balanceUsers.push(userId);
    return { balance: userId === 'account-a' ? 17 : 42, currency: 'TRY-CREDIT' };
  },
  getTransactionHistory: async (userId: string) => {
    historyUsers.push(userId);
    return [{ id: `history-for-${userId}` }];
  },
}));

const { handleGetBalance, handleGetMe } = await import('./controller');

function request(user?: Record<string, string>): FastifyRequest {
  return { user } as unknown as FastifyRequest;
}

function reply(): { instance: FastifyReply; body: unknown } {
  const result = {
    body: undefined as unknown,
    instance: {} as FastifyReply,
  };
  result.instance = {
    send(body: unknown) {
      result.body = body;
      return this;
    },
  } as FastifyReply;
  return result;
}

describe('credit account isolation', () => {
  beforeEach(() => {
    balanceUsers.length = 0;
    historyUsers.length = 0;
  });

  test('balance uses the JWT subject, even when a different id field is present', async () => {
    const response = reply();
    await handleGetBalance(request({ sub: 'account-a', id: 'account-b' }), response.instance);

    expect(balanceUsers).toEqual(['account-a']);
    expect(response.body).toEqual({ data: { balance: 17, currency: 'TRY-CREDIT' } });
  });

  test('account summary keeps each user balance and transactions separate', async () => {
    const first = reply();
    const second = reply();
    await handleGetMe(request({ sub: 'account-a' }), first.instance);
    await handleGetMe(request({ sub: 'account-b' }), second.instance);

    expect(balanceUsers).toEqual(['account-a', 'account-b']);
    expect(historyUsers).toEqual(['account-a', 'account-b']);
    expect(first.body).toEqual({ data: { balance: 17, currency: 'TRY-CREDIT', recent_transactions: [{ id: 'history-for-account-a' }] } });
    expect(second.body).toEqual({ data: { balance: 42, currency: 'TRY-CREDIT', recent_transactions: [{ id: 'history-for-account-b' }] } });
  });

  test('missing account identity is rejected before any balance lookup', async () => {
    await expect(handleGetBalance(request({}), reply().instance)).rejects.toMatchObject({ statusCode: 401 });
    expect(balanceUsers).toEqual([]);
  });
});
