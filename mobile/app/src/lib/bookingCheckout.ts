import type { BookingCreateInput, BookingCreateResult } from '@/types';

type CheckoutDependencies = {
  createBooking: (input: BookingCreateInput) => Promise<BookingCreateResult>;
  createOrder: (bookingId: string) => Promise<{ order_id: string }>;
  initStripeCheckout: (orderId: string) => Promise<{ checkout_url: string }>;
};

/** The server's booking status is the only authority for skipping payment. */
export async function startBookingCheckout(input: BookingCreateInput, deps: CheckoutDependencies) {
  const booking = await deps.createBooking(input);
  if (booking.status === 'confirmed') {
    return { kind: 'confirmed' as const, bookingId: booking.id };
  }

  const order = await deps.createOrder(booking.id);
  const checkout = await deps.initStripeCheckout(order.order_id);
  return {
    kind: 'payment' as const,
    orderId: order.order_id,
    checkoutUrl: checkout.checkout_url,
  };
}
