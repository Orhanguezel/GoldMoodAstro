import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { VideoView } from '@livekit/react-native';
import type { VideoTrack } from 'livekit-client';
import { Track } from 'livekit-client';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  SwitchCamera,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { bookingsApi } from '@/lib/api';
import {
  connectLiveKitAudio,
  endLiveKitSession,
  fetchLiveKitToken,
  setLiveKitCamera,
  setLiveKitMicrophone,
  switchLiveKitCamera,
  type LiveKitRoom,
} from '@/lib/livekit';
import type { Booking } from '@/types';

const { width } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function CallScreen() {
  const { bookingId: rawId } = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | null>(null);

  const roomRef = useRef<LiveKitRoom | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isVideoCall = booking?.media_type === 'video';
  const remoteName = booking?.consultant?.full_name || 'Danışman';

  const refreshTrackState = (room: LiveKitRoom | null) => {
    if (!room) return;
    const getVideoTrack = (p: any): VideoTrack | null => (p?.getTrackPublication?.(Track.Source.Camera)?.track ?? null) as VideoTrack | null;
    setLocalVideoTrack(getVideoTrack(room.localParticipant));
    const remote = Array.from(room.remoteParticipants?.values?.() ?? [])[0];
    setRemoteVideoTrack(getVideoTrack(remote));
  };

  const cleanup = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (roomRef.current) {
      try { roomRef.current.disconnect(); } catch {}
      roomRef.current = null;
    }
  };

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const data = await bookingsApi.get(bookingId);
        if (cancelled) return;
        setBooking(data);
        const tokenData = await fetchLiveKitToken(bookingId);
        if (cancelled) return;

        const room = await connectLiveKitAudio({
          token: tokenData.token,
          wsUrl: tokenData.ws_url,
          onConnected: () => {
            if (cancelled) return;
            setConnected(true);
            timerRef.current = setInterval(() => setDurationSeconds(p => p + 1), 1000);
          },
          onDisconnected: () => {
            if (cancelled) return;
            setConnected(false);
          },
        });

        if (cancelled) { room.disconnect(); return; }
        roomRef.current = room;

        const onTrackChanged = () => refreshTrackState(room);
        room.on?.('trackSubscribed', onTrackChanged);
        room.on?.('trackUnsubscribed', onTrackChanged);
        room.on?.('participantConnected', onTrackChanged);
        room.on?.('participantDisconnected', onTrackChanged);
        refreshTrackState(room);

        if (data.media_type === 'video') {
          await setLiveKitCamera(room, true, {});
          setCameraEnabled(true);
        }
        setLoading(false);
      } catch (err) {
        console.error('Call setup error:', err);
        setLoading(false);
      }
    };
    bootstrap();
    return () => { cancelled = true; cleanup(); };
  }, [bookingId]);

  const handleHangup = async () => {
    await cleanup();
    if (bookingId) {
      try { await endLiveKitSession(bookingId); } catch {}
      router.replace({ pathname: '/call/rate' as any, params: { bookingId } });
    } else {
      router.replace('/(tabs)/bookings' as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loaderText}>Görüşme Başlatılıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.inkDeep, colors.bgDeep]} style={styles.full}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.name}>{remoteName}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, connected ? styles.online : styles.offline]} />
                <Text style={styles.statusText}>{connected ? 'CANLI SEANS' : 'BAĞLANIYOR'}</Text>
              </View>
            </View>
            <View style={styles.timer}>
              <Clock size={14} color={colors.gold} />
              <Text style={styles.timerText}>{formatDuration(durationSeconds)}</Text>
            </View>
          </View>

          <View style={styles.stage}>
            {isVideoCall ? (
              <View style={styles.videoBox}>
                {remoteVideoTrack ? (
                  <VideoView style={styles.remoteVideo} videoTrack={remoteVideoTrack as any} />
                ) : (
                  <View style={styles.placeholder}><ActivityIndicator color={colors.gold} /><Text style={styles.placeholderText}>Görüntü bekleniyor...</Text></View>
                )}
                {localVideoTrack && (
                  <View style={styles.localPreview}>
                    <VideoView style={styles.localVideo} videoTrack={localVideoTrack as any} mirror={frontCamera} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.audioStage}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarBorder}>
                    {booking?.consultant?.avatar_url ? (
                      <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{remoteName[0]}</Text></View>
                    )}
                  </View>
                  {connected && <View style={styles.pulse} />}
                </View>
                <Text style={styles.audioInfo}>Sesli Görüşme Aktif</Text>
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <View style={styles.btnRow}>
              <Pressable style={[styles.btn, isMuted && styles.btnActive]} onPress={async () => {
                const room = roomRef.current;
                if (!room) return;
                await setLiveKitMicrophone(room, isMuted);
                setIsMuted(!isMuted);
              }}>
                {isMuted ? <MicOff size={24} color={colors.text} /> : <Mic size={24} color={colors.text} />}
              </Pressable>

              {isVideoCall && (
                <>
                  <Pressable style={[styles.btn, !cameraEnabled && styles.btnActive]} onPress={async () => {
                    const room = roomRef.current;
                    if (!room) return;
                    await setLiveKitCamera(room, !cameraEnabled, {});
                    setCameraEnabled(!cameraEnabled);
                  }}>
                    {!cameraEnabled ? <VideoOff size={24} color={colors.text} /> : <Video size={24} color={colors.text} />}
                  </Pressable>
                  <Pressable style={styles.btn} disabled={!cameraEnabled} onPress={async () => {
                    const room = roomRef.current;
                    if (!room) return;
                    await switchLiveKitCamera(room, !frontCamera);
                    setFrontCamera(!frontCamera);
                  }}>
                    <SwitchCamera size={24} color={colors.text} />
                  </Pressable>
                </>
              )}

              <Pressable style={[styles.btn, !speakerOn && styles.btnActive]} onPress={() => setSpeakerOn(!speakerOn)}>
                {speakerOn ? <Volume2 size={24} color={colors.text} /> : <VolumeX size={24} color={colors.text} />}
              </Pressable>
            </View>

            <Pressable style={styles.hangup} onPress={handleHangup}>
              <PhoneOff size={28} color={colors.bgDeep} />
            </Pressable>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  full: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgDeep },
  loaderText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  name: { fontFamily: font.display, fontSize: 20, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  online: { backgroundColor: colors.success },
  offline: { backgroundColor: colors.warning },
  statusText: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  timerText: { fontFamily: font.mono, fontSize: 14, color: colors.gold },
  stage: { flex: 1, padding: spacing.lg },
  videoBox: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.inkDeep, position: 'relative' },
  remoteVideo: { flex: 1 },
  localPreview: { position: 'absolute', top: 16, right: 16, width: 100, height: 140, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.bgDeep },
  localVideo: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  placeholderText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted },
  audioStage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  avatarBorder: { width: 160, height: 160, borderRadius: 80, padding: 4, backgroundColor: colors.gold, zIndex: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 76 },
  avatarFallback: { width: '100%', height: '100%', borderRadius: 76, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: font.display, fontSize: 60, color: colors.gold },
  pulse: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: colors.gold, opacity: 0.3, zIndex: 1 },
  audioInfo: { fontFamily: font.sansBold, fontSize: 13, color: colors.textMuted, marginTop: 40, letterSpacing: 2 },
  controls: { padding: spacing.xl, paddingBottom: 40, alignItems: 'center', gap: 30 },
  btnRow: { flexDirection: 'row', gap: 20 },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: colors.gold },
  hangup: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', shadowColor: colors.danger, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
});
