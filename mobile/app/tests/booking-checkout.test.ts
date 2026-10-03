import { expect, test } from 'bun:test';
import { startBookingCheckout } from '../src/lib/bookingCheckout';
import type { BookingCreateInput, BookingCreateResult } from '../src/types';

const input = {
  consultant_id: 'consultant',
  resource_id: 'resource',
  appointment_date: '2026-10-04',
  appointment_time: '12:00',
  session_duration: 30,
  session_price: '0', // A stale client preview must not waive a server-side price.
  withdrawal_consent: true,
} as BookingCreateInput;

test('server pending_payment proceeds to Stripe even when client price preview is zero', async () => {
  const calls: string[] = [];
  const result = await startBookingCheckout(input, {
    createBooking: async () => {
      calls.push('booking');
      return { id: 'booking-id', status: 'pending_payment' } as BookingCreateResult;
    },
    createOrder: async (bookingId) => {
      calls.push(`order:${bookingId}`);
      return { order_id: 'order-id' };
    },
    initStripeCheckout: async (orderId) => {
      calls.push(`stripe:${orderId}`);
      return { checkout_url: 'https://checkout.stripe.com/test' };
    },
  });

  expect(calls).toEqual(['booking', 'order:booking-id', 'stripe:order-id']);
  expect(result).toEqual({ kind: 'payment', orderId: 'order-id', checkoutUrl: 'https://checkout.stripe.com/test' });
});

test('server confirmed booking never creates an order', async () => {
  const result = await startBookingCheckout(input, {
    createBooking: async () => ({ id: 'free-booking', status: 'confirmed' }) as BookingCreateResult,
    createOrder: async () => { throw new Error('order must not be created'); },
    initStripeCheckout: async () => { throw new Error('Stripe must not be called'); },
  });

  expect(result).toEqual({ kind: 'confirmed', bookingId: 'free-booking' });
});
