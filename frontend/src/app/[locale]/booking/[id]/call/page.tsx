'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/integrations/rtk/constants';
import { tokenStore } from '@/integrations/rtk/token';
import { useGetCustomerReadingsForConsultantQuery } from '@/integrations/rtk/hooks';
import type { HistoryItem, ReadingType } from '@/integrations/rtk/public/history.public.endpoints';
import BookingMessageButton from '@/components/common/BookingMessageButton';

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
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32 lg:pt-40 pb-20 px-4 text-[var(--gm-text)] overflow-hidden relative">
      
      {/* Background Decorations */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] aura-mint opacity-[0.05] blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] aura-rose opacity-[0.05] blur-[100px] pointer-events-none" />
      
      {/* Subtle Orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.1]">
        <svg viewBox="0 0 280 280" fill="none" className="w-full h-full rotate-slow">
          <circle cx="140" cy="140" r="120" stroke="currentColor" className="text-[var(--gm-gold-deep)]" strokeWidth="0.4" strokeDasharray="2 6" />
        </svg>
      </div>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        
        {/* Main Call UI */}
        <div className="flex min-h-[70vh] flex-col items-center justify-between rounded-[var(--gm-radius-xl)] border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/40 backdrop-blur-md p-10 lg:p-16 shadow-[var(--gm-shadow-card)]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={cn("w-2 h-2 rounded-full", state === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-[var(--gm-muted)]')} />
              <p className="section-label mb-0">GoldMoodAstro Live</p>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl text-[var(--gm-text)] tracking-tight">Sesli Görüşme</h1>
            <p className="mt-4 text-sm font-serif italic text-[var(--gm-muted)]">
              {state === 'connecting' && 'Yıldızlarla bağlantı kuruluyor...'}
              {state === 'connected' && 'Bağlantı güvenli ve aktif.'}
              {state === 'reconnecting' && 'Bağlantı tazeleniyor...'}
              {state === 'disconnected' && 'Görüşme sonlandı.'}
              {state === 'error' && 'Bir enerji kesintisi oluştu.'}
            </p>
            {error ? <p className="mt-4 text-sm text-[var(--gm-error)] font-medium bg-[var(--gm-error)]/5 py-2 px-4 rounded-lg">{error}</p> : null}
          </div>

          <div className="flex flex-col items-center gap-8 my-12">
            <div className="relative">
              {/* Pulsing Aura */}
              {state === 'connected' && (
                <div className="absolute inset-0 rounded-full bg-[var(--gm-gold)]/20 blur-2xl animate-pulse" />
              )}
              <div className="relative size-44 lg:size-52 grid place-items-center rounded-full border border-[var(--gm-gold)]/30 bg-[var(--gm-bg-deep)] shadow-glow">
                <span className="font-display text-5xl lg:text-6xl text-[var(--gm-gold)]">GM</span>
              </div>
            </div>
            <div className="font-display text-3xl lg:text-4xl tracking-widest text-[var(--gm-gold)]">
              {mm}:{ss}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 w-full">
            <button
              type="button"
              onClick={toggleMic}
              disabled={state !== 'connected' && state !== 'reconnecting'}
              className={cn(
                "min-w-[160px] py-4 rounded-full border transition-all duration-300 font-display text-[11px] tracking-widest uppercase",
                muted 
                  ? "bg-[var(--gm-error)]/10 border-[var(--gm-error)]/30 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/20" 
                  : "bg-[var(--gm-bg-deep)] border-[var(--gm-border-soft)] text-[var(--gm-text)] hover:bg-[var(--gm-surface-high)]"
              )}
            >
              {muted ? 'Mikrofon Kapalı' : 'Mikrofon Açık'}
            </button>
            <button
              type="button"
              onClick={hangup}
              className="btn-premium min-w-[160px] py-4 shadow-gold hover:bg-red-900/90"
            >
              Görüşmeyi Bitir
            </button>
            <BookingMessageButton bookingId={bookingId} variant="secondary" label="Mesaj" />
          </div>

          <Link href={`/${locale}/profile/bookings`} className="mt-12 text-[10px] font-display tracking-[0.3em] text-[var(--gm-muted)] uppercase hover:text-[var(--gm-gold)] transition-colors">
            ← Randevularıma dön
          </Link>
        </div>

        {/* Sidebar: Customer History */}
        <aside className="rounded-[var(--gm-radius-xl)] border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/60 backdrop-blur-md p-8 shadow-[var(--gm-shadow-soft)] h-fit">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-4 text-left group"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gm-gold)] mb-1">
                Müşteri Geçmişi
              </span>
              <span className="block font-display text-2xl text-[var(--gm-text)]">
                Son Okumalar
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--gm-muted)] group-hover:text-[var(--gm-gold)] transition-colors">
              {historyOpen ? 'Kapat' : 'Aç'}
            </span>
          </button>

          {historyOpen ? (
            <div className="mt-8 space-y-4">
              {readingsLoading ? (
                [1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl bg-[var(--gm-bg-deep)]/50" />
                ))
              ) : customerReadings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--gm-border-soft)] p-8 text-center text-sm italic text-[var(--gm-muted)]">
                  Henüz bir geçmiş bulunamadı.
                </div>
              ) : (
                customerReadings.map((item) => (
                  <article
                    key={`${item.type}:${item.id}`}
                    className="group rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface-high)]/40 p-5 hover:border-[var(--gm-gold)]/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] text-[var(--gm-gold)] shadow-sm">
                        <span className="font-display text-sm">{READING_ICONS[item.type]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gm-gold-deep)]">
                            {READING_LABELS[item.type]}
                          </span>
                          <span className="shrink-0 text-[10px] font-serif italic text-[var(--gm-muted)]">
                            {shortDate(item.created_at)}
                          </span>
                        </div>
                        <h2 className="truncate font-serif text-base text-[var(--gm-text)] mb-1">
                          {item.title}
                        </h2>
                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--gm-text-dim)] opacity-80">
                          {item.snippet || 'Detaylı yorum içeriği...'}
                        </p>
                        <Link
                          href={readingHref(locale, item)}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)] transition-colors"
                        >
                          İncele <ArrowRight size={10} />
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
