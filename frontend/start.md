

#frontend  local 

rm -rf node_modules  .next
bun install
bun run noEmit
bun run build
bun run dev


export NEXT_PUBLIC_API_URL=http://localhost:8086/api
export NEXT_PUBLIC_SITE_URL=https://www.konigsmassage.de
export TEST_LOCALE=tr
export TEST_LOCALES_CSV=tr,en,de
export CANONICAL_HOST=konigsmassage.de

bun run test:e2e

clear
bun run test:e2e



lighthous test.. 
crom 
bun run perf:audit
# veya
CHROME_PATH=/usr/bin/google-chrome bun run perf:audit
# Chromium ise: CHROME_PATH=$(which chromium-browser)  # dağıtıma göre değişir




#frontend  prod

cd /var/www/tariftarif/frontend
rm -rf node_modules  .next
bun install
bun run typecheck
NODE_ENV=production bun run build
pm2 restart tariftarif-frontend
pm2 save


pm2 delete tariftarif-frontend || true
pm2 start /var/www/tariftarif/frontend/ecosystem.frontend.config.cjs
pm2 save




bun run analyze

which bun         # yolunu gör (ör: /usr/bin/bun)
PORT=3012 NODE_ENV=production \
pm2 start "$(which bun)" --name guezelwebdesign-frontend -- run start


#PM2 kalıcı başlatma

pm2 status
pm2 save
pm2 startup systemd -u root --hp /root   # çıktıda verdiği komutu da çalıştır
# log rotate öneririm:
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14



harika—teşhis doğru: **yanlış porta (27018)** gitmekten kaynaklıymış.
işte “kısa yol” şifresi; bilgisayarı her açtığında ya da bağlantı koparsa bunları uygula 👇

# Hızlı durum kontrolü

```bash
# 27019 tüneli dinliyor mu?
ss -lntp | grep :27019 || echo "27019 dinlemiyor"

# Mongo kimliği + tünel test
mongosh "mongodb://tarif_user:App_Sifresi_9uC7u@127.0.0.1:27019/tariftarif?authSource=tariftarif" \
  --eval 'db.runCommand({connectionStatus:1})'
```

# Acil başlat (anlık, 10 sn’lik çözüm)

```bash
# Eski/bozuk proses varsa temizle
pkill -f "ssh .* 127.0.0.1:27019:127.0.0.1:27017" 2>/dev/null || true

# Tüneli hemen ayağa kaldır
ssh -fN -M 0 \
  -o ExitOnForwardFailure=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:27019:127.0.0.1:27017 tarif-vps
```

# Otomatik çalışsın (systemd user – bir kere ayarla)

> Bunu önceden kurmuştuk; sadece kontrol/yeniden başlat komutları:

```bash
# Kullanıcı servislerini yenile & başlat
systemctl --user daemon-reload
systemctl --user enable autossh-tarif-vps-mongo.service
systemctl --user restart autossh-tarif-vps-mongo.service

# Durum ve log
systemctl --user status autossh-tarif-vps-mongo.service
journalctl --user -u autossh-tarif-vps-mongo.service -n 50 --no-pager
```

> Oturum açmadan da ayağa kalksın istersen (tek seferlik):

```bash
loginctl enable-linger "$USER"
```

# GUI’de doğru bağlantı

* **Her zaman 27019** (tarif-vps için).
* URI’yi direkt yapıştır:
  `mongodb://tarif_user:App_Sifresi_9uC7u@127.0.0.1:27019/tariftarif?authSource=tariftarif`
* TLS/SSL: **Off** (lokal tünel).
* Form kullanıyorsan **Authentication Database = tariftarif**.

# Minik kısayol (istersen .bashrc’ye ekle)

```bash
echo '
t19-kill(){ pkill -f "ssh .* 127.0.0.1:27019:127.0.0.1:27017" 2>/dev/null || true; }
t19-start(){ ssh -fN -M 0 -o ExitOnForwardFailure=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 127.0.0.1:27019:127.0.0.1:27017 tarif-vps; }
t19-test(){ mongosh "mongodb://tarif_user:App_Sifresi_9uC7u@127.0.0.1:27019/tariftarif?authSource=tariftarif" --eval "db.runCommand({ping:1})"; }
' >> ~/.bashrc && source ~/.bashrc
```

Sonra:

* `t19-kill` → temizle
* `t19-start` → tüneli aç
* `t19-test` → ping et

> Not: **guezelweb** tünelin ayrı kalsın (**27018**). karışmaması için tarif-vps = **27019** olarak devam et.
