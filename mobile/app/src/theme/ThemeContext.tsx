import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { siteSettingsApi } from '@/lib/api';
import { storage } from '@/lib/storage';

import { defaultAppTheme, type AppTheme } from './appTheme';
import { designTokensToAppTheme, normalizeRemoteTokens } from './remoteToAppTheme';

const ThemeContext = createContext<AppTheme>(defaultAppTheme);

/** Önbellek şeması değişince artır (merge mantığı güncellenince). */
export const THEME_CACHE_VERSION = 2;

type ThemeCachePayload = { v: number; theme: AppTheme };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(defaultAppTheme);

  useEffect(() => {
    let alive = true;
    (async () => {
      const cached = await storage.getThemeCache();
      if (cached && typeof cached === 'object' && 'v' in cached && 'theme' in cached) {
        const c = cached as ThemeCachePayload;
        if (c.v === THEME_CACHE_VERSION && c.theme?.colors?.bg) {
          setTheme(c.theme);
        }
      }
      try {
        const raw = await siteSettingsApi.getDesignTokens();
        if (!alive) return;
        const tokens = normalizeRemoteTokens(raw);
        const next = designTokensToAppTheme(tokens);
        setTheme(next);
        await storage.setThemeCache({ v: THEME_CACHE_VERSION, theme: next } as ThemeCachePayload);
      } catch {
        /* ağ yok / 404 — varsayılan veya önbellek */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => theme, [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}
