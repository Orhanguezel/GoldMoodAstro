# GoldMoodAstro — Canlı Görüşme Notları

**Müşteri:** Murat Kısıkçılar (güçlüfatma hesabı üzerinden iletişim)  
**Platform:** Google Meet  
**Bütçe:** 30.000 TL | **Süre:** 30 gün

---

## Proje Özeti

Danışman + kullanıcı eşleştirme platformu. Kullanıcı danışman seçiyor, randevu alıyor, ödeme yapıyor, randevu saatinde uygulama içi sesli görüşme yapıyor. Astroloji / mood danışmanlığı odaklı.

**Platformlar:** iOS + Android (Flutter) + Web Admin Panel  
**Backend:** Fastify + MySQL + Drizzle ORM  
**Sesli Görüşme:** Agora SDK  
**Ödeme:** Iyzipay  
**Bildirim:** Firebase FCM  

---

## Ne İnşa Ediyorum

| Modül | Detay |
|---|---|
| Auth | Kullanıcı + danışman kaydı, JWT |
| Danışman profili | Fotoğraf, uzmanlık, fiyat, takvim |
| Randevu sistemi | Slot yönetimi, çakışma kontrolü, statüler |
| Ödeme | Iyzipay — ödeme olmadan randevu kesinleşmez |
| Sesli görüşme | Agora SDK, token backend'den, sadece randevu saatinde aktif |
| Push bildirim | Firebase FCM — 24h / 2h / 15dk hatırlatmaları |
| Mesajlaşma | Text tabanlı, sistem mesajları, admin görebilir |
| Operasyon akışları | İptal, no-show otomatik işaretleme, iade talebi |
| Admin panel | Kullanıcı, danışman, randevu, finans, şikayet yönetimi |

---

## Netleşmiş Maddeler

- Tüm source code müşteriye devrediliyor
- Repo erişimi baştan açılacak, haftalık demo yapılacak
- Test ortamı + canlı ortam ayrı kurulacak
- Agora, Firebase, Iyzipay servis ücretleri müşteriye ait
- Faz 2 modülleri (ses kayıt, bekleme listesi, canlı müsait danışman) bu fazda yok

---

## Görüşme Ajandası (Müşteri Tarafından Belirlendi)

### 1. Veri Modeli
Netleştirilecekler:
- `users` tablosu — roller (user / consultant / admin)
- `consultants` tablosu — profil, uzmanlık, fiyat, onay durumu
- `appointments` tablosu — slot referansı, statü, kullanıcı + danışman FK
- `payments` tablosu — randevu FK, tutar, durum, danışman ödeme takibi

### 2. Randevu Slot Yapısı ve Çakışma Kontrolü
Netleştirilecekler:
- Danışman slotları nasıl tanımlanıyor — tekrarlayan mı, tek tek mi?
- Çakışma kontrolü nerede yapılıyor — DB unique constraint + backend doğrulama
- Randevu iptali sonrası slot tekrar açılıyor mu?

### 3. Ödeme → Randevu → Seans Tetikleme Akışı
Netleştirilecekler:
- Iyzipay callback aldıktan sonra randevu `booked` durumuna geçiş
- Ödeme başarısız olursa slot serbest bırakılıyor
- Seans tetikleme: randevu saati gelince Agora token üretilmesi

### 4. Sesli Görüşme (Agora) Entegrasyon Planı
Netleştirilecekler:
- Agora App ID / hesap müşteride var mı, yoksa yeni mi açılacak?
- Token süresi ne kadar — seans süresi + buffer
- Görüşme kaydı isteniyor mu (Faz 2 konusu ama baştan bilinmeli)

### 5. Sprint Planı (Hafta Hafta)
Önerilen çerçeve:
- **Hafta 1:** DB şeması, auth, danışman profili, slot sistemi
- **Hafta 2:** Randevu akışı, ödeme entegrasyonu, statü yönetimi
- **Hafta 3:** Agora sesli görüşme, push bildirim, mesajlaşma
- **Hafta 4:** Admin panel, operasyon akışları, test, deploy

---

## Görüşmede Sorulacaklar

1. **Tasarım:** Hazır UI/UX var mı, yoksa ben mi belirleyeceğim?
2. **Danışman onay süreci:** Kayıt direkt mi açılıyor, admin onayı gerekiyor mu?
3. **İptal politikası:** Kaç saat öncesine kadar iptal serbest, iade kuralı ne?
4. **Danışmana ödeme:** Otomatik mi, admin onaylı mı?
5. **Repo tercihi:** GitHub mı, GitLab mı?
6. **Sunucu:** VPS hazır mı, yoksa ben mi önereyim?
7. **İletişim kanalı:** Günlük/haftalık takip nerede — WhatsApp, e-posta, Bionluk?

---

## Dikkat Edilecek Nokta

Kapsam genişlemesi riskini baştan konuş. Faz 1 net, Faz 2 istekleri geliştirme sırasında eklenmemelidir.
