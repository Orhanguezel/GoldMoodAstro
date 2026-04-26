import type React from 'react';

import { fetchDesignTokens } from '@/lib/tokens/fetchTokens.server';
import { tokensToCSS } from '@/lib/tokens/tokensToCSS';

export async function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tokens = await fetchDesignTokens();
  const css = tokensToCSS(tokens);

  return (
    <>
      <style id="design-tokens" dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
