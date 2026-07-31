import { ZODIAC_META, localizeSign } from '@/lib/zodiac/signs';
import type { ZodiacSign } from '@/types/common';

type ZodiacAffirmationContent = {
  title: string;
  focus: string;
  meditation: string;
  affirmations: string[];
};

const focusBySign: Record<ZodiacSign, string> = {
  aries: 'turning courage into a balanced beginning',
  taurus: 'calming the body and strengthening trust',
  gemini: 'gathering scattered thoughts with curiosity and clarity',
  cancer: 'protecting emotional space while hearing the inner voice',
  leo: 'letting the heart be seen and remembering creative power',
  virgo: 'softening details and focusing on what is useful',
  libra: 'bringing balance, relationship and inner harmony together',
  scorpio: 'holding intense emotion with transformation and inner strength',
  sagittarius: 'expanding the horizon while choosing today step',
  capricorn: 'structuring responsibility with calm determination',
  aquarius: 'balancing original ideas with community awareness',
  pisces: 'organizing intuition and setting compassionate boundaries',
};

const focusBySignTr: Record<ZodiacSign, string> = {
  aries: 'cesareti dengeli bir başlangıca dönüştürmek',
  taurus: 'bedeni sakinleştirip güveni güçlendirmek',
  gemini: 'dağınık düşünceleri merak ve açıklıkla toplamak',
  cancer: 'iç sesi dinlerken duygusal alanı korumak',
  leo: 'kalbin görünmesine izin verip yaratıcı gücü hatırlamak',
  virgo: 'ayrıntıları yumuşatıp faydalı olana odaklanmak',
  libra: 'dengeyi, ilişkiyi ve iç uyumu buluşturmak',
  scorpio: 'yoğun duyguyu dönüşüm ve iç güçle taşımak',
  sagittarius: 'ufku genişletirken bugünün adımını seçmek',
  capricorn: 'sorumluluğu sakin kararlılıkla yapılandırmak',
  aquarius: 'özgün fikirleri topluluk bilinciyle dengelemek',
  pisces: 'sezgiyi düzenleyip şefkatli sınırlar kurmak',
};

const focusBySignDe: Record<ZodiacSign, string> = {
  aries: 'Mut in einen ausgewogenen Anfang zu verwandeln',
  taurus: 'den Körper zu beruhigen und Vertrauen zu stärken',
  gemini: 'verstreute Gedanken mit Neugier und Klarheit zu sammeln',
  cancer: 'den emotionalen Raum zu schützen und der inneren Stimme zuzuhören',
  leo: 'das Herz sichtbar werden zu lassen und kreative Kraft zu erinnern',
  virgo: 'Details loszulassen und sich auf das Hilfreiche zu konzentrieren',
  libra: 'Balance, Beziehung und innere Harmonie zu verbinden',
  scorpio: 'intensive Gefühle mit Wandlung und innerer Stärke zu halten',
  sagittarius: 'den Horizont zu erweitern und den heutigen Schritt zu wählen',
  capricorn: 'Verantwortung mit ruhiger Entschlossenheit zu strukturieren',
  aquarius: 'originelle Ideen mit Gemeinschaftssinn auszubalancieren',
  pisces: 'Intuition zu ordnen und mitfühlende Grenzen zu setzen',
};

const elementBreath = {
  Ate\u015f: 'As you inhale, let a warm living light expand in your chest; as you exhale, release urgency.',
  Toprak: 'As you inhale, feel your feet settle into the ground; as you exhale, soften heaviness in the body.',
  Hava: 'As you inhale, invite spacious clarity into the mind; as you exhale, release tension between thoughts.',
  Su: 'As you inhale, make gentle room for your feelings; as you exhale, let what you hold begin to flow.',
} as const;

const elementBreathTr: Record<string, string> = {
  Ateş: 'Nefes alırken göğsünde sıcak ve canlı bir ışığın genişlediğini hisset; verirken aceleyi bırak.',
  Toprak: 'Nefes alırken ayaklarının zemine yerleştiğini hisset; verirken bedendeki ağırlığı yumuşat.',
  Hava: 'Nefes alırken zihnine ferah bir açıklık davet et; verirken düşünceler arasındaki gerilimi bırak.',
  Su: 'Nefes alırken duygularına nazikçe alan aç; verirken tuttuklarının akmasına izin ver.',
};

