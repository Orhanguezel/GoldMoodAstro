import type { BookingCreateInput, LoginInput, RegisterInput } from '@/types';

export const apiPaths = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    passwordResetRequest: '/auth/password-reset/request',
    passwordResetConfirm: '/auth/password-reset/confirm',
    me: '/auth/me',
  },
  bookings: {
    create: '/bookings',
    requestNow: '/bookings/request-now',
    mine: '/bookings/me',
  },
  orders: {
    create: '/orders',
    initIyzipay: (orderId: string) => `/orders/${orderId}/init-iyzico`,
  },
} as const;

export function buildLoginRequest(data: LoginInput) {
  return { path: apiPaths.auth.login, body: data };
}

export function buildRegisterRequest(data: RegisterInput) {
  return { path: apiPaths.auth.register, body: data };
}

export function buildMobilePasswordResetRequest(email: string) {
  return {
    path: apiPaths.auth.passwordResetRequest,
    body: { email, client: 'mobile' as const },
  };
}

export function buildBookingCreateRequest(data: BookingCreateInput) {
  return { path: apiPaths.bookings.create, body: data };
}

export function buildOrderForBookingRequest(bookingId: string) {
  return {
    path: apiPaths.orders.create,
    body: { booking_id: bookingId, payment_gateway_slug: 'iyzipay' as const },
  };
}
