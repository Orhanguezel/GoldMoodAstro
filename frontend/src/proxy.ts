// =============================================================
// FILE: src/proxy.ts (Next.js 16+ — eski middleware.ts deprecated)
// 1) Locale prefix routing — kök URL `/` Türkçe içeriği gösterir
//    (internal rewrite to /tr, URL bar'da `/` kalır).
// 2) Danışman detay kanonikleştirme: /:locale/consultants/<UUID>
//    → /:locale/consultants/<slug> (gerçek HTTP 308). Render-içi
//    redirect Next 16 streaming'inde yutulduğu için burada yapılır.
//    Slug ile gelen istek API'ye gitmez (sıfır ek yük).
// =============================================================

import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['tr', 'en', 'de'] as const;
const DEFAULT_LOCALE = 'tr';

// Non-locale path prefixes (admin, api vs.)
const NON_LOCALE_PREFIXES = ['admin', 'api', 'uploads', 'public', 'static', 'images', 'assets'];

// Static file extensions — proxy'i atla
const STATIC_EXT_RE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf|eot|css|js|map|txt|xml|json|webmanifest)$/i;

// Danışman detay kanonikleştirme
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CONSULTANT_PATH_RE = /^\/([^/]+)\/consultants\/([^/]+)\/?$/;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

async function consultantSlugRedirect(req: NextRequest): Promise<NextResponse | null> {
  const match = req.nextUrl.pathname.match(CONSULTANT_PATH_RE);
  if (!match) return null;
  const locale = match[1];
  const param = decodeURIComponent(match[2]);
  if (!UUID_RE.test(param)) return null; // slug ile gelmiş → dokunma, API'ye gitme
  try {
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(param)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const slug: string | undefined = (json?.data ?? json)?.slug?.trim?.();
    if (slug && slug !== param) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/consultants/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // API erişilemezse normal render (id ile de çalışır)
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Next.js internals + static dosyalar — atla
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/offline.html' ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // İlk path segment'i (boşsa root '/')
  const firstSeg = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();

  // Non-locale (admin/api/uploads) — olduğu gibi geç
  if (firstSeg && NON_LOCALE_PREFIXES.includes(firstSeg)) {
    return NextResponse.next();
  }

  // Locale prefix var ve destekli
  if (firstSeg && (SUPPORTED_LOCALES as readonly string[]).includes(firstSeg)) {
    // Danışman detay: id (UUID) → slug kanonik 308
    const redirect = await consultantSlugRedirect(req);
    if (redirect) return redirect;
    return NextResponse.next();
  }

  // Locale prefix YOK → default locale'e internal rewrite (URL bar'da `/` kalır)
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // _next/static, _next/image hariç her şeyde çalış
    '/((?!_next/static|_next/image).*)',
  ],
};
