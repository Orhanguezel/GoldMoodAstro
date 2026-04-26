#!/usr/bin/env bash
# GoldMoodAstro — VPS log shortcut'ları
#
#   ./deploy/logs.sh [target] [-n LINES] [-f]
#
# Targets:
#   backend        backend PM2 logs (default)
#   admin          admin panel PM2 logs
#   frontend       frontend PM2 logs
#   pm2            tüm PM2 process listesi + son 20 satır combined
#   nginx          nginx access + error son 50 satır
#   nginx-access   nginx access log
#   nginx-error    nginx error log
#   backup         backup cron log
#   mysql          mysql error log
#   sshd           ssh giriş denemeleri (auth.log)
#   all            backend + admin + frontend birlikte tail -f
#
# Bayraklar:
#   -n N    Son N satır (default 100)
#   -f      Follow (tail -f)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRED="$ROOT/.secrets/credentials.env"
[[ -f "$CRED" ]] || { echo "❌ $CRED bulunamadı"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$CRED"; set +a

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
SSH_KEY_PATH="${SSH_KEY/#\~/$HOME}"
SSH_OPTS=(-i "$SSH_KEY_PATH" -t)

TARGET="backend"
LINES=100
FOLLOW=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    backend|admin|frontend|pm2|nginx|nginx-access|nginx-error|backup|mysql|sshd|all)
      TARGET="$1"; shift ;;
    -n) LINES="$2"; shift 2 ;;
    -f) FOLLOW=1; shift ;;
    -h|--help) sed -n '2,/^set -euo/p' "$0" | sed 's/^# \?//'; exit 0 ;;
    *) echo "Bilinmeyen argüman: $1"; exit 2 ;;
  esac
done

case "$TARGET" in
  backend|admin|frontend)
    NAME="goldmoodastro-$TARGET"
    if [[ $FOLLOW -eq 1 ]]; then
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "pm2 logs $NAME --lines $LINES"
    else
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "pm2 logs $NAME --lines $LINES --nostream"
    fi
    ;;
  pm2)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "pm2 list && echo && pm2 logs --lines 20 --nostream"
    ;;
  nginx)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "echo '=== access ===' && tail -n $LINES /var/log/nginx/access.log && echo && echo '=== error ===' && tail -n $LINES /var/log/nginx/error.log"
    ;;
  nginx-access)
    if [[ $FOLLOW -eq 1 ]]; then
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -f /var/log/nginx/access.log"
    else
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -n $LINES /var/log/nginx/access.log"
    fi
    ;;
  nginx-error)
    if [[ $FOLLOW -eq 1 ]]; then
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -f /var/log/nginx/error.log"
    else
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -n $LINES /var/log/nginx/error.log"
    fi
    ;;
  backup)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -n $LINES /var/backups/goldmoodastro/backup.log && echo && ls -lh /var/backups/goldmoodastro/db-*.sql.gz 2>/dev/null | tail -10"
    ;;
  mysql)
    if [[ $FOLLOW -eq 1 ]]; then
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -f /var/log/mysql/error.log"
    else
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "tail -n $LINES /var/log/mysql/error.log"
    fi
    ;;
  sshd)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "grep -E 'sshd|Accepted|Failed' /var/log/auth.log 2>/dev/null | tail -n $LINES || journalctl -u ssh --no-pager -n $LINES"
    ;;
  all)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "pm2 logs --lines $LINES"
    ;;
esac
