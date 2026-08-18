// =============================================================
// Regresyon testi: serbest metin alanlarına HTML sızmasın.
//
// 2026-08-18: danışman biyografisi zengin metin editöründen HTML olarak
// kaydediliyordu; public sayfa alanı düz metin bastığı için ziyaretçi
// "<div>...</div>" ve "&nbsp;" görüyordu (Elif Demirtaş ve Halil Çağatay
// Turgut profilleri). Düzeltme YAZMA tarafında: bio Zod şemasında
// htmlToPlainText'ten geçiyor.
//
// Bu test o garantiyi kilitler. Çalıştırma: bun backend/scripts/plain-text-guard-test.ts
// =============================================================
import { z } from 'zod';
import { htmlToPlainText, looksLikeHtml } from '@goldmood/shared-backend/modules/_shared/plainText';

// consultantSelf ve consultants/validation ile AYNI kural.
const bioSchema = z.string().trim().max(5000).nullable().optional()
  .transform((v) => (v == null ? v : htmlToPlainText(v)));

type Case = { ad: string; girdi: string; bekle?: string };
const cases: Case[] = [
  { ad: 'zengin editör <div> çıktısı', girdi: 'Merhaba.<div>İkinci&nbsp;paragraf.</div>', bekle: 'Merhaba.\nİkinci paragraf.' },
  { ad: 'Word/Docs yapıştırması', girdi: '<p style="margin:0">Bir</p><p>İki</p>', bekle: 'Bir\n\nİki' },
  { ad: 'satır sonu <br>', girdi: 'A<br/>B', bekle: 'A\nB' },
  { ad: 'script içeriğiyle birlikte atılır', girdi: 'Merhaba<script>alert(1)</script> dünya', bekle: 'Merhaba dünya' },
  { ad: 'style içeriğiyle birlikte atılır', girdi: 'A<style>.x{color:red}</style>B', bekle: 'AB' },
  { ad: 'sayısal varlık', girdi: 'Elif&#39;in haritası', bekle: "Elif'in haritası" },
  { ad: 'düz metin bozulmaz', girdi: 'Merhaba.\n\nİkinci paragraf.', bekle: 'Merhaba.\n\nİkinci paragraf.' },
  { ad: 'emoji korunur', girdi: 'Merhaba 🌙<div>Devam</div>', bekle: 'Merhaba 🌙\nDevam' },
];

let fail = 0;
for (const c of cases) {
  const out = bioSchema.parse(c.girdi) ?? '';
  const kirli = looksLikeHtml(out);
  const beklentiTuttu = c.bekle === undefined || out === c.bekle;
  const ok = !kirli && beklentiTuttu;
  if (!ok) {
    fail++;
    console.log(`FAIL  ${c.ad}`);
    console.log(`      cikti : ${JSON.stringify(out)}`);
    if (c.bekle !== undefined) console.log(`      beklenen: ${JSON.stringify(c.bekle)}`);
  } else {
    console.log(`ok    ${c.ad}`);
  }
}

console.log(`\n${cases.length - fail}/${cases.length} gecti`);
process.exit(fail === 0 ? 0 : 1);
