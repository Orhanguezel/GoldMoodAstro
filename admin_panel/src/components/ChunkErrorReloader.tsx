'use client';

import { useEffect } from 'react';

/**
 * Bayat build koruması: deploy sonrası tarayıcıdaki ESKİ sayfa, artık sunucuda olmayan
 * eski chunk'ları (ör. /_next/static/chunks/14-xxxx.js) istediğinde `ChunkLoadError` /
 * "Loading chunk failed" / "MIME type text/plain not executable" hatası çıkar.
 * Bu bileşen o hatayı yakalar ve sayfayı BİR KEZ yeniler → taze HTML + güncel chunk gelir,
 * kullanıcı elle Ctrl+Shift+R yapmak zorunda kalmaz.
 *
 * Döngü koruması: son otomatik reload zamanını sessionStorage'da tutar; COOLDOWN içinde
 * tekrar reload etmez (sunucu gerçekten kırıksa sonsuz reload olmaz).
 */
const RELOAD_TS_KEY = 'gm-chunk-reload-ts';
const COOLDOWN_MS = 15_000;

function isChunkError(reason: unknown): boolean {
  const anyR = reason as { name?: unknown; message?: unknown } | null | undefined;
  const name = String(anyR?.name ?? '');
  const msg = String(anyR?.message ?? reason ?? '');
  return (
    name === 'ChunkLoadError' ||
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk [\w./-]+ failed/i.test(msg) ||
    /Failed to load chunk/i.test(msg) ||
    /(Failed to fetch|error loading) dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /'text\/plain'.*not executable/i.test(msg)
  );
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_TS_KEY) || '0');
    const now = Date.now();
    if (now - last < COOLDOWN_MS) return; // yakın zamanda yenilendi → döngüyü engelle
    sessionStorage.setItem(RELOAD_TS_KEY, String(now));
  } catch {
    /* sessionStorage yoksa yine de yenile */
  }
  window.location.reload();
}

export default function ChunkErrorReloader() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.error) || isChunkError(e.message)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkError(e.reason)) reloadOnce();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
