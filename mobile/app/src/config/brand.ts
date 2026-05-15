import Constants from 'expo-constants';

type ExpoExtra = {
  apiUrl?: string;
  appName?: string;
  publicUrl?: string;
  supportEmail?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const mobileBrandConfig = {
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? extra.appName ?? 'Astro App',
  publicUrl: (process.env.EXPO_PUBLIC_PUBLIC_URL ?? extra.publicUrl ?? '').replace(/\/$/, ''),
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? extra.supportEmail ?? '',
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    extra.apiUrl ??
    '',
} as const;

export function publicShareUrl(path: string) {
  if (!mobileBrandConfig.publicUrl) return path;
  return `${mobileBrandConfig.publicUrl}${path}`;
}
