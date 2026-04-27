import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
  Star 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, font, radius, gradients } from '@/theme/tokens';
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
  const rawBookingId = useLocalSearchParams<{ bookingId: string | string[] }>().bookingId;
  const bookingId = useMemo(
    () => (Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId),
    [rawBookingId],
  );

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | null>(null);

  const roomRef = useRef<LiveKitRoom | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isVideoCall = useMemo(
    () => booking?.media_type === 'video',
    [booking?.media_type],
  );

  const remoteName = useMemo(() => booking?.consultant?.full_name || 'Danışman', [booking?.consultant?.full_name]);

  const refreshTrackState = (room: LiveKitRoom | null) => {
    if (!room) return;

    const getVideoTrack = (participant: any): VideoTrack | null => {
      return (participant?.getTrackPublication?.(Track.Source.Camera)?.track ?? null) as VideoTrack | null;
    };

    setLocalVideoTrack(getVideoTrack(room.localParticipant));

    const remote = Array.from(room.remoteParticipants?.values?.() ?? [])[0];
    setRemoteVideoTrack(getVideoTrack(remote));
  };

  const cleanup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (roomRef.current) {
      try {
        roomRef.current.disconnect();
      } catch {
        // ignore
      }
      roomRef.current = null;
    }
  };

  const handleDisconnectFlow = (reason?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setConnecting(false);
    setConnected(false);
    if (reason) setErrorMessage(reason);
    setCameraEnabled(false);
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

        const isVideo = data.media_type === 'video';
        if (isVideo) {
          setCameraEnabled(true);
        }

        const room = await connectLiveKitAudio({
          token: tokenData.token,
          wsUrl: tokenData.ws_url,
          onConnected: () => {
            if (cancelled) return;
            setErrorMessage('');
            setConnected(true);
            setConnecting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setDurationSeconds((prev) => prev + 1);
            }, 1000);
          },
          onDisconnected: () => {
            if (cancelled) return;
            handleDisconnectFlow();
          },
          onReconnecting: () => {
            if (cancelled) return;
            setConnecting(true);
          },
          onReconnected: () => {
            if (cancelled) return;
            setConnecting(false);
            setConnected(true);
          },
        });

        if (cancelled) {
          await room.disconnect();
          return;
        }

        roomRef.current = room;

        const onTrackChanged = () => refreshTrackState(room);
        room.on?.('trackSubscribed', onTrackChanged);
        room.on?.('trackUnsubscribed', onTrackChanged);
        room.on?.('participantConnected', onTrackChanged);
        room.on?.('participantDisconnected', onTrackChanged);
        refreshTrackState(room);

        if (isVideo) {
          try {
            await setLiveKitCamera(room, true, {});
            setCameraEnabled(true);
          } catch (err) {
            console.error('Camera publish failed:', err);
            setCameraEnabled(false);
          }
        } else {
          await setLiveKitCamera(room, false, {}).catch(() => {});
          setCameraEnabled(false);
        }

        setLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Call setup failed:', err);
        setErrorMessage('Bağlantı sağlanamadı.');
        setLoading(false);
        setConnecting(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [bookingId]);

  const handleHangup = async () => {
    const id = bookingId;
    await cleanup();
    if (id) {
      try {
        await endLiveKitSession(id);
      } catch (err) {
        console.warn('Session end call failed:', err);
      }
      router.replace({
        pathname: '/call/rate' as any,
        params: { bookingId: id },
      });
    } else {
      router.replace('/bookings' as any);
    }
  };

  const handleToggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;

    const nextValue = !isMuted;
    try {
      await setLiveKitMicrophone(room, !nextValue);
      setIsMuted(nextValue);
    } catch (err) {
      console.warn('Microphone toggle failed:', err);
    }
  };

  const handleToggleCamera = async () => {
    if (!isVideoCall) return;
    const room = roomRef.current;
    if (!room) return;

    const nextValue = !cameraEnabled;
    try {
      await setLiveKitCamera(room, nextValue, {});
      setCameraEnabled(nextValue);
    } catch (err) {
      console.warn('Camera toggle failed:', err);
    }
  };

  const handleSwitchCamera = async () => {
    if (!isVideoCall || !cameraEnabled) return;
    const room = roomRef.current;
    if (!room) return;

    const nextValue = !frontCamera;
    try {
      await switchLiveKitCamera(room, nextValue);
      setFrontCamera(nextValue);
    } catch (err) {
      console.warn('Camera switch failed:', err);
    }
  };

  if (loading || !bookingId) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loaderText}>Bağlantı Hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.darkSurface}
        style={styles.fullBg}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.remoteName}>{remoteName}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, connected ? styles.online : styles.offline]} />
                <Text style={styles.statusLabel}>{connected ? 'Canlı Görüşme' : 'Bağlanıyor...'}</Text>
              </View>
            </View>
            <View style={styles.timerBox}>
              <Clock size={14} color={colors.gold} />
              <Text style={styles.timerText}>{formatDuration(durationSeconds)}</Text>
            </View>
          </View>

          {/* Center Stage */}
          <View style={styles.stage}>
            {isVideoCall ? (
              <View style={styles.videoGrid}>
                {remoteVideoTrack ? (
                  <VideoView style={styles.remoteVideo} videoTrack={remoteVideoTrack as any} />
                ) : (
                  <View style={styles.placeholder}>
                    <ActivityIndicator color={colors.gold} />
                    <Text style={styles.placeholderText}>Görüntü bekleniyor...</Text>
                  </View>
                )}

                {localVideoTrack && (
                  <View style={styles.localPreviewWrap}>
                    <VideoView 
                      style={styles.localVideo} 
                      videoTrack={localVideoTrack as any} 
                      mirror={frontCamera}
                    />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.audioStage}>
                <View style={styles.avatarGlowWrap}>
                  <View style={styles.avatarBorder}>
                    {booking?.consultant?.avatar_url ? (
                      <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatarLarge} />
                    ) : (
                      <View style={styles.avatarLargePlaceholder}>
                        <Text style={styles.avatarInitialLarge}>{remoteName?.[0]}</Text>
                      </View>
                    )}
                  </View>
                  {connected && <View style={styles.pulseRing} />}
                </View>
                <Text style={styles.audioStatus}>
                  {connected ? 'Sesli görüşme aktif' : 'Bağlantı kuruluyor...'}
                </Text>
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              
              <Pressable 
                onPress={handleToggleMute}
                style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              >
                {isMuted ? <MicOff size={24} color={colors.text} /> : <Mic size={24} color={colors.text} />}
              </Pressable>

              {isVideoCall && (
                <>
                  <Pressable 
                    onPress={handleToggleCamera}
                    style={[styles.controlBtn, !cameraEnabled && styles.controlBtnActive]}
                  >
                    {!cameraEnabled ? <VideoOff size={24} color={colors.text} /> : <Video size={24} color={colors.text} />}
                  </Pressable>
                  <Pressable 
                    onPress={handleSwitchCamera}
                    disabled={!cameraEnabled}
                    style={[styles.controlBtn, !cameraEnabled && styles.controlBtnDisabled]}
                  >
                    <SwitchCamera size={24} color={colors.text} />
                  </Pressable>
                </>
              )}

              <Pressable 
                onPress={() => setSpeakerOn(!speakerOn)}
                style={[styles.controlBtn, !speakerOn && styles.controlBtnActive]}
              >
                {speakerOn ? <Volume2 size={24} color={colors.text} /> : <VolumeX size={24} color={colors.text} />}
              </Pressable>

            </View>

            <Pressable 
              onPress={handleHangup}
              style={styles.hangupBtn}
            >
              <PhoneOff size={28} color={colors.bgDeep} />
            </Pressable>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  fullBg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgDeep,
  },
  loaderText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  remoteName: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  online: { backgroundColor: colors.success },
  offline: { backgroundColor: colors.warning },
  statusLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  timerText: {
    fontFamily: font.mono,
    fontSize: 14,
    color: colors.gold,
  },

  // Stage
  stage: {
    flex: 1,
    padding: spacing.lg,
  },
  videoGrid: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.inkDeep,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  localPreviewWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.bgDeep,
  },
  localVideo: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
  },

  audioStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlowWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBorder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
    backgroundColor: colors.gold,
    zIndex: 2,
  },
  avatarLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 76,
  },
  avatarLargePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 76,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialLarge: {
    fontFamily: font.display,
    fontSize: 60,
    color: colors.gold,
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.gold,
    opacity: 0.2,
    zIndex: 1,
  },
  audioStatus: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Controls
  controls: {
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: colors.gold,
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  hangupBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },

  errorBanner: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(229, 91, 77, 0.9)',
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.text,
  },
});
