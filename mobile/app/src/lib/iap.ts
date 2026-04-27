import { Platform } from 'react-native';
import {
  IAPErrorCode,
  IAPResponseCode,
  InAppPurchaseState,
  InAppPurchases,
} from 'expo-in-app-purchases';
import type { InAppPurchase } from 'expo-in-app-purchases';
import type { SubscriptionPlan } from '@/types';

export type IapProviderSlug = 'apple_iap' | 'google_iap';

const PRODUCT_IDS = {
  ios: {
    monthly: process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY_IOS || process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY || 'com.goldmoodastro.app.monthly',
    yearly: process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY_IOS || process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY || 'com.goldmoodastro.app.yearly',
  },
  android: {
    monthly: process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY_ANDROID || process.env.EXPO_PUBLIC_IAP_PRODUCT_MONTHLY || 'com.goldmoodastro.app.monthly',
    yearly: process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY_ANDROID || process.env.EXPO_PUBLIC_IAP_PRODUCT_YEARLY || 'com.goldmoodastro.app.yearly',
  },
} as const;

function buildTimeoutError(): Error {
  return new Error('Ödeme zaman aşımına uğradı, tekrar deneyiniz.');
}

function buildNotAvailableError(): Error {
  return new Error('Bu cihazdan abonelik satın alma yapılamıyor.');
}

function buildPlatformError(): Error {
  return new Error('Faturalandırma servisine bağlanılamadı.');
}

function getProvider(): IapProviderSlug | null {
  if (Platform.OS === 'ios') return 'apple_iap';
  if (Platform.OS === 'android') return 'google_iap';
  return null;
}

function normalizePlanCode(plan: SubscriptionPlan): 'monthly' | 'yearly' | string {
  return (plan.code || '').toLowerCase().trim();
}

function resolveProductId(plan: SubscriptionPlan): string {
  const code = normalizePlanCode(plan);
  if (code === 'free') return '';

  const platformProducts = Platform.OS === 'ios' ? PRODUCT_IDS.ios : PRODUCT_IDS.android;
  if (code === 'monthly') return platformProducts.monthly;
  if (code === 'yearly') return platformProducts.yearly;

  return '';
}

async function queryProductOrFail(productId: string): Promise<void> {
  const response = await InAppPurchases.getProductsAsync([productId]);

  if (response.responseCode !== IAPResponseCode.OK) {
    throw buildNotAvailableError();
  }

  const hasResult = Array.isArray(response.results) && response.results.length > 0;
  if (!hasResult) {
    throw new Error(`Abonelik ürünü bulunamadı: ${productId}`);
  }
}

export interface IapPurchaseResult {
  provider: IapProviderSlug;
  planCode: string;
  productId: string;
  transactionId: string;
  receipt: string;
  purchaseToken?: string;
}

export async function purchaseSubscriptionPlan(plan: SubscriptionPlan): Promise<IapPurchaseResult> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('IAP bu platformda desteklenmiyor.');
  }

  const productId = resolveProductId(plan);
  if (!productId) {
    throw new Error('Bu plan için IAP ürünü tanımlı değil.');
  }

  const connect = await InAppPurchases.connectAsync();
  if (connect.responseCode !== IAPResponseCode.OK) {
    throw buildPlatformError();
  }

  await queryProductOrFail(productId);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finalize = () => {
      settled = true;
      clearTimeout(timeoutId);
      InAppPurchases.setPurchaseListener(() => undefined);
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      finalize();
      reject(buildTimeoutError());
    }, 120000);

    InAppPurchases.setPurchaseListener((result) => {
      if (settled) return;
      if (result.responseCode === IAPResponseCode.USER_CANCELED) {
        finalize();
        reject(new Error('Ödeme iptal edildi.'));
        return;
      }

      if (result.responseCode === IAPResponseCode.DEFERRED) {
        finalize();
        reject(new Error('Ödeme onayı bekleniyor.'));
        return;
      }

      if (result.responseCode !== IAPResponseCode.OK) {
        if (result.responseCode === IAPResponseCode.ERROR) {
          const code = result.errorCode;
          const fallback = code === IAPErrorCode.ITEM_ALREADY_OWNED
            ? 'Bu abonelik zaten hesabınızda aktif.'
            : 'Ödeme işlemi sırasında hata oluştu.';
          finalize();
          reject(new Error(fallback));
          return;
        }

        finalize();
        reject(buildPlatformError());
        return;
      }

      const purchases = (result.results ?? []) as Array<InAppPurchase>;
      const matching = purchases.find((purchase) => purchase.productId === productId);
      if (!matching) {
        return;
      }

      if (
        matching.purchaseState !== InAppPurchaseState.PURCHASED &&
        matching.purchaseState !== InAppPurchaseState.RESTORED
      ) {
        if (matching.purchaseState === InAppPurchaseState.FAILED) {
          finalize();
          reject(new Error('Ödeme başarısız oldu.'));
        }
        return;
      }

      (async () => {
        try {
          if (!matching.acknowledged) {
            await InAppPurchases.finishTransactionAsync(matching, false);
          }

          finalize();
          resolve({
            provider,
            planCode: plan.code,
            productId: matching.productId,
            transactionId: matching.orderId,
            purchaseToken: matching.purchaseToken,
            receipt: matching.transactionReceipt || matching.purchaseToken || '',
          });
        } catch (err) {
          finalize();
          reject(err instanceof Error ? err : new Error('İşlem tamamlanamadı.'));
        }
      })();
    });

    InAppPurchases.purchaseItemAsync(productId).catch((err: unknown) => {
      if (settled) return;
      finalize();
      reject(err instanceof Error ? err : new Error('Satın alma başlatılamadı.'));
    });
  });
}

export function getIapProductId(plan: SubscriptionPlan): string {
  return resolveProductId(plan);
}

export function getIapProvider(): IapProviderSlug | null {
  return getProvider();
}
