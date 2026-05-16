// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/page.tsx
// FINAL — Admin Site Settings Page (App Router)
// =============================================================

import { Suspense } from 'react';
import AdminSiteSettingsClient from './_components/admin-site_settings-client';

// AdminSiteSettingsClient useSearchParams() kullanıyor (?tab= derin-link) —
// App Router'da Suspense sınırı zorunlu, yoksa prerender/runtime hatası.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminSiteSettingsClient />
    </Suspense>
  );
}
