// Storefront (frontend) public varlıklarını admin panelde doğru host'tan çözer.
// Banner image_url gibi alanlar frontend-relative (/banners/*.svg) saklanıyor;
// admin kendi domaininde render edince 404 olur. Bu helper relative path'i
// storefront origin'e bağlar. Mutlak/data URL'ler dokunulmadan geçer.

const STOREFRONT_ORIGIN = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://goldmoodastro.com'
).replace(/\/+$/, '');

export function resolvePublicAsset(url?: string | null): string {
  if (!url) return '';
  const v = String(url).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('blob:')) return v;
  return `${STOREFRONT_ORIGIN}/${v.replace(/^\/+/, '')}`;
}
