// =============================================================
// FILE: modules/llmPrompts/repository.ts
// FAZ 19 / T19-3 — DB ops for llm_prompts (admin CRUD)
// =============================================================
import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import type {
  PromptCreateInput,
  PromptListParams,
  PromptUpdateInput,
} from "./validation";

export type LlmPromptView = {
  id: string;
  key: string;
  locale: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  user_template: string;
  safety_check: boolean;
  similarity_threshold: number;
  max_attempts: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(r: any): LlmPromptView {
  return {
    id: String(r.id),
    key: String(r.key),
    locale: String(r.locale),
    provider: String(r.provider),
    model: String(r.model),
    temperature: Number(r.temperature),
    max_tokens: Number(r.max_tokens),
    system_prompt: String(r.system_prompt ?? ""),
    user_template: String(r.user_template ?? ""),
    safety_check: Number(r.safety_check ?? 0) === 1,
    similarity_threshold: Number(r.similarity_threshold),
    max_attempts: Number(r.max_attempts),
    notes: r.notes ?? null,
    is_active: Number(r.is_active ?? 0) === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function safeOrderBy(col?: string) {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "key":
      return col;
    default:
      return "key";
  }
}

export async function listPrompts(
  app: FastifyInstance,
  q: PromptListParams,
): Promise<{ items: LlmPromptView[]; total: number }> {
  const mysql = (app as any).mysql;
  const where: string[] = [];
  const args: any[] = [];

  if (q.search) {
    where.push("(p.`key` LIKE ? OR p.system_prompt LIKE ? OR p.user_template LIKE ?)");
    const s = `%${q.search}%`;
    args.push(s, s, s);
  }
  if (q.locale) {
    where.push("p.locale = ?");
    args.push(q.locale);
  }
  if (q.provider) {
    where.push("p.provider = ?");
    args.push(q.provider);
  }
  if (typeof q.is_active === "boolean") {
    where.push("p.is_active = ?");
    args.push(q.is_active ? 1 : 0);
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
  const orderCol = safeOrderBy(q.orderBy);
  const orderDir = q.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const [rows] = await mysql.query(
    `SELECT p.* FROM llm_prompts p ${whereClause} ORDER BY p.\`${orderCol}\` ${orderDir} LIMIT ? OFFSET ?`,
    [...args, q.limit ?? 100, q.offset ?? 0],
  );
  const [countRows] = await mysql.query(
    `SELECT COUNT(*) AS total FROM llm_prompts p ${whereClause}`,
    args,
  );
  const total = Number((countRows as any[])[0]?.total ?? 0);
  return { items: (rows as any[]).map(mapRow), total };
}

export async function getPromptById(
  app: FastifyInstance,
  id: string,
): Promise<LlmPromptView | null> {
  const mysql = (app as any).mysql;
  const [rows] = await mysql.query("SELECT * FROM llm_prompts WHERE id = ? LIMIT 1", [id]);
  const r = (rows as any[])[0];
  return r ? mapRow(r) : null;
}

export async function createPrompt(
  app: FastifyInstance,
  body: PromptCreateInput,
): Promise<LlmPromptView> {
  const mysql = (app as any).mysql;
  const id = randomUUID();
  await mysql.query(
    `INSERT INTO llm_prompts
       (id, \`key\`, locale, provider, model, temperature, max_tokens,
        system_prompt, user_template, safety_check, similarity_threshold,
        max_attempts, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      id,
      body.key,
      body.locale,
      body.provider,
      body.model,
      body.temperature,
      body.max_tokens,
      body.system_prompt,
      body.user_template,
      body.safety_check ? 1 : 0,
      body.similarity_threshold,
      body.max_attempts,
      body.notes ?? null,
      body.is_active ? 1 : 0,
    ],
  );
  const created = await getPromptById(app, id);
  if (!created) throw new Error("prompt_create_failed");
  return created;
}

export async function updatePrompt(
  app: FastifyInstance,
  id: string,
  body: PromptUpdateInput,
): Promise<LlmPromptView | null> {
  const mysql = (app as any).mysql;
  const fields: string[] = [];
  const args: any[] = [];

  if (typeof body.key !== "undefined") { fields.push("`key` = ?"); args.push(body.key); }
  if (typeof body.locale !== "undefined") { fields.push("locale = ?"); args.push(body.locale); }
  if (typeof body.provider !== "undefined") { fields.push("provider = ?"); args.push(body.provider); }
  if (typeof body.model !== "undefined") { fields.push("model = ?"); args.push(body.model); }
  if (typeof body.temperature !== "undefined") { fields.push("temperature = ?"); args.push(body.temperature); }
  if (typeof body.max_tokens !== "undefined") { fields.push("max_tokens = ?"); args.push(body.max_tokens); }
  if (typeof body.system_prompt !== "undefined") { fields.push("system_prompt = ?"); args.push(body.system_prompt); }
  if (typeof body.user_template !== "undefined") { fields.push("user_template = ?"); args.push(body.user_template); }
  if (typeof body.safety_check !== "undefined") { fields.push("safety_check = ?"); args.push(body.safety_check ? 1 : 0); }
  if (typeof body.similarity_threshold !== "undefined") { fields.push("similarity_threshold = ?"); args.push(body.similarity_threshold); }
  if (typeof body.max_attempts !== "undefined") { fields.push("max_attempts = ?"); args.push(body.max_attempts); }
  if (typeof body.notes !== "undefined") { fields.push("notes = ?"); args.push(body.notes ?? null); }
  if (typeof body.is_active !== "undefined") { fields.push("is_active = ?"); args.push(body.is_active ? 1 : 0); }

  if (!fields.length) return getPromptById(app, id);

  fields.push("updated_at = NOW(3)");
  await mysql.query(
    `UPDATE llm_prompts SET ${fields.join(", ")} WHERE id = ?`,
    [...args, id],
  );
  return getPromptById(app, id);
}

export async function deletePrompt(
  app: FastifyInstance,
  id: string,
): Promise<boolean> {
  const mysql = (app as any).mysql;
  const [res] = await mysql.query("DELETE FROM llm_prompts WHERE id = ? LIMIT 1", [id]);
  return ((res as any)?.affectedRows ?? 0) > 0;
}
