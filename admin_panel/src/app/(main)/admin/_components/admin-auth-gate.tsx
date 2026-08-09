// =============================================================
// FILE: src/app/(main)/admin/dashboard/_components/admin-auth-gate.tsx
// FINAL — Admin Auth Gate (RTK status)
// - NO manual fetch
// - Redirects to /auth/login when not admin
// =============================================================

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useStatusQuery } from '@/integrations/hooks';
import type { AuthStatusResponse } from '@/integrations/shared';
import { normalizeMeFromStatus } from '@/integrations/shared';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // RTK GET /auth/status
  const q = useStatusQuery();

  const me = normalizeMeFromStatus(q.data as AuthStatusResponse | undefined);
  const isAdmin = me?.isAdmin === true;

  // SADECE ilk yükleme (henüz hiç veri yok). `isFetching` KULLANMA:
  // authStatus providesTags ['User','Auth'] ve 6 mutation bunları invalidate ediyor
  // → arka planda her tazelemede isFetching true oluyordu. Eskiden burada null
  // dönülüyordu, yani TÜM admin layout'u (sidebar + header + içerik) unmount olup
  // yeniden mount oluyordu: sidebar açık/kapalı durumu, scroll pozisyonu ve açık
  // diyaloglar sıfırlanıyor, ekran "git-gel" yapıyordu.
  const firstLoad = q.isUninitialized || q.isLoading;

  // Tazeleme bitmeden yetki kararı verme; 401/403 dışındaki geçici hatada
  // (ağ blip'i) kullanıcıyı login'e atma — elimizdeki son geçerli veriyle devam et.
  const settled = !firstLoad && !q.isFetching;
  const errStatus = (q.error as { status?: number } | undefined)?.status;
  const unauthorized = q.isError ? errStatus === 401 || errStatus === 403 : !isAdmin;

  React.useEffect(() => {
    if (settled && unauthorized) router.replace('/auth/login');
  }, [settled, unauthorized, router]);

  if (firstLoad) return null; // istersen burada spinner/skeleton bas

  // Yetkisizse yönlendirme efektini bekle, UI flash'ı olmasın. Arka plan
  // tazelemesi sürerken elimizde geçerli admin verisi varsa çocukları KORU.
  if (!isAdmin) return null;

  return <>{children}</>;
}
