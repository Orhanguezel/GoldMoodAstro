export const PAYMENT_SUCCESS_PATTERNS = [
  '/siparis/basarili', '/booking/success', 'checkout=success', 'payment=success', 'status=success',
];

export const PAYMENT_FAILURE_PATTERNS = [
  '/sepet?payment=failed', '/sepet?payment=error', 'checkout=failed', 'payment=failed',
  'payment=error', 'status=failure', 'status=failed', 'status=cancelled',
];

export function classifyPaymentReturn(
  currentUrl: string,
  siteUrl: string,
  patterns: { success: string[]; failure: string[] },
): 'success' | 'failure' | null {
  try {
    const current = new URL(currentUrl);
    const site = new URL(siteUrl);
    const canonicalHost = (host: string) => host.replace(/^www\./, '');
    if (canonicalHost(current.hostname) !== canonicalHost(site.hostname)) return null;
    if (current.protocol !== site.protocol) return null;
    const path = `${current.pathname}${current.search}`;
    // The backend's Stripe return route uses status=cancelled. Keep this
    // contract even when an older admin setting omits the pattern.
    if (current.pathname.endsWith('/booking/payment') && current.searchParams.get('status') === 'cancelled') {
      return 'failure';
    }
    if (patterns.failure.some((pattern) => path.includes(pattern))) return 'failure';
    if (patterns.success.some((pattern) => path.includes(pattern))) return 'success';
  } catch {
    return null;
  }
  return null;
}
