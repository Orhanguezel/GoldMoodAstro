// packages/shared-backend/modules/numerology/logic.ts

const alphabet: Record<string, number> = {
  a: 1, j: 1, s: 1, ş: 1,
  b: 2, k: 2, t: 2,
  c: 3, ç: 3, l: 3, u: 3, ü: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, ö: 6, x: 6,
  g: 7, ğ: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, ı: 9, r: 9
};

const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];

function reduceNumber(num: number, keepMaster = true): number {
  if (keepMaster && (num === 11 || num === 22 || num === 33)) return num;
  if (num < 10) return num;
  const sum = String(num).split('').reduce((acc, digit) => acc + Number(digit), 0);
  return reduceNumber(sum, keepMaster);
}

export function calculateNumerology(fullName: string, birthDate: string) {
  const cleanName = fullName.toLowerCase().replace(/[^a-zçğıöşü]/g, '');
  const nameChars = cleanName.split('');
  
  // 1) Destiny Number (Kader Sayısı) - All letters
  const destinySum = nameChars.reduce((acc, char) => acc + (alphabet[char] || 0), 0);
  const destiny = reduceNumber(destinySum);

  // 2) Soul Urge (Ruh Güdüsü) - Vowels
  const soulUrgeSum = nameChars
    .filter(c => vowels.includes(c))
    .reduce((acc, char) => acc + (alphabet[char] || 0), 0);
  const soulUrge = reduceNumber(soulUrgeSum);

  // 3) Personality Number (Kişilik Sayısı) - Consonants
  const personalitySum = nameChars
    .filter(c => !vowels.includes(c))
    .reduce((acc, char) => acc + (alphabet[char] || 0), 0);
  const personality = reduceNumber(personalitySum);

  // 4) Life Path Number (Hayat Yolu) - Birth Date
  const dateDigits = birthDate.replace(/[^0-9]/g, '').split('').map(Number);
  const lifePathSum = dateDigits.reduce((acc, d) => acc + d, 0);
  const lifePath = reduceNumber(lifePathSum);

  return {
    lifePath,
    destiny,
    soulUrge,
    personality
  };
}
