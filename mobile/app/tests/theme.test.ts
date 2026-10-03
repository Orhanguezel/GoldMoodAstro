import { describe, expect, test } from 'bun:test';

import { DEFAULT_REMOTE_TOKENS } from '../src/theme/defaultRemoteTokens';
import { designTokensToAppTheme, parseRemoteTokens } from '../src/theme/remoteToAppTheme';

describe('mobile design token fallback', () => {
  test('accepts the JSON string returned by site settings', () => {
    const tokens = parseRemoteTokens(JSON.stringify({
      colors: { brand_primary: '#123456' },
    }));
    expect(tokens?.colors.brand_primary).toBe('#123456');
    expect(tokens?.colors.bg_base).toBe(DEFAULT_REMOTE_TOKENS.colors.bg_base);
  });

  test('ignores malformed server values so a cached theme can be kept', () => {
    expect(parseRemoteTokens('{bad json')).toBeNull();
    expect(parseRemoteTokens(null)).toBeNull();
    expect(parseRemoteTokens({ colors: {} })).toBeNull();
  });

  test('initial mobile theme uses the generated seed palette and font families', () => {
    const theme = designTokensToAppTheme(DEFAULT_REMOTE_TOKENS);
    expect(theme.colors.bg).toBe(DEFAULT_REMOTE_TOKENS.colors.bg_base);
    expect(theme.colors.gold).toBe(DEFAULT_REMOTE_TOKENS.colors.brand_primary);
    expect(theme.font.display).toBe('Fraunces_400Regular');
    expect(theme.font.serif).toBe('Gabriela_400Regular');
    expect(theme.font.sans).toBe('Outfit_400Regular');
    expect(theme.statusBar.default).toBe('dark');
  });

  test('uses light status icons when the administrator selects a dark base', () => {
    const theme = designTokensToAppTheme({
      ...DEFAULT_REMOTE_TOKENS,
      colors: { ...DEFAULT_REMOTE_TOKENS.colors, bg_base: '#1B0A3D' },
    });
    expect(theme.statusBar.default).toBe('light');
  });
});
