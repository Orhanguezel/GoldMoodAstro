import { redirect } from 'next/navigation';

// Danışman Başvuruları artık /admin/consultants "Bekleyenler" sekmesine taşındı.
// Eski linkler/bookmark'lar kırılmasın diye yönlendirilir.
export default function Page() {
  redirect('/admin/consultants');
}
