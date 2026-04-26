#!/usr/bin/env bash
# GoldMoodAstro — VPS backup kurulumu (bir kerelik, idempotent)
# Kurulduktan sonra her gün 03:00'te DB dump alır, 7 gün tutar.
#
#   ./deploy/setup-backup.sh                # cron + script kur
#   ./deploy/setup-backup.sh --run-now      # kur + hemen bir backup al
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadı"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
remote_sh() { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -s'; }

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()  { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }

RUN_NOW=0
[[ "${1:-}" == "--run-now" ]] && RUN_NOW=1

say "Backup script + cron kurulumu"
remote_sh <<EOF
set -euo pipefail

# 1) MySQL credentials file (mysqldump için, parolayı script'e koymadan)
cat > /root/.goldmoodastro-backup.cnf <<'CNF'
[client]
user=${PROD_DB_USER}
password=${PROD_DB_PASSWORD}
host=${PROD_DB_HOST}
CNF
chmod 600 /root/.goldmoodastro-backup.cnf

# 2) Backup script
cat > /usr/local/bin/goldmoodastro-backup <<'BASH'
#!/usr/bin/env bash
# GoldMoodAstro — günlük DB backup
# Cron tarafından çağrılır. Manuel çalıştırılabilir.
set -euo pipefail

BACKUP_DIR=/var/backups/goldmoodastro
RETENTION_DAYS=7
DB_NAME=goldmoodastro
LOG_FILE="\$BACKUP_DIR/backup.log"

mkdir -p "\$BACKUP_DIR"
TS=\$(date +%Y%m%d-%H%M%S)
OUT="\$BACKUP_DIR/db-\$TS.sql.gz"

log() { echo "[\$(date -u +%Y-%m-%dT%H:%M:%SZ)] \$*" >> "\$LOG_FILE"; }

if mysqldump --defaults-file=/root/.goldmoodastro-backup.cnf \\
     --single-transaction --quick --lock-tables=false \\
     --routines --triggers --events \\
     --no-tablespaces \\
     "\$DB_NAME" 2>>"\$LOG_FILE" | gzip > "\$OUT"; then
  SZ=\$(du -h "\$OUT" | cut -f1)
  log "OK db-\$TS.sql.gz (\$SZ)"
else
  log "FAIL db-\$TS.sql.gz"
  rm -f "\$OUT"
  exit 1
fi

# Retention: N günden eski dump'ları sil
find "\$BACKUP_DIR" -maxdepth 1 -name 'db-*.sql.gz' -mtime +"\$RETENTION_DAYS" -delete

# Log retention: 30 günden eski kayıtları kırp
if [[ -f "\$LOG_FILE" ]] && [[ \$(wc -l <"\$LOG_FILE") -gt 1000 ]]; then
  tail -500 "\$LOG_FILE" > "\$LOG_FILE.tmp" && mv "\$LOG_FILE.tmp" "\$LOG_FILE"
fi
BASH
chmod +x /usr/local/bin/goldmoodastro-backup

# 3) Cron — her gün 03:00 UTC
cat > /etc/cron.d/goldmoodastro-backup <<'CRON'
# GoldMoodAstro — günlük DB backup (03:00 UTC)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 3 * * * root /usr/local/bin/goldmoodastro-backup
CRON
chmod 644 /etc/cron.d/goldmoodastro-backup

# 4) Klasör + log dosyası
mkdir -p /var/backups/goldmoodastro
touch /var/backups/goldmoodastro/backup.log
chmod 750 /var/backups/goldmoodastro

echo "  → /usr/local/bin/goldmoodastro-backup"
echo "  → /etc/cron.d/goldmoodastro-backup (her gün 03:00 UTC)"
echo "  → /var/backups/goldmoodastro/"
EOF
ok "Kurulum tamam"

if [[ $RUN_NOW -eq 1 ]]; then
  say "İlk backup'ı şimdi al"
  remote_sh <<'BASH'
/usr/local/bin/goldmoodastro-backup
ls -lh /var/backups/goldmoodastro/db-*.sql.gz | tail -3
echo
tail -5 /var/backups/goldmoodastro/backup.log
BASH
  ok "İlk backup alındı"
fi

echo
echo "Kullanım:"
echo "  ssh goldmoodastro '/usr/local/bin/goldmoodastro-backup'   # manuel backup"
echo "  ssh goldmoodastro 'ls -lh /var/backups/goldmoodastro/'    # backup'ları listele"
echo "  ssh goldmoodastro 'tail /var/backups/goldmoodastro/backup.log'"
echo
echo "Backup'ı lokale çekmek için:"
echo "  scp goldmoodastro:/var/backups/goldmoodastro/db-LATEST.sql.gz ./backups/"
