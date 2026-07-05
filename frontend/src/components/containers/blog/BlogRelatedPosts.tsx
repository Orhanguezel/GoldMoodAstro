import React from 'react';
import Link from 'next/link';
import { excerpt, localizePath, safeStr, toCdnSrc } from '@/integrations/shared';
import type { CustomPageDto } from '@/integrations/shared';

type Props = {
  posts: CustomPageDto[];
  locale: string;
  title?: string;
};

/**
 * Blog yazısı sidebar'ında "Diğer Yazılar" listesi (server component).
 * Yatay küçük kart: kapak + başlık + kısa özet.
 */
export default function BlogRelatedPosts({ posts, locale, title }: Props) {
  const heading =
    title || (locale === 'tr' ? 'Diğer Yazılar' : locale === 'de' ? 'Weitere Beiträge' : 'Other Articles');

  if (!Array.isArray(posts) || posts.length === 0) return null;

  return (
    <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 shadow-(--gm-shadow-soft)">
      <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-(--gm-gold-deep) mb-4">
        {heading}
      </p>
      <ul className="space-y-4">
        {posts.map((post) => {
          const slug = safeStr(post.slug);
          if (!slug) return null;
          const postTitle = safeStr(post.title) || slug;
          const href = localizePath(locale, `/blog/${slug}`);
          const imgRaw =
            safeStr(post.featured_image) ||
            (Array.isArray(post.images) ? safeStr((post.images as unknown[])[0] as string) : '');
          const imgSrc = imgRaw ? toCdnSrc(imgRaw, 160, 160, 'fill') || imgRaw : '';
          const summary = excerpt(safeStr(post.summary), 70);

          return (
            <li key={post.id || slug}>
              <Link
                href={href}
                className="group flex items-start gap-3 no-underline"
              >
                <span className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep)">
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={postTitle}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug text-(--gm-text) transition-colors group-hover:text-(--gm-primary) line-clamp-2">
                    {postTitle}
                  </span>
                  {summary ? (
                    <span className="mt-1 block text-xs text-(--gm-text-dim) line-clamp-2">
                      {summary}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
