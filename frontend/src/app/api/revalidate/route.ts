import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.REVALIDATE_SECRET;

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3094',
  'https://admin.goldmoodastro.com',
  'http://localhost:3094',
  'http://127.0.0.1:3094',
].filter(Boolean);

const DEFAULT_TAGS = [
  'design_tokens',
  'custom_css',
  'site-settings',
  'brand',
  'menu_items_header',
];

function corsHeaders(origin?: string | null) {
  const matched = (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]) || '*';
  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!SECRET) {
    return NextResponse.json(
      { error: 'revalidate_secret_not_configured' },
      { status: 500, headers },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { secret, path, all, tags } = body as {
    secret?: string;
    path?: string;
    all?: boolean;
    tags?: string[];
  };

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'invalid_secret' }, { status: 401, headers });
  }

  try {
    const tagsToRevalidate = Array.isArray(tags) && tags.length > 0 ? tags : DEFAULT_TAGS;
    tagsToRevalidate.forEach((tag) => revalidateTag(tag, 'max'));

    if (all) {
      revalidatePath('/', 'layout');
      return NextResponse.json({ revalidated: true, scope: 'all', tags: tagsToRevalidate }, { headers });
    }

    if (path) {
      revalidatePath(path, 'page');
      return NextResponse.json({ revalidated: true, path, tags: tagsToRevalidate }, { headers });
    }

    revalidatePath('/tr', 'layout');
    revalidatePath('/en', 'layout');
    return NextResponse.json({ revalidated: true, scope: 'all-locales', tags: tagsToRevalidate }, { headers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'revalidation_failed' },
      { status: 500, headers },
    );
  }
}
