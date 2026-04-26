import { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Pressable, 
  ActivityIndicator, Alert, Dimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { bookingsApi } from '@/lib/api';
import {
  connectLiveKitAudio,
  endLiveKitSession,
  fetchLiveKitToken,
  setLiveKitMicrophone,
  type LiveKitRoom,
} from '@/lib/livekit';
// Permissions only work in development builds, not Expo Go.
let request: any, PERMISSIONS: any, RESULTS: any;
try {
  const permissions = require('react-native-permissions');
  request = permissions.request;
  PERMISSIONS = permissions.PERMISSIONS;
  RESULTS = permissions.RESULTS;
} catch (e) {
  console.warn('Permissions native module not found, using mocks.');
}

const { width } = Dimensions.get('window');

export default function CallScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [consultantName, setConsultantName] = useState('...');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
  
  const room = useRef<LiveKitRoom | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const ending = useRef(false);

  useEffect(() => {
    initCall();
    return () => {
      endCall();
    };
  }, [bookingId]);

  const initCall = async () => {
    try {
      // 1. Randevu bilgilerini al (Isim için)
      const booking = await bookingsApi.get(bookingId!);
      setConsultantName(booking.consultant?.full_name || '...');

      // 2. İzinleri kontrol et (Sadece Mobil ve Native Modül Varsa)
      if (Platform.OS !== 'web' && request && PERMISSIONS) {
        const micPermission = Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.MICROPHONE 
          : PERMISSIONS.ANDROID.RECORD_AUDIO;
        
        const status = await request(micPermission);
        if (status !== 'granted') {
          Alert.alert(t('common.error'), 'Mikrofon izni gerekli.');
          router.back();
          return;
        }
      }

      // 3. LiveKit token al
      const { token, ws_url } = await fetchLiveKitToken(bookingId!);

      // 4. LiveKit odasına bağlan. Native modül Expo Go'da yoksa simülasyon fallback'i kullan.
      if (Platform.OS !== 'web') {
        try {
          room.current = await connectLiveKitAudio({
            token,
            wsUrl: ws_url,
            onConnected: () => {
              setConnectionState('connected');
              setJoined(true);
              setLoading(false);
              startTimer();
            },
            onDisconnected: () => {
              setConnectionState('disconnected');
              setJoined(false);
              stopTimer();
            },
            onReconnecting: () => setConnectionState('reconnecting'),
            onReconnected: () => setConnectionState('connected'),
          });
        } catch (nativeError) {
          console.warn('LiveKit native module unavailable, using call simulation.', nativeError);
          setConnectionState('connected');
          setJoined(true);
          setLoading(false);
          startTimer();
        }
      } else {
        // Web simülasyonu için bağlandı göster
        setConnectionState('connected');
        setJoined(true);
        setLoading(false);
        startTimer();
      }

    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Görüşme başlatılamadı.');
      router.back();
    }
  };

  const endCall = async () => {
    if (ending.current) return;
    ending.current = true;
    stopTimer();
    if (room.current) {
      room.current.disconnect();
      room.current = null;
    }
    
    // Backend'e bitişi bildir
    try {
      await endLiveKitSession(bookingId!);
    } catch (err) {
      console.warn('Session end notification failed:', err);
    }

    router.replace({
      pathname: '/call/rate',
      params: { bookingId }
    });
  };

  const startTimer = () => {
    timer.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const toggleMute = async () => {
    const nextMuted = !muted;
    try {
      await setLiveKitMicrophone(room.current, !nextMuted);
      setMuted(nextMuted);
    } catch (err) {
      console.warn('Microphone toggle failed:', err);
    }
  };

  const toggleSpeaker = () => {
    setSpeaker(!speaker);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>GoldMoodAstro</Text>
          <Text style={styles.status}>
            {loading || connectionState === 'connecting'
              ? t('call.connecting')
              : connectionState === 'reconnecting'
                ? 'Yeniden bağlanıyor'
                : t('call.connected', { name: '' })}
          </Text>
        </View>

        <View style={styles.main}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {consultantName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{consultantName}</Text>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable 
            style={[styles.controlBtn, muted && styles.controlBtnActive]} 
            onPress={toggleMute}
          >
            <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlLabel}>{t('call.mute')}</Text>
          </Pressable>

          <Pressable 
            style={styles.hangupBtn} 
            onPress={endCall}
          >
            <Text style={styles.hangupIcon}>📞</Text>
          </Pressable>

          <Pressable 
            style={[styles.controlBtn, speaker && styles.controlBtnActive]} 
            onPress={toggleSpeaker}
          >
            <Text style={styles.controlIcon}>{speaker ? '🔊' : '🔈'}</Text>
            <Text style={styles.controlLabel}>{t('call.speaker')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  header: { alignItems: 'center', gap: 4 },
  brand: { fontSize: 14, fontFamily: font.display, color: colors.gold, opacity: 0.8 },
  status: { fontSize: 12, color: colors.muted, fontFamily: font.sansMedium, textTransform: 'uppercase' },
  main: { alignItems: 'center', gap: spacing.lg },
  avatarGlow: { 
    width: 140, height: 140, borderRadius: 70, 
    backgroundColor: colors.surface, 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.amethyst + '40',
    ...shadows.soft
  },
  avatarPlaceholder: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: colors.amethyst, 
    alignItems: 'center', justifyContent: 'center' 
  },
  avatarInitials: { color: colors.stardust, fontSize: 40, fontFamily: font.sansBold },
  name: { fontSize: 28, fontFamily: font.display, color: colors.stardust, textAlign: 'center' },
  timer: { fontSize: 20, fontFamily: font.mono, color: colors.gold },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: spacing.xxl },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 4 },
  controlBtnActive: { backgroundColor: colors.amethyst },
  controlIcon: { fontSize: 24 },
  controlLabel: { fontSize: 10, color: colors.stardustDim, fontFamily: font.sansMedium },
  hangupBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  hangupIcon: { fontSize: 32, color: colors.stardust, transform: [{ rotate: '135deg' }] },
});
