import { Platform } from 'react-native';
import type { CreditPackage, SubscriptionPlan } from '@/types';
import type { Product, ProductSubscription, Purchase, PurchaseError } from 'expo-iap';

export type IapProviderSlug = 'apple_iap' | 'google_iap';

export interface IapPurchaseResult {
  ok: boolean;
  receipt?: string;
  productId?: string;
  transactionId?: string;
  purchaseToken?: string;
  pendingPurchaseId?: string;
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

const CREDIT_PRODUCT_IDS = {
  ios: {
    starter: process.env.EXPO_PUBLIC_IAP_CREDIT_STARTER_IOS || process.env.EXPO_PUBLIC_IAP_CREDIT_STARTER || 'com.goldmoodastro.app.credits.starter',
    popular: process.env.EXPO_PUBLIC_IAP_CREDIT_POPULAR_IOS || process.env.EXPO_PUBLIC_IAP_CREDIT_POPULAR || 'com.goldmoodastro.app.credits.popular',
    value: process.env.EXPO_PUBLIC_IAP_CREDIT_VALUE_IOS || process.env.EXPO_PUBLIC_IAP_CREDIT_VALUE || 'com.goldmoodastro.app.credits.value',
  },
  android: {
    starter: process.env.EXPO_PUBLIC_IAP_CREDIT_STARTER_ANDROID || process.env.EXPO_PUBLIC_IAP_CREDIT_STARTER || 'com.goldmoodastro.app.credits.starter',
    popular: process.env.EXPO_PUBLIC_IAP_CREDIT_POPULAR_ANDROID || process.env.EXPO_PUBLIC_IAP_CREDIT_POPULAR || 'com.goldmoodastro.app.credits.popular',
    value: process.env.EXPO_PUBLIC_IAP_CREDIT_VALUE_ANDROID || process.env.EXPO_PUBLIC_IAP_CREDIT_VALUE || 'com.goldmoodastro.app.credits.value',
  },
} as const;

export function getIapProductId(plan: SubscriptionPlan): string {
  const interval = plan.period === 'yearly' ? 'yearly' : 'monthly';
  if (Platform.OS === 'ios') return PRODUCT_IDS.ios[interval];
  if (Platform.OS === 'android') return PRODUCT_IDS.android[interval];
  return '';
}

export function getCreditIapProductId(pkg: CreditPackage): string {
  const code = (pkg.code || '').toLowerCase() as keyof typeof CREDIT_PRODUCT_IDS.ios;
  if (Platform.OS === 'ios') return CREDIT_PRODUCT_IDS.ios[code] || `com.goldmoodastro.app.credits.${pkg.code}`;
  if (Platform.OS === 'android') return CREDIT_PRODUCT_IDS.android[code] || `com.goldmoodastro.app.credits.${pkg.code}`;
  return '';
}

export function getIapProvider(): IapProviderSlug | null {
  if (Platform.OS === 'ios') return 'apple_iap';
  if (Platform.OS === 'android') return 'google_iap';
  return null;
}

const PURCHASE_TIMEOUT_MS = 2 * 60 * 1000;
const ANDROID_PACKAGE_NAME = process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME || 'com.goldmoodastro.app';
const pendingPurchases = new Map<string, Purchase>();

type ExpoIapModule = typeof import('expo-iap');

function purchaseKey(purchase: Purchase): string {
  return (
    purchase.purchaseToken ||
    purchase.transactionId ||
    purchase.id ||
    `${purchase.productId}:${purchase.transactionDate}`
  );
}

function errorMessage(error: PurchaseError | unknown): string {
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) return code;
  }
  return 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.';
}

function findAndroidOfferToken(products: ProductSubscription[], productId: string): string | null {
  const product = products.find((item) => item.id === productId && item.platform === 'android');
  if (!product || product.platform !== 'android') return null;
  const standardized = product.subscriptionOffers.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid;
  if (standardized) return standardized;
  return product.subscriptionOfferDetailsAndroid[0]?.offerToken ?? null;
}

async function receiptForPurchase(iap: ExpoIapModule, purchase: Purchase): Promise<string> {
  if (Platform.OS === 'ios') {
    const receipt = await iap.requestReceiptRefreshIOS().catch(() => '');
    return receipt || purchase.purchaseToken || '';
  }
  return purchase.purchaseToken || ('dataAndroid' in purchase ? purchase.dataAndroid ?? '' : '');
}

async function normalizePurchase(iap: ExpoIapModule, purchase: Purchase): Promise<IapPurchaseResult> {
  if (purchase.purchaseState !== 'purchased') {
    return {
      ok: false,
      message: 'Satın alma işlemi beklemede. Ödeme tamamlandığında abonelik güncellenecek.',
    };
  }

  const key = purchaseKey(purchase);
  pendingPurchases.set(key, purchase);

  return {
    ok: true,
    receipt: await receiptForPurchase(iap, purchase),
    productId: purchase.productId,
    transactionId:
      purchase.transactionId ||
      ('originalTransactionIdentifierIOS' in purchase ? purchase.originalTransactionIdentifierIOS ?? undefined : undefined) ||
      purchase.id,
    purchaseToken: purchase.purchaseToken ?? undefined,
    pendingPurchaseId: key,
  };
}

async function loadIap(): Promise<ExpoIapModule> {
  return import('expo-iap');
}

