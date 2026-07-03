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
import { trackEvent } from '@/integrations/telemetry';
import { useUiSection } from '@/i18n';

type LiveKitTokenResponse = {
  token: string;
  room: string;
  ws_url: string;
  expires_at: string;
};

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

const READING_LABEL_KEYS: Record<ReadingType, string> = {
  tarot: 'ui_extra_b0_call_reading_tarot',
  coffee: 'ui_extra_b0_call_reading_coffee',
  dream: 'ui_extra_b0_call_reading_dream',
  numerology: 'ui_extra_b0_call_reading_numerology',
  yildizname: 'ui_extra_b0_call_reading_yildizname',
  synastry: 'ui_extra_b0_call_reading_synastry',
  birth_chart: 'ui_extra_b0_call_reading_birth_chart',
};

const READING_LABEL_FALLBACKS: Record<ReadingType, string> = {
  tarot: 'Tarot',
  coffee: 'Coffee reading',
  dream: 'Dream',
  numerology: 'Numerology',
  yildizname: 'Yildizname',
  synastry: 'Synastry',
  birth_chart: 'Birth chart',
};

const READING_ICONS: Record<ReadingType, string> = {
  tarot: 'T',
  coffee: 'K',
  dream: 'R',
  numerology: 'N',
  yildizname: 'Y',
  synastry: 'S',
  birth_chart: 'D',
};

