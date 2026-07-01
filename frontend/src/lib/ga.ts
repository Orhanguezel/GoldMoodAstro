// =============================================================
// FILE: src/lib/ga.ts
// goldmoodastro – GA4 conversion event helper
// -------------------------------------------------------------
// NOT: Bu, projenin iç telemetri sistemi (@/integrations/telemetry,
// backend /track) DEĞİLDİR. Burası Google Analytics 4'e (gtag.js)
// dönüşüm/key-event göndermek içindir. GA4 gtag, GTM yoksa
// AnalyticsScripts.tsx tarafından doğrudan yüklenir (window.gtag).
// =============================================================

/**
 * GA4'e bir event gönderir. gtag yoksa dataLayer'a push eder
 * (GTM senaryosu). Hiçbir durumda hata fırlatmaz.
 */
export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...params });
    }
  } catch {
    /* analytics asla akışı bozmamalı */
  }
}
