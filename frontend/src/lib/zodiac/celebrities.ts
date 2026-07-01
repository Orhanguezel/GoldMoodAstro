import type { ZodiacSign } from '@/types/common';

export type CelebrityZodiac = {
  name: string;
  sign: ZodiacSign;
  birthday: string;
  field: string;
  note: string;
};

export const CELEBRITY_ZODIAC: CelebrityZodiac[] = [
  { name: 'Mustafa Kemal Atat\u00fcrk', sign: 'taurus', birthday: 'May 19', field: 'Leadership', note: 'The earth element highlights determination, strategy and lasting impact.' },
  { name: 'Tarkan', sign: 'libra', birthday: 'October 17', field: 'Music', note: 'Libra emphasis is read through stage aesthetics, harmony and strong social magnetism.' },
  { name: 'Sezen Aksu', sign: 'cancer', birthday: 'July 13', field: 'Music', note: 'Cancer energy blends emotional memory, intuition and heartfelt storytelling.' },
  { name: 'Bar\u0131\u015f Man\u00e7o', sign: 'capricorn', birthday: 'January 2', field: 'Music', note: 'Capricorn themes carry productivity, discipline and the wish to leave a cross-generational mark.' },
  { name: 'Frida Kahlo', sign: 'cancer', birthday: 'July 6', field: 'Art', note: 'Cancer symbolism turns personal story into a powerful, protective and intense language.' },
  { name: 'Albert Einstein', sign: 'pisces', birthday: 'March 14', field: 'Science', note: 'Pisces energy is remembered through intuitive thinking, imagination and abstract connection.' },
  { name: 'Beyonce', sign: 'virgo', birthday: 'September 4', field: 'Music', note: 'Virgo emphasis makes detail, work discipline and the search for excellence visible.' },
  { name: 'Taylor Swift', sign: 'sagittarius', birthday: 'December 13', field: 'Music', note: 'Sagittarius themes amplify storytelling, freedom and the desire to connect with broad audiences.' },
  { name: 'Rihanna', sign: 'pisces', birthday: 'February 20', field: 'Music / Enterprise', note: 'Pisces nature brings creativity, intuition and the ability to merge different fields fluidly.' },
  { name: 'Leonardo DiCaprio', sign: 'scorpio', birthday: 'November 11', field: 'Cinema', note: 'Scorpio intensity supports transformation, depth and attraction to powerful characters.' },
  { name: 'Madonna', sign: 'leo', birthday: 'August 16', field: 'Music', note: 'Leo energy shines through stage presence, bold expression and the power to reinvent the self.' },
  { name: 'Steve Jobs', sign: 'pisces', birthday: 'February 24', field: 'Technology', note: 'Pisces intuition emphasizes vision, simplification and turning abstract ideas into experience.' },
];

export function getCelebritiesBySign(sign: ZodiacSign, limit = 4): CelebrityZodiac[] {
  return CELEBRITY_ZODIAC.filter((item) => item.sign === sign).slice(0, limit);
}
