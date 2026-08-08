#!/usr/bin/env bash
set -euo pipefail

MANIFEST=".next/prerender-manifest.json"
PORT="${PORT:-3095}"
HOST="${HOST:-127.0.0.1}"

# bun'u ortamdan çöz (prod /usr/local/bin, yerel ~/.bun); sabit kullanıcı-yolu
# hardcode'u ortam değişince "bun: No such file" ile pm2 crash-loop'a sokuyordu.
BUN="$(command -v bun || true)"
[[ -z "$BUN" ]] && for c in /usr/local/bin/bun "$HOME/.bun/bin/bun" /home/orhan/.bun/bin/bun; do [[ -x "$c" ]] && BUN="$c" && break; done
[[ -z "$BUN" ]] && { echo "[pm2-start] bun bulunamadi"; exit 1; }

if [[ ! -f "$MANIFEST" ]]; then
  echo "[pm2-start] Missing $MANIFEST, running production build..."
  "$BUN" run build
fi

echo "[pm2-start] Starting Next.js on ${HOST}:${PORT} (bun: $BUN)"
exec "$BUN" run start -- -p "$PORT" -H "$HOST"
