> **⚠️ SUPERSEDED (2026-07-03):** Bu checklist uygulanmadan hedefe FARKLI yoldan ulaşıldı.
> Kullanıcı kararıyla AI görsel üretimi (BLOG-T1/T2) İPTAL edildi ("api kodu kullanma");
> görseller lokal SVG olarak üretildi, içerik Fable ajanlarıyla zenginleştirildi.
> SONUÇ: 24 blog yazısı (8 konu × tr/en/de) 95/100, AdSense/index hazır; seed kalıcı
> (199_blog_posts_seed.sql INSERT IGNORE). İlgili commitler: 78b4f8e, 5653f23.
> Aşağıdaki açık maddeler tarihsel referanstır — YAPILMAYACAK.

# Blog İçerik Kalite Yükseltme (çok dilli + görsel) — Codex Çeklisti (2026-07-02)

> Claude Code (mimar) hazırladı, **Codex uygular**. Amaç: mevcut 24 blog yazısını (8 konu × tr/en/de)
> SEO + index + AdSense kalitesine göre **dinamik** iyileştirmek — içerik derinliği, meta, başlık yapısı,
> iç link + **yazıya özel AI görselleri**. **Puanlama sistemine (seoQuality calculator) DOKUNMA** — skoru
> içeriği gerçekten iyileştirerek yükselt, hile yapma.

---

## 0. Durum tespiti (Claude — okumadan başlama)

**Mevcut durum (prod DB, 2026-07-02):**
- Yazılar **zaten çok dilli**: her konu tr/en/de ayrı `custom_pages` kaydı olarak var (24 i18n satırı). Örn: `dogum-haritasi-nedir` (tr) / `what-is-a-birth-chart` (en) / `was-ist-ein-geburtshoroskop` (de).
- **Hepsi ince**: içerik ~380-490 karakter (≈70-90 kelime) → `content` skoru **0/30** → toplam **41-47/100** (index eşiği 50 altında, AdSense riski).
- Kapak görselleri **paylaşılan placeholder** (`/img/natal_chart.png`, `/img/synastry_chart.png` …) — yazıya özel değil; `images` galeri = 1 (aynı placeholder).
- Backend + admin AI içerik asistanı **canlıda**: `POST /admin/ai/content` (action=enhance/improve/meta/summary), `chat()` ile (Groq/OpenAI/Anthropic).
- **AI görsel üretimi YOK** — eklenmeli (OPENAI_API_KEY mevcut → gpt-image-1).

