// Yerel (kullanıcı TZ) tarihini YYYY-MM-DD döndürür.
// new Date().toISOString().slice(0,10) UTC verir → TR (UTC+3) gece yarısına yakın
// bir önceki/sonraki günü gösterebilir. Bu helper yerel günü garanti eder.
export function todayLocalISO(date: Date = new Date()): string {
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}
