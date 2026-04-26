// =============================================================
// FILE: src/app/(main)/admin/(admin)/reviews/[id]/page.tsx
// FINAL — Admin Review Detail/Edit Page
// =============================================================

import AdminReviewsDetailClient from '../_components/admin-reviews-detail-client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminReviewsDetailClient id={id} />;
}