**Skoru düşüren asıl bileşen (breakdown'dan):** `content` 0/30 (thin), `meta` 13/25 (title/desc kısa), `heading` düşük (H1/H2 yok). Bunları düzeltmek skoru 41-47 → **75+** çıkarır.

**Puanlama modeli (DEĞİŞMEZ — sadece hedef):** meta 25 · içerik derinliği 30 (<300=0, 600-999=25, ≥1000=30) · başlık 15 (1 H1 + ≥2 H2) · medya 15 (kapak + alt) · JSON-LD 10 · iç link+index 5. Hedef: her yazı **≥50 index_ready**, mümkünse **≥75** + **adsense_ready** (≥300 kelime + meta_description + H1).

---

## FAZ 1 — AI görsel üretimi (yeni yetenek)

### [ ] BLOG-T1 — Backend: görsel üretim endpoint 🔴
- **Dosya:** `packages/shared-backend/modules/aiContent/imageController.ts` + router'a ekle.
- **Endpoint:** `POST /admin/ai/image` body `{ prompt: string, size?: '1024x1024'|'1536x1024', title?, locale? }` →
  OpenAI Images API (`${OPENAI_API_BASE}/images/generations`, model `gpt-image-1` veya env `OPENAI_IMAGE_MODEL`) çağır → dönen base64/URL'i **storage'a yükle** (mevcut storage servisi, bucket `public`, folder `blog`) → `{ url, asset_id }` döndür.
- Anahtar yoksa `503 ai_image_not_configured` (graceful).
- **Prompt kalıbı (konuya göre):** system yok; user = `"Astroloji/maneviyat blogu için estetik, metinsiz (no text) kapak görseli. Konu: {title}. Stil: mor-altın-krem tonları, mistik ama sade, modern editoryal. Tek görsel."` (marka paleti: gold/cream/ink — bkz. vision pivot).
- **Kabul:** endpoint bir konu başlığından tema-uygun görsel üretip storage URL döndürür.

### [ ] BLOG-T2 — Admin: "AI görsel üret" butonu 🟠
- **Dosya:** `admin_panel/.../blog/_components/admin-blog-client.tsx` — Görseller tab'ında `AdminImageUploadField` yanına buton: başlık/özetten görsel üretip `featured_image`'a (ve galeriye) uygula. RTK: `useAiImageGenerateMutation` (`ai_content_admin.endpoints.ts`).
- Üretilen görsele **otomatik alt text** öner (başlıktan) → `featured_image_alt` doldur.
- **Kabul:** editör tek tıkla yazıya özel kapak üretir; alt text dolu gelir.

## FAZ 2 — İçerik zenginleştirme pipeline (dinamik, skora göre)

### [ ] BLOG-T3 — Toplu iyileştirme runner (script veya admin) 🔴
- **Amaç:** her blog yazısı × locale için, **düşük skorlu bileşene göre** AI ile iyileştir. Hile yok — gerçek, native-dil, konuya sadık içerik.
- **Dosya:** `backend/scripts/blog-quality-uplift.ts` (bun script) VEYA admin "Toplu iyileştir" aksiyonu.
- **Akış (her entity+locale için):**
  1. `seo_quality_scores`'tan mevcut breakdown'u oku (hangi bileşen eksik).
  2. `content` düşükse → `aiContentAssist(action='enhance', locale, title, category=tags, content)` çağır → dönen HTML'i (600-1000+ kelime, `<h2>/<h3>/<ul>/<strong>`) kaydet. **Locale'e sadık** (tr yazı Türkçe genişler, en İngilizce, de Almanca — çeviri değil, o dilde derinleştirme).
  3. `meta` düşükse → `aiContentAssist(action='meta', ...)` → meta_title (30-60), meta_description (120-160), tags güncelle.
  4. İç link: içeriğe ≥2 ilgili site-içi link ekle (`/{locale}/consultants`, ilgili landing `/{locale}/birth-chart` vb., ilgili başka blog). (AI enhance prompt'una "2 iç link ekle: {liste}" ekle.)
  5. Kapak placeholder ise → BLOG-T1 ile görsel üret + alt text.
  6. Kaydet → `POST /admin/seo/recalculate {type:'custom_page', id}` ile skoru **yeniden hesapla**.
- **Idempotent + güvenli:** `content` zaten ≥600 kelime ise atla (tekrar genişletme). Rate-limit (LLM), hata halinde o entity'yi atla + logla.
- **Kabul:** çalıştıktan sonra tüm blog yazıları ≥50 index_ready; çoğu ≥75.

### [ ] BLOG-T4 — Başlık (H1) + hiyerarşi garantisi 🟠
- İçerikte tek `<h1>` YOKsa (blog sayfası başlığı ayrı `<h1>` render ediyorsa calculator onu görebilmeli) — calculator `heading` bileşeni içerik HTML'indeki H1/H2'ye bakıyor. AI enhance çıktısı **1 `<h1>` (veya sayfa H1 ile uyumlu) + ≥2 `<h2>`** içersin. Prompt'a bunu zorunlu ekle.
- **Kabul:** heading skoru her yazıda ≥10.

### [ ] BLOG-T5 — Kaydetme yeniden-moderasyon/skoru bozmama 🟡
- `updateBlogPost` zaten `is_published=false`'a çekiyor (danışman edit'i). Admin/script edit'inde yayın durumu **korunmalı** (bu yazılar zaten yayında). Script `is_published`'a dokunmasın; sadece content/meta/tags/image güncellesin. Skoru düşürecek yan etki olmasın.
- **Kabul:** iyileştirme sonrası yazılar yayında kalır, skor yükselir.

## FAZ 3 — Görsel çeşitliliği (opsiyonel derinlik)

### [ ] BLOG-T6 — Galeri görselleri 🟡
- Her yazıya 1-2 ek tema-uygun görsel (BLOG-T1) → `images[]` galeri (public blog `BlogDetails` >1 görselde grid+lightbox render ediyor). Medya skorunu ve görsel zenginliği artırır.
- **Kabul:** öne çıkan yazılarda galeri dolu; alt text'ler dolu.

## FAZ 4 — Doğrulama & deploy

### [ ] BLOG-T7 — Skor doğrulama 🔴
- `POST /admin/seo/recalculate` (tümü) → admin SEO dashboard'da dağılımı kontrol: hedef **hiçbir blog < 50**, ortalama ≥ 70, AdSense-riskli blog sayısı 0.
- **Puanlama sistemi değişmedi** — sadece içerik iyileşti (calculator'a dokunulmadı) doğrula: `seoQuality/calculator.ts` diff'siz.

### [ ] BLOG-T8 — Deploy 🔴
- typecheck (backend + admin) → commit → git-deploy (⚠️ Codex/Claude eşzamanlı deploy çakışmasına dikkat — tek deploy, biterken diğerini tetikleme).
- Görsel gen için prod `.env`: `OPENAI_API_KEY` (+ `OPENAI_IMAGE_MODEL=gpt-image-1`) dolu olmalı.
- Canlı doğrula: birkaç blog yazısı /tr /en /de → zengin içerik + özgün görsel + skor ≥50.

---

## Uygulama sırası (Codex)
1. **BLOG-T1, T2** (AI görsel altyapısı).
2. **BLOG-T3, T4, T5** (içerik zenginleştirme pipeline — asıl skor kazancı).
3. **BLOG-T6** (galeri, opsiyonel).
4. **BLOG-T7, T8** (recalc + deploy + doğrula).

## Kesin kurallar
- **seoQuality calculator/schema DEĞİŞMEZ.** Skor yalnız içerik iyileşerek yükselir.
- İçerik **native-dil**: tr→Türkçe, en→İngilizce, de→Almanca derinleştir (çeviri değil, o dilde özgün genişletme). Konuya (başlık) sadık.
- Görseller **metinsiz**, tema paletinde (gold/cream/ink), yazıya özel; storage'a yüklenip **mutlak URL** saklanır.
- Yayın durumu ve slug'lar korunur (SEO URL'leri bozma).
- LLM/görsel maliyeti: batch'i rate-limit'le; hata toleranslı (bir entity patlarsa devam).

## Kilit dosyalar
| İş | Yol |
|----|-----|
| AI içerik endpoint (mevcut) | `packages/shared-backend/modules/aiContent/controller.ts` (`/admin/ai/content`) |
| AI görsel endpoint (yeni) | `packages/shared-backend/modules/aiContent/imageController.ts` + `router.ts` |
| Toplu uplift script | `backend/scripts/blog-quality-uplift.ts` (yeni) |
| SEO calculator (DOKUNMA) | `packages/shared-backend/modules/seoQuality/calculator.ts` |
| Recalculate endpoint | `POST /admin/seo/recalculate` |
| Admin blog editör | `admin_panel/src/app/(main)/admin/(admin)/blog/_components/admin-blog-client.tsx` |
| Admin AI RTK | `admin_panel/src/integrations/endpoints/admin/ai_content_admin.endpoints.ts` |
| Public blog galeri | `frontend/src/components/containers/blog/BlogDetails.tsx` (images grid+lightbox) |
| Storage upload | mevcut storage servisi (bucket `public`, folder `blog`) |
