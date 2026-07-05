export type HoroscopeSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'transit';
export type HoroscopeSource = 'llm' | 'astrolog_manual' | 'seed';

export type HoroscopeAdminDto = {
  id: string;
  period: HoroscopePeriod;
  period_start_date: string;
  sign: HoroscopeSign;
  locale: string;
  content: string;
  mood_score: number | null;
  lucky_number: number | null;
  lucky_color: string | null;
  source: HoroscopeSource;
  prompt_id: string | null;
  created_at: string;
  updated_at: string;
};

export type HoroscopeListParams = {
  sign?: HoroscopeSign | 'all';
  period?: HoroscopePeriod | 'all';
  date?: string;
  locale?: string;
  source?: HoroscopeSource | 'all';
  limit?: number;
  offset?: number;
};

export type HoroscopeListResponse = {
  items: HoroscopeAdminDto[];
  total: number;
};

export type HoroscopeUpdatePayload = {
  content?: string;
  mood_score?: number | null;
  lucky_number?: number | null;
  lucky_color?: string | null;
};

export type HoroscopeGeneratePayload = {
  sign: HoroscopeSign;
  period: HoroscopePeriod;
  locale: string;
  date?: string;
  force?: boolean;
};

export type HoroscopeGenerateResult = {
  generated: boolean;
  reason?: string;
  horoscope?: HoroscopeAdminDto | null;
};
