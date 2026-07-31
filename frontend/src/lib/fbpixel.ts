// Meta Pixel conversion helper. It is deliberately fail-safe: analytics must
// never interrupt registration, application, booking, or payment flows.
export function fbEvent(
  name: string,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as Window & {
      fbq?: (...args: unknown[]) => void;
      __analyticsConsentGranted?: boolean;
    };
    if (typeof w.fbq !== 'function' || w.__analyticsConsentGranted !== true) return;
    w.fbq('track', name, params, eventId ? { eventID: eventId } : undefined);
  } catch {
    // no-op
  }
}

export const metaEventId = {
  checkout: (bookingId: string) => `checkout_${bookingId}`,
  purchase: (orderId: string) => `purchase_${orderId}`,
  lead: (subjectId: string) => `lead_${subjectId}`,
  registration: (userId: string) => `reg_${userId}`,
};
