export type HeadingInfo = { level: 1 | 2 | 3 | 4 | 5 | 6; text: string };
export type ImageInfo = { src: string; alt: string | null };

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function unpackHtml(input: string | null | undefined): string {
  const raw = String(input ?? '');
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return raw;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed?.html === 'string' ? parsed.html : raw;
  } catch {
    return raw;
  }
}

export function stripHtml(html: string): string {
  return decodeEntities(
    unpackHtml(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function wordCount(text: string): number {
  const words = stripHtml(text)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return words.length;
}

export function extractHeadings(html: string): HeadingInfo[] {
  const out: HeadingInfo[] = [];
  const source = unpackHtml(html);
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    out.push({ level: Number(match[1]) as HeadingInfo['level'], text: stripHtml(match[2] ?? '') });
  }
  return out;
}

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(re);
  return decodeEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim() || null;
}

export function extractImages(html: string): ImageInfo[] {
  const out: ImageInfo[] = [];
  const re = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(unpackHtml(html)))) {
    const tag = match[0] ?? '';
    out.push({ src: attrValue(tag, 'src') ?? '', alt: attrValue(tag, 'alt') });
  }
  return out;
}

export function countInternalLinks(html: string, siteHost: string): number {
  const host = siteHost.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  let count = 0;
  const re = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(unpackHtml(html)))) {
    const href = String(match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith('/')) count += 1;
    else {
      try {
        const url = new URL(href);
        if (url.hostname.toLowerCase() === host) count += 1;
      } catch {
        // ignore malformed links
      }
    }
  }
  return count;
}
