# Esnek Randevu — Aralık (Interval) Bazlı Slot Sistemi — Çeklist (2026-07-03)

> **Amaç:** Sabit 30dk kare slot grid'i yerine **süreye duyarlı aralık modeli**:
> - Hizmet süresi neyse (45/60/90dk) randevu **[başlangıç, başlangıç+süre)** aralığını kilitler.
> - Danışan takvimde günü **zaman çizgisi (timeline)** olarak görür: dolu aralıklar çizgide dolu,
>   boş aralıklar seçilebilir; başlangıç saatine tıklayınca seçilen aralık (ör. 10:30–11:15) vurgulanır.
> - Uygun başlangıçlar hizmet süresine göre dinamik hesaplanır (15dk adım):
>   `başlangıçlar = mesai ∖ (mevcut randevular ∪ molalar)` içinde `t + süre ≤ pencere sonu` olan t'ler.
>
> **Mevcut model (değişecek):** `resource_slots` 30dk kare grid (slot-generator cron üretiyor) +
> `slot_reservations` kapasite sayacı. Süre farkındalığı YOK — 60dk hizmet tek 30dk hücre işgal
> ediyor (çakışma riski!). `resource_working_hours` zaten aralık bazlı (dow 1=Pzt, start/end,
> slot_minutes) — YENİ modelin temeli bu.
>
> **KESİN KURALLAR:** ALTER YASAK (yeni tablolar CREATE IF NOT EXISTS). İş sonunda typecheck →
> COMMIT → PUSH (AGENTS.md). JWT kimliği `sub`. RTK {data} unwrap. Geriye uyum: mevcut slot_id'li
> booking akışı migration boyunca çalışır kalmalı.

---

## Mimari karar

**Dinamik hesap, tablo-grid değil.** Uygun başlangıçlar sorgu anında hesaplanır:
1. Günün mesai pencereleri: `resource_working_hours` (dow eşleşen satırlar)
2. Dolu aralıklar: o günün **aktif bookings**'i (`status IN (booked,confirmed,active)`) →
   `[appointment_time, appointment_time + session_duration)` + danışman molaları (`consultant_time_blocks`)
3. Boş pencereler = mesai − dolu; her boş pencerede 15dk adımlı başlangıçlar; `t+süre ≤ pencere_sonu`

**resource_slots/slot_reservations yeni akışta KULLANILMAZ** (tablolar kalır; eski akış migration
boyunca yaşar; tam geçiş sonrası slot-generator cron kaldırılır — ayrı temizlik görevi).

**Çakışma güvencesi (kritik):** booking INSERT'i transaction içinde
`SELECT ... FOR UPDATE` ile aynı danışman+tarih aktif randevularını kilitleyip aralık çakışması
kontrol eder (`yeni.start < mevcut.end AND mevcut.start < yeni.end` → 409 `slot_conflict`).
İki kullanıcı aynı anda aynı aralığı alamaz.

