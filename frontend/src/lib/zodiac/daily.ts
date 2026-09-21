export type DailyHoroscopeLike = {
  content?: unknown;
  contentTr?: unknown;
};

/** Yalnız gerçekten yayımlanmış bir günlük metin varsa SEO vaadi verilir. */
export function hasPublishedDailyHoroscope(value: DailyHoroscopeLike | null | undefined): boolean {
  const content = value?.contentTr ?? value?.content;
  return typeof content === 'string' && content.trim().length > 0;
}
