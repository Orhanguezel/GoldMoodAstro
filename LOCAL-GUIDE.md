# GoldMoodAstro Local Geliştirme Rehberi

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları takip edin.

## 1. Veritabanı Hazırlığı
MySQL veritabanınızın çalıştığından emin olun.
- **Veritabanı Adı:** `goldmoodastro`
- **Kullanıcı/Şifre:** `app` / `app` (veya `.env` dosyanıza göre güncelleyin)

Tabloları oluşturmak ve test verilerini yüklemek için:
```bash
bun run db:seed
```

## 2. Servisleri Başlatma
Tüm servisleri (Backend + Admin Panel) tek komutla başlatabilirsiniz:
```bash
./start-local.sh
```
- **Backend:** [http://localhost:8094/api/v1](http://localhost:8094/api/v1)
- **Admin Panel:** [http://localhost:3094](http://localhost:3094)

## 3. Mobil Uygulamayı Çalıştırma
Mobil uygulama Expo ile çalışmaktadır.
```bash
cd mobile/app
bun install
bun run start
```

### Önemli Not: Gerçek Cihazda Test
Eğer mobil uygulamayı gerçek bir telefonda test edecekseniz, telefonunuzun bilgisayarınızdaki backend'e erişebilmesi gerekir:
1. Bilgisayarınızın yerel IP adresini bulun: `172.20.10.6`
2. `mobile/app/app.json` içindeki `apiUrl` değerini güncelleyin:
   ```json
   "extra": {
     "apiUrl": "http://172.20.10.6:8094/api/v1"
   }
   ```
3. `backend/.env` içindeki `CORS_ORIGIN` kısmına kendi IP'nizi eklemeyi unutmayın.

## 4. Admin Giriş Bilgileri
Seed verileriyle birlikte varsayılan admin hesabı:
- **Email:** `admin@example.com`
- **Şifre:** `admin123`
