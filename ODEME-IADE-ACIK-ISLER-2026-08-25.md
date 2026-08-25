# Ödeme/İade — Açık İşler ve Durum Notu (2026-08-25)

> Bu not ekosistem-sosyal-medya (Tanitio) oturumundan bırakıldı. O gün bu repoda
> yapılan işin kaydı + goldmood oturumunda MUTLAKA ele alınacak açık işler.
> İlgili Tanitio süreci: `ekosistem-sosyal-medya/ODEME-CANLIYA-ALMA-CHECKLIST-2026-08-25.md`.

## O gün yapılanlar (canlıda, commit `025f235`)

1. **Abonelik iadesi düzeltildi:** `applyRefundToLedger` artık `subscription_start`
   siparişinin iadesinde aboneliği **`expired` + `ends_at=NOW`** yapar.
   Önceki durum: para iade ediliyor ama premium `ends_at`'e kadar açık kalıyordu
   (yıllıkta 12 ay!). `cancelled` statüsü BİLEREK kullanılmadı — `summary.ts`
   `cancelled` + `ends_at>NOW`'u premium sayar (iptal = yenileme durur, erişim sürer).
   Eşleşme anahtarı: `subscriptions.provider_subscription_id = payment_intent`
   (aktivasyonla simetrik, `activate.service.ts`).
2. **`orders.notes` ezme kusuru düzeltildi:** iade sebebi artık JSON'a
   `refund_reason` olarak eklenir; `context/package_id/plan_id` bağlamı korunur.
3. **Bekçi test:** `packages/shared-backend/modules/orders/refund.service.contract.test.ts`
   (eski ezme kalıbını kaynak seviyesinde yasaklar) — `bun test` ile koşar.
4. **Webhook secret rotasyonu:** eski endpoint'in `whsec`'i bir başka oturumun
   transcript'inde açığa çıkmıştı → yeni endpoint `we_1U8I11CiRLhHAv3z9uqaSq29`
   açıldı, `.env` güncellendi (yedek: `backend/.env.bak-20260825-whsec-rotasyon`),
   **sızan secret'lı eski endpoint `we_1U554t…` SİLİNDİ** (sızıntı işlevsiz).
   Aynı Stripe hesabında artık 2 endpoint var: goldmood + Tanitio
   (`we_1U8Hn5…`, panel.tanitio.com) — Tanitio'nunkine DOKUNMA.

## 🔴 AÇIK İŞLER (bu repoda oturum açılınca ele al)

- [ ] **Server'da `bun x tsc` core dump (exit 134) — deploy gate KIRIK.**
      `goldmoodastro:/var/www/goldmoodastro/backend`'de `bun run build` çöküyor;
      aynı commit lokalde temiz derleniyor (RAM 2.2GB boş, sebep belirsiz —
      bun sürümü/tsc etkileşimi olabilir). 2026-08-25 değişikliği şanslıydı:
      `packages/shared-backend` runtime'da TS olarak çalıştığı için build
      gerekmedi. **`backend/src`'ye dokunan İLK deploy'da bu çözülmek zorunda**
      (aksi hâlde `dist/` güncellenemez). Denenebilir: server bun güncelle,
      `npx tsc` ile derle, veya lokalde build + `dist/` rsync.
- [ ] **Abonelik iadesinin canlı para testi yapılmadı.** Tanitio tarafı gerçek
      parayla uçtan uca doğrulandı ama goldmood'un kendi iade zinciri (admin
      düğmesi → Stripe refund → webhook → abonelik kapanışı) canlıda gerçek
      ödeme ile denenmedi. Küçük bir danışmanlık/abonelik siparişiyle test et.
- [ ] **Yenileme mekanizması yok** (2026-08-25 analizi): `auto_renew` hep 0,
      süresi dolan abonelik sessizce premium kaybeder, hatırlatma maili yok.
      Stripe mode:'payment' tek-seferlik model — bilinçli, ama dönem sonu
      hatırlatma + yeniden satın alma akışı eksik.
- [ ] **Web'de abonelik satın alma yolu yok:** pricing sayfasında satın alma
      CTA'sı yok (`/subscriptions/start` yalnız mobilden çağrılıyor) ve success
      URL `/{locale}/me/subscription` route'u 404. Web'den premium satılamıyor.
- [ ] **Kupon Stripe'a bağlı değil:** pricing'deki kupon kutusu yalnız doğrulama
      yapıyor, checkout'a indirim geçmiyor.
- [ ] (Temizlik) Rotasyon yedeği `backend/.env.bak-20260825-whsec-rotasyon`
      doğrulama sonrası silinebilir.
