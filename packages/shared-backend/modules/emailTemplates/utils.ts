// =============================================================
// FILE: src/modules/email-templates/utils.ts
// =============================================================

export function extractVariablesFromText(input: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) out.add(m[1]);
  return Array.from(out);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function valueToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

export function renderTextWithParams(
  input: string,
  params: Record<string, unknown>,
): string {
  let output = input;
  for (const [k, v] of Object.entries(params)) {
    const re = new RegExp(`\\{\\{\\s*${escapeRegExp(k)}\\s*\\}\\}`, "g");
    output = output.replace(re, valueToString(v));
  }
  // Kalan placeholder'ları temizlemek istersen:
  // output = output.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, "");
  return output;
}

// Çift-JSON normalize: "\"[\"a\",\"b\"]\"" → ["a","b"]
export function parseVariablesColumn(
  variables: string | null | undefined,
): string[] | null {
  if (!variables) return null;
  try {
    const v1 = JSON.parse(variables);
    if (Array.isArray(v1) && v1.every((x) => typeof x === "string")) return v1;
    if (typeof v1 === "string") {
      const v2 = JSON.parse(v1);
      if (Array.isArray(v2) && v2.every((x) => typeof x === "string")) return v2;
    }
  } catch {
    // ignore
  }
  return null;
}

export function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

export function now(): Date {
  return new Date();
}

export function normalizeVariablesInput(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}
