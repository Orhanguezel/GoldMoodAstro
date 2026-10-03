// Saf (server + client) yardımcılar: ui_* satırlarını tek locale için düz bir
// sözlüğe indirir. uiDb.ts'teki useUiSection çözümleme sırasıyla birebir aynı.

export type UiStringsSnapshot = {
  locale: string;
  /** ui_* anahtarı → çözümlenmiş metin */
  labels: Record<string, string>;
  /** Section satırları (ui_header, ui_contact, ...) → ham JSON nesnesi */
  sections: Record<string, Record<string, unknown>>;
};

// Web'de kullanılmayan büyük gruplar: mobil uygulama sözlüğü ve admin paneli.
const EXCLUDED_PREFIXES = ['ui_mobile', 'ui_admin'];

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return value;
    }
  }
  return value;
}

export function shortLocale(x: unknown): string {
  return String(x || '').trim().toLowerCase().replace('_', '-').split('-')[0].trim();
}

export function resolveUiRows(rows: Array<{ key?: unknown; value?: unknown }>, locale: string): UiStringsSnapshot {
  const l = shortLocale(locale);
  const labels: Record<string, string> = {};
  const sections: Record<string, Record<string, unknown>> = {};

  for (const row of rows) {
    const key = typeof row?.key === 'string' ? row.key : '';
    if (!key || EXCLUDED_PREFIXES.some((p) => key.startsWith(p))) continue;
    const v = parseMaybeJson(row.value);

    if (typeof v === 'string') {
      // useUiSection düz string'i { en: v } sayar → her locale'de aynı metin.
      if (v.trim()) labels[key] = v.trim();
      continue;
    }
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;

    const obj = v as Record<string, unknown>;
    const label = obj.label && typeof obj.label === 'object' && !Array.isArray(obj.label)
      ? (obj.label as Record<string, unknown>)
      : null;

    if (label) {
      const val = (l && label[l]) || label.en || (l === 'tr' ? label.tr : '');
      if (typeof val === 'string' && val.trim() && val.trim() !== key) labels[key] = val.trim();
      continue;
    }

    // label'sız nesne: section JSON'u (ui_header → { ui_header_cta: ... }) veya
    // doğrudan { tr, en, de } çeviri nesnesi olabilir.
    const direct = (l && obj[l]) || obj.en;
    if (typeof direct === 'string') {
      if (direct.trim() && direct.trim() !== key) labels[key] = direct.trim();
      continue;
    }
    sections[key] = obj;
  }

  return { locale: l, labels, sections };
}
