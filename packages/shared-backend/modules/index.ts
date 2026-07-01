/**
 * @eco/shared-backend/modules
 *
 * Ekosistem ortak backend modulleri.
 * Her modul bagimsiz calisir, kendi schema/router/controller/repository'sine sahiptir.
 * Proje DB'si ayri olsa bile ayni modul kodu kullanilir (SaaS pattern).
 *
 * Kullanim:
 *   import { registerAuth } from '@eco/shared-backend/modules/auth';
 *
 * ICERIK & CMS
 *   - customPages    : Slug bazli CMS sayfalari
 *   - siteSettings   : Key-value site ayarlari (locale destekli)
 *   - newsletter     : Abone yonetimi
 *   - emailTemplates : Email sablon yonetimi
 *
 * AUTH & KULLANICI
 *   - auth           : JWT kimlik dogrulama, rol yonetimi
 *   - notifications  : Bildirim sistemi
 *
 * ILETISIM
 *   - contact        : Iletisim formu ve kayitlari
 *   - telegram       : Telegram bot entegrasyonu
 *
 * IZLEME
 *   - audit          : HTTP/auth event log, analitik
 *   - theme          : UI tema ayarlari
 *
 * AI
 *   - ai             : Icerik olusturma (Groq/OpenAI)
 *
 * DEPOLAMA
 *   - storage        : Dosya yukleme (Cloudinary/local)
 */
