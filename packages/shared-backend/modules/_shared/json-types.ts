// src/modules/_shared/json-types.ts
// JSON type helpers for siteSettings and similar modules

import { z } from 'zod';

/** Herhangi bir JSON-uyumlu değer tipi */
export type JsonLike = string | number | boolean | null | JsonLike[] | { [key: string]: JsonLike };

/** Zod validator: JSON-uyumlu herhangi bir değer */
export const jsonLike: z.ZodType<JsonLike> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonLike),
    z.record(jsonLike),
  ]),
);
