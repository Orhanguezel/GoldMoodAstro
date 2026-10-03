/**
 * Satır içi <style> blokları için güvenli, bağımlılıksız küçültme: yorumları
 * siler, boşlukları daraltır. Seçicilerde anlam taşıyan ":" öncesi boşluğa
 * dokunmaz (`a :hover` ≠ `a:hover`). SEO katalog 2026-10-03: inline CSS 0/1
 * minified.
 */
export function minifyCss(css: string): string {
  return String(css || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();
}
