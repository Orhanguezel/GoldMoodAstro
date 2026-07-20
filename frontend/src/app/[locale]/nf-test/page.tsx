// GECICI TANI SAYFASI — notFound() durum kodu deneyi (2026-07-20).
// Veri cekimi yok, async yok, dogrudan notFound(). Amac: 404 uretiliyor mu?
import { notFound } from 'next/navigation';

export default function NfTestPage() {
  notFound();
}
