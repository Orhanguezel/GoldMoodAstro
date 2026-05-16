'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Camera, CameraOff, Mic, MicOff, PhoneOff, Video } from 'lucide-react';
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/integrations/rtk/constants';
import { tokenStore } from '@/integrations/rtk/token';
import { 
  useGetCustomerReadingsForConsultantQuery, 
  useGetMyBookingQuery 
} from '@/integrations/rtk/hooks';
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

import PageContainer from '@/components/common/PageContainer';

export default function BookingCallPage() {
  const params = useParams<{ locale: string; id: string }>();
  const bookingId = String(params.id || '');
  const locale = String(params.locale || 'tr');

  const roomRef = useRef<Room | null>(null);
  const endingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<ConnectionState>('idle');
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);

  const { data: booking, isLoading: bookingLoading } = useGetMyBookingQuery(bookingId, { skip: !bookingId });
  const { data: customerReadings = [], isFetching: readingsLoading } =
    useGetCustomerReadingsForConsultantQuery({ bookingId, limit: 10 }, { skip: !bookingId });

  const isVideo = booking?.media_type === 'video';

  useEffect(() => {
    let cancelled = false;
    if (!booking) return;

    async function connect() {
      setState('connecting');
      setError('');

      try {
        const livekit = await fetchLiveKitToken(bookingId);
        if (cancelled) return;

        const room = new Room({ 
          adaptiveStream: true, 
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          }
        });
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

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
          if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        await room.connect(livekit.ws_url, livekit.token);
        
        // Always enable mic
        await room.localParticipant.setMicrophoneEnabled(true);
        
        // Enable camera if video call
        if (isVideo) {
          await room.localParticipant.setCameraEnabled(true);
          setCameraEnabled(true);
          
          // Attach local video
          const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (videoTrack?.videoTrack && localVideoRef.current) {
            videoTrack.videoTrack.attach(localVideoRef.current);
          }
        }

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
  }, [bookingId, booking, isVideo]);

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

  async function toggleCamera() {
    const nextEnabled = !cameraEnabled;
    await roomRef.current?.localParticipant.setCameraEnabled(nextEnabled);
    setCameraEnabled(nextEnabled);
  }

  async function hangup() {
    if (endingRef.current) return;
    endingRef.current = true;
    stopTimer();
    roomRef.current?.disconnect();
    roomRef.current = null;
    await endLiveKitSession(bookingId);
    window.location.href = `/${locale}/dashboard?tab=bookings`;
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  if (bookingLoading) {
    return (
      <PageContainer center className="bg-(--gm-bg) min-h-screen">
        <div className="w-10 h-10 border-2 border-(--gm-gold) border-t-transparent rounded-full animate-spin" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="full" className="bg-(--gm-bg) min-h-screen pt-32 lg:pt-40 pb-20 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-(--gm-info)/5 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-(--gm-gold)/5 blur-[100px] pointer-events-none rounded-full" />
      
      {/* Subtle Orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.1]">
        <svg viewBox="0 0 280 280" fill="none" className="w-full h-full rotate-slow">
          <circle cx="140" cy="140" r="120" stroke="currentColor" className="text-(--gm-gold-dim)" strokeWidth="0.4" strokeDasharray="2 6" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[var(--gm-w-wide)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        
        {/* Main Call UI */}
        <div className={cn(
          "flex min-h-[70vh] flex-col items-center justify-between rounded-[var(--gm-radius-xl)] border border-(--gm-border-soft) bg-(--gm-surface)/40 backdrop-blur-md p-6 lg:p-10 shadow-(--gm-shadow-card) overflow-hidden relative",
          isVideo && "p-0 bg-(--gm-bg-deep)/60"
        )}>
          
          {isVideo ? (
            <div className="relative w-full flex-1 bg-(--gm-bg-deep) overflow-hidden rounded-[var(--gm-radius-xl)]">
              {/* Remote Video (Full Screen) */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (PIP) */}
              <div className="absolute bottom-6 right-6 w-32 h-44 lg:w-40 lg:h-56 rounded-2xl border-2 border-(--gm-gold)/40 bg-(--gm-bg-deep) overflow-hidden shadow-2xl z-20">
                {cameraEnabled ? (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-(--gm-bg-deep)">
                    <CameraOff className="text-(--gm-muted)" />
                  </div>
                )}
              </div>

              {/* Status Overlay */}
              <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
                <div className={cn("w-2 h-2 rounded-full", state === 'connected' ? 'bg-(--gm-success) animate-pulse' : 'bg-(--gm-error)')} />
                <span className="font-display text-[10px] tracking-[0.2em] text-(--gm-text) uppercase bg-(--gm-bg-deep)/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {state === 'connected' ? `${mm}:${ss} • CANLI` : 'BAĞLANIYOR...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between flex-1 py-10 lg:py-16 w-full">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={cn("w-2 h-2 rounded-full", state === 'connected' ? 'bg-(--gm-success) animate-pulse' : 'bg-(--gm-muted)')} />
                  <p className="text-[10px] font-bold text-(--gm-gold-dim) tracking-[0.2em] uppercase mb-0">GoldMoodAstro Live</p>
                </div>
                <h1 className="font-serif text-4xl lg:text-5xl text-(--gm-text) tracking-tight">Sesli Görüşme</h1>
                <p className="mt-4 text-sm font-serif italic text-(--gm-muted)">
                  {state === 'connecting' && 'Yıldızlarla bağlantı kuruluyor...'}
                  {state === 'connected' && 'Bağlantı güvenli ve aktif.'}
                  {state === 'reconnecting' && 'Bağlantı tazeleniyor...'}
                  {state === 'disconnected' && 'Görüşme sonlandı.'}
                  {state === 'error' && 'Bir enerji kesintisi oluştu.'}
                </p>
                {error ? <p className="mt-4 text-sm text-(--gm-error) font-medium bg-(--gm-error)/5 py-2 px-4 rounded-lg">{error}</p> : null}
              </div>

              <div className="flex flex-col items-center gap-8 my-12">
                <div className="relative">
                  {state === 'connected' && (
                    <div className="absolute inset-0 rounded-full bg-(--gm-gold)/20 blur-2xl animate-pulse" />
                  )}
                  <div className="relative size-44 lg:size-52 grid place-items-center rounded-full border border-(--gm-gold)/30 bg-(--gm-bg-deep) shadow-(--gm-shadow-glow)">
                    <span className="font-serif text-5xl lg:text-6xl text-(--gm-gold)">GM</span>
                  </div>
                </div>
                <div className="font-serif text-3xl lg:text-4xl tracking-widest text-(--gm-gold)">
                  {mm}:{ss}
                </div>
              </div>
            </div>
          )}

          <div className={cn(
            "flex flex-wrap items-center justify-center gap-4 lg:gap-6 w-full p-8 z-30",
            isVideo && "absolute bottom-0 left-0 bg-gradient-to-t from-(--gm-bg-deep)/80 to-transparent pt-20 rounded-b-[var(--gm-radius-xl)]"
          )}>
            <button
              type="button"
              onClick={toggleMic}
              disabled={state !== 'connected' && state !== 'reconnecting'}
              className={cn(
                "w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300",
                muted 
                  ? "bg-(--gm-error) text-(--gm-text) border-(--gm-error)" 
                  : "bg-(--gm-text)/10 border-(--gm-border-soft) text-(--gm-text) hover:bg-(--gm-text)/20"
              )}
              title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {isVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                disabled={state !== 'connected' && state !== 'reconnecting'}
                className={cn(
                  "w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300",
                  !cameraEnabled 
                    ? "bg-(--gm-error) text-(--gm-text) border-(--gm-error)" 
                    : "bg-(--gm-text)/10 border-(--gm-border-soft) text-(--gm-text) hover:bg-(--gm-text)/20"
                )}
                title={cameraEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
              >
                {!cameraEnabled ? <CameraOff size={20} /> : <Video size={20} />}
              </button>
            )}

            <button
              type="button"
              onClick={hangup}
              className="w-14 h-14 rounded-full bg-(--gm-error) border border-(--gm-error) flex items-center justify-center text-(--gm-text) hover:bg-(--gm-error)/80 transition-all shadow-lg"
              title="Görüşmeyi Bitir"
            >
              <PhoneOff size={24} />
            </button>

            {!isVideo && <BookingMessageButton bookingId={bookingId} variant="secondary" label="Mesaj" />}
          </div>

          {!isVideo && (
            <Link href={`/${locale}/dashboard?tab=bookings`} className="mb-12 text-[10px] font-bold tracking-[0.3em] text-(--gm-muted) uppercase hover:text-(--gm-gold) transition-colors">
              ← Randevularıma dön
            </Link>
          )}
        </div>

        {/* Sidebar: Customer History */}
        <aside className="rounded-[var(--gm-radius-xl)] border border-(--gm-border-soft) bg-(--gm-surface)/60 backdrop-blur-md p-8 shadow-(--gm-shadow-soft) h-fit">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-4 text-left group"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-(--gm-gold) mb-1">
                Müşteri Geçmişi
              </span>
              <span className="block font-serif text-2xl text-(--gm-text)">
                Son Okumalar
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-(--gm-muted) group-hover:text-(--gm-gold) transition-colors">
              {historyOpen ? 'Kapat' : 'Aç'}
            </span>
          </button>

          {historyOpen ? (
            <div className="mt-8 space-y-4">
              {readingsLoading ? (
                [1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl bg-(--gm-bg-deep)/50" />
                ))
              ) : customerReadings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--gm-border-soft) p-8 text-center text-sm italic text-(--gm-muted)">
                  Henüz bir geçmiş bulunamadı.
                </div>
              ) : (
                customerReadings.map((item) => (
                  <article
                    key={`${item.type}:${item.id}`}
                    className="group rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface-high)/40 p-5 hover:border-(--gm-gold)/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-(--gm-border-soft) bg-(--gm-surface) text-(--gm-gold) shadow-sm">
                        <span className="font-serif text-sm">{READING_ICONS[item.type]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep)">
                            {READING_LABELS[item.type]}
                          </span>
                          <span className="shrink-0 text-[10px] font-serif italic text-(--gm-muted)">
                            {shortDate(item.created_at)}
                          </span>
                        </div>
                        <h2 className="truncate font-serif text-base text-(--gm-text) mb-1">
                          {item.title}
                        </h2>
                        <p className="line-clamp-2 text-xs leading-relaxed text-(--gm-text-dim) opacity-80">
                          {item.snippet || 'Detaylı yorum içeriği...'}
                        </p>
                        <Link
                          href={readingHref(locale, item)}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) hover:text-(--gm-gold-light) transition-colors"
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
      </div>
    </PageContainer>
  );
}
