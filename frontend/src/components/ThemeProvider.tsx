import { fetchDesignTokens, fetchCustomCss } from '@/lib/tokens/fetchTokens.server';
import { tokensToCSS } from '@/lib/tokens/tokensToCSS';
import { minifyCss } from '@/lib/minifyCss';

export async function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tokens, customCss] = await Promise.all([fetchDesignTokens(), fetchCustomCss()]);
  const css = minifyCss(tokensToCSS(tokens));

  return (
    <>
      <style id="design-tokens" dangerouslySetInnerHTML={{ __html: css }} />
      {customCss ? <style id="custom-css" dangerouslySetInnerHTML={{ __html: minifyCss(customCss) }} /> : null}
      {children}
    </>
  );
}
