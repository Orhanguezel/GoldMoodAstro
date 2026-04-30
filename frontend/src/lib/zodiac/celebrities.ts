import type { ZodiacSign } from '@/types/common';

export type CelebrityZodiac = {
  name: string;
  sign: ZodiacSign;
  birthday: string;
  field: string;
  note: string;
};

export const CELEBRITY_ZODIAC: CelebrityZodiac[] = [
  { name: 'Mustafa Kemal Atatürk', sign: 'taurus', birthday: '19 Mayıs', field: 'Liderlik', note: 'Toprak elementiyle kararlılık, strateji ve kalıcı etki teması öne çıkar.' },
  { name: 'Tarkan', sign: 'libra', birthday: '17 Ekim', field: 'Müzik', note: 'Terazi vurgusu sahne estetiği, uyum ve güçlü sosyal çekimle okunur.' },
  { name: 'Sezen Aksu', sign: 'cancer', birthday: '13 Temmuz', field: 'Müzik', note: 'Yengeç enerjisi duygu hafızası, sezgi ve içten anlatımla birleşir.' },
  { name: 'Barış Manço', sign: 'capricorn', birthday: '2 Ocak', field: 'Müzik', note: 'Oğlak teması üretkenlik, disiplin ve kuşaklar arası iz bırakma isteğini taşır.' },
  { name: 'Frida Kahlo', sign: 'cancer', birthday: '6 Temmuz', field: 'Sanat', note: 'Yengeç sembolizmi kişisel hikayeyi güçlü, koruyucu ve yoğun bir dile dönüştürür.' },
  { name: 'Albert Einstein', sign: 'pisces', birthday: '14 Mart', field: 'Bilim', note: 'Balık enerjisi sezgisel düşünme, hayal gücü ve soyut bağlantılar kurma becerisiyle anılır.' },
  { name: 'Beyonce', sign: 'virgo', birthday: '4 Eylül', field: 'Müzik', note: 'Başak vurgusu detay, çalışma disiplini ve kusursuzluk arayışını görünür kılar.' },
  { name: 'Taylor Swift', sign: 'sagittarius', birthday: '13 Aralık', field: 'Müzik', note: 'Yay teması anlatı kurma, özgürlük ve geniş kitlelerle bağ kurma arzusunu büyütür.' },
  { name: 'Rihanna', sign: 'pisces', birthday: '20 Şubat', field: 'Müzik / Girişim', note: 'Balık doğası yaratıcılık, sezgi ve farklı alanları akışkan biçimde birleştirme verir.' },
  { name: 'Leonardo DiCaprio', sign: 'scorpio', birthday: '11 Kasım', field: 'Sinema', note: 'Akrep yoğunluğu dönüşüm, derinlik ve güçlü karakterlere çekilme temalarını destekler.' },
  { name: 'Madonna', sign: 'leo', birthday: '16 Ağustos', field: 'Müzik', note: 'Aslan enerjisi sahne ışığı, cesur ifade ve kendini yeniden yaratma gücüyle parlar.' },
  { name: 'Steve Jobs', sign: 'pisces', birthday: '24 Şubat', field: 'Teknoloji', note: 'Balık sezgisi vizyon, sadeleştirme ve soyut fikri deneyime dönüştürme tarafını vurgular.' },
];

export function getCelebritiesBySign(sign: ZodiacSign, limit = 4): CelebrityZodiac[] {
  return CELEBRITY_ZODIAC.filter((item) => item.sign === sign).slice(0, limit);
}
