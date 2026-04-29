// =============================================================
// LLM provider abstraction — Anthropic + OpenAI + Groq desteği
// 2026-04-28: geoserra ai-insights.service.ts pattern'inden Groq + JSON mode
//             + usage tracking + AbortSignal.timeout devraldı.
// =============================================================

export type LlmProvider = 'openai' | 'anthropic' | 'groq' | 'azure' | 'local';

export type ChatArgs = {
  provider: LlmProvider;
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** base64 / data URI / http(s) URL */
  images?: string[];
  /** OpenAI/Groq json_object response_format — vision + structured output birleşimi */
  jsonMode?: boolean;
  /** Saniye cinsinden timeout (default 45) */
  timeoutMs?: number;
};

export type ChatUsage = { input: number; output: number };

export type ChatResult = {
  content: string;
  model: string;
  provider: LlmProvider;
  /** Token kullanımı — provider destekliyorsa doldurulur (geoserra pattern) */
  usage?: ChatUsage;
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

const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * Anthropic image content part builder.
 * - http(s):// → source.type=url
 * - data:image/...;base64,... → source.type=base64 + media_type otomatik
 * - raw base64 → varsayılan image/jpeg
 */
function buildAnthropicImagePart(img: string): any {
  const trimmed = (img ?? '').trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: 'image', source: { type: 'url', url: trimmed } };
  }
  const dataUriMatch = trimmed.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
  if (dataUriMatch) {
    return {
      type: 'image',
      source: { type: 'base64', media_type: dataUriMatch[1], data: dataUriMatch[2] },
    };
  }
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: trimmed } };
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
      messages: [{
        role: 'user',
        content: args.images && args.images.length > 0
          ? [
              ...args.images.map((img) => buildAnthropicImagePart(img)),
              { type: 'text', text: args.user },
            ]
          : args.user,
      }],
    }),
    signal: AbortSignal.timeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new LlmError(`anthropic_${res.status}: ${txt.slice(0, 200)}`, res.status, 'anthropic');
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const content =
    data.content?.find((c) => c.type === 'text')?.text?.trim() ||
    data.content?.[0]?.text?.trim() ||
    '';

  return {
    content,
    model: data.model || args.model,
    provider: 'anthropic',
    usage: {
      input: data.usage?.input_tokens ?? 0,
      output: data.usage?.output_tokens ?? 0,
    },
  };
}

// ─── OpenAI-compatible (OpenAI / Azure / Groq) ────────────────
type OpenAiCompatConfig = {
  baseUrl: string;
  apiKey: string;
  provider: 'openai' | 'azure' | 'groq';
};

function buildOpenAiCompatContent(args: ChatArgs) {
  if (!args.images || args.images.length === 0) return args.user;
  return [
    { type: 'text', text: args.user },
    ...args.images.map((img) => ({
      type: 'image_url',
      image_url: {
        url: img.startsWith('http')
          ? img
          : `data:image/jpeg;base64,${img.replace(/^data:image\/\w+;base64,/, '')}`,
      },
    })),
  ];
}

async function chatOpenAiCompatible(args: ChatArgs, config: OpenAiCompatConfig): Promise<ChatResult> {
  const body: Record<string, any> = {
    model: args.model,
    temperature: args.temperature ?? 0.8,
    max_tokens: args.maxTokens ?? 800,
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: buildOpenAiCompatContent(args) },
    ],
  };
  if (args.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new LlmError(`${config.provider}_${res.status}: ${txt.slice(0, 200)}`, res.status, config.provider);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  return {
    content,
    model: data.model || args.model,
    provider: config.provider,
    usage: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  };
}

async function chatOpenAI(args: ChatArgs): Promise<ChatResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmError('OPENAI_API_KEY missing', undefined, 'openai');
  return chatOpenAiCompatible(args, {
    baseUrl: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    apiKey,
    provider: 'openai',
  });
}

async function chatGroq(args: ChatArgs): Promise<ChatResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new LlmError('GROQ_API_KEY missing', undefined, 'groq');
  return chatOpenAiCompatible(args, {
    baseUrl: process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1',
    apiKey,
    provider: 'groq',
  });
}

// ─── Public chat() — provider'a göre dispatch ───────────────────
export async function chat(args: ChatArgs): Promise<ChatResult> {
  switch (args.provider) {
    case 'anthropic':
      return chatAnthropic(args);
    case 'openai':
    case 'azure':
      return chatOpenAI(args);
    case 'groq':
      return chatGroq(args);
    case 'local':
      throw new LlmError('local provider not implemented', undefined, 'local');
    default:
      throw new LlmError(`unknown provider: ${args.provider}`);
  }
}
