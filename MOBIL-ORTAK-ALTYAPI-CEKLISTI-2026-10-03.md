# Mobil ortak altyapı: düzeltme ve HepsiHal'e taşıma

3 Ekim 2026 · Kapsam: önce GoldMoodAstro mobilindeki ortak kodu düzelt, test et; sonra yalnız doğrulanmış çekirdeği HepsiHal'e taşı. Canlı yayın ve mağaza başvurusu bu işin dışında.

## Başlangıç kanıtı

- Kaynak: `mobile/app` — Expo 54, React Native 0.81.5, Expo Router 6.
- Önceki kontrol: smoke 11 test geçti. Tam typecheck `tsc` bulunamadığından çalışmadı; bu durum başarı değildir.
- Yerel release kontrolünde iOS servis dosyası ve submit kimlikleri eksik. EAS'te haricen tanımlı olabilir; henüz doğrulanmadı.
- Astroloji, danışmanlık, LiveKit ve ödeme akışları HepsiHal'e taşınmayacak. EAS/Firebase kimliği, sırlar ve kullanıcı verileri kesinlikle kopyalanmayacak.

## Öncelikli düzeltmeler / kabul koşulları

- [x] CORE-01 — Örtük GET yanıt önbelleği kaldırıldı; uçuşta eski hesap yanıtı reddediliyor. **Kanıt:** `session-integration.test.ts` 403, çevrimdışı ve A→B testleri.
- [x] CORE-02 — GET/HEAD en çok iki retry; yazma hataları/401 sonrası otomatik yazma tekrarı yok. Deadline, iptal ve 204 testleri geçti. Token yenilenen yazmada kontrollü 409 ile açık tekrar gerekiyor.
- [x] CORE-03 — Ağ/5xx oturumu silmiyor; refresh tekilleştirildi. Depo yazmaları sıraya alındı, eski refresh çıkış/yeni giriş üzerine yazamıyor. **Kanıt:** gerçek API facade + storage, sahte ağ/depo ile entegrasyon testleri.
- [x] CORE-04 — Native güvenli depo arızasında plaintext yedek yok; web yalnız bellek. Legacy taşıma ve yeni girişte eski refresh temizliği testli. SecureStore yerel cihaz davranışı ayrıca doğrulanacak.
- [ ] CORE-05 — **Kod uygulandı, ekran/cihaz kabulü açık:** `useSyncExternalStore` ile ortak auth durumu ve aynı oturum için tek istek. Bağlantı yokken token korunuyor, doğrulanmış kullanıcı ilan edilmiyor. Login/offline ekran UX ve çoklu ekran mounted testleri tamamlanmalı.
- [ ] PUSH-01 — **Kodda kısmi:** Android kanal izin öncesine alındı; geçersiz `Constants.isDevice` kontrolü kaldırıldı; backend kabulünden sonra kayıt tutuluyor; başlangıçtaki misafir kayıt çağrısı kaldırıldı. iOS APNs→FCM yanlış gönderimi kapalı. iOS köprüsü ve gerçek cihaz teslimi açık.
- [ ] DEP-01 — **Kısmi:** image-picker `~17.0.11`, eksik Bun test tipleri eklendi; repo kilidiyle frozen install ve tam typecheck geçti. ESLint 8 + expo config 57 için SDK54 uyumlu toolchain denemesi ayrı kalıyor; kuralları kapatarak yeşil yapılmadı.
- [x] QA-01 — **3 Ekim yerel:** 41 test / 101 assertion geçti; tam uygulama typecheck exit 0. Değiştirilen altyapı ve root layout için hedefli ESLint hata sayısı 0. Tam uygulama lint sonucu aşağıda ayrı.
- [x] PORT-01 — Üç nötr çekirdek dosyası + 20 test HepsiHal `mobile/core` içine taşındı; byte/hash eşitliği kontrol ediliyor. Tam Expo uygulaması taşınmadı. HepsiHal çekirdek test ve typecheck geçti.
- [ ] QA-02 — Tam mobil lint: **79 hata / 500 uyarı / 33 hata içeren dosya**. Ayrıntı: [dosya ve kural envanteri](mobile/qa/2026-10-03-lint-summary.json). Bunlar tamamlanmadan tüm mobil “temiz” denmeyecek.

## Açık ürün / cihaz / mağaza kapıları

- [ ] GoldMoodAstro iOS FCM sağlayıcı köprüsü ve gerçek cihaz push testi; backend değişikliği gerekiyorsa `mobile/REQUESTS.md` üzerinden talep.
- [ ] HepsiHal auth/API sözleşme adaptörü; GoldMoodAstro uçları doğrudan yeniden adlandırılmayacak.
- [ ] HepsiHal OneSignal mobil sağlayıcısı, çıkışta cihaz-hesap ilişkisinin kaldırılması ve yetkili deep link.
- [ ] Her iki uygulamada Android/iOS oturum, ağ kesintisi, kamera ve bildirim izin reddi cihaz matrisi.
- [ ] HepsiHal native V3 konsepti; fiyat/ilan/talep/hesap ekranları ve erişilebilirlik.
- [ ] Ayrı bundle/package ID, imza, EAS/Firebase/OneSignal hesap sahipliği, gizlilik beyanları.
- [ ] TestFlight/Play kapalı beta; mağaza gönderimi ayrıca onay gerektirir.