const elementBreathDe: Record<string, string> = {
  Feuer: 'Lass beim Einatmen warmes, lebendiges Licht in deiner Brust wachsen und beim Ausatmen die Eile los.',
  Erde: 'Spüre beim Einatmen, wie deine Füße Halt finden, und lass beim Ausatmen Schwere aus dem Körper weichen.',
  Luft: 'Lade beim Einatmen Weite und Klarheit in den Geist ein und löse beim Ausatmen die Spannung zwischen Gedanken.',
  Wasser: 'Gib deinen Gefühlen beim Einatmen sanft Raum und lass beim Ausatmen das Festgehaltene ins Fließen kommen.',
};

export function getZodiacAffirmationContent(sign: ZodiacSign, locale = 'en'): ZodiacAffirmationContent {
  const meta = ZODIAC_META[sign];
  const localized = localizeSign(meta, locale);
  const lang = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : 'en';
  const focus = lang === 'tr' ? focusBySignTr[sign] : lang === 'de' ? focusBySignDe[sign] : focusBySign[sign];

  if (lang === 'tr') {
    return {
      title: `${localized.label} için kısa meditasyon`,
      focus,
      meditation: [
        `Rahat bir pozisyon bul ve üç yavaş nefesle ${localized.label} enerjine dön.`,
        elementBreathTr[localized.element],
        `${localized.ruler} tarafından temsil edilen niteliği hatırla ve bugün ${focus} için küçük bir niyet belirle.`,
        'Son nefeste omuzlarını serbest bırak ve seçtiğin niyeti gün içinde tek bir somut adıma dönüştür.',
      ].join(' '),
      affirmations: [
        `${localized.label} enerjimi farkındalık ve dengeyle kullanıyorum.`,
        `${localized.element} elementimin gücü bugün bana açıklık ve destek veriyor.`,
        `${localized.modality} niteliğimle doğru zamanda doğru adımı seçiyorum.`,
        'Kendi ritmime saygı duyuyor ve iç sesimi sakince dinliyorum.',
      ],
    };
  }

  if (lang === 'de') {
    return {
      title: `Kurze Meditation für ${localized.label}`,
      focus,
      meditation: [
        `Finde eine bequeme Haltung und kehre mit drei langsamen Atemzügen zu deiner ${localized.label}-Energie zurück.`,
        elementBreathDe[localized.element],
        `Erinnere dich an die von ${localized.ruler} verkörperte Qualität und setze heute eine kleine Absicht, um ${focus}.`,
        'Löse mit dem letzten Atemzug deine Schultern und verwandle deine Absicht heute in eine konkrete Handlung.',
      ].join(' '),
      affirmations: [
        `Ich nutze meine ${localized.label}-Energie bewusst und ausgewogen.`,
        `Die Kraft meines Elements ${localized.element} schenkt mir heute Klarheit und Halt.`,
        `Mit meiner ${localized.modality}-Qualität wähle ich den richtigen Schritt zur richtigen Zeit.`,
        'Ich achte meinen eigenen Rhythmus und höre ruhig auf meine innere Stimme.',
      ],
    };
  }

  return {
    title: `Short meditation for ${localized.label}`,
    focus,
    meditation: [
      `Find a comfortable position and return to your ${localized.label} energy with three slow breaths.`,
      elementBreath[meta.element],
      `Remember the quality represented by ${localized.ruler} and set a small intention today for ${focus}.`,
      'On the final breath, release your shoulders and turn the chosen intention into one action during the day.',
    ].join(' '),
    affirmations: [
      `I use my ${localized.label} energy with awareness and balance.`,
      `The strength of my ${localized.element} element gives me clarity and support today.`,
      `With my ${localized.modality} quality, I choose the right step at the right time.`,
      `I respect my own rhythm and listen calmly to my inner voice.`,
    ],
  };
}
