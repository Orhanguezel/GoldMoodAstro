// =============================================================================
// Onaylı ama profili EKSİK (sitede yayınlanamayan) danışmanlara profil-tamamlama
// hatırlatma e-postası. Eksik alanlara göre mesaj kişiselleşir.
//
// Kullanım (prod):
//   cd backend && bun run scripts/consultant-completion-reminders.ts          # DRY-RUN (sadece gösterir)
//   cd backend && bun run scripts/consultant-completion-reminders.ts --send   # gerçekten e-posta atar
//
// "Yayın için zorunlu" eksikler: seans ücreti, müsaitlik, slug.
// "Profil kalitesi" eksikleri de (foto, bio, uzmanlık, dil...) ayrıca listelenir.
// =============================================================================

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { consultants } from '@/modules/consultants/schema';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { sendMail } from '@goldmood/shared-backend/modules/mail';

const SEND = process.argv.includes('--send');
const PANEL_URL = process.env.CONSULTANT_PANEL_URL || 'https://goldmoodastro.com/tr/me/consultant';

const rows = await db
  .select({
    id: consultants.id,
    name: users.full_name,
    email: users.email,
    avatar: users.avatar_url,
    slug: consultants.slug,
    bio: consultants.bio,
    expertise: consultants.expertise,
    languages: consultants.languages,
    price: consultants.session_price,
    duration: consultants.session_duration,
    supportsVideo: consultants.supports_video,
    available: consultants.is_available,
    approval: consultants.approval_status,
  })
  .from(consultants)
  .innerJoin(users, eq(users.id, consultants.user_id))
  .where(eq(consultants.approval_status, 'approved'));

// Yayın için zorunlu eksikler (bunlar tamamlanmadan sitede görünmez).
function blockingMissing(c: any): string[] {
  const m: string[] = [];
  if (!(Number(c.price || 0) > 0)) m.push('Seans ücreti girin (0’dan büyük bir tutar)');
  if (Number(c.available || 0) !== 1) m.push('Profilinizi “müsait” olarak işaretleyin');
  if (!c.slug) m.push('Public adres (otomatik oluşur; oluşmadıysa destek ile iletişime geçin)');
  return m;
}
// Profil kalitesi eksikleri (yayını engellemez ama tamamlanması önerilir).
function qualityMissing(c: any): string[] {
  const m: string[] = [];
  if (!c.avatar) m.push('Profil fotoğrafı ekleyin');
  if (!(c.bio && String(c.bio).trim().length >= 20)) m.push('Kısa bir biyografi yazın');
  if (!(Array.isArray(c.expertise) && c.expertise.length)) m.push('Uzmanlık alanlarınızı seçin');
  if (!(Array.isArray(c.languages) && c.languages.length)) m.push('Konuştuğunuz dilleri ekleyin');
  return m;
}

function buildEmail(c: any, blocking: string[], quality: string[]) {
  const li = (arr: string[]) => arr.map((x) => `<li>${x}</li>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1a1226">
  <h2 style="color:#b9892d">Merhaba ${c.name || 'Değerli danışmanımız'},</h2>
  <p>GoldMoodAstro danışman profiliniz <b>onaylandı</b> 🎉 Ancak sitede <b>yayınlanabilmesi</b> için birkaç adım kaldı.</p>
  <p><b>Yayın için tamamlamanız gerekenler:</b></p>
  <ul>${li(blocking)}</ul>
  ${quality.length ? `<p style="color:#715d83"><b>Profilinizi güçlendirmek için (opsiyonel):</b></p><ul style="color:#715d83">${li(quality)}</ul>` : ''}
  <p>Bunları tamamladığınızda profiliniz <b>otomatik olarak yayına girer</b> ve danışanlar sizi bulup randevu alabilir.</p>
  <p><a href="${PANEL_URL}" style="display:inline-block;background:#b9892d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:bold">Danışman Panelim</a></p>
  <p style="color:#999;font-size:12px">Sevgiler,<br/>GoldMoodAstro</p>
</div>`;
  const text =
    `Merhaba ${c.name || ''},\n\nDanışman profiliniz onaylandı ama sitede yayınlanabilmesi için tamamlamanız gerekenler:\n` +
    blocking.map((x) => ` - ${x}`).join('\n') +
    (quality.length ? `\n\nProfilinizi güçlendirmek için (opsiyonel):\n` + quality.map((x) => ` - ${x}`).join('\n') : '') +
    `\n\nPanel: ${PANEL_URL}\n\nGoldMoodAstro`;
  return { html, text };
}

let sent = 0;
const skipped: string[] = [];

for (const c of rows as any[]) {
  const blocking = blockingMissing(c);
  if (blocking.length === 0) { continue; } // zaten yayında, hatırlatma gerekmez
  if (!c.email) { skipped.push(`${c.name} (e-posta yok)`); continue; }
  const quality = qualityMissing(c);
  const { html, text } = buildEmail(c, blocking, quality);
  const subject = 'Profilinizi tamamlayın — yayına girmenize az kaldı 🌙';

  console.log(`\n=== ${c.name} <${c.email}> ===`);
  console.log('Yayın için eksik:', blocking.join(' | '));
  if (quality.length) console.log('Kalite eksik:', quality.join(' | '));

  if (SEND) {
    try {
      await sendMail({ to: c.email, subject, html, text } as any);
      sent += 1;
      console.log('  -> GÖNDERİLDİ');
    } catch (e) {
      console.error('  -> HATA:', (e as Error).message);
    }
  }
}

console.log(`\n${SEND ? `Gönderilen: ${sent}` : 'DRY-RUN (gönderilmedi). Göndermek için --send ekleyin.'}`);
if (skipped.length) console.log('Atlanan:', skipped.join(', '));
process.exit(0);
