// Call sayfası fullscreen — Header/Footer'ı görsel olarak ört.
// Next.js layout'lar nested zincirli; parent ClientLayout'taki Header/Footer
// hâlâ DOM'da; biz fixed inset-0 overlay ile üstüne yerleştiriyoruz.
import type React from 'react';

export default function CallLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-(--gm-bg) overflow-y-auto">
      {children}
    </div>
  );
}
