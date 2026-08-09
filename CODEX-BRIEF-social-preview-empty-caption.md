# CODEX BRIEF — Story-CTA kart görsellerinde metin BOŞ (baked) + içerik kalite

> ✅ GÖREV 1 ÇÖZÜLDÜ (Claude, 2026-08-09): 24 bozuk `*story*cta.png` silinip generator
> `--db`'siz yeniden çalıştırıldı → metin baked, prod'a rsync'lendi, prod URL'inden görsel
> doğrulandı. Ekosistem re-sync edildi. **Kalan: GÖREV 2 (içerik kalite gözden geçirme).**
>
> Hazırlayan: Claude (mimari/lokalizasyon — kök neden GÖRSEL olarak teyit edildi).
> DÜZELTME: bu bir önizleme/render bug'ı DEĞİL; goldmood'un ürettiği PNG'nin İÇİNE metin
> çizilmemişti. Kök: renderSlide existsSync guard'ı 4 Ağustos'taki boş dosyaları cache'liyordu.

---

## GÖREV 1 — story-cta kart görsellerinde başlık/CTA metni BOŞ

### Semptom (GÖRSEL OLARAK DOĞRULANDI)
`backend/uploads/social/august-2026-week1-extra-v3/2026-08-09-story-dream-sea-cta.png`
(ve tüm `*story*-cta.png` serisi, 08-08..08-31) açıldığında: altın dalga art'ı VAR, ama
**ortadaki metin kutusu ve alttaki CTA pill BOMBOŞ** — şekiller çizili, içleri metinsiz.
Kullanıcı bunu admin.goldmoodastro.com/admin/social/instagram önizlemesinde gördü; önizleme
DOĞRU çalışıyor (bozuk görseli olduğu gibi gösteriyor). Sorun görselin KENDİSİNDE.

Karşılaştırma (bunlar SAĞLAM, metin baked): `/tr/social-image?type=sign&sign=aries`,
`?type=tool&tool=numeroloji`, `?type=pair&pair=...` (satori/OG yolu) — çalışıyor.
Kırık olan yalnız ön-üretilmiş `/uploads/social/august-2026-week1-extra-v3/*story*cta.png` serisi.
Caption DATA'sı dolu (1a'da boş 0) — o ayrı temsil; kart GÖRSELİNE metin basılmamış. İki farklı şey.

### Üreten kod (izlendi)
- `scripts/prepare-august-2026-weeks2-4-extra.ts:59`:
  `posts.push(await story(s.day, \`${s.slug}-cta\`, s.cta, { ...cover, kicker, body: s.cta, footer: "Etkileşim aracını ekle" }))`
  (cover = `{ title: s.title, subtitle, body: s.body, asset, footer: s.cta }` — yani slide title/body/footer DOLU).
- `story()` — `scripts/prepare-august-2026-week1-extra-drafts.ts:401` → `renderSlide(...)`.
- `renderSlide` — aynı dosya `:278`. Metni `overlaySvg()` (`:175`) + kutu/pill'i `artFrameSvg()` çiziyor.

### KÖK NEDEN (smoking gun)
`renderSlide` **satır 283**: `if (existsSync(filePath)) return ...` — dosya varsa üretimi ATLIYOR.
Bozuk PNG'ler **4 Ağustos'ta** (eski/eksik bir sürümde, boş metinle) üretilmiş; slide tanımları
ARTIK metin içeriyor ama existsSync yüzünden yeniden üretilmiyor → eski boş dosya kalıyor.
(İkincil olasılık: `overlaySvg`/`artFrameSvg` story+asset layout'unda title/body metnini yanlış
konuma/boş basıyor olabilir — regen sonrası hâlâ boşsa BU'dur.)

### Codex adımları
1. Bir bozuk dosyayı SİL (ör. `2026-08-09-story-dream-sea-cta.png`), sadece o slide'ı yeniden
   üret (script'in image-only kısmını çalıştır), çıkan PNG'yi AÇ/GÖRÜNTÜLE.
   - Metin geldiyse → sebep existsSync cache'iydi. Tüm `*story*cta.png` serisini sil + yeniden üret.
   - Hâlâ boşsa → `overlaySvg`/`artFrameSvg` story-layout bug'ı; title/body text'inin bu layout'ta
     doğru y konumunda ve DOLU basıldığını düzelt (satır 177-216 + artFrameSvg).
2. **DB güvenliği:** weeks2-4 script'i social_posts'a taslak INSERT ediyorsa, yeniden çalıştırma
   ÇİFT taslak yaratmasın — image-only regen yap VEYA insert'i idempotent (INSERT IGNORE / var olanı
   update) tut. Prod DB içeriğini EZME (workspace kuralı).
3. **Deploy:** regenerate edilen PNG'ler `backend/uploads/social/...` altında. **UYARI:** deploy
   uploads/ dizinini otomatik SENKRONLAMAZ ([[deploy_uploads_gap]]) — yeni PNG'leri prod'a rsync'le.
4. Bitince ekosistem oturumuna haber ver → o `content_catalog`'u re-sync eder, önizlemeler dolu gelir.

### Kabul kriteri
`*story*cta.png` serisi açıldığında title + body + CTA metni GÖRSELİN İÇİNDE görünür (dream-sea:
"Rüyada Su veya Deniz Görmek" + "Rüyanı yorumlara yaz" + "Etkileşim aracını ekle"). Prod'daki
/uploads dosyaları da güncel. Önizleme (admin + ekosistem) dolu metinli kart gösterir.

### İlgili (opsiyonel, ayrı — Görev 1'in kapsamı DIŞI)
- `SocialPlatformPage` accountItems canlı IG postlarında `m.message` boşsa "(açıklama yok)" gösteriyor;
  IG Graph fetch `caption` alanını istemiyorsa ayrı bir eksik olabilir — ama kullanıcının ŞU ANKİ
  semptomu bu DEĞİL. Karıştırma; ancak Görev 1 bitince kullanıcı isterse bakılır.

---

## GÖREV 2 — İçerik kalite gözden geçirme ("içeriklerde hatalar var")
Kullanıcı üretilen sosyal içerikte hatalar olduğunu söyledi (henüz örnek vermedi — İSTE).
- Kaynaklar: günlük burç `backend/src/cron/social-horoscope.ts` (caption) + `horoscope-job.ts` (LLM)
  + ağustos serisi metinleri `scripts/prepare-august-2026-*.ts` (title/body/cta spec'leri).
- Kural (hafıza): asset tipi tutarlılığı, tarot açık-yüz+element, kontrast, tek-burç kapak yasağı,
  üretimden sonra GÖRSEL doğrulama.
- Codex: kullanıcıdan somut hata örneği/tipi al (metin/görsel/eşleşme) → o kategoriyi tara → düzelt.
  Prod içeriğini seed ON DUPLICATE ile EZME.
