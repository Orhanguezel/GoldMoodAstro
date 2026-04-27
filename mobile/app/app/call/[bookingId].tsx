import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { VideoView } from '@livekit/react-native';
import type { VideoTrack } from 'livekit-client';
import { Track } from 'livekit-client';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
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
  const { t } = useTranslation();

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

    const getVideoTrack = (participant: unknown): VideoTrack | null => {
      const p = participant as {
        getTrackPublication?: (source: Track.Source) => { track?: unknown } | undefined;
      };
      return (p?.getTrackPublication?.(Track.Source.Camera)?.track ?? null) as VideoTrack | null;
    };

    setLocalVideoTrack(getVideoTrack(room.localParticipant));

    const remote = Array.from(room.remoteParticipants?.values?.() ?? [])[0] as
      | {
          name?: string;
          identity?: string;
        }
      | undefined;
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
        setErrorMessage(t('call.connectError', 'Bağlantı sağlanamadı.'));
        setLoading(false);
        setConnecting(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [bookingId, t]);

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
        pathname: '/call/rate',
        params: { bookingId: id },
      });
    } else {
      router.replace('/(tabs)/bookings');
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
      Alert.alert(t('common.error'), t('call.microphoneToggleError', 'Mikrofon ayarı güncellenemedi.'));
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
      Alert.alert(t('common.error'), t('call.videoToggleError', 'Kamera ayarı güncellenemedi.'));
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
      Alert.alert(t('common.error'), t('call.switchCameraError', 'Kamera değiştirilemedi.'));
    }
  };

  const toggleSpeaker = () => {
    setSpeakerOn((prev) => !prev);
  };

  if (loading || !bookingId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.amethyst} />
          <Text style={styles.loadingText}>{t('call.connecting')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {t('call.connected', { name: remoteName })}
          </Text>
          <Text style={styles.timer}>{formatDuration(durationSeconds)}</Text>
        </View>

        {connecting ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color={colors.amethyst} />
            <Text style={styles.statusText}>{t('call.connecting')}</Text>
          </View>
        ) : (
          !connected && (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>{errorMessage || t('call.endedTitle', 'Çağrı sonlandı.')}</Text>
              <Text style={styles.statusSubText}>
                {booking?.consultant?.full_name
                  ? t('call.endedBody', { duration: formatDuration(durationSeconds) })
                  : t('call.endedBody', { duration: formatDuration(durationSeconds) })}
              </Text>
            </View>
          )
        )}

        <View style={styles.stage}>
          {isVideoCall ? (
            <View style={styles.videoContainer}>
              {remoteVideoTrack ? (
                  <VideoView style={styles.remoteVideo} videoTrack={remoteVideoTrack || undefined} />
              ) : (
                <View style={styles.placeholder}>
                  {booking?.consultant?.avatar_url ? (
                    <Image
                      source={{ uri: booking.consultant.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Text style={styles.placeholderInitial}>
                      {remoteName?.[0]?.toUpperCase() || 'S'}
                    </Text>
                  )}
                  <Text style={styles.placeholderText}>
                    {t('call.waitRemote', 'Danışman katılıyor...')}
                  </Text>
                </View>
              )}

              {localVideoTrack ? (
                <View style={styles.localPreview}>
                  <VideoView style={styles.localVideo} videoTrack={localVideoTrack || undefined} mirror />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.audioContainer}>
              {booking?.consultant?.avatar_url ? (
                <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatarLarge} />
              ) : (
                <View style={styles.avatarLargeFallback}>
                  <Text style={styles.avatarText}>
                    {remoteName?.[0]?.toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <Pressable
            style={[styles.iconButton, isMuted && styles.iconButtonActive]}
            onPress={handleToggleMute}
          >
            <Text style={[styles.iconText, isMuted && styles.iconTextActive]}>{t('call.mute')}</Text>
          </Pressable>

          {Platform.OS === 'android' ? (
            <Pressable
              style={[styles.iconButton, speakerOn && styles.iconButtonActive]}
              onPress={toggleSpeaker}
            >
              <Text style={[styles.iconText, speakerOn && styles.iconTextActive]}>{t('call.speaker')}</Text>
            </Pressable>
          ) : null}

          {isVideoCall ? (
            <>
              <Pressable
                style={[styles.iconButton, !cameraEnabled && styles.iconButtonActive]}
                onPress={handleToggleCamera}
              >
                <Text style={[styles.iconText, !cameraEnabled && styles.iconTextActive]}>
                  {cameraEnabled ? t('call.videoOn') : t('call.videoOff')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.iconButton}
                onPress={handleSwitchCamera}
                disabled={!cameraEnabled}
              >
                <Text style={styles.iconText}>
                  {frontCamera ? t('call.cameraFront') : t('call.cameraBack')}
                </Text>
              </Pressable>
            </>
          ) : null}

          <Pressable style={[styles.hangupButton]} onPress={handleHangup}>
            <Text style={styles.hangupText}>{t('call.hangup')}</Text>
          </Pressable>
        </View>

        {!connected ? (
          <Pressable style={styles.rateButton} onPress={handleHangup}>
            <Text style={styles.rateText}>{t('call.rateBtn', 'Değerlendir')}</Text>
          </Pressable>
        ) : null}

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.midnight },
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: colors.stardust,
    fontFamily: font.display,
    marginRight: spacing.md,
  },
  timer: {
    color: colors.gold,
    fontFamily: font.sansMedium,
    fontSize: 14,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: { color: colors.stardustDim, fontFamily: font.sans },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
    textAlign: 'center',
  },
  statusSubText: {
    color: colors.muted,
    fontFamily: font.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    minHeight: 280,
  },
  videoContainer: {
    position: 'relative',
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localPreview: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 140,
    height: 180,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  localVideo: { width: '100%', height: '100%' },
  audioContainer: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    gap: spacing.md,
  },
  placeholderText: {
    color: colors.stardustDim,
    fontFamily: font.sans,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
  },
  avatarLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarLargeFallback: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.amethyst,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarText: { color: colors.stardust, fontSize: 40, fontFamily: font.sansBold },
  placeholderInitial: { color: colors.stardust, fontSize: 40, fontFamily: font.sansBold },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  iconButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  iconButtonActive: {
    backgroundColor: colors.amethyst,
  },
  iconText: {
    color: colors.stardust,
    fontFamily: font.sans,
    fontSize: 12,
  },
  iconTextActive: { color: colors.stardust },
  hangupButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  hangupText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
  },
  rateButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.amethyst,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    ...shadows.soft,
  },
  rateText: {
    color: colors.stardust,
    fontFamily: font.sansBold,
  },
  errorBanner: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(229, 91, 77, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(229, 91, 77, 0.35)',
  },
  errorText: {
    color: colors.danger,
    fontFamily: font.sans,
    fontSize: 13,
  },
});