function readingHref(locale: string, item: HistoryItem) {
  const routes: Record<ReadingType, string> = {
    tarot: `/tarot/reading/${item.id}`,
    coffee: `/kahve-fali/result/${item.id}`,
    dream: `/ruya-tabiri/result/${item.id}`,
    numerology: '/numeroloji',
    yildizname: `/yildizname/result/${item.id}`,
    synastry: `/sinastri/result/${item.id}`,
    birth_chart: '/birth-chart',
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
  const { ui } = useUiSection('ui_extra' as any);

  const roomRef = useRef<Room | null>(null);
  const connectingRef = useRef(false);
  const endingRef = useRef(false);
  const micBusyRef = useRef(false);
  const camBusyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedStartRef = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<ConnectionState>('idle');
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(true);

  // Instant request flow: poll until the consultant approves, then connect in place.
  const { data: booking, isLoading: bookingLoading } = useGetMyBookingQuery(bookingId, {
    skip: !bookingId,
    pollingInterval: 5000,
  });
  const { data: customerReadings = [], isFetching: readingsLoading } =
    useGetCustomerReadingsForConsultantQuery({ bookingId, limit: 10 }, { skip: !bookingId });

  const isVideo = booking?.media_type === 'video';
  const bookingStatus = (booking as any)?.status as string | undefined;
  const isWaitingApproval = bookingStatus === 'requested_now' || bookingStatus === 'pending';
  const isCancelledOrTimedOut =
    bookingStatus === 'requested_now_timeout' ||
    bookingStatus === 'cancelled' ||
    bookingStatus === 'rejected';

  useEffect(() => {
    let cancelled = false;
    if (!booking) return;
    // Wait for approval before starting the LiveKit connection.
    if (isWaitingApproval || isCancelledOrTimedOut) return;
    if (roomRef.current || connectingRef.current) return;

    async function connect() {
      connectingRef.current = true;
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
          if (!trackedStartRef.current) {
            trackedStartRef.current = true;
            trackEvent('session_started', { booking_id: bookingId }).catch(() => {});
          }
        });
        room.on(RoomEvent.Disconnected, () => {
          setState('disconnected');
          stopTimer();
        });
        room.on(RoomEvent.Reconnecting, () => setState('reconnecting'));
        room.on(RoomEvent.Reconnected, () => setState('connected'));

        // Local mikrofon/kamera durumunu GERÇEK track event'lerinden senkronla —
        // buton görseli ile yayın durumu asla ayrışmasın.
        room.on(RoomEvent.TrackMuted, (pub, participant) => {
          if (!participant.isLocal) return;
          if (pub.kind === Track.Kind.Audio) setMuted(true);
          if (pub.kind === Track.Kind.Video) setCameraEnabled(false);
        });
        room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
          if (!participant.isLocal) return;
          if (pub.kind === Track.Kind.Audio) setMuted(false);
          if (pub.kind === Track.Kind.Video) setCameraEnabled(true);
        });

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
          if (!trackedStartRef.current) {
            trackedStartRef.current = true;
            trackEvent('session_started', { booking_id: bookingId }).catch(() => {});
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setError(err instanceof Error ? err.message : 'Could not start the session.');
        }
        roomRef.current = null;
      } finally {
        connectingRef.current = false;
      }
    }

    connect();

    return () => {
      cancelled = true;
      connectingRef.current = false;
      stopTimer();
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [bookingId, bookingStatus, isVideo, isWaitingApproval, isCancelledOrTimedOut]);

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
    const lp = roomRef.current?.localParticipant;
    if (!lp || micBusyRef.current) return;
    micBusyRef.current = true;
    try {
      // Hedefi UI state'inden değil GERÇEK track durumundan al (senkron kaybını önler).
      await lp.setMicrophoneEnabled(!lp.isMicrophoneEnabled);
    } catch {
      // izin/cihaz hatası — finally'de gerçek durum yansıtılır
    } finally {
      setMuted(!lp.isMicrophoneEnabled);
      micBusyRef.current = false;
    }
  }

  async function toggleCamera() {
    const lp = roomRef.current?.localParticipant;
    if (!lp || camBusyRef.current) return;
    camBusyRef.current = true;
    try {
      await lp.setCameraEnabled(!lp.isCameraEnabled);
      // Kamera yeni açıldıysa local önizlemeyi bağla.
      const pub = lp.getTrackPublication(Track.Source.Camera);
      if (pub?.videoTrack && localVideoRef.current) pub.videoTrack.attach(localVideoRef.current);
    } catch {
      // izin/cihaz hatası — finally'de gerçek durum yansıtılır
    } finally {
      setCameraEnabled(lp.isCameraEnabled);
      camBusyRef.current = false;
    }
  }

  async function hangup() {
    if (endingRef.current) return;
    endingRef.current = true;
    stopTimer();
    roomRef.current?.disconnect();
    roomRef.current = null;
    await endLiveKitSession(bookingId);
    trackEvent('session_completed', { booking_id: bookingId, duration_seconds: seconds }).catch(() => {});
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

  // Instant session request: keep polling while consultant approval is pending.
  if (isWaitingApproval) {
    return (
      <PageContainer center className="bg-(--gm-bg) min-h-screen">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full border-2 border-(--gm-gold)/40 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-(--gm-gold) border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="font-serif text-3xl text-(--gm-text)">
            {ui('ui_extra_b0_call_waiting_approval_title', 'Waiting for consultant approval')}
          </h1>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            {ui('ui_extra_b0_call_waiting_approval_desc', 'Your instant session request has been sent to the consultant. When approved, this page will automatically switch to the session. Keep it open.')}
          </p>
          <Link
            href={`/${(params as any)?.locale || 'tr'}/profile/bookings`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-(--gm-text-dim) hover:text-(--gm-gold) transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            {ui('ui_extra_b0_call_back_to_bookings', 'Back to my bookings')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (isCancelledOrTimedOut) {
    return (
      <PageContainer center className="bg-(--gm-bg) min-h-screen">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full border-2 border-(--gm-error)/40 flex items-center justify-center">
            <PhoneOff className="w-8 h-8 text-(--gm-error)" />
          </div>
          <h1 className="font-serif text-3xl text-(--gm-text)">
            {bookingStatus === 'requested_now_timeout'
              ? ui('ui_extra_b0_call_request_timeout', 'Request timed out')
              : bookingStatus === 'rejected'
              ? ui('ui_extra_b0_call_request_rejected', 'Request declined')
              : ui('ui_extra_b0_call_cancelled', 'Session cancelled')}
          </h1>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            {bookingStatus === 'requested_now_timeout'
              ? ui('ui_extra_b0_call_timeout_desc', 'The consultant did not respond in time. You can try another consultant or create the request again.')
              : ui('ui_extra_b0_call_cancelled_desc', 'This session cannot take place right now. You can view the details on the bookings page.')}
          </p>
          <Link
            href={`/${(params as any)?.locale || 'tr'}/consultants`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) text-xs font-bold uppercase tracking-widest"
          >
            {ui('ui_extra_b0_call_explore_consultants', 'Explore consultants')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
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
                  {state === 'connected' ? `${mm}:${ss} • ${ui('ui_extra_b0_call_live', 'LIVE')}` : ui('ui_extra_b0_call_connecting', 'CONNECTING...')}
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
                <h1 className="font-serif text-4xl lg:text-5xl text-(--gm-text) tracking-tight">{ui('ui_extra_b0_call_voice_call', 'Voice session')}</h1>
                <p className="mt-4 text-sm font-serif italic text-(--gm-muted)">
                  {state === 'connecting' && ui('ui_extra_b0_call_connecting_stars', 'Connecting your session...')}
                  {state === 'connected' && ui('ui_extra_b0_call_secure_active', 'Connection is secure and active.')}
                  {state === 'reconnecting' && ui('ui_extra_b0_call_refreshing', 'Refreshing the connection...')}
                  {state === 'disconnected' && ui('ui_extra_b0_call_ended', 'Session ended.')}
                  {state === 'error' && ui('ui_extra_b0_call_energy_disruption', 'A connection issue occurred.')}
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
              title={muted ? ui('ui_extra_b0_call_unmute', 'Unmute') : ui('ui_extra_b0_call_mute', 'Mute')}
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
                title={cameraEnabled ? ui('ui_extra_b0_call_camera_off', 'Turn camera off') : ui('ui_extra_b0_call_camera_on', 'Turn camera on')}
              >
                {!cameraEnabled ? <CameraOff size={20} /> : <Video size={20} />}
              </button>
            )}

            <button
              type="button"
              onClick={hangup}
              className="w-14 h-14 rounded-full bg-(--gm-error) border border-(--gm-error) flex items-center justify-center text-(--gm-text) hover:bg-(--gm-error)/80 transition-all shadow-lg"
              title={ui('ui_extra_b0_call_end_call', 'End session')}
            >
              <PhoneOff size={24} />
            </button>

            {!isVideo && <BookingMessageButton bookingId={bookingId} variant="secondary" label={ui('ui_extra_b0_call_message', 'Message')} />}
          </div>

          {!isVideo && (
            <Link href={`/${locale}/dashboard?tab=bookings`} className="mb-12 text-[10px] font-bold tracking-[0.3em] text-(--gm-muted) uppercase hover:text-(--gm-gold) transition-colors">
              ← {ui('ui_extra_b0_call_back_to_bookings', 'Back to my bookings')}
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
                {ui('ui_extra_b0_call_client_history', 'Client history')}
              </span>
              <span className="block font-serif text-2xl text-(--gm-text)">
                {ui('ui_extra_b0_call_recent_readings', 'Recent readings')}
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-(--gm-muted) group-hover:text-(--gm-gold) transition-colors">
              {historyOpen ? ui('ui_extra_b0_call_close', 'Close') : ui('ui_extra_b0_call_open', 'Open')}
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
                  {ui('ui_extra_b0_call_no_history', 'No history found yet.')}
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
                            {ui(READING_LABEL_KEYS[item.type] as any, READING_LABEL_FALLBACKS[item.type])}
                          </span>
                          <span className="shrink-0 text-[10px] font-serif italic text-(--gm-muted)">
                            {shortDate(item.created_at)}
                          </span>
                        </div>
                        <h2 className="truncate font-serif text-base text-(--gm-text) mb-1">
                          {item.title}
                        </h2>
                        <p className="line-clamp-2 text-xs leading-relaxed text-(--gm-text-dim) opacity-80">
                          {item.snippet || ui('ui_extra_b0_call_detail_placeholder', 'Detailed reading content...')}
                        </p>
                        <Link
                          href={readingHref(locale, item)}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) hover:text-(--gm-gold-light) transition-colors"
                        >
                          {ui('ui_extra_b0_call_review', 'Review')} <ArrowRight size={10} />
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
