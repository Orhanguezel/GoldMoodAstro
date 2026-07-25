// =============================================================
// FILE: src/app/(main)/admin/(admin)/marketing/page.tsx
// Pazarlama & Dönüşüm — birinci-taraf dashboard + hızlı linkler
//
// ⚠️ LAYOUT KURALI: admin/layout.tsx zaten padding + max-w-screen-2xl + mx-auto
// verir. Client kök wrapper'ına p-*/max-w-*/mx-auto EKLEME (çift padding = bozuk
// layout). Kök: <div className="space-y-10 pb-12 animate-in fade-in ...">.
// =============================================================
import MarketingClient from './_components/marketing-client';

export default function AdminMarketingPage() {
  return <MarketingClient />;
}
