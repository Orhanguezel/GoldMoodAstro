#!/usr/bin/env bun

type Locale = "tr" | "en" | "de";
type Source = "live" | "files" | "seed";
type Format = "text" | "markdown";

type Sign = {
  key: string;
  tr: string;
  en: string;
  de: string;
};

const SIGNS: Sign[] = [
  { key: "aries", tr: "Koç", en: "Aries", de: "Widder" },
  { key: "taurus", tr: "Boğa", en: "Taurus", de: "Stier" },
  { key: "gemini", tr: "İkizler", en: "Gemini", de: "Zwillinge" },
  { key: "cancer", tr: "Yengeç", en: "Cancer", de: "Krebs" },
  { key: "leo", tr: "Aslan", en: "Leo", de: "Löwe" },
  { key: "virgo", tr: "Başak", en: "Virgo", de: "Jungfrau" },
  { key: "libra", tr: "Terazi", en: "Libra", de: "Waage" },
  { key: "scorpio", tr: "Akrep", en: "Scorpio", de: "Skorpion" },
  { key: "sagittarius", tr: "Yay", en: "Sagittarius", de: "Schütze" },
  { key: "capricorn", tr: "Oğlak", en: "Capricorn", de: "Steinbock" },
  { key: "aquarius", tr: "Kova", en: "Aquarius", de: "Wassermann" },
  { key: "pisces", tr: "Balık", en: "Pisces", de: "Fische" },
];

const FORBIDDEN_TERMS = [
  "kesin olacak",
  "yüzde yüz",
  "garanti",
  "mutlaka olacak",
  "büyü",
  "bağlama",
  "muska",
  "cin çıkarma",
  "ruh çağırma",
  "yatırım tavsiyesi",
  "sağlık teşhisi",
  "ilaç önerisi",
];

const args = parseArgs(process.argv.slice(2));
const source = getArg<Source>("source", "live", ["live", "files", "seed"]);
const locale = getArg<Locale>("locale", "tr", ["tr", "en", "de"]);
const format = getArg<Format>("format", "text", ["text", "markdown"]);
const baseUrl = String(args.baseUrl ?? "https://goldmoodastro.com").replace(/\/$/, "");
const filesDir = String(args.dir ?? "doc/zodiac-content-2026-07");
const threshold = Number(args.threshold ?? 0.4);

const documents = await loadDocuments(source, locale);
const result = analyze(documents);
printReport(result);

function parseArgs(items: string[]): Record<string, string | boolean> {
  return items.reduce<Record<string, string | boolean>>((acc, item) => {
    if (!item.startsWith("--")) return acc;
    const [rawKey, ...rawValue] = item.slice(2).split("=");
    acc[rawKey] = rawValue.length ? rawValue.join("=") : true;
    return acc;
  }, {});
}

function getArg<T extends string>(key: string, fallback: T, allowed: T[]): T {
  const value = args[key];
  if (typeof value !== "string") return fallback;
  if (allowed.includes(value as T)) return value as T;
  throw new Error(`Invalid --${key}: ${value}. Allowed: ${allowed.join(", ")}`);
}

async function loadDocuments(src: Source, loc: Locale): Promise<Record<string, string>> {
  if (src === "live") return loadLiveDocuments(loc);
  if (src === "files") return loadFileDocuments();
  return loadSeedDocuments(loc);
}

