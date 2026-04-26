// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/[id]/page.tsx
// Admin Booking Detail Page (create/edit)
// =============================================================

import AdminBookingsDetailClient from '../admin-bookings-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBookingsDetailClient id={id} />;
}

