// =============================================================
// FILE: modules/_shared/plainText.ts
//
// HTML -> DÜZ METİN. Serbest metin alanlarının (danışman biyografisi gibi)
// veritabanına DÜZ METİN olarak girmesini garanti eder.
//
// NEDEN VAR: danışman panelindeki "Kendimi anlat" alanı zengin metin editörü
// kullanıyordu ve HTML üretiyordu; public danışman sayfası ise aynı alanı
// {consultant.bio} diye basıyor — React kaçırdığı için ziyaretçi ekranda
// "<div>...</div>" ve "&nbsp;" görüyordu (2026-08-18, Elif Demirtaş profili).
//
// Düzeltmeyi GÖRÜNTÜLEME tarafına değil YAZMA tarafına koyduk, çünkü bio tek
// bir yerde kullanılmıyor: meta description, JSON-LD description, danışman
// kartları, mobil uygulama ve içerik moderasyonu hep aynı alanı okuyor. Her
// tüketiciye ayrı ayrı HTML çözme eklemek er ya da geç birini atlar; alanın
// kendisini düz metin tutmak sorunu yapısal olarak bitirir.
// =============================================================

const BLOCK_TAGS = /<\/?(?:div|p|br|li|tr|h[1-6]|section|article|blockquote)\b[^>]*>/gi;

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
};

/**
 * HTML içerebilecek serbest metni düz metne çevirir.
 * - Blok etiketleri satır sonuna dönüşür (paragraf yapısı korunur).
 * - Kalan tüm etiketler atılır.
 * - Yaygın HTML varlıkları (&nbsp; gibi) çözülür.
 * - Üçten fazla ardışık boş satır ikiye indirilir; satır sonları trim'lenir.
 *
 * HTML içermeyen metni pratikte değiştirmez (yalnız fazla boşluğu toparlar).
 */
export function htmlToPlainText(input: string | null | undefined): string {
  if (!input) return '';
  let out = String(input);

  // script/style: ETİKETİ İLE BİRLİKTE İÇERİĞİ de atılır. Sadece etiketi
  // silmek "alert(1)" gibi kod parçasını biyografide düz metin olarak
  // bırakıyordu — zararsız ama çöp.
  out = out.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  // <br> ve blok etiketleri satır sonuna
  out = out.replace(BLOCK_TAGS, '\n');
  // kalan etiketler
  out = out.replace(/<[^>]+>/g, '');
  // varlıklar
  for (const [entity, char] of Object.entries(ENTITIES)) {
    out = out.split(entity).join(char);
  }
  // sayısal varlıklar (&#8217; gibi)
  out = out.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  // satır sonu normalizasyonu
  out = out.replace(/\r\n?/g, '\n');
  out = out
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

/** Metinde gerçekten HTML işaretlemesi var mı (uyarı/rapor için). */
export function looksLikeHtml(input: string | null | undefined): boolean {
  if (!input) return false;
  return /<[a-z][^>]*>/i.test(input) || /&(nbsp|amp|lt|gt|quot|#\d+);/i.test(input);
}
