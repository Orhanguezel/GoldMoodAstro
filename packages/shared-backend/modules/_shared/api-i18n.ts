import type { FastifyRequest } from 'fastify';

type Locale = 'tr' | 'en' | 'de';

const MESSAGES = {
  unauthorized: {
    tr: 'Yetkisiz erişim.',
    en: 'Unauthorized access.',
    de: 'Nicht autorisierter Zugriff.',
  },
  tarot_deck_not_found: {
    tr: 'Tarot destesi bulunamadı.',
    en: 'Tarot deck was not found.',
    de: 'Das Tarotdeck wurde nicht gefunden.',
  },
  tarot_reading_not_found: {
    tr: 'Açılım bulunamadı.',
    en: 'Reading was not found.',
    de: 'Die Legung wurde nicht gefunden.',
  },
  coffee_images_required: {
    tr: '3 adet geçerli görsel gereklidir.',
    en: 'Three valid images are required.',
    de: 'Drei gültige Bilder sind erforderlich.',
  },
  coffee_failed: {
    tr: 'Fal yorumlanırken bir hata oluştu. Lütfen tekrar deneyin.',
    en: 'An error occurred while interpreting the coffee reading. Please try again.',
    de: 'Beim Deuten des Kaffeesatzes ist ein Fehler aufgetreten. Bitte versuche es erneut.',
  },
  coffee_not_found: {
    tr: 'Fal bulunamadı.',
    en: 'Coffee reading was not found.',
    de: 'Die Kaffeesatzdeutung wurde nicht gefunden.',
  },
  dream_failed: {
    tr: 'Rüya yorumlanırken bir hata oluştu.',
    en: 'An error occurred while interpreting the dream.',
    de: 'Beim Deuten des Traums ist ein Fehler aufgetreten.',
  },
  dream_not_found: {
    tr: 'Rüya yorumu bulunamadı.',
    en: 'Dream interpretation was not found.',
    de: 'Die Traumdeutung wurde nicht gefunden.',
  },
  numerology_failed: {
    tr: 'Numeroloji hesaplanırken bir hata oluştu.',
    en: 'An error occurred while calculating the numerology report.',
    de: 'Beim Berechnen des Numerologieberichts ist ein Fehler aufgetreten.',
  },
  numerology_not_found: {
    tr: 'Numeroloji raporu bulunamadı.',
    en: 'Numerology report was not found.',
    de: 'Der Numerologiebericht wurde nicht gefunden.',
  },
  package_not_found: {
    tr: 'Paket bulunamadı.',
    en: 'Package was not found.',
    de: 'Das Paket wurde nicht gefunden.',
  },
  payment_not_configured: {
    tr: 'Ödeme sistemi yapılandırılmamış.',
    en: 'Payment system is not configured.',
    de: 'Das Zahlungssystem ist nicht konfiguriert.',
  },
  payment_init_failed: {
    tr: 'Ödeme başlatılamadı.',
    en: 'Payment could not be started.',
    de: 'Die Zahlung konnte nicht gestartet werden.',
  },
  insufficient_credits: {
    tr: 'Yetersiz kredi.',
    en: 'Insufficient credits.',
    de: 'Nicht genügend Guthaben.',
  },
  yildizname_result_missing: {
    tr: 'Yıldızname menzili bulunamadı; seed eksik olabilir.',
    en: 'Yildizname mansion was not found; seed data may be missing.',
    de: 'Die Yildizname-Station wurde nicht gefunden; Seed-Daten fehlen möglicherweise.',
  },
  yildizname_not_found: {
    tr: 'Yıldızname bulunamadı.',
    en: 'Yildizname reading was not found.',
    de: 'Die Yildizname-Deutung wurde nicht gefunden.',
  },
  birth_chart_required: {
    tr: 'Doğum haritan bulunamadı; önce harita oluşturmalısın.',
    en: 'Your birth chart was not found; please create a chart first.',
    de: 'Dein Geburtshoroskop wurde nicht gefunden; bitte erstelle zuerst ein Horoskop.',
  },
  menzil_not_found: {
    tr: 'Menzil yorumu bulunamadı.',
    en: 'Mansion interpretation was not found.',
    de: 'Die Stationdeutung wurde nicht gefunden.',
  },
  llm_failed: {
    tr: 'LLM yorum üretilemedi, tekrar dene.',
    en: 'The AI interpretation could not be generated. Please try again.',
    de: 'Die KI-Deutung konnte nicht erstellt werden. Bitte versuche es erneut.',
  },
  self_invite_forbidden: {
    tr: 'Kendinize davet gönderemezsiniz.',
    en: 'You cannot send an invite to yourself.',
    de: 'Du kannst dir selbst keine Einladung senden.',
  },
  invite_invalid: {
    tr: 'Davet bulunamadı veya geçersiz.',
    en: 'Invite was not found or is invalid.',
    de: 'Die Einladung wurde nicht gefunden oder ist ungültig.',
  },
  invite_not_found: {
    tr: 'Davet bulunamadı.',
    en: 'Invite was not found.',
    de: 'Die Einladung wurde nicht gefunden.',
  },
  inviter_not_found: {
    tr: 'Davet eden kullanıcı bulunamadı.',
    en: 'Inviting user was not found.',
    de: 'Der einladende Nutzer wurde nicht gefunden.',
  },
  both_charts_required: {
    tr: 'Her iki kullanıcının da doğum haritası olmalı.',
    en: 'Both users must have a birth chart.',
    de: 'Beide Nutzer benötigen ein Geburtshoroskop.',
  },
  own_chart_required: {
    tr: 'Önce kendi doğum haritanızı oluşturmalısınız.',
    en: 'Please create your own birth chart first.',
    de: 'Bitte erstelle zuerst dein eigenes Geburtshoroskop.',
  },
  report_not_found: {
    tr: 'Rapor bulunamadı.',
    en: 'Report was not found.',
    de: 'Der Bericht wurde nicht gefunden.',
  },
  sign_required: {
    tr: 'Burç parametresi (sign) eksik.',
    en: 'Sign parameter is missing.',
    de: 'Der Sternzeichen-Parameter fehlt.',
  },
  horoscope_not_found: {
    tr: 'İlgili tarih için yorum bulunamadı.',
    en: 'No interpretation was found for the requested date.',
    de: 'Für das angefragte Datum wurde keine Deutung gefunden.',
  },
  sign_info_not_found: {
    tr: 'Burç bilgisi bulunamadı.',
    en: 'Sign information was not found.',
    de: 'Sternzeicheninformationen wurden nicht gefunden.',
  },
  compatibility_params_required: {
    tr: 'signA ve signB parametreleri zorunludur.',
    en: 'signA and signB parameters are required.',
    de: 'Die Parameter signA und signB sind erforderlich.',
  },
  compatibility_not_found: {
    tr: 'Uyumluluk yorumu henüz mevcut değil.',
    en: 'Compatibility interpretation is not available yet.',
    de: 'Die Kompatibilitätsdeutung ist noch nicht verfügbar.',
  },
  month_required: {
    tr: 'month parametresi (YYYY-MM) zorunludur.',
    en: 'month parameter (YYYY-MM) is required.',
    de: 'Der Parameter month (JJJJ-MM) ist erforderlich.',
  },
  history_failed: {
    tr: 'Geçmiş yüklenirken bir hata oluştu.',
    en: 'An error occurred while loading history.',
    de: 'Beim Laden des Verlaufs ist ein Fehler aufgetreten.',
  },
  invalid_type: {
    tr: 'Geçersiz tip.',
    en: 'Invalid type.',
    de: 'Ungültiger Typ.',
  },
  id_required: {
    tr: 'ID gerekli.',
    en: 'ID is required.',
    de: 'ID ist erforderlich.',
  },
  record_not_found_or_forbidden: {
    tr: 'Kayıt bulunamadı veya size ait değil.',
    en: 'Record was not found or does not belong to you.',
    de: 'Der Eintrag wurde nicht gefunden oder gehört nicht zu dir.',
  },
  consultants_only: {
    tr: 'Sadece danışmanlar erişebilir.',
    en: 'Only consultants can access this resource.',
    de: 'Nur Berater können auf diese Ressource zugreifen.',
  },
  user_id_required: {
    tr: 'userId gerekli.',
    en: 'userId is required.',
    de: 'userId ist erforderlich.',
  },
  consultant_customer_relation_missing: {
    tr: 'Bu danışanla bir randevu ilişkiniz yok.',
    en: 'You do not have a booking relationship with this client.',
    de: 'Du hast keine Terminbeziehung mit diesem Klienten.',
  },
  deletion_request_exists: {
    tr: 'Zaten aktif bir silme talebiniz bulunuyor.',
    en: 'You already have an active deletion request.',
    de: 'Du hast bereits eine aktive Löschanfrage.',
  },
  deletion_request_not_found: {
    tr: 'Aktif bir silme talebi bulunamadı.',
    en: 'No active deletion request was found.',
    de: 'Es wurde keine aktive Löschanfrage gefunden.',
  },
  invalid_request: {
    tr: 'Geçersiz istek.',
    en: 'Invalid request.',
    de: 'Ungültige Anfrage.',
  },
  record_not_found: {
    tr: 'Kayıt bulunamadı.',
    en: 'Record was not found.',
    de: 'Der Eintrag wurde nicht gefunden.',
  },
  action_failed: {
    tr: 'İşlem gerçekleştirilemedi.',
    en: 'Action could not be completed.',
    de: 'Die Aktion konnte nicht abgeschlossen werden.',
  },
  create_failed: {
    tr: 'Kayıt oluşturulamadı.',
    en: 'Record could not be created.',
    de: 'Der Eintrag konnte nicht erstellt werden.',
  },
  update_forbidden: {
    tr: 'Bu alanları güncelleme yetkiniz yok.',
    en: 'You are not allowed to update these fields.',
    de: 'Du darfst diese Felder nicht aktualisieren.',
  },
  update_failed: {
    tr: 'Güncelleme başarısız.',
    en: 'Update failed.',
    de: 'Aktualisierung fehlgeschlagen.',
  },
  reply_create_failed: {
    tr: 'Yanıt oluşturulamadı.',
    en: 'Reply could not be created.',
    de: 'Die Antwort konnte nicht erstellt werden.',
  },
  delete_failed: {
    tr: 'Silme işlemi başarısız.',
    en: 'Delete action failed.',
    de: 'Löschen fehlgeschlagen.',
  },
} as const;

export type ApiMessageKey = keyof typeof MESSAGES;

export function requestLocale(req?: FastifyRequest | null): Locale {
  const queryLocale = ((req?.query as Record<string, unknown> | undefined)?.locale ?? '') as string;
  const headerLocale = String(req?.headers?.['x-locale'] ?? req?.headers?.['accept-language'] ?? '');
  const raw = queryLocale || (req as any)?.locale || headerLocale || 'tr';
  const normalized = String(raw).trim().toLowerCase().split(',')[0].split('-')[0];
  return normalized === 'en' || normalized === 'de' ? normalized : 'tr';
}

export function apiMessage(req: FastifyRequest | null | undefined, key: ApiMessageKey): string {
  const locale = requestLocale(req);
  return MESSAGES[key][locale] ?? MESSAGES[key].tr;
}
