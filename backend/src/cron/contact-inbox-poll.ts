// İletişim gelen kutusu (IMAP) — kullanıcıların e-posta yanıtlarını iletişim
// thread'ine düşürür. Her ~5 dakikada bir tarar. IMAP yapılandırılmamışsa sessizce
// no-op döner (imap_not_configured); hata deploy'u/uygulamayı etkilemez.
import { pollContactInbox } from '@goldmood/shared-backend/modules/contact/inbox';

const POLL_MS = 5 * 60 * 1000;

export function registerContactInboxCron() {
  // İlk taramayı boot'tan ~45 sn sonra yap (uygulama otursun), sonra periyodik.
  setTimeout(() => void runContactInboxPoll(), 45 * 1000);
  setInterval(() => void runContactInboxPoll(), POLL_MS);
  console.log('[cron] contact-inbox poll registered (5m)');
}

export async function runContactInboxPoll() {
  try {
    const res = await pollContactInbox({ limit: 50 });
    if (res.imported > 0) {
      console.log(`[contact-inbox] imported=${res.imported} scanned=${res.scanned} skipped=${res.skipped}`);
    } else if (!res.ok && res.reason !== 'imap_not_configured') {
      console.warn(`[contact-inbox] poll not ok: ${res.reason}`);
    }
  } catch (err) {
    console.error('[contact-inbox] poll failed:', err);
  }
}
