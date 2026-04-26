'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/admin-bookings-client.tsx
// FINAL — Admin Bookings
// =============================================================

import * as React from 'react';
import { useListBookingsAdminQuery } from '@/integrations/hooks';

import { BookingsHeader, type BookingsFilters } from './bookings-header';
import { BookingsList } from './bookings-list';

export default function AdminBookingsClient() {
  const [filters, setFilters] = React.useState<BookingsFilters>({
    q: '',
    status: 'all',
    is_read: 'all',
    appointment_date: '',
    resource_id: '',
  });

  const params = React.useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      is_read: filters.is_read === 'all' ? undefined : (filters.is_read === 'read' ? true : false),
      appointment_date: filters.appointment_date || undefined,
      resource_id: filters.resource_id || undefined,
      limit: 200,
    }),
    [filters],
  );

  const { data: bookings = [], isLoading, isFetching, refetch } = useListBookingsAdminQuery(params);
  const busy = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <BookingsHeader
        filters={filters}
        total={bookings.length}
        loading={busy}
        onFiltersChange={setFilters}
        onRefresh={refetch}
      />

      <BookingsList items={bookings} loading={busy} />
    </div>
  );
}
