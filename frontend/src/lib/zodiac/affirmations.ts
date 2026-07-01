import { ZODIAC_META } from '@/lib/zodiac/signs';
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

const elementBreath = {
  Ate\u015f: 'As you inhale, let a warm living light expand in your chest; as you exhale, release urgency.',
  Toprak: 'As you inhale, feel your feet settle into the ground; as you exhale, soften heaviness in the body.',
  Hava: 'As you inhale, invite spacious clarity into the mind; as you exhale, release tension between thoughts.',
  Su: 'As you inhale, make gentle room for your feelings; as you exhale, let what you hold begin to flow.',
} as const;

export function getZodiacAffirmationContent(sign: ZodiacSign): ZodiacAffirmationContent {
  const meta = ZODIAC_META[sign];
  const focus = focusBySign[sign];

  return {
    title: `Short meditation for ${meta.label}`,
    focus,
    meditation: [
      `Find a comfortable position and return to your ${meta.label} energy with three slow breaths.`,
      elementBreath[meta.element],
      `Remember the quality represented by ${meta.ruler} and set a small intention today for ${focus}.`,
      'On the final breath, release your shoulders and turn the chosen intention into one action during the day.',
    ].join(' '),
    affirmations: [
      `I use my ${meta.label} energy with awareness and balance.`,
      `The strength of my ${meta.element} element gives me clarity and support today.`,
      `With my ${meta.modality} quality, I choose the right step at the right time.`,
      `I respect my own rhythm and listen calmly to my inner voice.`,
    ],
  };
}
