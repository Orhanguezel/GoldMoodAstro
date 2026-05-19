import { NextResponse, type NextRequest } from 'next/server';

// Danışman detay URL'i her zaman isim-slug olsun.
// /:locale/consultants/<UUID> ile gelinirse → /:locale/consultants/<slug> (308).
// Render-içi redirect Next 16 streaming'inde yutulduğu için kanonikleştirme
// middleware'de yapılır (gerçek HTTP redirect, streaming'den etkilenmez).
//
// Normal trafik slug kullanır → UUID değilse hiç API çağrısı yapılmaz (sıfır yük).

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CONSULTANT_PATH_RE = /^\/([^/]+)\/consultants\/([^/]+)\/?$/;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = pathname.match(CONSULTANT_PATH_RE);
  if (!m) return NextResponse.next();

  const locale = m[1];
  const param = decodeURIComponent(m[2]);
  if (!UUID_RE.test(param)) return NextResponse.next(); // slug ile gelmiş → dokunma

  try {
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(param)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return NextResponse.next();
    const json = await res.json();
    const slug: string | undefined = (json?.data ?? json)?.slug?.trim();
    if (slug && slug !== param) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/consultants/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // API erişilemezse sayfayı normal render et (id ile de çalışır)
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:locale/consultants/:param',
};
