/**
 * OG gorselleri (next/og + satori) icin font yukleyici.
 *
 * ⚠️ BURAYA VARIABLE FONT KOYMA. Satori variable font ayristiramaz; TTF gecerli
 * olsa bile su hatayla TUM OG route'lari 502 verir:
 *
 *   TypeError: Cannot read properties of undefined (reading '258')
 *     at Object.parse ... at g_.addFonts
 *
 * Cinzel-Bold.ttf (wght ekseni) ve Fraunces-Italic.ttf (opsz/wght/SOFT/WONK)
 * variable idi ve canlida tam olarak buna yol acti (2026-07-18). Cozum: fonttools
 * ile sabitlenmis statik ornekler:
 *
 *   Cinzel   -> wght=700
 *   Fraunces -> wght=400, opsz=14, SOFT=0, WONK=0
 *
 * Font degistirilecekse once 'fvar' tablosunun OLMADIGI dogrulanmali:
 *   python3 -c "from fontTools.ttLib import TTFont; print('fvar' in TTFont('X.ttf'))"
 */
export async function getOgFonts() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goldmoodastro.com';

  const [cinzelData, frauncesData] = await Promise.all([
    fetch(`${baseUrl}/fonts/Cinzel-Bold-static.ttf`).then((res) => res.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Fraunces-Italic-static.ttf`).then((res) => res.arrayBuffer()),
  ]);

  return [
    {
      name: 'Cinzel',
      data: cinzelData,
      style: 'normal' as const,
      weight: 700 as const,
    },
    {
      name: 'Fraunces',
      data: frauncesData,
      style: 'italic' as const,
      weight: 400 as const,
    },
  ];
}
