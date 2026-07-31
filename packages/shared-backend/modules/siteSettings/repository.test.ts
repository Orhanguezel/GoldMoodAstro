/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { rowToDto } from './repository';

describe('site setting response masking', () => {
  test('never returns the Meta CAPI token', () => {
    const dto = rowToDto({
      id: 'setting-id',
      key: 'facebook_capi_token',
      locale: '*',
      value: JSON.stringify('secret-token'),
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
    });
    expect(dto.value).toBe('***');
    expect(JSON.stringify(dto)).not.toContain('secret-token');
  });
});
