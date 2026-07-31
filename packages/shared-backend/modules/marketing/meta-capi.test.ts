/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { hasAnalyticsConsent, sha256Pii } from './meta-capi';

describe('Meta CAPI privacy helpers', () => {
  test('normalizes and hashes email without exposing plaintext', () => {
    expect(sha256Pii('  USER@Example.COM ', 'email')).toBe(
      'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514',
    );
  });

  test('normalizes phone before hashing', () => {
    expect(sha256Pii('+90 (555) 123 45 67', 'phone')).toBe(
      sha256Pii('905551234567', 'phone'),
    );
  });

  test('returns null for empty PII', () => {
    expect(sha256Pii('   ', 'email')).toBeNull();
  });

  test('accepts only explicit analytics consent', () => {
    const granted = encodeURIComponent(JSON.stringify({ analytics: true }));
    const rejected = encodeURIComponent(JSON.stringify({ analytics: false }));
    expect(hasAnalyticsConsent({ headers: { cookie: `goldmoodastro_cookie_consent_v1=${granted}` } })).toBe(true);
    expect(hasAnalyticsConsent({ cookies: { goldmoodastro_cookie_consent_v1: rejected } })).toBe(false);
    expect(hasAnalyticsConsent({ headers: {} })).toBe(false);
  });
});
