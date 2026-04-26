// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/[id]/page.tsx
// FINAL — Admin Availability Detail (App Router)
// Route: /admin/availability/:id  (id: "new" | UUID)
// =============================================================

import AdminAvailabilityDetailClient from '../_components/admin-availability-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  return <AdminAvailabilityDetailClient id={p.id} />;
}
