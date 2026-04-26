// src/modules/_shared/swagger-helpers.ts
// Swagger / OpenAPI schema helpers

import type { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/** Bearer token security definition for Swagger */
export const authSecurity = [{ bearerAuth: [] }];

/**
 * Zod schema → Fastify-uyumlu JSON Schema objesi.
 */
export function fromZodSchema(schema: ZodType<any>, title?: string): Record<string, any> {
  const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' });
  if (title) (jsonSchema as any).title = title;
  return jsonSchema as Record<string, any>;
}