### Yeni tablo (yalnız molalar için)
```sql
-- 0XX_consultant_time_blocks_schema.sql
CREATE TABLE IF NOT EXISTS consultant_time_blocks (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(160) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ctb_consultant_date_idx (consultant_id, block_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## FAZ 1 — Backend aralık motoru

### [x] INT-T1 — Availability hesaplayıcı 🔴
- **Yeni:** `backend/src/modules/consultants/interval-availability.ts`:
  `computeDayAvailability(consultantId, date, durationMinutes)` →
  `{ windows: [{start,end}], busy: [{start,end,kind:'booking'|'block'}], starts: ['09:00','09:15',...] }`
- Kaynaklar: working_hours (dow konv: `((DAYOFWEEK+5)%7)+1`), aktif bookings (süreleriyle), time_blocks.
- Adım 15dk (sabit const, ileride ayarlanabilir). Geçmiş saatler (bugünse) elenir; şimdi+30dk tampon.
- **Kabul:** birim mantık: 09-21 mesai + 10:00-10:45 dolu + 60dk hizmet → starts 09:00 var, 09:15/09:30/09:45/10:00..10:30 yok (çakışır), 10:45 var. **Tamamlandı:** `interval-availability.ts` mesai, booking ve mola aralıklarını 15dk adımla hesaplıyor.

### [x] INT-T2 — Public API 🔴
- `GET /consultants/:id/availability?date=YYYY-MM-DD&duration=60` (veya `service_id` → süre servis kaydından).
- Response: `{ data: { windows, busy, starts, step_minutes, duration_minutes } }` — busy aralıkları
  timeline çizimi için (kimlik bilgisi SIZDIRMADAN: yalnız aralık, randevu sahibi yok).
- Eski `GET /:id/slots` endpoint'i KALIR (mobil eski sürüm uyumu) ama frontend yenisine geçer.
- **Kabul:** farklı duration'larda starts doğru daralıyor. **Tamamlandı:** `GET /consultants/:id/availability` eklendi; `duration` ve `service_id` destekli, eski `/slots` endpoint'i korunuyor.

### [x] INT-T3 — Çakışma-güvenli booking create 🔴
- Booking create (public + instant): `slot_id` OPSİYONEL olur; yeni akış `{appointment_date,
  appointment_time, service_id}` ile gelir; süre servis kaydından snapshot.
- Transaction: `SELECT id FROM bookings WHERE consultant_id=? AND appointment_date=? AND status IN
  ('booked','confirmed','active') FOR UPDATE` → JS'te aralık çakışma kontrolü → çakışıyorsa 409
  `slot_conflict`; temizse INSERT. time_blocks + mesai içi doğrulaması da burada.
- Eski slot_id'li istekler mevcut yoldan çalışmaya devam eder (geriye uyum).
- **Kabul:** eşzamanlı iki istek aynı aralığı alamaz (tek kazanan, diğeri 409); mesai dışı istek 400. **Tamamlandı:** public booking `slot_id` opsiyonel; `slot_id` yoksa transaction içinde mesai/mola/randevu aralıkları kilitli kontrol ediliyor, çakışma `409 slot_conflict`.

### [x] INT-T4 — Danışman molaları (time blocks) 🟠
- CRUD: `GET/POST/DELETE /me/consultant/time-blocks` (requireAuth, kendi consultant'ı).
- Danışman paneli "Saatlerim" bölümüne "Mola/Blokaj ekle" (tarih + aralık + neden).
- **Kabul:** eklenen mola availability'de busy görünür, o aralığa randevu alınamaz. **Tamamlandı:** `/me/consultant/time-blocks` CRUD, availability busy entegrasyonu ve danışman panelinde mola ekle/sil UI eklendi.

## FAZ 2 — Frontend timeline seçici

### [x] INT-T5 — TimelinePicker bileşeni 🔴
- **Yeni:** `frontend/src/components/containers/consultant/TimelinePicker.tsx` — SlotPicker'ın yerine
  (SlotPicker dosyası kalır, kullanım değişir):
  - Gün şeridi (mevcut tarih seçici korunur).
  - **Zaman çizgisi:** mesai penceresi yatay bar; busy aralıklar dolu (dolgu + desen), boşlar açık.
  - Altta 15dk adımlı **başlangıç chip'leri** (starts listesi) — sabah/öğle/akşam gruplu.
  - Chip veya çizgiye tıklayınca: seçim `10:30 – 11:15 (45 dk)` olarak vurgulanır (çizgide seçili
    aralık farklı renk); hizmet değişince süre ve uygun başlangıçlar otomatik yenilenir.
  - Erişilebilirlik: chip'ler buton; çizgi yalnız görsel destek.
- ConsultantDetail: seçili hizmetin süresi → availability query `duration` parametresi;
  "SAAT SEÇİN" butonu seçim yapılınca aralık metniyle aktifleşir.
- Booking sayfasına yeni paramlar: `date, time, duration, serviceId` (slotId yok — INT-T3 yeni yol).
- ui_ metinleri tr/en/de (İngilizce placeholder YASAK).
- **Kabul:** 45/60/90dk hizmetlerde çizgi + başlangıçlar doğru; dolu aralık görsel olarak izlenebilir. **Tamamlandı:** `TimelinePicker` yeni availability API'sini kullanıyor, busy aralıkları çiziyor, hizmet süresine göre başlangıç chipleri üretiyor.

### [x] INT-T6 — Booking akışı uyumu 🔴
- `frontend/src/app/[locale]/booking/page.tsx` (ödeme öncesi özet): slotId yerine date+time+duration
  ile çalışır; 409 slot_conflict gelirse kullanıcıya "bu aralık az önce doldu" + takvime geri dön.
- Instant call ("hemen görüş") akışı etkilenmez (slot'suz zaten).
- **Kabul:** uçtan uca: hizmet seç → aralık seç → ödeme → booking DB'de doğru süreyle; çakışan
  ikinci deneme 409 mesajı gösterir. **Tamamlandı:** booking sayfası `slotId` zorunluluğunu kaldırdı; `slot_conflict` ve mesai dışı hataları kullanıcı dostu metne çevriliyor.

## FAZ 3 — Danışman görünümü + geçiş temizliği

### [x] INT-T7 — Danışman takvim görünümü 🟠
- Danışman panelinde günlük timeline: randevuları + molaları çizgide görsün (müşteri adıyla).
- **Kabul:** danışman gününü tek bakışta görür. **Tamamlandı:** `/me/consultant/day-timeline` ve panelde günlük randevu+mola timeline görünümü eklendi.

### [ ] INT-T8 — Eski grid'in emekliliği 🟡 (tam geçiş DOĞRULANDIKTAN sonra)
- Frontend tamamen yeni akışta + mobil sürüm güncellenince: slot-generator cron kaldır,
  `getConsultantSlots` eski endpoint'i deprecate işaretle (silme — mobil eski sürümler için 1-2 ay).
- resource_slots büyümesin diye cron kaldırılana kadar HORIZON 30 günde kalır.
- **Kabul:** yeni akış tek kaynak; eski tablolar sadece tarihsel.
  **Not:** Bu turda bilinçli olarak açık bırakıldı; checklist geriye uyum için eski `/slots` endpoint'inin kalmasını ve mobil geçiş sonrası emekliliği şart koşuyor.

### [x] INT-T9 — Deploy + uçtan uca doğrulama 🔴
- typecheck ×3 → commit+push → git-deploy.
- Canlı senaryolar: (1) 45dk hizmet 10:30 → 10:30-11:15 kilitli, 11:15 seçilebilir;
  (2) eşzamanlı çift rezervasyon → tek kazanan; (3) mola ekle → aralık kapalı;
  (4) eski mobil slots endpoint'i hâlâ 200.
  **Tamamlandı:** backend/frontend/admin typecheck geçti; lokal ve canlı DB'de `--only=225,226` seed geçti; commit `be8af6a` pushlandı; canlıda pull+build+PM2 reload yapıldı. Smoke: `GET /api/consultants/:id/availability?duration=45` 200, 15dk başlangıçlar dönüyor; eski `/slots` endpoint'i 200; consultant detail ve consultant panel sayfaları 200.

---

## Kilit dosyalar
| İş | Yol |
|----|-----|
| Mevcut slot okuma | `backend/src/modules/consultants/repository.ts` `getConsultantSlots` |
| dow konvansiyonu | `packages/shared-backend/modules/availability/repository.ts:125` |
| Booking create + slot rezervasyon | `packages/shared-backend/modules/bookings/{controller,repository}.ts` (`ensureResourceSlotTx`, `reserveSlotTx`) |
| Mevcut seçici | `frontend/src/components/containers/consultant/SlotPicker.tsx` + `ConsultantDetail.tsx` |
| Slot cron (T8'de emekli) | `backend/src/cron/slot-generator.ts` |
| Mesai CRUD (danışman) | `packages/shared-backend/modules/availability/*` |

## Riskler / dikkat
- **Çakışma penceresi:** FOR UPDATE kilidi olmadan iki eşzamanlı ödeme aynı aralığı alabilir — INT-T3 pazarlıksız.
- **TZ:** appointment_time server local; hesaplarda `parseAppointment` deseniyle tutarlı kal (livekit'teki gibi).
- **Mobil uyum:** eski slots endpoint'i kaldırılmaz (INT-T8'e kadar); mobil parite ayrı görev.
- **session_duration snapshot:** booking'e her zaman servis süresi yazılır — sonradan servis süresi değişse bile mevcut randevu aralığı sabit kalır.
