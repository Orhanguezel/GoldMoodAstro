// =============================================================
// FILE: src/lib/iap.ts
// IAP STUB — preview/demo build için.
// `expo-in-app-purchases` paketi Expo SDK 54 ile uyumsuz (eski modül API'si:
// ExportedModule, ExpoMethod kaldırıldı). Production'da RevenueCat veya
// react-native-iap'a migrate edilecek.
// Bu stub TypeScript interface'i koruyor; gerçek satın alma şimdilik no-op.
// =============================================================

import { Platform } from 'react-native';
import type { SubscriptionPlan } from '@/types';

export type IapProviderSlug = 'apple_iap' | 'google_iap';

export interface IapPurchaseResult {
  ok: boolean;
  receipt?: string;
  productId?: string;
  transactionId?: string;
  purchaseToken?: string;
  message?: string;
}

const PRODUCT_IDS = {
  ios: {
    monthly:
      process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY_IOS ||
      process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY ||
      'com.goldmoodastro.app.monthly',
    yearly:
      process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY_IOS ||
      process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY ||
      'com.goldmoodastro.app.yearly',
  },
  android: {
    monthly:
      process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY_ANDROID ||
      process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY ||
      'com.goldmoodastro.app.monthly',
    yearly:
      process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY_ANDROID ||
      process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY ||
      'com.goldmoodastro.app.yearly',
  },
} as const;

export function getIapProductId(plan: SubscriptionPlan): string {
  const interval = plan.period === 'yearly' ? 'yearly' : 'monthly';
  if (Platform.OS === 'ios') return PRODUCT_IDS.ios[interval];
  if (Platform.OS === 'android') return PRODUCT_IDS.android[interval];
  return '';
}

export function getIapProvider(): IapProviderSlug | null {
  if (Platform.OS === 'ios') return 'apple_iap';
  if (Platform.OS === 'android') return 'google_iap';
  return null;
}

export async function purchaseSubscriptionPlan(
  _plan: SubscriptionPlan,
): Promise<IapPurchaseResult> {
  return {
    ok: false,
    message:
      'In-app satın alma henüz bu sürümde aktif değil. Production sürümünde RevenueCat üzerinden çalışacak.',
  };
}
