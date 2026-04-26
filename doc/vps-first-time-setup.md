# VPS İlk Kurulum Rehberi — GoldMoodAstro

Bu adımlar bir kez yapılır. Sonraki deploy'lar GitHub Actions ile otomatik.

## 1. MySQL Veritabanı

```bash
mysql -u root -p
CREATE DATABASE goldmoodastro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goldmood'@'127.0.0.1' IDENTIFIED BY 'GUCLU_SIFRE_BURAYA';
GRANT ALL PRIVILEGES ON goldmoodastro.* TO 'goldmood'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## 2. Dizin Yapısı

```bash
sudo mkdir -p /var/www/goldmoodastro/{backend,admin_panel}
sudo chown -R orhan:orhan /var/www/goldmoodastro
```

## 3. Backend .env

```bash
nano /var/www/goldmoodastro/backend/.env
```

`.env.example`'ı kopyala, şu alanları doldur:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME=goldmoodastro`
- `JWT_SECRET`, `COOKIE_SECRET` (openssl rand -base64 32)
- `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `CLOUDINARY_*` veya `STORAGE_DRIVER=local`
- `SMTP_*` mail ayarları
- `IYZIPAY_API_KEY`, `IYZIPAY_SECRET_KEY`, `IYZIPAY_BASE_URL`
- `CORS_ORIGIN=https://www.goldmoodastro.com,https://admin.goldmoodastro.com`
- `PUBLIC_URL=https://www.goldmoodastro.com`
- `FRONTEND_URL=https://www.goldmoodastro.com`

## 4. Admin Panel .env

```bash
nano /var/www/goldmoodastro/admin_panel/.env
```

```
NEXT_PUBLIC_API_URL=https://www.goldmoodastro.com/api
NEXT_PUBLIC_SITE_URL=https://admin.goldmoodastro.com
```

## 5. DB Seed (İlk kez)

```bash
cd /var/www/goldmoodastro/backend
bun install
bun run db:seed
```

## 6. PM2 İlk Başlatma

```bash
# Backend
cd /var/www/goldmoodastro/backend
pm2 start ecosystem.config.cjs --only goldmoodastro-backend
pm2 save
pm2 startup  # Sistem boot'unda otomatik başlat

# Admin (Next.js build sonrası)
cd /var/www/goldmoodastro/admin_panel
# ecosystem.config.cjs varsa:
pm2 start ecosystem.config.cjs --only goldmoodastro-admin
pm2 save
```

## 7. Nginx

```bash
sudo cp /var/www/goldmoodastro/nginx/goldmoodastro.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/goldmoodastro.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 8. SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d goldmoodastro.com -d www.goldmoodastro.com
sudo certbot --nginx -d admin.goldmoodastro.com
```

## 9. GitHub Actions Secrets

Repo → Settings → Secrets → Actions:
- `VPS_HOST` — sunucu IP adresi
- `VPS_USER` — SSH kullanıcı adı (örn: orhan)
- `VPS_KEY` — `~/.ssh/deploy_key` içeriği (private key)

## 10. Port Kontrol

```bash
ss -ltnp | grep ':8094'   # Backend
ss -ltnp | grep ':3094'   # Admin
```
