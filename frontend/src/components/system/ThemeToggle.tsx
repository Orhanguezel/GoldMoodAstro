'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { IconSun, IconMoon } from '@/components/ui/icons';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Render a neutral placeholder until mount to avoid localStorage hydration mismatch.
  useEffect(() => setMounted(true), []);

  const baseCls = `inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-bg)]/40 text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)] hover:bg-[var(--gm-bg)]/70 transition-colors ${className}`;

  if (!mounted) {
    return <span aria-hidden="true" className={baseCls} />;
  }

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      onClick={toggleTheme}
      className={baseCls}
    >
      {isDark ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
    </button>
  );
}
