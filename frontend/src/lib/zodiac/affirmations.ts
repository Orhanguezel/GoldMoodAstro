import { ZODIAC_META } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';

type ZodiacAffirmationContent = {
  title: string;
  focus: string;
  meditation: string;
  affirmations: string[];
};

const focusBySign: Record<ZodiacSign, string> = {
  aries: 'cesaretini dengeli bir başlangıca dönüştürmek',
  taurus: 'bedenini sakinleştirip güven duygunu güçlendirmek',
  gemini: 'zihnindeki dağınıklığı merak ve netlikle toplamak',
  cancer: 'duygusal alanını koruyarak iç sesini duymak',
  leo: 'kalbini görünür kılıp yaratıcı gücünü hatırlamak',
  virgo: 'detayları yumuşatıp faydalı olana odaklanmak',
  libra: 'denge, ilişki ve iç uyumu aynı merkezde buluşturmak',
  scorpio: 'yoğun duyguyu dönüşüm ve iç güçle taşımak',
  sagittarius: 'ufkunu genişletirken bugünkü adımını seçmek',
  capricorn: 'sorumluluğu sakin bir kararlılıkla yapılandırmak',
  aquarius: 'özgün fikrini topluluk bilinciyle dengelemek',
  pisces: 'sezgini toparlayıp şefkatli sınırlar kurmak',
};

const elementBreath = {
  Ateş: 'Nefes alırken göğsünde sıcak, canlı bir ışık büyüsün; verirken aceleyi bırak.',
  Toprak: 'Nefes alırken ayaklarının zemine yerleştiğini hisset; verirken bedendeki ağırlığı yumuşat.',
  Hava: 'Nefes alırken zihnine ferah bir açıklık gelsin; verirken düşüncelerin arasındaki gerginliği bırak.',
  Su: 'Nefes alırken duygularına nazikçe alan aç; verirken tuttuğun yüklerin akmasına izin ver.',
} as const;

export function getZodiacAffirmationContent(sign: ZodiacSign): ZodiacAffirmationContent {
  const meta = ZODIAC_META[sign];
  const focus = focusBySign[sign];

  return {
    title: `${meta.label} burcu için kısa meditasyon`,
    focus,
    meditation: [
      `Rahat bir pozisyon al ve üç yavaş nefesle ${meta.label} enerjine dön.`,
      elementBreath[meta.element],
      `${meta.ruler} sembolünün temsil ettiği yönü hatırla ve bugün ${focus} için küçük bir niyet belirle.`,
      'Son nefeste omuzlarını serbest bırak; seçtiğin niyeti günün içinde bir davranışa dönüştür.',
    ].join(' '),
    affirmations: [
      `${meta.label} enerjimi bilinçli ve dengeli şekilde kullanıyorum.`,
      `${meta.element} elementimin gücü bana bugün netlik ve destek veriyor.`,
      `${meta.modality} niteliğimle doğru zamanda doğru adımı seçiyorum.`,
      `Kendi ritmime saygı duyuyor, iç sesimi sakinlikle dinliyorum.`,
    ],
  };
}