export async function purchaseSubscriptionPlan(plan: SubscriptionPlan): Promise<IapPurchaseResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { ok: false, message: 'Bu platformda uygulama içi satın alma desteklenmiyor.' };
  }

  const productId = getIapProductId(plan);
  if (!productId) {
    return { ok: false, message: 'Abonelik ürün kodu bulunamadı.' };
  }

  try {
    const iap = await loadIap();
    await iap.initConnection();

    const products = ((await iap.fetchProducts({ skus: [productId], type: 'subs' })) ?? []) as ProductSubscription[];
    if (!products.some((item) => item.id === productId)) {
      return { ok: false, productId, message: 'Abonelik ürünü mağazada bulunamadı.' };
    }

    const resultPromise = new Promise<IapPurchaseResult>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        purchaseSub.remove();
        errorSub.remove();
      };
      const settle = (result: IapPurchaseResult) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      const purchaseSub = iap.purchaseUpdatedListener((purchase) => {
        if (purchase.productId !== productId) return;
        void normalizePurchase(iap, purchase)
          .then(settle)
          .catch((err) => settle({ ok: false, productId, message: errorMessage(err) }));
      });
      const errorSub = iap.purchaseErrorListener((error) => {
        settle({ ok: false, productId, message: errorMessage(error) });
      });

      timer = setTimeout(() => {
        settle({ ok: false, productId, message: 'Satın alma zaman aşımına uğradı. Lütfen tekrar deneyin.' });
      }, PURCHASE_TIMEOUT_MS);
    });

    if (Platform.OS === 'android') {
      const offerToken = findAndroidOfferToken(products, productId);
      if (!offerToken) {
        return { ok: false, productId, message: 'Google Play abonelik teklifi bulunamadı.' };
      }
      await iap.requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken }],
          },
        },
      });
    } else {
      await iap.requestPurchase({
        type: 'subs',
        request: {
          apple: { sku: productId },
        },
      });
    }

    return await resultPromise;
  } catch (err) {
    return { ok: false, productId, message: errorMessage(err) };
  }
}

export async function purchaseCreditPackage(pkg: CreditPackage): Promise<IapPurchaseResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { ok: false, message: 'Bu platformda uygulama içi satın alma desteklenmiyor.' };
  }

  const productId = getCreditIapProductId(pkg);
  if (!productId) {
    return { ok: false, message: 'Kredi paketinin mağaza ürün kodu bulunamadı.' };
  }

  try {
    const iap = await loadIap();
    await iap.initConnection();

    const products = ((await iap.fetchProducts({ skus: [productId], type: 'in-app' })) ?? []) as Product[];
    if (!products.some((item) => item.id === productId)) {
      return { ok: false, productId, message: 'Kredi paketi mağazada bulunamadı.' };
    }

    const resultPromise = new Promise<IapPurchaseResult>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        purchaseSub.remove();
        errorSub.remove();
      };
      const settle = (result: IapPurchaseResult) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      const purchaseSub = iap.purchaseUpdatedListener((purchase) => {
        if (purchase.productId !== productId) return;
        void normalizePurchase(iap, purchase)
          .then(settle)
          .catch((err) => settle({ ok: false, productId, message: errorMessage(err) }));
      });
      const errorSub = iap.purchaseErrorListener((error) => {
        settle({ ok: false, productId, message: errorMessage(error) });
      });

      timer = setTimeout(() => {
        settle({ ok: false, productId, message: 'Satın alma zaman aşımına uğradı. Lütfen tekrar deneyin.' });
      }, PURCHASE_TIMEOUT_MS);
    });

    await iap.requestPurchase({
      type: 'in-app',
      request: Platform.OS === 'android'
        ? { google: { skus: [productId] } }
        : { apple: { sku: productId } },
    });

    return await resultPromise;
  } catch (err) {
    return { ok: false, productId, message: errorMessage(err) };
  }
}

export async function finishSubscriptionPurchase(purchase: IapPurchaseResult): Promise<void> {
  if (!purchase.ok || !purchase.pendingPurchaseId) return;
  const pending = pendingPurchases.get(purchase.pendingPurchaseId);
  if (!pending) return;
  const iap = await loadIap();
  await iap.finishTransaction({ purchase: pending, isConsumable: false });
  pendingPurchases.delete(purchase.pendingPurchaseId);
}

export async function finishCreditPurchase(purchase: IapPurchaseResult): Promise<void> {
  if (!purchase.ok || !purchase.pendingPurchaseId) return;
  const pending = pendingPurchases.get(purchase.pendingPurchaseId);
  if (!pending) return;
  const iap = await loadIap();
  await iap.finishTransaction({ purchase: pending, isConsumable: true });
  pendingPurchases.delete(purchase.pendingPurchaseId);
}

export async function restoreSubscriptionPurchases(): Promise<IapPurchaseResult[]> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return [];
  const iap = await loadIap();
  await iap.initConnection();
  await iap.restorePurchases().catch(() => undefined);
  const purchases = await iap.getAvailablePurchases(
    Platform.OS === 'ios' ? { onlyIncludeActiveItemsIOS: true } : undefined,
  );
  const subscriptionPurchases = purchases.filter((purchase) => purchase.purchaseState === 'purchased');
  return Promise.all(subscriptionPurchases.map((purchase) => normalizePurchase(iap, purchase)));
}

export async function openStoreSubscriptionManagement(productId?: string): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  const iap = await loadIap();
  await iap.initConnection().catch(() => undefined);
  await iap.deepLinkToSubscriptions(
    Platform.OS === 'android'
      ? {
          packageNameAndroid: ANDROID_PACKAGE_NAME,
          skuAndroid: productId || undefined,
        }
      : undefined,
  );
}
