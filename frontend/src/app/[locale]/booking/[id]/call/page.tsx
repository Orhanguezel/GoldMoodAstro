'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Room, RoomEvent } from 'livekit-client';
import { BASE_URL } from '@/integrations/rtk/constants';
import { tokenStore } from '@/integrations/rtk/token';
import { useGetCustomerReadingsForConsultantQuery } from '@/integrations/rtk/hooks';
import type { HistoryItem, ReadingType } from '@/integrations/rtk/public/history.public.endpoints';

type LiveKitTokenResponse = {
  token: string;
  room: string;
  ws_url: string;
  expires_at: string;
};

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

const READING_LABELS: Record<ReadingType, string> = {
  tarot: 'Tarot',
  coffee: 'Kahve',
  dream: 'Rüya',
  numerology: 'Numeroloji',
  yildizname: 'Yıldızname',
  synastry: 'Sinastri',
};

const READING_ICONS: Record<ReadingType, string> = {
  tarot: 'T',
  coffee: 'K',
  dream: 'R',
  numerology: 'N',
  yildizname: 'Y',
  synastry: 'S',
};

function readingHref(locale: string, item: HistoryItem) {
  const routes: Record<ReadingType, string> = {
    tarot: `/tarot/reading/${item.id}`,
    coffee: `/kahve-fali/result/${item.id}`,
    dream: `/ruya-tabiri/result/${item.id}`,
    numerology: '/numeroloji',
    yildizname: `/yildizname/result/${item.id}`,
    synastry: `/sinastri/result/${item.id}`,
  };
  return `/${locale}${routes[item.type]}`;
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

async function fetchLiveKitToken(bookingId: string): Promise<LiveKitTokenResponse> {
  const res = await fetch(`${BASE_URL}/livekit/token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload.data;
}

async function endLiveKitSession(bookingId: string) {
  await fetch(`${BASE_URL}/livekit/session/end`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
    },
    body: JSON.stringify({ booking_id: bookingId }),
  }).catch(() => {});
}

export default function BookingCallPage() {
  const params = useParams<{ locale: string; id: string }>();
  const bookingId = String(params.id || '');
  const locale = String(params.locale || 'tr');

  const roomRef = useRef<Room | null>(null);
  const endingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<ConnectionState>('idle');
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);
  const { data: customerReadings = [], isFetching: readingsLoading } =
    useGetCustomerReadingsForConsultantQuery({ bookingId, limit: 10 }, { skip: !bookingId });

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      setState('connecting');
      setError('');

      try {
        const livekit = await fetchLiveKitToken(bookingId);
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.Connected, () => {
          setState('connected');
          startTimer();
        });
        room.on(RoomEvent.Disconnected, () => {
          setState('disconnected');
          stopTimer();
        });
        room.on(RoomEvent.Reconnecting, () => setState('reconnecting'));
        room.on(RoomEvent.Reconnected, () => setState('connected'));

        await room.connect(livekit.ws_url, livekit.token);
        await room.localParticipant.setMicrophoneEnabled(true);

        if (!cancelled) {
          setState('connected');
          startTimer();
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setError(err instanceof Error ? err.message : 'Görüşme başlatılamadı.');
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      stopTimer();
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [bookingId]);

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
  }

  function stopTimer() {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function toggleMic() {
    const nextMuted = !muted;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(!nextMuted);
    setMuted(nextMuted);
  }

  async function hangup() {
    if (endingRef.current) return;
    endingRef.current = true;
    stopTimer();
    roomRef.current?.disconnect();
    roomRef.current = null;
    await endLiveKitSession(bookingId);
    window.location.href = `/${locale}/profile/bookings`;
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 py-10 text-[var(--gm-text)]">
      <section className="mx-auto grid min-h-[70vh] max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[70vh] flex-col items-center justify-between rounded-[var(--gm-radius-xl)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-8 shadow-[var(--gm-shadow-card)]">
          <div className="text-center">
            <p className="section-label">GoldMoodAstro LiveKit</p>
            <h1 className="mt-3 font-display text-3xl">Sesli Görüşme</h1>
            <p className="mt-2 text-sm text-[var(--gm-muted)]">
              {state === 'connecting' && 'Bağlanıyor'}
              {state === 'connected' && 'Bağlandı'}
              {state === 'reconnecting' && 'Yeniden bağlanıyor'}
              {state === 'disconnected' && 'Bağlantı kesildi'}
              {state === 'error' && 'Bağlantı kurulamadı'}
            </p>
            {error ? <p className="mt-3 text-sm text-[var(--gm-error)]">{error}</p> : null}
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="grid size-36 place-items-center rounded-full border border-[var(--gm-border)] bg-[var(--gm-bg-deep)] shadow-[var(--gm-shadow-gold)]">
              <span className="font-display text-4xl text-[var(--gm-gold)]">GM</span>
            </div>
            <div className="font-mono text-2xl text-[var(--gm-gold)]">
              {mm}:{ss}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleMic}
              disabled={state !== 'connected' && state !== 'reconnecting'}
              className="btn-outline-premium min-w-28 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {muted ? 'Mikrofon Aç' : 'Sessize Al'}
            </button>
            <button type="button" onClick={hangup} className="btn-premium min-w-28">
              Kapat
            </button>
          </div>

          <Link href={`/${locale}/profile/bookings`} className="text-sm text-[var(--gm-muted)]">
            Randevularıma dön
          </Link>
        </div>

        <aside className="rounded-[var(--gm-radius-xl)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5 shadow-[var(--gm-shadow-card)]">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold)]">
                Müşteri Geçmişi
              </span>
              <span className="mt-1 block font-display text-xl text-[var(--gm-text)]">
                Son okumaları
              </span>
            </span>
            <span className="text-sm text-[var(--gm-muted)]">{historyOpen ? 'Kapat' : 'Aç'}</span>
          </button>

          {historyOpen ? (
            <div className="mt-5 space-y-3">
              {readingsLoading ? (
                [1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-xl bg-[var(--gm-bg-deep)]" />
                ))
              ) : customerReadings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--gm-border)] p-5 text-sm text-[var(--gm-muted)]">
                  Bu müşterinin henüz kayıtlı yorumu yok.
                </div>
              ) : (
                customerReadings.map((item) => (
                  <article
                    key={`${item.type}:${item.id}`}
                    className="rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--gm-border)] bg-[var(--gm-surface-high)] text-xs font-bold text-[var(--gm-gold)]">
                        {READING_ICONS[item.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gm-gold)]">
                            {READING_LABELS[item.type]}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--gm-muted)]">
                            {shortDate(item.created_at)}
                          </span>
                        </div>
                        <h2 className="truncate text-sm font-semibold text-[var(--gm-text)]">
                          {item.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--gm-muted)]">
                          {item.snippet || 'Önizleme metni yok.'}
                        </p>
                        <Link
                          href={readingHref(locale, item)}
                          target="_blank"
                          className="mt-3 inline-flex text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gm-gold)]"
                        >
                          Detayı aç
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
