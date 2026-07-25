import type { ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface GradientHeroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function GradientHero({
  title,
  eyebrow,
  description,
  actions,
  aside,
  className,
}: GradientHeroProps) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-3xl bg-dark-hero-gradient px-7 py-8 text-white shadow-float sm:px-8",
        className,
      )}
    >
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-widest text-brand-100">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/75 sm:text-base">
              {description}
            </p>
          )}
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {aside && <div className="relative shrink-0">{aside}</div>}
      </div>
    </section>
  );
}
