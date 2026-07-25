// Faz 1 minimal stub.
// ------------------------------------------------------------
// Ekosistem'in tam AI generator'u (haber->sosyal, X thread, YouTube, personal
// draft vb.) posts/templates/source-connectors/style modullerine baglidir; bunlar
// Faz 4'te tasinacak. Faz 1 (GA4 + Search Console) yalnizca marketing/routes.ts'in
// derlenmesi icin `generateGoogleAdsRsaCopy` imzasina ihtiyac duyar (Google Ads AI
// metin uretimi endpoint'i Faz 1 frontend'inde kullanilmaz). Gercek uygulama Faz 2'de.

export interface GoogleAdsRsaCopyResult {
  headlines: string[];
  longHeadlines: string[];
  descriptions: string[];
  businessName: string;
  model: string;
  provider: string;
}

export async function generateGoogleAdsRsaCopy(_input: {
  tenantKey: string;
  goal?: string | null;
  context?: string | null;
}): Promise<GoogleAdsRsaCopyResult> {
  throw new Error(
    "AI Google Ads reklam metni uretimi bu surumde devre disi (Faz 2'de aktiflesecek).",
  );
}
