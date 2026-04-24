

# Şifre sorar
mysql -u root -p

ADMIN_EMAIL="admin@site.com" ADMIN_PASSWORD="SüperGizli!" bun run db:seed

ALLOW_DROP=true bun run db:seed


cd /var/www/konigsmassage/backend

rm -rf dist .tsbuildinfo
bun run build

pm2 restart 0
pm2 restart 1


mkdir -p dist/db/seed/sql
cp -f src/db/seed/sql/*.sql dist/db/seed/sql/


cd ~/Documents/productsPark   # doğru klasör
git status                    # ne değişmiş gör
git add -A
git commit -m "mesajın"
git pull --rebase origin main
git push origin main




-- 1. Yeni veritabanını oluştur (örnek: konigsmassage)
CREATE DATABASE `konigsmassage` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Uygulama kullanıcısını oluştur / şifresini ayarla
-- (hem localhost hem 127.0.0.1 hem de istersen % için)
CREATE USER IF NOT EXISTS 'app'@'localhost' IDENTIFIED BY 'app';
CREATE USER IF NOT EXISTS 'app'@'127.0.0.1' IDENTIFIED BY 'app';
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'app';

-- 3. Yetkileri ver
GRANT ALL PRIVILEGES ON `konigsmassage`.* TO 'app'@'localhost';
GRANT ALL PRIVILEGES ON `konigsmassage`.* TO 'app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `konigsmassage`.* TO 'app'@'%';

FLUSH PRIVILEGES;

-- (İleride şifreyi değiştirmek istersen)
-- ALTER USER 'app'@'localhost' IDENTIFIED BY 'yeniSifre';
-- ALTER USER 'app'@'127.0.0.1' IDENTIFIED BY 'yeniSifre';
-- ALTER USER 'app'@'%' IDENTIFIED BY 'yeniSifre';


ALLOW_DROP=true bun run db:seed
# gerekirse explicit:
NODE_ENV=production ALLOW_DROP=true bun run db:seed




```sh
pm2 flush


cd /var/www/konigsmassage
git fetch --prune
git reset --hard origin/main

cd backend
bun run build

# çalışan süreç kesilmeden reload
pm2 reload ecosystem.config.cjs --env production

# gerekirse log izle
pm2 logs konigsmassage-backend --lines 100

```