async function loadLiveDocuments(loc: Locale): Promise<Record<string, string>> {
  const entries = await Promise.all(
    SIGNS.map(async (sign) => {
      const res = await fetch(`${baseUrl}/${loc}/burclar/${sign.key}`, {
        headers: { "user-agent": "GoldMoodAstro zodiac duplicate audit" },
      });
      if (!res.ok) throw new Error(`Live fetch failed for ${sign.key}: ${res.status}`);
      const html = await res.text();
      return [sign.key, htmlToText(html)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function loadFileDocuments(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    SIGNS.map(async (sign) => {
      const file = `${filesDir}/${sign.key}.md`;
      const text = await Bun.file(file).text().catch(() => "");
      return [sign.key, markdownToText(text)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function loadSeedDocuments(loc: Locale): Promise<Record<string, string>> {
  loadDotEnv("backend/.env");
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "goldmoodastro",
  });
  try {
    const [rows] = await connection.execute(
      `SELECT key1 AS sign,
              GROUP_CONCAT(CONCAT_WS('\n', title, short_summary, content)
                ORDER BY FIELD(key2, NULL, 'personality', 'love', 'career', 'wellness', 'health')
                SEPARATOR '\n') AS body
         FROM astrology_kb
        WHERE kind IN ('sign', 'sign_section')
          AND locale = ?
          AND is_active = 1
        GROUP BY key1`,
      [loc],
    );
    const bySign = Object.fromEntries(SIGNS.map((sign) => [sign.key, ""]));
    for (const row of rows as Array<{ sign: string; body: string | null }>) {
      if (row.sign in bySign) bySign[row.sign] = row.body ?? "";
    }
    return bySign;
  } finally {
    await connection.end();
  }
}

function loadDotEnv(path: string): void {
  const file = Bun.file(path);
  if (!file.size) return;
  const text = Bun.spawnSync(["bash", "-lc", `test -f ${shellQuote(path)} && cat ${shellQuote(path)} || true`], {
    stdout: "pipe",
  }).stdout.toString();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function analyze(docs: Record<string, string>) {
  const normalized = Object.fromEntries(
    SIGNS.map((sign) => {
      const text = docs[sign.key] ?? "";
      return [
        sign.key,
        {
          text,
          words: tokenize(normalizeText(text)).length,
          shingles: sentenceShingles(text),
          forbidden: FORBIDDEN_TERMS.filter((term) => hasForbiddenTerm(text, term)),
        },
      ] as const;
    }),
  );

  const matrix: Record<string, Record<string, number>> = {};
  const pairs: Array<{ a: string; b: string; score: number }> = [];
  for (const a of SIGNS) {
    matrix[a.key] = {};
    for (const b of SIGNS) {
      const score = a.key === b.key ? 1 : jaccard(normalized[a.key].shingles, normalized[b.key].shingles);
      matrix[a.key][b.key] = score;
      if (a.key < b.key) pairs.push({ a: a.key, b: b.key, score });
    }
  }

  pairs.sort((x, y) => y.score - x.score);
  return {
    source,
    locale,
    generatedAt: new Date().toISOString(),
    threshold,
    matrix,
    pairs,
    stats: Object.fromEntries(
      SIGNS.map((sign) => [
        sign.key,
        {
          words: normalized[sign.key].words,
          shingles: normalized[sign.key].shingles.size,
          forbidden: normalized[sign.key].forbidden,
        },
      ]),
    ),
  };
}

function sentenceShingles(raw: string): Set<string> {
  const text = normalizeText(raw);
  const sentences = text
    .split(/[.!?。！？]+|\n+/)
    .map((sentence) => tokenize(sentence))
    .filter((tokens) => tokens.length >= 5);
  const shingles = new Set<string>();
  for (const tokens of sentences) {
    const width = tokens.length < 8 ? 3 : 4;
    for (let i = 0; i <= tokens.length - width; i += 1) {
      shingles.add(tokens.slice(i, i + width).join(" "));
    }
  }
  return shingles;
}

function normalizeText(raw: string): string {
  let text = decodeHtml(raw)
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

  const replacements = [
    ...SIGNS.flatMap((s) => [s.key, s.tr, s.en, s.de]),
    "ates",
    "toprak",
    "hava",
    "su",
    "fire",
    "earth",
    "air",
    "water",
    "feuer",
    "erde",
    "luft",
    "wasser",
    "oncu",
    "sabit",
    "degisken",
    "cardinal",
    "fixed",
    "mutable",
    "kardinal",
    "fix",
    "beweglich",
    "mars",
    "venus",
    "merkur",
    "mercury",
    "ay",
    "moon",
    "mond",
    "gunes",
    "sun",
    "sonne",
    "jupiter",
    "saturn",
    "uranus",
    "neptun",
    "neptune",
    "pluton",
    "pluto",
  ].map((word) => normalizeTextLiteral(word));

  for (const word of replacements) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, "g"), " astroterm ");
  }

  return text
    .replace(/\d+/g, "0")
    .replace(/[^\p{L}\p{N}.!?\n ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextLiteral(raw: string): string {
  return raw
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((token) => token.length > 1);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---/m, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`[\]()~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasForbiddenTerm(text: string, term: string): boolean {
  const normalizedText = normalizeTextLiteral(text);
  const normalizedTerm = normalizeTextLiteral(term);
  const pattern = normalizedTerm.includes(" ")
    ? new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(\\s|$)`, "i")
    : new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(\\s|$)`, "i");
  return pattern.test(normalizedText.replace(/[^\p{L}\p{N} ]/gu, " "));
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function printReport(result: ReturnType<typeof analyze>): void {
  const worst = result.pairs.slice(0, 10);
  if (format === "markdown") {
    console.log(`# Zodiac Duplicate Baseline — ${result.generatedAt.slice(0, 10)}`);
    console.log("");
    console.log(`- source: \`${result.source}\``);
    console.log(`- locale: \`${result.locale}\``);
    console.log(`- metric: sentence 3/4-gram Jaccard after zodiac term normalization`);
    console.log(`- threshold: \`${pct(result.threshold)}\``);
    console.log("");
    console.log("## Matrix");
    console.log("");
    console.log(`| sign | ${SIGNS.map((s) => s.key).join(" | ")} |`);
    console.log(`|---|${SIGNS.map(() => "---:").join("|")}|`);
    for (const sign of SIGNS) {
      console.log(`| ${sign.key} | ${SIGNS.map((other) => pct(result.matrix[sign.key][other.key])).join(" | ")} |`);
    }
    console.log("");
    console.log("## Worst 10 Pairs");
    console.log("");
    console.log("| pair | overlap |");
    console.log("|---|---:|");
    for (const pair of worst) {
      console.log(`| ${pair.a} / ${pair.b} | ${pct(pair.score)} |`);
    }
    console.log("");
    console.log("## Per-Sign Stats");
    console.log("");
    console.log("| sign | words | shingles | forbidden terms |");
    console.log("|---|---:|---:|---|");
    for (const sign of SIGNS) {
      const stat = result.stats[sign.key];
      console.log(`| ${sign.key} | ${stat.words} | ${stat.shingles} | ${stat.forbidden.join(", ") || "-"} |`);
    }
    return;
  }

  console.log(`Zodiac duplicate audit (${result.source}, ${result.locale}, ${result.generatedAt})`);
  console.log(`Metric: sentence 3/4-gram Jaccard after zodiac term normalization`);
  console.log("");
  console.log(["sign", ...SIGNS.map((s) => s.key.padStart(11))].join(" "));
  for (const sign of SIGNS) {
    console.log(
      [sign.key.padEnd(11), ...SIGNS.map((other) => pct(result.matrix[sign.key][other.key]).padStart(11))].join(" "),
    );
  }
  console.log("");
  console.log("Worst 10 pairs:");
  for (const pair of worst) {
    const status = pair.score > result.threshold ? "OVER" : "OK";
    console.log(`- ${pair.a} / ${pair.b}: ${pct(pair.score)} ${status}`);
  }
}
