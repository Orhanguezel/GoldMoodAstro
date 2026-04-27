// =============================================================
// LLM provider abstraction — Anthropic + OpenAI desteği
// Tek API: chat({ system, user, model, temperature, maxTokens })
// =============================================================

export type LlmProvider = 'openai' | 'anthropic' | 'azure' | 'local';

export type ChatArgs = {
  provider: LlmProvider;
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
};

export type ChatResult = {
  content: string;
  model: string;
  provider: LlmProvider;
};

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly provider?: LlmProvider,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

// ─── Anthropic Claude ─────────────────────────────────────────
async function chatAnthropic(args: ChatArgs): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmError('ANTHROPIC_API_KEY missing', undefined, 'anthropic');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens ?? 800,
      temperature: args.temperature ?? 0.8,
      system: args.system,
      messages: [{ role: 'user', content: args.user }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new LlmError(`anthropic_${res.status}: ${txt.slice(0, 200)}`, res.status, 'anthropic');
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    model?: string;
  };
  const content =
    data.content?.find((c) => c.type === 'text')?.text?.trim() ||
    data.content?.[0]?.text?.trim() ||
    '';

  return { content, model: data.model || args.model, provider: 'anthropic' };
}

// ─── OpenAI ───────────────────────────────────────────────────
async function chatOpenAI(args: ChatArgs): Promise<ChatResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmError('OPENAI_API_KEY missing', undefined, 'openai');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      temperature: args.temperature ?? 0.8,
      max_tokens: args.maxTokens ?? 800,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new LlmError(`openai_${res.status}: ${txt.slice(0, 200)}`, res.status, 'openai');
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const content = data.choices?.[0]?.message?.content?.trim() || '';
  return { content, model: data.model || args.model, provider: 'openai' };
}

// ─── Public chat() — provider'a göre dispatch ───────────────────
export async function chat(args: ChatArgs): Promise<ChatResult> {
  switch (args.provider) {
    case 'anthropic':
      return chatAnthropic(args);
    case 'openai':
    case 'azure':
      return chatOpenAI(args);
    case 'local':
      throw new LlmError('local provider not implemented', undefined, 'local');
    default:
      throw new LlmError(`unknown provider: ${args.provider}`);
  }
}
