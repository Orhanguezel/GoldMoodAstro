import { expect, test } from 'bun:test';
import { repairUtf8Mojibake } from '../src/lib/textEncoding';

test('keeps correctly decoded consultant names', () => {
  expect(repairUtf8Mojibake('Çisem Akçalan')).toBe('Çisem Akçalan');
});

test('repairs Turkish letters decoded as Latin-1 or Windows-1252', () => {
  expect(repairUtf8Mojibake('Ãisem AkÃ§alan')).toBe('Çisem Akçalan');
  expect(repairUtf8Mojibake('Halil Ã‡aÄŸatay')).toBe('Halil Çağatay');
});
