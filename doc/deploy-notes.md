# Deploy Notları — GoldMoodAstro

Production deploy süreci, scripts, troubleshooting.

## VPS

| Parametre | Değer |
|-----------|-------|
| Host | `76.13.146.44` |
| Hostname | `srv1620684` |
| OS | Ubuntu 24.04 LTS |
| RAM / Disk | 8 GB / 96 GB |
| SSH alias | `goldmoodastro` |
| SSH key | `~/.ssh/goldmoodastro_root_ed25519` |
| Auth | sadece public key (PasswordAuth disabled) |
| Repo path | `/var/www/goldmoodastro/` |

## Domain & SSL

`.com` ana, alternatifler 301 → `.com`. Tüm 9 alan adı tek SAN sertifikasında.

| Domain | Yönlendirme |
|--------|-------------|
| `goldmoodastro.com` (+www) | Ana site (Next.js) |
| `admin.goldmoodastro.com` | Admin panel |
| `goldmoodastro.com.tr / .info / .online` (+www) | 301 → `goldmoodastro.com` |

Sertifika auto-renew: certbot systemd timer. Manuel kontrol:
```bash
ssh goldmoodastro 'certbot certificates'
ssh goldmoodastro 'certbot renew --dry-run'
```

## PM2 Servisleri

| Servis | Port | Interpreter | Ecosystem |
|--------|------|-------------|-----------|
| `goldmoodastro-backend` | 8094 | bun | `dist/index.js` |
| `goldmoodastro-admin` | 3094 | node | `next start` |
| `goldmoodastro-frontend` | 3095 | node | `next start` |

`pm2 startup systemd` ile sistem reboot'ta otomatik başlar.

## Scripts

Tümü lokalden çalışır, `.secrets/credentials.env`'i okur.

### `deploy/provision-vps.sh`

Bir kerelik VPS kurulumu. Idempotent — tekrar koşturulabilir.

Yaptığı işler: apt update + install, Bun, Node 22 (NodeSource), PM2, MySQL DB+user, UFW, nginx snippets, `backend/.env` üretimi, certbot SSL, PM2 startup systemd.

```bash
./deploy/provision-vps.sh
```

### `deploy/deploy.sh`

Her deploy'da çalıştırılır. rsync + bun install + build + pm2 (re)start.

```bash
./deploy/deploy.sh                    # backend + admin + frontend (full)
./deploy/deploy.sh backend            # sadece backend
./deploy/deploy.sh admin              # sadece admin
./deploy/deploy.sh frontend           # sadece frontend
./deploy/deploy.sh --seed             # full + db:seed:nodrop
./deploy/deploy.sh --fresh-seed       # full + DROP + seed (DİKKAT: prod data silinir)
```

### `deploy/sync-env.sh`

3rd-party credentials (Cloudinary, SMTP, Iyzipay, vb.) `credentials.env`'de değiştiğinde VPS'teki `backend/.env`'i yeniler.

```bash
./deploy/sync-env.sh                  # yenile + pm2 reload backend
./deploy/sync-env.sh --no-reload      # sadece dosyayı yenile
```

### `deploy/setup-backup.sh`

DB backup cron kurulumu. Bir kerelik.

- Klasör: `/var/backups/goldmoodastro/`
- Cron: her gün 03:00 UTC
- Retention: 7 gün
- Format: `db-YYYYMMDD-HHMMSS.sql.gz`

```bash
./deploy/setup-backup.sh              # sadece kur
./deploy/setup-backup.sh --run-now    # kur + hemen bir backup al
```

VPS'te manuel backup:
```bash
ssh goldmoodastro '/usr/local/bin/goldmoodastro-backup'
```

Backup'ı lokale çekme:
```bash
scp goldmoodastro:/var/backups/goldmoodastro/db-LATEST.sql.gz ./backups/
```

Backup'tan restore:
```bash
ssh goldmoodastro 'gunzip < /var/backups/goldmoodastro/db-XXXX.sql.gz | mysql --defaults-file=/root/.goldmoodastro-backup.cnf goldmoodastro'
```

