# Mobil → Backend İstekleri

Mobile geliştirici (eş + Cursor) yeni endpoint veya backend değişiklik
ihtiyacını buraya yazar. Orhan görür, backend'e ekler, sonra `mobile/AGENTS.md`'yi
günceller. **Her istek tek bir başlık altında, tarihli.**

---

## Format

```
## YYYY-MM-DD — Kısa başlık

**Method + Path:** POST /api/v1/me/preferences
**Body:** { theme: 'dark' | 'light', notifications: boolean }
**Response:** { ok: true }
**Neden:** Mobil settings ekranında tema + bildirim tercihi kaydı için
**Aciliyet:** Düşük / Orta / Yüksek
**Durum:** ⏳ Bekliyor / 🚧 Hazırlanıyor / ✅ Tamamlandı (path)
```

---

## İstekler

## 2026-05-16 — FAZ 41 T41-1: auth/me `is_premium` + `subscription` özeti

**Method + Path:** `GET /auth/me` (ve alias `GET /auth/user`) — mevcut handler’a **additive** alanlar  
**Response (user içinde):** `{ is_premium: boolean, subscription: { tier, plan_code, period, status, ends_at, trial_ends_at, is_trial } | null }`  
**Kontrat:** `doc/contracts/auth-me-subscription-contract.md`  
**Neden:** Mobil `usePremium` + `BannerWidget` pro gating; şu an yalnız `/subscriptions/me` yedek çağrısı var  
**Aciliyet:** Orta  
**Durum:** ⏳ Bekliyor

<!-- Buraya yeni istekleri ekle. En yeni en üstte. -->
