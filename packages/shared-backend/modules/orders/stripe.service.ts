// =============================================================
// FILE: src/modules/orders/stripe.service.ts
//
// Stripe Checkout Session üretimi — SDK'sız (webhook.ts ile aynı yaklaşım:
// tek bağımlılık = fetch; sürüm/bundle riski yok).
//
// Fail-closed: STRIPE_SECRET_KEY yoksa hiçbir oturum üretilmez.
// Sipariş eşleşmesi `client_reference_id = order.id` ile kurulur; webhook bunu
// okuyup completePaidOrder()'ı çağırır. metadata'ya da yazılır (panelden okunur).
// =============================================================

const STRIPE_API = 'https://api.stripe.com/v1';

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('stripe_not_configured');
  }
}

function secretKey(): string {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) throw new StripeNotConfiguredError();
  return key;
}

/** Stripe form-encoded gövde ister; iç içe alanları a[b][c] biçimine çevirir. */
function toForm(obj: Record<string, unknown>, prefix = ''): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) {
      parts.push(...toForm(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          parts.push(...toForm(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts;
}

async function stripePost(path: string, payload: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: toForm(payload).join('&'),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg = body?.error?.message || `stripe_http_${res.status}`;
    const err = new Error(msg);
    (err as any).statusCode = res.status;
    throw err;
  }
  return body;
}

export interface CreateCheckoutArgs {
  orderId: string;
  orderNumber: string;
  amount: number;            // majör birim (12.34)
  currency: string;          // 'TRY' | 'EUR' ...
  productName: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
  locale?: string;
  metadata?: Record<string, string>;
}

// PayPal, Stripe Checkout'ta yalnız bu para birimlerinde sunulabilir (Stripe'ın
// PayPal desteklediği presentment currency listesi). TRY listede YOK — TRY fiyatlı
// bir oturumda PayPal istenirse Stripe 400 döner, o yüzden koşullu ekliyoruz.
const PAYPAL_CURRENCIES = new Set([
  'EUR', 'GBP', 'USD', 'CHF', 'CZK', 'DKK', 'NOK', 'PLN', 'SEK',
  'AUD', 'CAD', 'HKD', 'NZD', 'SGD',
]);

/** Bu para biriminde PayPal sunulabilir mi? (Dashboard'da etkin olması ayrıca gerekir.) */
export function paypalSupportsCurrency(currency: string): boolean {
  return PAYPAL_CURRENCIES.has(String(currency || '').toUpperCase());
}

export async function createCheckoutSession(args: CreateCheckoutArgs): Promise<{ id: string; url: string }> {
  const unitAmount = Math.round(Number(args.amount) * 100);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) throw new Error('invalid_amount');

  const payload: Record<string, unknown> = {
    mode: 'payment',
    client_reference_id: args.orderId,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(args.currency || 'TRY').toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: args.productName },
        },
      },
    ],
    metadata: {
      order_id: args.orderId,
      order_number: args.orderNumber,
      ...(args.metadata ?? {}),
    },
    // Ödeme nesnesine de taşı: dispute/refund incelemesinde Stripe panelinde görünür.
    payment_intent_data: {
      metadata: { order_id: args.orderId, order_number: args.orderNumber },
    },
  };
  if (args.customerEmail) payload.customer_email = args.customerEmail;
  // Stripe 'tr' desteklerken bilinmeyen locale 400 verir → sadece bilinenleri geç.
  const loc = String(args.locale || '').slice(0, 2).toLowerCase();
  if (['tr', 'en', 'de'].includes(loc)) payload.locale = loc;

  // PayPal'ı açıkça iste: Dashboard'daki otomatik yöntemler bazı hesaplarda
  // PayPal'ı göstermiyor. Uygun para biriminde 'card' + 'paypal' geçeriz;
  // PayPal hesapta etkin değilse Stripe 400 döner → kart-only ile TEKRAR
  // deneriz, yani ödeme akışı yapılandırma eksiğinde kilitlenmez.
  const wantsPaypal = paypalSupportsCurrency(args.currency) && process.env.STRIPE_DISABLE_PAYPAL !== '1';
  if (wantsPaypal) {
    try {
      const s = await stripePost('/checkout/sessions', { ...payload, payment_method_types: ['card', 'paypal'] });
      return { id: String(s.id), url: String(s.url) };
    } catch (err) {
      const status = Number((err as any)?.statusCode ?? 0);
      if (status !== 400) throw err;
      // 400 = "paypal etkin değil / bu para biriminde sunulamıyor" → sessizce karta düş.
    }
  }

  const session = await stripePost('/checkout/sessions', payload);
  return { id: String(session.id), url: String(session.url) };
}

/** Stripe iadesi — refund akışı provider-aware olduğunda kullanılır. */
export async function refundPaymentIntent(paymentIntentId: string, amountMinor?: number): Promise<any> {
  const payload: Record<string, unknown> = { payment_intent: paymentIntentId };
  if (typeof amountMinor === 'number' && amountMinor > 0) payload.amount = amountMinor;
  return stripePost('/refunds', payload);
}

export function isStripeConfigured(): boolean {
  return Boolean(String(process.env.STRIPE_SECRET_KEY || '').trim());
}
