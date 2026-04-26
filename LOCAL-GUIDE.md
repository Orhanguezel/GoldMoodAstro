# GoldMoodAstro — Local Geliştirme Rehberi

Yerel makinede backend + admin panel + frontend birlikte çalıştırma.

## 1. Gereksinimler

- Bun (1.3+)
- MySQL 8 (lokal)
- Node 20+ (Next.js 16 build için — `nvm use 22` veya NodeSource ile)

## 2. Veritabanı

Lokal MySQL üzerinde DB ve user:

```sql
CREATE DATABASE goldmoodastro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app'@'localhost' IDENTIFIED BY 'app';
GRANT ALL PRIVILEGES ON goldmoodastro.* TO 'app'@'localhost';
FLUSH PRIVILEGES;
```

Tablo + seed:
```bash
cd backend
bun run db:seed           # DROP + CREATE + seed (sıfırdan)
bun run db:seed:nodrop    # sadece eksikleri ekler
```

## 3. Ortam Dosyaları

- `backend/.env` — `backend/.env.example` baz alınarak doldurulur. JWT_SECRET ve COOKIE_SECRET için `.secrets/credentials.env`'deki değerleri kullanabilirsiniz.
- `admin_panel/.env` — `admin_panel/.env.example`'dan kopyalayın.
- `frontend/.env` — `frontend/.env.example`'dan kopyalayın.

`.secrets/credentials.env` master vault — git'e gitmez, lokal + prod tüm sırlar burada.

## 4. Servisleri Başlatma

Tek komut:
```bash
./start-local.sh
```

Veya ayrı ayrı:
```bash
bun run dev:backend    # → http://localhost:8094  (Swagger: /docs — sadece dev)
bun run dev:admin      # → http://localhost:3094
cd frontend && bun run dev   # → http://localhost:3000
```

## 5. Mobil (Flutter)

```bash
cd mobile/app
bun install
bun run start
```

**Gerçek cihazda test:** Lokal IP'nizi (örn. `192.168.x.x`) `mobile/app/app.json` içindeki `extra.apiUrl`'e yazın. `backend/.env` `CORS_ORIGIN`'e de aynı IP'yi ekleyin.

## 6. Admin Giriş

Seed verisindeki varsayılan admin:
- E-posta: `admin@goldmoodastro.com`
- Şifre: `.secrets/credentials.env` → `ADMIN_PASSWORD`

Custom admin oluşturmak için: `backend/.env`'de `ADMIN_EMAIL` + `ADMIN_PASSWORD` set edip `bun run db:seed`.

## 7. Sık Karşılaşılan Sorunlar

- **`Cannot find module './app'`** — backend ESM mode'da. Lokal'de `bun run dev` (Bun runtime) kullanın, `node` ile direkt başlatmayın.
- **`Next.js requires Node >= 20.9`** — `nvm use 22` veya NodeSource ile node 22 kurun. Ubuntu default 18.
- **CORS hatası** — `backend/.env` `CORS_ORIGIN` listesine local URL'i ekleyin (örn. `http://localhost:3000`).

## Production

Deploy script'leri `deploy/` altında. Detay: [doc/deploy-notes.md](doc/deploy-notes.md).
