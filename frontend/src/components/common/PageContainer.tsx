import React from 'react';
import { cn } from '@/lib/utils';

export type PageContainerProps<T extends React.ElementType = 'div'> = {
  children: React.ReactNode;
  className?: string;
  width?: 'narrow' | 'readable' | 'content' | 'default' | 'wide' | 'full';
  pad?: 'page' | 'tight' | 'large' | 'none';
  as?: T;
  /** @deprecated Use width="full". Kept for existing call sites. */
  fullWidth?: boolean;
  /** @deprecated Use pad. Kept for existing call sites. */
  verticalPadding?: 'none' | 'small' | 'normal' | 'large';
  /** @deprecated Header offset should be supplied by page-level layout when needed. */
  withHeaderOffset?: boolean;
  /** Centers children with flexbox. Kept for migrated pages that need empty/loading states centered. */
  center?: boolean;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const widthClasses = {
  narrow: 'max-w-[var(--gm-w-narrow)]',
  readable: 'max-w-[var(--gm-w-readable)]',
  content: 'max-w-[var(--gm-w-content)]',
  default: 'max-w-[var(--gm-w-default)]',
  wide: 'max-w-[var(--gm-w-wide)]',
  full: 'max-w-none',
};

// Site header `fixed top-0` (HeaderClient) — pad'lı her sayfa üst boşluğuyla
// header'ı temizlemek zorunda; simetrik py-* değerleri header altına kayma
// regresyonu üretir (2026-08-16, /danismanlar/[slug]). pad="none" kullanan
// sayfalar kendi offset'ini verir (ör. ConsultantDashboard pt-24).
const padClasses = {
  none: 'py-0',
  tight: 'pt-24 pb-6 md:pt-28 md:pb-10',
  page: 'pt-24 pb-10 md:pt-28 md:pb-16',
  large: 'pt-28 pb-12 md:pt-32 md:pb-20',
};

const legacyPadMap = {
  none: 'none',
  small: 'tight',
  normal: 'page',
  large: 'large',
} satisfies Record<NonNullable<PageContainerProps['verticalPadding']>, NonNullable<PageContainerProps['pad']>>;

export default function PageContainer<T extends React.ElementType = 'div'>({
  children,
  className,
  width = 'default',
  pad = 'page',
  as,
  fullWidth = false,
  verticalPadding,
  withHeaderOffset = false,
  center = false,
  ...props
}: PageContainerProps<T>) {
  const Component = as || 'div';
  const resolvedWidth = fullWidth ? 'full' : width;
  const resolvedPad = verticalPadding ? legacyPadMap[verticalPadding] : pad;

  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 md:px-6',
        widthClasses[resolvedWidth],
        padClasses[resolvedPad],
        withHeaderOffset && 'pt-32',
        center && 'flex items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
