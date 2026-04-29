// =============================================================
// FILE: modules/llmPrompts/admin.controller.ts
// FAZ 19 / T19-3 — Admin LLM prompt CRUD + "Test Et"
// =============================================================
import type { FastifyRequest } from "fastify";
import {
  IdParamSchema,
  PromptCreateSchema,
  PromptListParamsSchema,
  PromptUpdateSchema,
  PromptTestSchema,
} from "./validation";
import {
  createPrompt,
  deletePrompt,
  getPromptById,
  listPrompts,
  updatePrompt,
} from "./repository";
import { generate } from "../llm/prompts";

export async function listPromptsAdmin(req: FastifyRequest) {
  const q = PromptListParamsSchema.parse(req.query);
  return await listPrompts(req.server, q);
}

export async function getPromptAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const prompt = await getPromptById(req.server, id);
  if (!prompt) {
    const err: any = new Error("prompt_not_found");
    err.statusCode = 404;
    throw err;
  }
  return prompt;
}

export async function createPromptAdmin(req: FastifyRequest) {
  const body = PromptCreateSchema.parse((req as any).body);
  return await createPrompt(req.server, body);
}

export async function updatePromptAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const body = PromptUpdateSchema.parse((req as any).body);
  const updated = await updatePrompt(req.server, id, body);
  if (!updated) {
    const err: any = new Error("prompt_not_found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

export async function deletePromptAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const ok = await deletePrompt(req.server, id);
  return { ok };
}

// "Test Et" — DB'deki prompt'u verilen vars ile çalıştırır, sonuç döner.
// Hiçbir şey yazmaz; sadece sandbox.
export async function testPromptAdmin(req: FastifyRequest) {
  const { id } = IdParamSchema.parse(req.params);
  const body = PromptTestSchema.parse((req as any).body);
  const prompt = await getPromptById(req.server, id);
  if (!prompt) {
    const err: any = new Error("prompt_not_found");
    err.statusCode = 404;
    throw err;
  }
  try {
    const result = await generate({
      promptKey: prompt.key,
      locale: prompt.locale,
      vars: body.vars as Record<string, string | number | null | undefined>,
      recentTexts: body.recent_texts,
    });
    return {
      ok: true,
      prompt_id: prompt.id,
      prompt_key: prompt.key,
      output: result.content,
      model: result.model,
      provider: result.provider,
      attempts: result.attempts,
      safety_flags: result.safetyFlags,
      max_similarity: result.maxSimilarity ?? null,
    };
  } catch (err: any) {
    return {
      ok: false,
      prompt_id: prompt.id,
      prompt_key: prompt.key,
      error: String(err?.message ?? err),
    };
  }
}
