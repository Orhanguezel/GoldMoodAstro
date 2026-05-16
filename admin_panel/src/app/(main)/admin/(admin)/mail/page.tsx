'use client';
// =============================================================
// FILE: src/app/(main)/admin/(admin)/mail/page.tsx
// E-posta (SMTP) Ayarları — dedike sayfa. Mantık tekrarı YOK:
// site-settings'teki SmtpSettingsTab bileşeni yeniden kullanılır.
// 'use client': SmtpSettingsTab'te 'use client' yok, RTK/useState kullanır —
// client sınırı burada kurulur (server page'den render edilemez).
// =============================================================

import { SmtpSettingsTab } from '../site-settings/tabs/smtp-settings-tab';

export default function MailSettingsPage() {
  // locale prop yalnız UI rozeti içindir; SMTP ayarları GLOBAL.
  return <SmtpSettingsTab locale="tr" />;
}
