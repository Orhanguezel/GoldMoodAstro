// src/modules/orders/iyzico.service.ts
// @ts-ignore — iyzipay lacks type declarations
import Iyzipay from 'iyzipay';
import { DEFAULT_LOCALE } from '../../core/i18n';

// Iyzipay SDK'nın desteklediği locale değerleri
const IYZIPAY_LOCALES = ['tr', 'en'] as const;
type IyzipayLocale = (typeof IYZIPAY_LOCALES)[number];

/**
 * İstek locale'sini Iyzipay'in desteklediği formata çevirir.
 * Desteklenmeyen locale → DEFAULT_LOCALE → 'tr' fallback.
 */
export function resolveIyzicoLocale(requestLocale?: string | null): IyzipayLocale {
  const lang = (requestLocale ?? DEFAULT_LOCALE ?? 'tr')
    .split('-')[0]
    .toLowerCase();
  return (IYZIPAY_LOCALES as readonly string[]).includes(lang)
    ? (lang as IyzipayLocale)
    : 'tr';
}

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;  // opsiyonel — yoksa ENV'den okunur
  uri?: string;      // iyzipay SDK'nın beklediği alan adı (baseUrl ile eş değer)
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: 'PHYSICAL' | 'VIRTUAL';
  price: string;
}

export interface IyzicoInitializeRequest {
  locale: IyzipayLocale;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup?: string;
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    lastLoginDate: string;
    registrationDate: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: IyzicoBasketItem[];
}

export class IyzicoService {
  // iyzipay SDK'nın TypeScript tipleri uri bekliyor ama gerçekte apiKey/secretKey/baseUrl kullanıyor.
  // Tip uyumsuzluğunu unknown → any cast ile aşıyoruz.
  private iyzipay: Iyzipay;

  constructor(config: IyzicoConfig) {
    // iyzipay SDK 'uri' alan adını bekliyor; 'baseUrl' veya ENV'den çeviriyoruz.
    const uri =
      config.uri ??
      config.baseUrl ??
      (process.env.IYZICO_TEST_MODE === 'false'
        ? 'https://api.iyzipay.com'
        : 'https://sandbox-api.iyzipay.com');

    const apiKey =
      config.apiKey ||
      process.env.IYZIPAY_API_KEY ||
      process.env.IYZICO_API_KEY ||
      '';
    const secretKey =
      config.secretKey ||
      process.env.IYZIPAY_SECRET_KEY ||
      process.env.IYZICO_SECRET_KEY ||
      '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.iyzipay = new Iyzipay({ apiKey, secretKey, uri } as any);
  }

  initializeCheckoutForm(request: IyzicoInitializeRequest): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      (this.iyzipay as unknown as Record<string, Record<string, Function>>)
        .checkoutFormInitialize
        .create(request, (err: unknown, result: Record<string, unknown>) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  retrieveCheckoutResult(token: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      (this.iyzipay as unknown as Record<string, Record<string, Function>>)
        .checkoutForm
        .retrieve({ token }, (err: unknown, result: Record<string, unknown>) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }
}

function toMinor(value: unknown): number {
  const n = Number(String(value ?? '0').replace(',', '.'));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

export function isPaymentMockEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return String(process.env.PAYMENT_MOCK_MODE || '').toLowerCase() === 'true';
}

export function assertPaymentMockSafe() {
  if (process.env.NODE_ENV === 'production' && String(process.env.PAYMENT_MOCK_MODE || '').toLowerCase() === 'true') {
    throw new Error('PAYMENT_MOCK_MODE cannot be enabled in production');
  }
}

export type IyzicoCallbackVerification = {
  raw: Record<string, unknown>;
  paymentId: string;
  paidPriceMinor: number;
  currency: string;
};

export async function verifyIyzicoCallback(params: {
  iyzico: IyzicoService;
  token: string;
  expectedAmountMinor: number;
  expectedCurrency: string;
  expectedBasketId?: string;
  expectedConversationId?: string;
}): Promise<IyzicoCallbackVerification> {
  const token = clean(params.token);
  if (!token) throw new Error('iyzico_token_required');

  const result = await params.iyzico.retrieveCheckoutResult(token);
  const status = clean(result.status).toLowerCase();
  const paymentStatus = clean(result.paymentStatus).toUpperCase();
  if (status !== 'success' || paymentStatus !== 'SUCCESS') {
    throw new Error('iyzico_payment_not_successful');
  }

  const paidPriceMinor = toMinor(result.paidPrice);
  if (!Number.isFinite(paidPriceMinor) || paidPriceMinor !== params.expectedAmountMinor) {
    throw new Error('iyzico_amount_mismatch');
  }

  const currency = clean(result.currency).toUpperCase();
  if (currency !== clean(params.expectedCurrency).toUpperCase()) {
    throw new Error('iyzico_currency_mismatch');
  }

  if (params.expectedBasketId && clean(result.basketId) !== params.expectedBasketId) {
    throw new Error('iyzico_basket_mismatch');
  }

  if (params.expectedConversationId && clean(result.conversationId) !== params.expectedConversationId) {
    throw new Error('iyzico_conversation_mismatch');
  }

  return {
    raw: result,
    paymentId: clean(result.paymentId) || token,
    paidPriceMinor,
    currency,
  };
}
