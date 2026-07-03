// Kullanıcıya giden bildirim (notification + push) metinleri — alıcının diline göre.
// apiMessage request locale'ini kullanır; bildirimler ise ALICININ diline göre olmalı
// (booking.locale müşteri dilini taşır). Bu yüzden ayrı helper.

type Locale = 'tr' | 'en' | 'de';

export function pickLocale(locale: string | null | undefined): Locale {
  const l = String(locale ?? 'tr').toLowerCase().split(',')[0].split('-')[0];
  return l === 'en' || l === 'de' ? l : 'tr';
}

type Entry = { title: string; message: string };

const TABLE: Record<string, Record<Locale, Entry>> = {
  booking_approved_instant: {
    tr: { title: '✅ Anlık Görüşmeniz Onaylandı', message: 'Danışman talebinizi kabul etti. Hemen görüşmeye geçebilirsiniz.' },
    en: { title: '✅ Your Instant Session Is Approved', message: 'The consultant accepted your request. You can start the session now.' },
    de: { title: '✅ Deine Sofort-Sitzung ist bestätigt', message: 'Der Berater hat deine Anfrage angenommen. Du kannst die Sitzung jetzt starten.' },
  },
  booking_approved: {
    tr: { title: '✅ Randevunuz Onaylandı', message: '{date} {time} için randevunuz onaylandı.' },
    en: { title: '✅ Your Appointment Is Approved', message: 'Your appointment for {date} {time} has been approved.' },
    de: { title: '✅ Dein Termin ist bestätigt', message: 'Dein Termin für {date} {time} wurde bestätigt.' },
  },
  booking_rejected: {
    tr: { title: '❌ Randevunuz Reddedildi', message: 'Danışman randevu talebinizi reddetti.' },
    en: { title: '❌ Your Appointment Was Declined', message: 'The consultant declined your appointment request.' },
    de: { title: '❌ Dein Termin wurde abgelehnt', message: 'Der Berater hat deine Terminanfrage abgelehnt.' },
  },
  booking_rejected_reason: {
    tr: { title: '❌ Randevunuz Reddedildi', message: 'Danışman randevu talebinizi reddetti. Sebep: {reason}' },
    en: { title: '❌ Your Appointment Was Declined', message: 'The consultant declined your appointment request. Reason: {reason}' },
    de: { title: '❌ Dein Termin wurde abgelehnt', message: 'Der Berater hat deine Terminanfrage abgelehnt. Grund: {reason}' },
  },
  booking_cancelled: {
    tr: { title: 'Randevunuz İptal Edildi', message: 'Danışman randevunuzu iptal etti. Sebep: {reason}' },
    en: { title: 'Your Appointment Was Cancelled', message: 'The consultant cancelled your appointment. Reason: {reason}' },
    de: { title: 'Dein Termin wurde storniert', message: 'Der Berater hat deinen Termin storniert. Grund: {reason}' },
  },
  withdrawal_received: {
    tr: { title: 'Para Çekme Talebi Alındı', message: 'Para çekme talebiniz alındı. Admin onayından sonra hesabınıza geçecektir.' },
    en: { title: 'Withdrawal Request Received', message: 'Your withdrawal request has been received. It will be transferred after admin approval.' },
    de: { title: 'Auszahlungsanforderung erhalten', message: 'Deine Auszahlungsanforderung ist eingegangen. Sie wird nach der Admin-Freigabe überwiesen.' },
  },
  favorite_online: {
    tr: { title: '{name} şimdi çevrimiçi', message: '{name} şimdi çevrimiçi. Hemen görüşme başlatabilirsin.' },
    en: { title: '{name} is online now', message: '{name} is online now. You can start an instant session.' },
    de: { title: '{name} ist jetzt online', message: '{name} ist jetzt online. Du kannst eine Sofortsitzung starten.' },
  },
  media_message_received: {
    tr: { title: 'Yeni medya sorusu', message: 'Bir danışandan kayıtlı ses/video sorusu aldınız.' },
    en: { title: 'New media question', message: 'You received a recorded voice/video question from a client.' },
    de: { title: 'Neue Medienfrage', message: 'Sie haben eine aufgezeichnete Sprach-/Videofrage von einem Klienten erhalten.' },
  },
  media_message_replied: {
    tr: { title: 'Medya sorunuz yanıtlandı', message: 'Danışmanınız kayıtlı sorunuza yanıt verdi.' },
    en: { title: 'Your media question was answered', message: 'Your consultant replied to your recorded question.' },
    de: { title: 'Ihre Medienfrage wurde beantwortet', message: 'Ihr Berater hat auf Ihre aufgezeichnete Frage geantwortet.' },
  },
  media_message_refunded: {
    tr: { title: 'Medya sorunuz iade edildi', message: 'Danışman süresi içinde yanıt vermediği için krediniz iade edildi.' },
    en: { title: 'Your media question was refunded', message: 'Your credits were refunded because the consultant did not reply in time.' },
    de: { title: 'Ihre Medienfrage wurde erstattet', message: 'Ihr Guthaben wurde erstattet, weil der Berater nicht rechtzeitig geantwortet hat.' },
  },
};

export type NotifyKey = keyof typeof TABLE;

function interpolate(s: string, params: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : ''));
}

/** Alıcı diline göre bildirim başlık + mesajı döndürür. */
export function notifyText(
  locale: string | null | undefined,
  key: NotifyKey,
  params: Record<string, string | number> = {},
): Entry {
  const loc = pickLocale(locale);
  const entry = TABLE[key][loc] ?? TABLE[key].tr;
  return {
    title: interpolate(entry.title, params),
    message: interpolate(entry.message, params),
  };
}