### `deploy/logs.sh`

Log shortcut'ları.

```bash
./deploy/logs.sh backend              # son 100 satır backend log
./deploy/logs.sh backend -f           # tail -f
./deploy/logs.sh nginx                # nginx access + error
./deploy/logs.sh backup               # backup log + dump listesi
./deploy/logs.sh sshd                 # SSH giriş denemeleri
./deploy/logs.sh all                  # tüm pm2 servislerini birlikte tail
```

## İlk Kurulum (Sıfırdan)

```bash
# 1. DNS A kayıtları (.com, www, admin, .com.tr, .info, .online)
#    → 76.13.146.44

# 2. SSH key kurulumu (manuel, bir kerelik)
ssh-keygen -t ed25519 -f ~/.ssh/goldmoodastro_root_ed25519
ssh-copy-id -i ~/.ssh/goldmoodastro_root_ed25519 root@76.13.146.44
cat >> ~/.ssh/config <<EOF
Host goldmoodastro
  HostName 76.13.146.44
  User root
  IdentityFile ~/.ssh/goldmoodastro_root_ed25519
  IdentitiesOnly yes
EOF

# 3. VPS provisioning
./deploy/provision-vps.sh

# 4. İlk deploy (DB tablolarını oluşturmak için fresh seed)
./deploy/deploy.sh --fresh-seed

# 5. Backup cron kur
./deploy/setup-backup.sh --run-now
```

## 3rd-Party Credentials

`.secrets/credentials.env` alt kısmındaki boş alanları doldur, sonra:

```bash
./deploy/sync-env.sh
```

Doldurulması gerekenler:
- **Cloudinary** — media upload (yoksa local storage kullanılır)
- **SMTP** — mail gönderimi (yoksa şifre sıfırlama vb. patlar)
- **Google OAuth** — Google ile giriş
- **Agora** — sesli görüşme (KRİTİK)
- **Firebase FCM** — push bildirim (mobil için)
- **Iyzipay** — ödeme (KRİTİK, sandbox: `https://sandbox-api.iyzipay.com`)

## Troubleshooting

### Deploy patladı

`deploy/deploy.sh` set -e ile çalışır, ilk hatada durur. Log'lara bak:
```bash
./deploy/logs.sh backend -n 50
./deploy/logs.sh nginx-error -n 30
```

### Backend startup hatası

Bun interpreter ile çalışır (ESM uzantısız import için). Eski `interpreter: node` ile process kayıtlıysa:
```bash
ssh goldmoodastro 'pm2 delete goldmoodastro-backend; pm2 start /var/www/goldmoodastro/ecosystem.config.cjs --only goldmoodastro-backend'
```

### Nginx config hatası

```bash
ssh goldmoodastro 'nginx -t'
```

### SSL sertifika sorunu

```bash
ssh goldmoodastro 'certbot certificates'
ssh goldmoodastro 'systemctl status certbot.timer'
```

Eksik domain için expand:
```bash
ssh goldmoodastro 'certbot --expand -d goldmoodastro.com -d <yeni-domain>'
```

### MySQL erişimi

Root parolası: `.secrets/credentials.env` → `PROD_DB_ROOT_PASSWORD`.
App user: `goldmoodastro` / `PROD_DB_PASSWORD`.

```bash
ssh goldmoodastro 'mysql --defaults-file=/root/.goldmoodastro-backup.cnf goldmoodastro -e "SHOW TABLES"'
```

## Müşteri Sunum Önizlemeleri

`/1` ve `/2` route'larında static HTML servis edilir (geçici, sunum sonrası kaldırılabilir):

```
https://goldmoodastro.com/1   → previews/1.html
https://goldmoodastro.com/2   → previews/2.html
```

Kaldırmak için: `nginx/goldmoodastro.conf`'tan `location = /1` ve `/2` bloklarını sil + nginx reload + `/var/www/goldmoodastro/previews/` sil.
