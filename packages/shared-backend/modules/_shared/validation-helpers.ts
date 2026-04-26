// src/modules/_shared/validation-helpers.ts
// Zod validation helpers

import { z, type ZodType } from 'zod';

/** Boş string'i null'a dönüştüren Zod preprocess wrapper */
export function emptyToNull<T extends ZodType<any>>(schema: T) {
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    schema,
  );
}
