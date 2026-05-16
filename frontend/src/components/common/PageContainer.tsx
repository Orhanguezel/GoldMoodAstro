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

const padClasses = {
  none: 'py-0',
  tight: 'py-8 md:py-12',
  page: 'py-12 md:py-20',
  large: 'py-12 md:py-32',
};

const legacyPadMap = {
  none: 'none',
  small: 'tight',
  normal: 'page',
  large: 'page',
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
        verticalPadding === 'large' && 'md:py-32',
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
