// =============================================================
// FAZ 24 / T24-1 — Ebced (Türk-İslam yıldızname sayı sistemi)
// TR fonetik harf → Arapça karşılık → klasik ebced sayı
// =============================================================
// Klasik Ebced düzeni (ebced-i kebir):
// ا=1 ب=2 ج=3 د=4 ه=5 و=6 ز=7 ح=8 ط=9
// ي=10 ك=20 ل=30 م=40 ن=50 س=60 ع=70 ف=80 ص=90
// ق=100 ر=200 ش=300 ت=400 ث=500 خ=600 ذ=700 ض=800 ظ=900 غ=1000
//
// TR Latin → Arapça fonetik eşleme yaklaşımı:
// Türkçedeki harfin yakın Arapça karşılığını al, sayısını topla.
// (Bu MVP için pratik bir yaklaşım — derinleştirme astrolog/dilbilimci ile yapılır)
// =============================================================

const TR_TO_EBCED: Record<string, number> = {
  A: 1,    // ا
  B: 2,    // ب
  C: 3,    // ج (cim)
  Ç: 3,    // ج yakın
  D: 4,    // د
  E: 5,    // ه (he)
  F: 80,   // ف
  G: 1000, // غ (gayn) — alternatif: 3 (cim variant). Klasik ebcedde G=ğayn=1000.
  Ğ: 1000, // غ
  H: 8,    // ح
  I: 10,   // ي (yâ)
  İ: 10,   // ي
  J: 3,    // ج (yakın)
  K: 20,   // ك
  L: 30,   // ل
  M: 40,   // م
  N: 50,   // ن
  O: 70,   // ع (ayn)
  Ö: 70,   // ع
  P: 2,    // ب (be — Türkçede P/B fonetik yakın)
  Q: 100,  // ق (TR'de yok ama Arapça yazımda olur)
  R: 200,  // ر
  S: 60,   // س
  Ş: 300,  // ش
  T: 400,  // ت
  U: 6,    // و (vav)
  Ü: 6,    // و
  V: 6,    // و
  W: 6,    // و (TR'de yok ama yabancı isim için)
  X: 600,  // خ (ha — yabancı X için)
  Y: 10,   // ي (yâ)
  Z: 7,    // ز
};

/** TR string'i normalize et: harfleri büyük yap, harf olmayanları temizle */
function normalize(s: string): string {
  return String(s ?? '')
    .toLocaleUpperCase('tr-TR')
    .replace(/[^A-ZÇĞİÖŞÜ]/g, ''); // yalnız harfler
}

/** TR string'in ebced toplamı */
export function ebcedOfText(text: string): number {
  const norm = normalize(text);
  let total = 0;
  for (const ch of norm) {
    total += TR_TO_EBCED[ch] ?? 0;
  }
  return total;
}

/** Yıldızname sayısı: ad + anne adı (+ doğum yılı) ebced toplamı.
 *  Doğum yılı eklenirse menzile dağılım daha kişiselleşir. */
export function computeYildiznameNumber(args: {
  name: string;
  motherName: string;
  birthYear?: number;
}): number {
  const a = ebcedOfText(args.name);
  const b = ebcedOfText(args.motherName);
  const c = Number.isFinite(args.birthYear) ? Number(args.birthYear) : 0;
  return a + b + c;
}

/** Sayı → 1..28 arası menzil numarası */
export function menzilNumberOf(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 1;
  const mod = total % 28;
  return mod === 0 ? 28 : mod;
}
