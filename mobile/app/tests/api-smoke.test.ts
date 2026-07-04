/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import {
  cacheKey,
  messageFromApiErrorBody,
  normalizeListResponse,
  unwrapData,
} from '../src/lib/apiUtils';
import {
  apiPaths,
  buildBookingCreateRequest,
  buildLoginRequest,
  buildMobilePasswordResetRequest,
  buildOrderForBookingRequest,
  buildRegisterRequest,
} from '../src/lib/apiContracts';
import { routeFromNotificationData } from '../src/lib/notificationRoutes';

describe('mobile API client helpers', () => {
  test('extracts API error messages from common backend shapes', () => {
    expect(messageFromApiErrorBody({ message: 'plain' })).toBe('plain');
    expect(messageFromApiErrorBody({ error: 'string error' })).toBe('string error');
    expect(messageFromApiErrorBody({ error: { message: 'nested' } })).toBe('nested');
    expect(messageFromApiErrorBody({ error: { code: 'NOPE' } })).toBeUndefined();
  });

  test('normalizes list envelopes used by public and dashboard endpoints', () => {
    expect(normalizeListResponse<string>(['a'])).toEqual(['a']);
    expect(normalizeListResponse<string>({ data: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(normalizeListResponse<string>({ items: ['c'] })).toEqual(['c']);
    expect(normalizeListResponse<string>({ data: { items: ['d'] } })).toEqual(['d']);
    expect(normalizeListResponse<string>({ data: null })).toEqual([]);
  });

  test('unwraps { data } envelopes without accepting unrelated shapes', () => {
    expect(unwrapData<{ id: string }>({ data: { id: 'row-1' } })).toEqual({ id: 'row-1' });
    expect(unwrapData({ items: [] })).toBeNull();
    expect(unwrapData(null)).toBeNull();
  });

  test('cache key is stable when params arrive in different orders', () => {
    const a = cacheKey('GET', '/consultants', { page: 2, minRating: 4 });
    const b = cacheKey('GET', '/consultants', { minRating: 4, page: 2 });
    expect(a).toBe(b);
  });
});

describe('mobile auth smoke contracts', () => {
  test('login and register use the expected mobile auth endpoints', () => {
    expect(buildLoginRequest({ email: 'user@example.com', password: 'secret' })).toEqual({
      path: apiPaths.auth.login,
      body: { email: 'user@example.com', password: 'secret' },
    });

    expect(buildRegisterRequest({
      email: 'new@example.com',
      password: 'secret',
      full_name: 'New User',
      rules_accepted: true,
    })).toEqual({
      path: apiPaths.auth.register,
      body: {
        email: 'new@example.com',
        password: 'secret',
        full_name: 'New User',
        rules_accepted: true,
      },
    });
  });

  test('password reset requests are tagged as mobile for deep-link email flow', () => {
    expect(buildMobilePasswordResetRequest('user@example.com')).toEqual({
      path: apiPaths.auth.passwordResetRequest,
      body: { email: 'user@example.com', client: 'mobile' },
    });
  });
});

describe('mobile booking and payment smoke contracts', () => {
  test('booking create preserves interval, service and media fields', () => {
    const booking = buildBookingCreateRequest({
      consultant_id: 'consultant-1',
      resource_id: 'resource-1',
      appointment_date: '2026-07-04',
      appointment_time: '14:30',
      session_duration: 45,
      session_price: '1200.00',
      media_type: 'video',
      service_id: 'service-1',
      customer_message: 'Hazirim',
    });

    expect(booking.path).toBe(apiPaths.bookings.create);
    expect(booking.body).toMatchObject({
      consultant_id: 'consultant-1',
      appointment_date: '2026-07-04',
      appointment_time: '14:30',
      session_duration: 45,
      media_type: 'video',
      service_id: 'service-1',
    });
  });

  test('booking payment starts with Iyzipay order contract', () => {
    expect(buildOrderForBookingRequest('booking-1')).toEqual({
      path: apiPaths.orders.create,
      body: { booking_id: 'booking-1', payment_gateway_slug: 'iyzipay' },
    });
    expect(apiPaths.orders.initIyzipay('order-1')).toBe('/orders/order-1/init-iyzico');
  });
});

describe('mobile push deep-link smoke contracts', () => {
  test('routes call and request-now notifications to the correct screens', () => {
    expect(routeFromNotificationData({ type: 'incoming_call', booking_id: 'booking-1' })).toBe('/call/booking-1');
    expect(routeFromNotificationData({ type: 'booking_reminder', bookingId: 'booking-2' })).toBe('/call/booking-2');
    expect(routeFromNotificationData({ type: 'booking_requested_now' })).toBe('/(consultant)/consultant/bookings');
  });

  test('routes engagement notifications to detail screens', () => {
    expect(routeFromNotificationData({ type: 'favorite_online', consultant_id: 'consultant-1' })).toBe('/consultant/consultant-1');
    expect(routeFromNotificationData({ type: 'media_message_reply' })).toBe('/media-messages');
    expect(routeFromNotificationData({ chat_thread_id: 'thread-1' })).toBe('/chat/thread-1');
  });

  test('keeps legacy booking and screen payloads working', () => {
    expect(routeFromNotificationData({ booking_id: 'booking-3' })).toBe('/booking/booking-3');
    expect(routeFromNotificationData({ screen: 'bookings' })).toBe('/(tabs)/bookings');
    expect(routeFromNotificationData({ screen: 'favorites' })).toBe('/(tabs)/favorites');
    expect(routeFromNotificationData({ screen: 'profile' })).toBe('/(tabs)/profile');
    expect(routeFromNotificationData({ type: 'unknown' })).toBeNull();
  });
});
