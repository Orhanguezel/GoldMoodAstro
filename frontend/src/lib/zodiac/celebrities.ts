import type { ZodiacSign } from '@/types/common';

/** tr/en/de metin. 2026-07-20: bu alanlar duz Ingilizce string'di ve
 *  Turkce/Almanca sayfada da Ingilizce goruntuleniyordu. */
export type LocalizedText = { tr: string; en: string; de: string };

export type CelebrityZodiac = {
  name: string;
  sign: ZodiacSign;
  birthday: LocalizedText;
  field: LocalizedText;
  note: LocalizedText;
};

/** Locale'e gore metin sec (bilinmeyen locale -> en). */
export function ct(v: LocalizedText, locale: string): string {
  return (v as Record<string, string>)[locale] ?? v.en;
}

export const CELEBRITY_ZODIAC: CelebrityZodiac[] = [
  { name: 'Mustafa Kemal Atat\u00fcrk', sign: 'taurus', birthday: { tr: '19 Mayıs', en: 'May 19', de: '19. Mai' }, field: { tr: 'Liderlik', en: 'Leadership', de: 'Führung' }, note: { tr: 'Toprak elementi kararlılığı, stratejiyi ve kalıcı etkiyi öne çıkarır.', en: 'The earth element highlights determination, strategy and lasting impact.', de: 'Das Erdelement betont Entschlossenheit, Strategie und bleibende Wirkung.' } },
  { name: 'Tarkan', sign: 'libra', birthday: { tr: '17 Ekim', en: 'October 17', de: '17. Oktober' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Terazi vurgusu sahne estetiği, uyum ve güçlü sosyal çekim üzerinden okunur.', en: 'Libra emphasis is read through stage aesthetics, harmony and strong social magnetism.', de: 'Die Waage-Betonung zeigt sich in Bühnenästhetik, Harmonie und starker sozialer Anziehung.' } },
  { name: 'Sezen Aksu', sign: 'cancer', birthday: { tr: '13 Temmuz', en: 'July 13', de: '13. Juli' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Yengeç enerjisi duygusal hafızayı, sezgiyi ve içten hikâye anlatımını harmanlar.', en: 'Cancer energy blends emotional memory, intuition and heartfelt storytelling.', de: 'Die Krebs-Energie verbindet emotionales Gedächtnis, Intuition und aufrichtiges Erzählen.' } },
  { name: 'Bar\u0131\u015f Man\u00e7o', sign: 'capricorn', birthday: { tr: '2 Ocak', en: 'January 2', de: '2. Januar' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Oğlak temaları üretkenliği, disiplini ve kuşaklar boyu iz bırakma isteğini taşır.', en: 'Capricorn themes carry productivity, discipline and the wish to leave a cross-generational mark.', de: 'Steinbock-Themen tragen Produktivität, Disziplin und den Wunsch, generationenübergreifend Spuren zu hinterlassen.' } },
  { name: 'Frida Kahlo', sign: 'cancer', birthday: { tr: '6 Temmuz', en: 'July 6', de: '6. Juli' }, field: { tr: 'Sanat', en: 'Art', de: 'Kunst' }, note: { tr: 'Yengeç sembolizmi kişisel hikâyeyi güçlü, koruyucu ve yoğun bir dile dönüştürür.', en: 'Cancer symbolism turns personal story into a powerful, protective and intense language.', de: 'Die Krebs-Symbolik verwandelt die persönliche Geschichte in eine kraftvolle, schützende und intensive Sprache.' } },
  { name: 'Albert Einstein', sign: 'pisces', birthday: { tr: '14 Mart', en: 'March 14', de: '14. März' }, field: { tr: 'Bilim', en: 'Science', de: 'Wissenschaft' }, note: { tr: 'Balık enerjisi sezgisel düşünme, hayal gücü ve soyut bağ kurma ile hatırlanır.', en: 'Pisces energy is remembered through intuitive thinking, imagination and abstract connection.', de: 'Die Fische-Energie bleibt durch intuitives Denken, Vorstellungskraft und abstrakte Verbindung in Erinnerung.' } },
  { name: 'Beyonce', sign: 'virgo', birthday: { tr: '4 Eylül', en: 'September 4', de: '4. September' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Başak vurgusu detayı, iş disiplinini ve mükemmellik arayışını görünür kılar.', en: 'Virgo emphasis makes detail, work discipline and the search for excellence visible.', de: 'Die Jungfrau-Betonung macht Detail, Arbeitsdisziplin und das Streben nach Exzellenz sichtbar.' } },
  { name: 'Taylor Swift', sign: 'sagittarius', birthday: { tr: '13 Aralık', en: 'December 13', de: '13. Dezember' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Yay temaları hikâye anlatıcılığını, özgürlüğü ve geniş kitlelerle bağ kurma arzusunu güçlendirir.', en: 'Sagittarius themes amplify storytelling, freedom and the desire to connect with broad audiences.', de: 'Schütze-Themen verstärken Erzählkunst, Freiheit und den Wunsch, ein breites Publikum zu erreichen.' } },
  { name: 'Rihanna', sign: 'pisces', birthday: { tr: '20 Şubat', en: 'February 20', de: '20. Februar' }, field: { tr: 'Müzik / Girişimcilik', en: 'Music / Enterprise', de: 'Musik / Unternehmertum' }, note: { tr: 'Balık doğası yaratıcılığı, sezgiyi ve farklı alanları akışkan biçimde birleştirme becerisini getirir.', en: 'Pisces nature brings creativity, intuition and the ability to merge different fields fluidly.', de: 'Die Fische-Natur bringt Kreativität, Intuition und die Fähigkeit, verschiedene Felder fließend zu verbinden.' } },
  { name: 'Leonardo DiCaprio', sign: 'scorpio', birthday: { tr: '11 Kasım', en: 'November 11', de: '11. November' }, field: { tr: 'Sinema', en: 'Cinema', de: 'Film' }, note: { tr: 'Akrep yoğunluğu dönüşümü, derinliği ve güçlü karakterlere ilgiyi destekler.', en: 'Scorpio intensity supports transformation, depth and attraction to powerful characters.', de: 'Die Skorpion-Intensität unterstützt Wandlung, Tiefe und die Anziehung zu starken Charakteren.' } },
  { name: 'Madonna', sign: 'leo', birthday: { tr: '16 Ağustos', en: 'August 16', de: '16. August' }, field: { tr: 'Müzik', en: 'Music', de: 'Musik' }, note: { tr: 'Aslan enerjisi sahne varlığı, cesur ifade ve kendini yeniden yaratma gücüyle parlar.', en: 'Leo energy shines through stage presence, bold expression and the power to reinvent the self.', de: 'Die Löwen-Energie zeigt sich in Bühnenpräsenz, mutigem Ausdruck und der Kraft zur Neuerfindung.' } },
  { name: 'Steve Jobs', sign: 'pisces', birthday: { tr: '24 Şubat', en: 'February 24', de: '24. Februar' }, field: { tr: 'Teknoloji', en: 'Technology', de: 'Technologie' }, note: { tr: 'Balık sezgisi vizyonu, sadeleştirmeyi ve soyut fikirleri deneyime dönüştürmeyi öne çıkarır.', en: 'Pisces intuition emphasizes vision, simplification and turning abstract ideas into experience.', de: 'Die Fische-Intuition betont Vision, Vereinfachung und das Verwandeln abstrakter Ideen in Erfahrung.' } },
];

export function getCelebritiesBySign(sign: ZodiacSign, limit = 4): CelebrityZodiac[] {
  return CELEBRITY_ZODIAC.filter((item) => item.sign === sign).slice(0, limit);
}
