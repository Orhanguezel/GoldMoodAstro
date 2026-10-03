/** Accept only same-origin paths for post-auth navigation. */
export function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('//') || decoded.startsWith('/\\')) return null;
    const url = new URL(raw, 'https://goldmoodastro.invalid');
    if (url.origin !== 'https://goldmoodastro.invalid') return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
