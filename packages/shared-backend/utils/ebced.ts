// packages/shared-backend/utils/ebced.ts

const EBCED_MAP: Record<string, number> = {
  'a': 1, 'e': 1, 'ı': 10, 'i': 10,
  'b': 2, 'p': 2,
  'c': 3, 'ç': 3, 'j': 3,
  'd': 4,
  'h': 8,
  'v': 6, 'o': 6, 'ö': 6, 'u': 6, 'ü': 6,
  'z': 7,
  't': 400,
  'y': 10,
  'k': 20, 'g': 1000, 'ğ': 1000,
  'l': 30,
  'm': 40,
  'n': 50,
  's': 60,
  'f': 80,
  'r': 200,
  'ş': 300,
};

// Ebced Kebir (Büyük Ebced) hesaplama
export function calculateEbced(text: string): number {
  const normalized = text.toLowerCase().replace(/[^a-zçğıöşü]/g, '');
  let total = 0;
  for (const char of normalized) {
    total += EBCED_MAP[char] || 0;
  }
  return total;
}

// Yıldızname sayısı (Mod 12)
// Ebced toplamı (Ad + Anne Adı) % 12
export function calculateYildiznameSign(nameEbced: number, motherNameEbced: number): number {
  const total = nameEbced + motherNameEbced;
  const result = total % 12;
  return result === 0 ? 12 : result;
}
