import { describe, expect, test } from 'bun:test';
import { safeNextPath } from '../src/lib/safeNextPath';

describe('post-auth return path', () => {
  test('keeps a local path, query and hash', () => {
    expect(safeNextPath('/tr/dashboard?tab=bookings#next')).toBe('/tr/dashboard?tab=bookings#next');
  });

  test.each([
    'https://evil.example/',
    '//evil.example/',
    '/\\evil.example/',
    '/%2f%2fevil.example/',
    '/%5cevil.example/',
    '/tr/dashboard\nLocation: //evil.example',
    '%2f%2fevil.example/',
  ])('rejects unsafe destination %s', (destination) => {
    expect(safeNextPath(destination)).toBeNull();
  });
});
