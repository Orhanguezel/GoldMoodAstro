/** Recover UTF-8 text when a native/network decoder has interpreted bytes as Latin-1. */
export function repairUtf8Mojibake(value: string | null | undefined): string {
  if (!value || !/[ÃÄÅ]/.test(value)) return value ?? '';

  const cp1252Bytes: Record<number, number> = {
    0x2021: 0x87, // ‡
    0x0178: 0x9f, // Ÿ
  };

  return value.replace(/[ÃÄÅ][\u0080-\u00ff\u0178\u2021]/g, (pair) => {
    const bytes = [...pair].map((char) => {
      const code = char.charCodeAt(0);
      return cp1252Bytes[code] ?? code;
    });
    try {
      return decodeURIComponent(bytes.map((byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''));
    } catch {
      return pair;
    }
  });
}
