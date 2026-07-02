// AI içerik asistanı — blog/içerik editöründe içerik genişletme/iyileştirme + SEO meta üretimi.
// goldmoodastro chat() soyutlamasını kullanır (Groq/OpenAI/Anthropic). Konuya göre (başlık +
// kategori + mevcut içerik context) ve locale'e göre yazar.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { chat, type LlmProvider } from '../llm/provider';

function resolveAi(): { provider: LlmProvider; model: string } | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (groq) return { provider: 'groq', model: process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile' };
  if (openai) return { provider: 'openai', model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini' };
  if (anthropic) return { provider: 'anthropic', model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5' };
  return null;
}

const LOCALE_NAME: Record<string, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch' };

const bodySchema = z.object({
  action: z.enum(['enhance', 'improve', 'meta', 'summary']),
  locale: z.string().trim().min(2).max(8).default('tr'),
  title: z.string().trim().max(300).optional().default(''),
  category: z.string().trim().max(120).optional().default(''),
  summary: z.string().trim().max(2000).optional().default(''),
  content: z.string().max(60000).optional().default(''),
  tags: z.string().trim().max(500).optional().default(''),
});

const SYSTEM = [
  'Sen astroloji, tarot, numeroloji ve maneviyat odaklı bir platform için profesyonel, SEO uyumlu içerik editörüsün.',
  'Ton: sakin, sorumlu, bilgilendirici. Kadercilik/korku dili KULLANMA; sembolik ve farkındalık odaklı yaz.',
  'İçeriği daima ilgili KONUYA (verilen başlık + kategori + mevcut içerik) sadık kalarak üret.',
  'İçerik gövdesi temiz HTML olsun: <p>, <h2>, <h3>, <ul>, <li>, <strong>. Inline stil/script YOK.',
  'meta_title 50-60 karakter, meta_description 120-160 karakter ideal.',
  'Yanıtın SADECE geçerli JSON olsun; JSON dışında hiçbir metin yazma.',
].join('\n');

function buildUser(action: string, b: z.infer<typeof bodySchema>): string {
  const lang = LOCALE_NAME[b.locale] || b.locale;
  const ctx = [
    `Hedef dil: ${lang} (${b.locale}). Tüm çıktı bu dilde olmalı.`,
    b.title ? `Başlık: ${b.title}` : '',
    b.category ? `Kategori/Konu: ${b.category}` : '',
    b.summary ? `Özet: ${b.summary}` : '',
    b.tags ? `Etiketler: ${b.tags}` : '',
    b.content ? `Mevcut içerik (HTML):\n${b.content}` : '(Mevcut içerik yok.)',
  ].filter(Boolean).join('\n');

  switch (action) {
    case 'enhance':
      return `${ctx}\n\nGÖREV: Mevcut içeriği bu konuya sadık kalarak ZENGİNLEŞTİR ve GENİŞLET. Alt başlıklar (<h2>/<h3>), maddeler ve vurgular ekle; SEO derinliği için ~700-1000 kelimeye çıkar. Anlamı bozma, özgün ve doğal yaz.\nJSON şema: {"content": "<zengin HTML>"}`;
    case 'improve':
      return `${ctx}\n\nGÖREV: Mevcut içeriği DÜZELT ve İYİLEŞTİR — dil bilgisi, akıcılık, netlik, paragraf düzeni ve SEO uyumu. Uzunluğu koru, anlamı değiştirme. HTML biçimini temizle/düzelt.\nJSON şema: {"content": "<düzeltilmiş HTML>"}`;
    case 'meta':
      return `${ctx}\n\nGÖREV: Bu içeriğe uygun SEO meta alanları üret. meta_title 50-60 karakter, meta_description 120-160 karakter, konuya uygun 4-6 etiket.\nJSON şema: {"meta_title": "...", "meta_description": "...", "tags": "etiket1, etiket2, ..."}`;
    case 'summary':
      return `${ctx}\n\nGÖREV: İçeriğe uygun, konuyu net anlatan 2-3 cümlelik bir ÖZET yaz (düz metin, HTML değil).\nJSON şema: {"summary": "..."}`;
    default:
      return ctx;
  }
}

function extractJson(raw: string): Record<string, unknown> {
  let s = String(raw || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function aiContentAssist(req: FastifyRequest, reply: FastifyReply) {
  const cfg = resolveAi();
  if (!cfg) return reply.code(503).send({ error: { message: 'ai_not_configured' } });

  const parsed = bodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const b = parsed.data;
  if (b.action !== 'enhance' && !b.content && !b.title) {
    return reply.code(400).send({ error: { message: 'content_or_title_required' } });
  }

  try {
    const res = await chat({
      provider: cfg.provider,
      model: cfg.model,
      system: SYSTEM,
      user: buildUser(b.action, b),
      jsonMode: true,
      temperature: 0.7,
      maxTokens: 4000,
      timeoutMs: 60000,
    });
    const out = extractJson(res.content);
    const data: Record<string, string> = {};
    for (const k of ['content', 'meta_title', 'meta_description', 'summary', 'tags'] as const) {
      if (typeof out[k] === 'string' && (out[k] as string).trim()) data[k] = (out[k] as string).trim();
    }
    if (Object.keys(data).length === 0) {
      return reply.code(502).send({ error: { message: 'ai_empty_result' } });
    }
    return reply.send({ data, model: res.model, provider: res.provider });
  } catch (err) {
    return reply.code(502).send({ error: { message: 'ai_request_failed', detail: String((err as Error)?.message || err).slice(0, 200) } });
  }
}
