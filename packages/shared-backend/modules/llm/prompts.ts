// =============================================================
// LLM Prompt orchestrator
// 1) llm_prompts'tan template çek
// 2) {{placeholder}}'ları doldur
// 3) provider'ı çağır
// 4) safety check + (opsiyonel) similarity ile reroll
// =============================================================
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { llmPrompts, type LlmPromptRow } from './schema';
import { chat, LlmError, type ChatResult } from './provider';
import { checkContent } from '../_shared/contentModeration';

export type RenderVars = Record<string, string | number | undefined | null>;

/** Mustache benzeri minimal renderer: {{key}} -> vars[key] */
export function renderTemplate(tpl: string, vars: RenderVars): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    if (v === null || v === undefined) return '';
    return String(v);
  });
}

export type GenerateArgs = {
  promptKey: string;
  locale?: string;
  vars: RenderVars;
  /** Anti-copy-paste için: bu yorumun cosine sim hesaplanacağı önceki metinler */
  recentTexts?: string[];
  /** Override: belirli alanları manuel ezmek istersen */
  override?: Partial<Pick<LlmPromptRow, 'temperature' | 'max_tokens' | 'model' | 'provider'>>;
};

export type GenerateResult = ChatResult & {
  promptKey: string;
  promptId: string;
  attempts: number;
  /** Safety filter sonucunu döndürür (fail = unsafe) */
  safetyFlags: string[];
  /** Cosine similarity 0..1 (recentTexts ile en yüksek) */
  maxSimilarity?: number;
};

async function loadPrompt(key: string, locale: string): Promise<LlmPromptRow> {
  const [row] = await db
    .select()
    .from(llmPrompts)
    .where(and(eq(llmPrompts.key, key), eq(llmPrompts.locale, locale), eq(llmPrompts.is_active, 1)))
    .limit(1);
  if (!row) {
    // locale fallback → tr
    if (locale !== 'tr') return loadPrompt(key, 'tr');
    throw new LlmError(`prompt_not_found: ${key}`);
  }
  return row;
}

// Çok hızlı n-gram benzerlik (gerçek embedding yerine v1 placeholder)
// İlk milestone için yeterli; sonradan embedding-based similarity'e upgrade.
function jaccardNgrams(a: string, b: string, n = 3): number {
  const ngrams = (s: string) => {
    const tokens = s.toLowerCase().replace(/\s+/g, ' ').split('');
    const set = new Set<string>();
    for (let i = 0; i + n <= tokens.length; i++) set.add(tokens.slice(i, i + n).join(''));
    return set;
  };
  const A = ngrams(a);
  const B = ngrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Ana fonksiyon — prompt template'i yükler, render eder, LLM çağırır,
 * safety + similarity kontrolü yapar, gerekirse reroll.
 */
export async function generate(args: GenerateArgs): Promise<GenerateResult> {
  const locale = args.locale || 'tr';
  const prompt = await loadPrompt(args.promptKey, locale);

  const provider = (args.override?.provider ?? prompt.provider) as any;
  const model = args.override?.model ?? prompt.model;
  const temperature = Number(args.override?.temperature ?? prompt.temperature);
  const maxTokens = Number(args.override?.max_tokens ?? prompt.max_tokens);
  const maxAttempts = Math.max(1, prompt.max_attempts);
  const simThreshold = Number(prompt.similarity_threshold);

  let attempt = 0;
  let lastResult: ChatResult | null = null;
  let lastFlags: string[] = [];
  let lastSim: number | undefined;

  while (attempt < maxAttempts) {
    attempt++;
    const userText = renderTemplate(prompt.user_template, {
      ...args.vars,
      attempt,
    });

    const res = await chat({
      provider,
      model,
      system: prompt.system_prompt,
      user: userText,
      temperature: temperature + (attempt - 1) * 0.05, // her tekrarda biraz arttır
      maxTokens,
    });
    lastResult = res;

    // Güvenlik kontrolü
    if (prompt.safety_check) {
      const moderation = checkContent(res.content, 'reading');
      lastFlags = moderation.flags;
      if (!moderation.safe) continue; // unsafe → tekrar dene
    }

    // Anti-copy-paste similarity
    if (args.recentTexts?.length) {
      lastSim = Math.max(...args.recentTexts.map((t) => jaccardNgrams(res.content, t)));
      if (lastSim >= simThreshold) continue; // çok benzer → tekrar dene
    }

    // OK
    return {
      ...res,
      promptKey: prompt.key,
      promptId: prompt.id,
      attempts: attempt,
      safetyFlags: [],
      maxSimilarity: lastSim,
    };
  }

  // Tüm attempt'ler tükendi — son sonucu döndür (warning flagleriyle)
  if (!lastResult) throw new LlmError('llm_no_result');
  return {
    ...lastResult,
    promptKey: prompt.key,
    promptId: prompt.id,
    attempts: attempt,
    safetyFlags: lastFlags,
    maxSimilarity: lastSim,
  };
}
