'use client';

import React from 'react';

type Props = {
  url: string;
  title: string;
  locale: string;
};

const LABELS = {
  tr: { share: 'Paylaş', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı' },
  en: { share: 'Share', copy: 'Copy link', copied: 'Copied' },
  de: { share: 'Teilen', copy: 'Link kopieren', copied: 'Kopiert' },
} as const;

function labelsFor(locale: string) {
  if (locale === 'tr' || locale === 'de') return LABELS[locale];
  return LABELS.en;
}

/**
 * Blog yazısı paylaşım çubuğu (client). Sidebar içinde kullanılır.
 * WhatsApp / X / Facebook / Telegram + bağlantı kopyala.
 */
export default function BlogShareBar({ url, title, locale }: Props) {
  const t = labelsFor(locale);
  const [copied, setCopied] = React.useState(false);

  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  const links: Array<{ key: string; label: string; href: string; icon: React.ReactNode }> = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encTitle}%20${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.8-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
        </svg>
      ),
    },
    {
      key: 'x',
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
          <path d="M18.9 2H22l-7.1 8.1L23 22h-6.6l-5.1-6.7L5.4 22H2.3l7.6-8.7L1.6 2h6.7l4.6 6.1L18.9 2zm-1.2 18h1.8L7.3 3.9H5.4L17.7 20z" />
        </svg>
      ),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
        </svg>
      ),
    },
    {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${enc}&text=${encTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.6 13.2 2 11.8c-1-.3-1-1 .2-1.5l18.4-7.1c.8-.3 1.5.2 1.3 1.1z" />
        </svg>
      ),
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard yoksa sessizce geç
    }
  };

  return (
    <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 shadow-(--gm-shadow-soft)">
      <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-(--gm-gold-deep) mb-4">
        {t.share}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--gm-border-soft) bg-(--gm-bg-deep) text-(--gm-text-dim) transition-all hover:border-(--gm-primary)/50 hover:text-(--gm-primary) hover:-translate-y-0.5"
          >
            {l.icon}
          </a>
        ))}
        <button
          type="button"
          onClick={onCopy}
          aria-label={t.copy}
          title={t.copy}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--gm-border-soft) bg-(--gm-bg-deep) text-(--gm-text-dim) transition-all hover:border-(--gm-primary)/50 hover:text-(--gm-primary) hover:-translate-y-0.5"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      {copied ? (
        <p className="mt-3 text-xs text-(--gm-primary)">{t.copied}</p>
      ) : null}
    </div>
  );
}
