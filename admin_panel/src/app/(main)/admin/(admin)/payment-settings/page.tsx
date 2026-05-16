'use client';
// =============================================================
// FILE: src/app/(main)/admin/(admin)/payment-settings/page.tsx
// Ödeme Ayarları — dedike sayfa. Mantık tekrarı YOK: site-settings'teki
// ApiSettingsTab (Iyzipay/ödeme) bileşeni yeniden kullanılır.
// 'use client': tab bileşenleri RTK/useState kullanır — client sınırı şart.
// =============================================================

import { ApiSettingsTab } from '../site-settings/tabs/api-settings-tab';

export default function PaymentSettingsPage() {
  // locale prop yalnız UI rozeti içindir; ödeme ayarları GLOBAL.
  return <ApiSettingsTab locale="tr" />;
}