## Karar

Tek monolit uygulama kopyalanmayacak. Ortak, framework bağımsız TypeScript çekirdeği önce kaynakta düzeltilecek. İki repo bağımsız çalışacak; klasörler arası çalışma zamanı bağımlılığı kurulmayacak. Tam mobil uygulama veya mağaza hazırlığı ancak ayrı kapılar geçince tamamlandı sayılır.

## Teknik değişiklikler ve sınırlar

| Alan | Kaynak dosya / değişiklik | Açık sınır |
|---|---|---|
| İstek | `mobile/app/src/lib/core/transport.ts`, `src/lib/api.ts` | Üç eski doğrudan fetch akışı (KYC/upload/horoscope) ortak request facade dışında; sonraki audit |
| Depolama | `src/lib/core/secretStore.ts`, `serialQueue.ts`, `src/lib/storage.ts` | Donanım kilidi/Keychain ve sunucu revoke cihaz testi |
| Oturum UI | `src/hooks/useAuth.ts` | Ekran/cihaz etkileşim testi; offline UX |
| Başlangıç | `app/_layout.tsx` | Türetilmiş ready; font hatasında sonsuz splash önlendi; görsel cihaz testi açık |
| Push | `src/lib/notifications.ts`, `mobile/REQUESTS.md` | iOS bilinçli kapalı; native köprü gerekli |
| Bağımlılık | root `bun.lock`, mobil `package.json` | Eski `mobile/app/bun.lock` yanlış `tarimiklim-mobile` kimliği taşıyordu; kaldırıldı, Git geçmişinde mevcut |

Kök dışı kullanıcı değişikliklerine, backend/web/admin/shared kodlarına ve canlı süreçlere dokunulmadı. Bağımlılıklar yalnız mobil workspace için kuruldu; lifecycle scriptleri çalıştırılmadı.

## Öncelikli kalan işler

1. Ortak UI adayları: `SkeletonView` (2), `BannerSlider` (2), `BannerWidget` (2), `ReviewList` (1) ve `useFavorites` (1) lint hatalarını gerçekten düzelt; sonra HepsiHal için uygun bileşenleri seç. Astrolojiye bağlı kartları taşıma.
2. Auth offline/yeniden deneme/çıkış UX, üç ham fetch yolunun timeout ve session guard uyumu; yeni Türkçe/İngilizce/Almanca hata metinleri gerektiğinde mevcut sözlükten.
3. Onboarding 17 hata, menü 7, ayarlar 7; önce lint toolchain kararını sabitle, sonra davranış ve erişilebilirlik testleri. Diğer ekranların tamamı JSON envanterinde.
4. iOS sağlayıcı ve gerçek cihaz izin/teslim/çıkış/deep link kabulü.
5. Yerel release denetiminin iki eksiği: `GoogleService-Info.plist` ve iOS submit kimlikleri. Sırlar rapora/Git'e konmayacak; mağaza gönderimi ayrıca onaylanacak.
6. HepsiHal API/tema adaptörü + bağımsız Expo kabuğu; ardından native ekranlar. Tam uygulama kopyalama bu kapılar geçmeden tamamlandı sayılmaz.

## Tekrarlanabilir kontroller

```bash
# Repo kökünden:
bun install --frozen-lockfile --ignore-scripts --filter goldmoodastro-mobile
cd mobile/app
bun run test:smoke
bun run typecheck
../../node_modules/.bin/eslint src/lib/core src/lib/api.ts src/lib/storage.ts src/lib/notifications.ts src/hooks/useAuth.ts app/_layout.tsx --quiet
bun run lint
node scripts/check-release-readiness.mjs
```

Son iki komut **şu an geçmiyor**; yukarıdaki açıklar nedeniyle beklenen ve raporlanan sonuç. Smoke testleri native build veya mağaza kabul kanıtı değildir.

## Birincil kaynaklar

- [Expo54 ImagePicker](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/): uyumlu `~17.0.11` sürümü.
- [Expo54 Notifications](https://docs.expo.dev/versions/v54.0.0/sdk/notifications/): native token türü ve cihaz/build koşulları.
- [Expo54 resmî şablonu](https://github.com/expo/expo/blob/sdk-54/templates/expo-template-default/package.json): lint toolchain karşılaştırması; otomatik SDK yükseltmesi yapılmadı.

Yerel mobil QA standardı ve React inceleme kuralları gereği oturum aboneliği tekilleştirildi, aynı bilgiyi tekrar tutan ready state kaldırıldı; görsel ekran değişikliği yapılmadı.
