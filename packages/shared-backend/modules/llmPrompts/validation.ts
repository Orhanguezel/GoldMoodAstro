// =============================================================
// FILE: modules/llmPrompts/validation.ts
// FAZ 19 / T19-3 — Admin LLM prompt CRUD validation
// =============================================================
import { z } from "zod";

export const IdParamSchema = z.object({
  id: z.string().trim().min(1).max(36),
});

export const PromptListParamsSchema = z.object({
  search: z.string().trim().optional(),
  locale: z.string().trim().min(2).max(8).optional(),
  provider: z.enum(["openai", "anthropic", "groq", "azure", "local"]).optional(),
  is_active: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true") return true;
        if (s === "0" || s === "false") return false;
      }
      return undefined;
    }, z.boolean().optional()),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  orderBy: z.enum(["created_at", "updated_at", "key"]).default("key"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const PromptCreateSchema = z.object({
  key: z.string().trim().min(2).max(80),
  locale: z.string().trim().min(2).max(8).default("tr"),
  provider: z.enum(["openai", "anthropic", "groq", "azure", "local"]).default("anthropic"),
  model: z.string().trim().min(2).max(120).default("claude-haiku-4-5"),
  temperature: z.coerce.number().min(0).max(2).default(0.8),
  max_tokens: z.coerce.number().int().min(1).max(64000).default(800),
  system_prompt: z.string().min(1),
  user_template: z.string().min(1),
  safety_check: z.boolean().default(true),
  similarity_threshold: z.coerce.number().min(0).max(1).default(0.85),
  max_attempts: z.coerce.number().int().min(1).max(10).default(3),
  notes: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const PromptUpdateSchema = PromptCreateSchema.partial();

// "Test Et" — promtu LLM'e atıp sonucu döner (vars JSON, hiçbir şey kaydetmez)
export const PromptTestSchema = z.object({
  vars: z.record(z.string(), z.unknown()).default({}),
  recent_texts: z.array(z.string()).default([]),
});

export type PromptListParams = z.infer<typeof PromptListParamsSchema>;
export type PromptCreateInput = z.infer<typeof PromptCreateSchema>;
export type PromptUpdateInput = z.infer<typeof PromptUpdateSchema>;
export type PromptTestInput = z.infer<typeof PromptTestSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
