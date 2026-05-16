import { describe, expect, test } from 'bun:test';
import {
  buildSubscriptionSummary,
  type SubscriptionSummaryRow,
} from '../../packages/shared-backend/modules/subscriptions/summary';
import { resolveBannerTargetSegments } from '../../packages/shared-backend/modules/banners/controller';

describe('FAZ 41 premium subscription summary', () => {
  test('maps an active monthly subscription row to the additive auth/me payload', () => {
    const trialEnds = new Date(Date.now() + 60_000);
    const summary = buildSubscriptionSummary({
      status: 'active',
      ends_at: '2026-06-16T00:00:00.000Z',
      trial_ends_at: trialEnds,
      period: 'monthly',
      plan_code: 'monthly',
    } satisfies SubscriptionSummaryRow);

    expect(summary).toMatchObject({
      is_premium: true,
      tier: 'premium',
      plan_code: 'monthly',
      period: 'monthly',
      status: 'active',
      ends_at: '2026-06-16T00:00:00.000Z',
      is_trial: true,
    });
    expect(summary.trial_ends_at).toBe(trialEnds.toISOString());
  });

  test('keeps lifetime subscriptions premium with null ends_at', () => {
    const summary = buildSubscriptionSummary({
      status: 'active',
      ends_at: null,
      trial_ends_at: null,
      period: 'lifetime',
      plan_code: 'lifetime',
    });

    expect(summary.is_premium).toBe(true);
    expect(summary.ends_at).toBeNull();
    expect(summary.is_trial).toBe(false);
  });
});

describe('FAZ 41 banner target segments', () => {
  test('anonymous and free users resolve to all+free', () => {
    expect(resolveBannerTargetSegments(null)).toEqual(['all', 'free']);
    expect(resolveBannerTargetSegments(undefined)).toEqual(['all', 'free']);
  });

  test('premium users resolve to all+paid without new_user/existing_user v1 segments', () => {
    expect(resolveBannerTargetSegments({ is_premium: true })).toEqual(['all', 'paid']);
  });
});
