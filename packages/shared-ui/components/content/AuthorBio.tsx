import React from 'react';

export type AuthorBioProps = {
  name: string;
  avatar?: string | null;
  title?: string | null;
  bio?: string | null;
  expertise?: string[];
  socials?: Array<{ label: string; href: string }>;
  certificates?: string[];
};

export function AuthorBio({
  name,
  avatar,
  title,
  bio,
  expertise = [],
  socials = [],
  certificates = [],
}: AuthorBioProps) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="mx-auto mt-16 max-w-4xl rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/70 p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--gm-gold)]/40 bg-[var(--gm-bg-deep)]">
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[var(--gm-gold)]">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold-dim)]">
            İçerik Yazarı
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--gm-text)]">{name}</h2>
          {title && <p className="mt-1 text-sm font-medium text-[var(--gm-text-dim)]">{title}</p>}
          {bio && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--gm-text-dim)]">{bio}</p>}

          {(expertise.length > 0 || certificates.length > 0) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {[...expertise, ...certificates].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--gm-gold)]/25 bg-[var(--gm-gold)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold)]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-4">
              {socials.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase tracking-widest text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default AuthorBio;
