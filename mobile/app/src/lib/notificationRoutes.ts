function pickString(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function routeFromNotificationData(data: Record<string, unknown>): string | null {
  const type = pickString(data, ['type', 'event', 'notification_type']);
  const screen = pickString(data, ['screen']);
  const bookingId = pickString(data, ['booking_id', 'bookingId']);
  const consultantId = pickString(data, ['consultant_id', 'consultantId']);
  const threadId = pickString(data, ['thread_id', 'threadId', 'chat_thread_id', 'chatThreadId']);

  if (type === 'incoming_call' && bookingId) return `/call/${bookingId}`;
  if (type === 'booking_reminder' && bookingId) return `/call/${bookingId}`;
  if (type === 'booking_requested_now') return '/(consultant)/consultant/bookings';
  if (type === 'favorite_online' && consultantId) return `/consultant/${consultantId}`;
  if (threadId) return `/chat/${threadId}`;
  if (type?.startsWith('media_message')) return '/media-messages';
  if (bookingId) return `/booking/${bookingId}`;
  if (screen === 'bookings') return '/(tabs)/bookings';
  if (screen === 'favorites') return '/(tabs)/favorites';
  if (screen === 'profile') return '/(tabs)/profile';
  return null;
}
