'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Room, RoomEvent } from 'livekit-client';
import { BASE_URL } from '@/integrations/rtk/constants';
import { tokenStore } from '@/integrations/rtk/token';

type LiveKitTokenResponse = {
  token: string;
  room: string;
  ws_url: string;
  expires_at: string;
};

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

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
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-between rounded-[var(--gm-radius-xl)] border border-[var(--gm-border)] bg-[var(--gm-surface)] p-8 shadow-[var(--gm-shadow-card)]">
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
      </section>
    </main>
  );
}
