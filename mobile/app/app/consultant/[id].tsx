import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { paddingBottom: 120 },
  
  // Hero
  hero: { backgroundColor: colors.inkDeep, overflow: 'hidden', paddingBottom: 30 },
  heroBg: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 23, 21, 0.6)' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileArea: { alignItems: 'center', marginTop: 10 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.gold },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.gold },
  avatarInitial: { fontFamily: font.display, fontSize: 40, color: colors.ink },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.success, borderWidth: 3, borderColor: colors.inkDeep },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: font.display, fontSize: 26, color: colors.text },
  expertise: { fontFamily: font.sansMedium, fontSize: 14, color: colors.goldDim, marginTop: 4 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricVal: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  metricDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Sections
  section: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.lineSoft },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text, marginBottom: 12 },
  bio: { fontFamily: font.sans, fontSize: 14, color: colors.textDim, lineHeight: 22 },
  datesScroll: { gap: 10 },
  dateBtn: { width: 64, height: 74, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  dateBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  dateDay: { fontFamily: font.sansMedium, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  dateNum: { fontFamily: font.sansBold, fontSize: 18, color: colors.text, marginTop: 2 },
  dateTextActive: { color: colors.ink },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: { width: (width - 40 - 30) / 4, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  slotBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotBtnFull: { opacity: 0.2 },
  slotText: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
  slotTextActive: { color: colors.ink },
  slotTextFull: { color: colors.textMuted },
  emptySlots: { paddingVertical: 20, alignItems: 'center' },
  emptySlotsText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted },

  serviceCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  serviceCardActive: { borderColor: colors.gold, backgroundColor: colors.inkDeep },
  serviceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  serviceName: { fontFamily: font.sansBold, fontSize: 15, color: colors.text, flex: 1 },
  servicePrice: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  serviceMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 6 },
  serviceDesc: { fontFamily: font.sans, fontSize: 13, color: colors.textDim, marginTop: 10, lineHeight: 20 },
  freeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(76, 175, 110, 0.15)',
  },
  freeBadgeText: { fontFamily: font.sansBold, fontSize: 10, color: colors.success, letterSpacing: 0.5 },
  requestNowBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(201, 169, 97, 0.08)',
  },
  requestNowText: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },

  mediaQuestionCard: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, gap: 10 },
  mediaQuestionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  mediaQuestionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text, flex: 1 },
  mediaQuestionPrice: { fontFamily: font.display, fontSize: 18, color: colors.gold },
  mediaQuestionText: { fontFamily: font.sans, fontSize: 13, color: colors.textDim, lineHeight: 20 },
  mediaQuestionBtn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  mediaQuestionBtnRecording: { backgroundColor: colors.danger },
  mediaQuestionBtnDisabled: { opacity: 0.6 },
  mediaQuestionBtnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },

  mediaRow: { flexDirection: 'row', gap: 10 },
  mediaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mediaChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  mediaChipText: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  mediaChipTextActive: { color: colors.ink },
  mediaHint: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 10, lineHeight: 18 },

  // Footer
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: colors.surface, padding: spacing.lg, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg
  },
  footerPrice: { gap: 2 },
  footerPriceLabel: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
  footerPriceVal: { fontFamily: font.display, fontSize: 24, color: colors.gold },
  bookBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gold, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: radius.pill,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.ink },
});
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { useTranslation } from 'react-i18next';

import { consultantsApi, chatApi, reviewsApi, bookingsApi, siteSettingsApi, mediaMessagesApi, storageApi } from '@/lib/api';
import type { Consultant, ConsultantMediaSettings, ConsultantSlot, ConsultantService, Review } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import ReviewList from '@/components/ReviewList';
import { 
  ChevronLeft, 
  MessageSquare, 
  Star,
  ShieldCheck,
  Clock,
  Globe,
  Calendar,
  Zap,
  Sparkles,
  Video,
  Mic,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ConsultantDetailScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { id, topic } = useLocalSearchParams<{ id: string; topic?: string }>();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;
  const { isAuthenticated, authHydrating } = useAuth();

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [services, setServices] = useState<ConsultantService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<ConsultantSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [requestNowLoading, setRequestNowLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ConsultantSlot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [videoFeatureEnabled, setVideoFeatureEnabled] = useState(false);
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [mediaSettings, setMediaSettings] = useState<ConsultantMediaSettings | null>(null);
  const [mediaQuestionLoading, setMediaQuestionLoading] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const recordingStartedAtRef = useRef<number | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  const canShowVideoOption = useMemo(() => {
    if (!videoFeatureEnabled) return false;
    if (selectedService) return selectedService.media_type === 'both';
    return consultant?.supports_video === 1;
  }, [videoFeatureEnabled, selectedService, consultant?.supports_video]);

  const resolvedMediaType = useMemo(() => {
    if (!videoFeatureEnabled) return 'audio';
    if (selectedService) {
      if (selectedService.media_type === 'video') return 'video';
      if (selectedService.media_type === 'both') return mediaType;
      return 'audio';
    }
    return consultant?.supports_video === 1 ? mediaType : 'audio';
  }, [videoFeatureEnabled, selectedService, consultant?.supports_video, mediaType]);

  const baseSessionPrice = useMemo(() => {
    if (selectedService) return Number(selectedService.price);
    return Number(consultant?.session_price ?? 0);
  }, [selectedService, consultant?.session_price]);

  const videoSessionPrice = useMemo(() => {
    const vp = Number(consultant?.video_session_price ?? 0);
    return vp > 0 ? vp : baseSessionPrice;
  }, [consultant?.video_session_price, baseSessionPrice]);

  const displaySessionPrice =
    resolvedMediaType === 'video' && !selectedService ? videoSessionPrice : baseSessionPrice;

  useEffect(() => {
    siteSettingsApi
      .isFeatureEnabled('feature_video_enabled')
      .then(setVideoFeatureEnabled)
      .catch(() => setVideoFeatureEnabled(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    mediaMessagesApi
      .getConsultantSettings(id)
      .then(setMediaSettings)
      .catch(() => setMediaSettings(null));
  }, [id]);

  useEffect(() => {
    if (!canShowVideoOption && mediaType === 'video') {
      setMediaType('audio');
    }
  }, [canShowVideoOption, mediaType]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedServiceId]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setReviewsLoading(true);
    setServicesLoading(true);
    Promise.all([
      consultantsApi.get(id),
      reviewsApi.forConsultant(id),
      consultantsApi.services(id).catch(() => [] as ConsultantService[]),
    ])
      .then(([consultantData, reviewData, serviceList]) => {
        setConsultant(consultantData);
        setReviews(reviewData);
        setServices(serviceList);
        if (serviceList.length > 0) {
          setSelectedServiceId(serviceList[0].id);
        }
      })
      .catch(logger.error)
      .finally(() => {
        setLoading(false);
        setReviewsLoading(false);
        setServicesLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      setSlotsLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const duration = selectedService?.duration_minutes ?? consultant?.session_duration ?? 30;
      consultantsApi.availability(id, {
        date: dateStr,
        duration,
        ...(selectedServiceId ? { service_id: selectedServiceId } : {}),
      })
        .then((availability) => {
          const resourceId = availability.resource_id ?? '';
          setSlots(
            availability.starts.map((time) => ({
              id: `${dateStr}-${time}`,
              resource_id: resourceId,
              slot_date: dateStr,
              slot_time: time,
              capacity: 1,
              is_active: 1,
              reserved_count: 0,
            })),
          );
        })
        .catch(logger.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [id, selectedDate, selectedServiceId, selectedService?.duration_minutes, consultant?.session_duration]);

  const submitAudioQuestion = async (uri: string, durationSeconds: number) => {
    if (!consultant) return;
    setMediaQuestionLoading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri,
        name: `audio-question-${Date.now()}.m4a`,
        type: 'audio/mp4',
      } as unknown as Blob);
      const upload = await storageApi.upload(form, {
        bucket: 'media_messages',
        path: `${consultant.id}/${Date.now()}`,
      });
      if (!upload.path) throw new Error('upload_failed');
      await mediaMessagesApi.create({
        consultant_id: consultant.id,
        kind: 'audio',
        storage_path: upload.path,
        duration_seconds: Math.max(1, durationSeconds),
        note: topic ? String(topic) : null,
      });
      Alert.alert(
        t('mediaMessages.sentTitle', 'Sorunuz gönderildi'),
        t('mediaMessages.sentBody', 'Danışman yanıtı geldiğinde bildirim alacaksınız.'),
        [{ text: t('common.ok', 'Tamam'), onPress: () => router.push('/media-messages' as any) }],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(
        t('common.error', 'Hata'),
        message.includes('insufficient_credits')
          ? t('mediaMessages.insufficientCredits', 'Bu soru için yeterli krediniz yok.')
          : t('mediaMessages.sendError', 'Medya sorusu gönderilemedi. Lütfen tekrar deneyin.'),
      );
    } finally {
      setMediaQuestionLoading(false);
    }
  };

  const startAudioQuestion = async () => {
    if (!consultant || !mediaSettings?.audio_enabled || mediaQuestionLoading) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/auth/login', params: { next: `/consultant/${consultant.id}` } } as any);
      return;
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('mediaMessages.microphonePermissionTitle', 'Mikrofon izni gerekli'),
          t('mediaMessages.microphonePermissionBody', 'Sesli soru kaydetmek için mikrofon izni vermeniz gerekiyor.'),
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
    } catch (err) {
      logger.error('Audio question recording start error:', err);
      Alert.alert(t('common.error', 'Hata'), t('mediaMessages.recordError', 'Kayıt başlatılamadı.'));
    }
  };

  const stopAudioQuestion = async () => {
    if (!recording) return;
    const startedAt = recordingStartedAtRef.current ?? Date.now();
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecording(false);
      recordingStartedAtRef.current = null;
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri) throw new Error('recording_uri_missing');
      await submitAudioQuestion(uri, Math.round((Date.now() - startedAt) / 1000));
    } catch (err) {
      setRecording(false);
      recordingStartedAtRef.current = null;
      logger.error('Audio question recording stop error:', err);
      Alert.alert(t('common.error', 'Hata'), t('mediaMessages.recordError', 'Kayıt tamamlanamadı.'));
    }
  };

  const handleAudioQuestionPress = () => {
    if (recording) {
      stopAudioQuestion();
      return;
    }
    Alert.alert(
      t('mediaMessages.audioQuestionTitle', 'Sesli soru gönder'),
      t('mediaMessages.audioQuestionConfirm', '{{price}} {{currency}} karşılığı kısa bir sesli soru kaydedilecek. Hazır olduğunuzda kaydı başlatın.', {
        price: Math.ceil(mediaSettings?.audio_price ?? 0),
        currency: mediaSettings?.currency ?? 'TRY',
      }),
      [
        { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
        { text: t('mediaMessages.startRecording', 'Kaydı Başlat'), onPress: startAudioQuestion },
      ],
    );
  };

  const handleVideoQuestionPress = async () => {
    if (!consultant || !mediaSettings?.video_enabled || mediaQuestionLoading) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/auth/login', params: { next: `/consultant/${consultant.id}` } } as any);
      return;
    }

    Alert.alert(
      t('mediaMessages.videoQuestionTitle', 'Görüntülü soru gönder'),
      t('mediaMessages.videoQuestionConfirm', '{{price}} {{currency}} karşılığı kısa bir video soru kaydedilecek.', {
        price: Math.ceil(mediaSettings.video_price),
        currency: mediaSettings.currency ?? 'TRY',
      }),
      [
        { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
        {
          text: t('mediaMessages.startRecording', 'Kaydı Başlat'),
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert(
                  t('mediaMessages.cameraPermissionTitle', 'Kamera izni gerekli'),
                  t('mediaMessages.cameraPermissionBody', 'Görüntülü soru kaydetmek için kamera izni vermeniz gerekiyor.'),
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 0.8,
                videoMaxDuration: 180,
              });
              if (result.canceled || !result.assets?.[0]?.uri) return;

              setMediaQuestionLoading(true);
              const asset = result.assets[0];
              const form = new FormData();
              form.append('file', {
                uri: asset.uri,
                name: `video-question-${Date.now()}.mp4`,
                type: asset.mimeType ?? 'video/mp4',
              } as unknown as Blob);
              const upload = await storageApi.upload(form, {
                bucket: 'media_messages',
                path: `${consultant.id}/${Date.now()}`,
              });
              if (!upload.path) throw new Error('upload_failed');
              await mediaMessagesApi.create({
                consultant_id: consultant.id,
                kind: 'video',
                storage_path: upload.path,
                duration_seconds: asset.duration ? Math.max(1, Math.round(asset.duration / 1000)) : undefined,
                note: topic ? String(topic) : null,
              });
              Alert.alert(
                t('mediaMessages.sentTitle', 'Sorunuz gönderildi'),
                t('mediaMessages.sentBody', 'Danışman yanıtı geldiğinde bildirim alacaksınız.'),
                [{ text: t('common.ok', 'Tamam'), onPress: () => router.push('/media-messages' as any) }],
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              Alert.alert(
                t('common.error', 'Hata'),
                message.includes('insufficient_credits')
                  ? t('mediaMessages.insufficientCredits', 'Bu soru için yeterli krediniz yok.')
                  : t('mediaMessages.sendError', 'Medya sorusu gönderilemedi. Lütfen tekrar deneyin.'),
              );
            } finally {
              setMediaQuestionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleMessage = () => {
    if (!consultant) return;
    if (authHydrating) return;
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired', 'Giriş gerekli'),
        t('consultantDetail.messageLoginPrompt', 'Danışmana mesaj göndermek için giriş yapın veya hesap oluşturun.'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.registerBtn'),
            onPress: () =>
              router.push({
                pathname: '/auth/register',
                params: { next: `/consultant/${consultant.id}` },
              } as any),
          },
          {
            text: t('auth.login', 'Giriş'),
            onPress: () =>
              router.push({
                pathname: '/auth/login',
                params: { next: `/consultant/${consultant.id}` },
              } as any),
          },
        ],
      );
      return;
    }
    chatApi
      .createThreadForConsultant(consultant.id)
      .then(({ id: tid }) => router.push(`/chat/${tid}`))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : t('booking.messageFailed', 'Mesaj başlatılamadı.');
        Alert.alert(t('common.error'), msg);
      });
  };

  const handleRequestNow = async () => {
    if (!consultant) return;
    if (!isAuthenticated) {
      Alert.alert(t('auth.loginRequired', 'Giriş gerekli'), t('consultantDetail.instantLoginPrompt', 'Anlık görüşme talebi için giriş yapmalısınız.'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.login', 'Giriş'), onPress: () => router.push('/auth/login' as any) },
      ]);
      return;
    }
    const isOnline = typeof consultant.is_online === 'boolean'
      ? consultant.is_online
      : Number(consultant.is_online ?? consultant.is_available) === 1;
    if (!isOnline) {
      Alert.alert(t('consultantDetail.unavailableTitle', 'Müsait değil'), t('consultantDetail.unavailableBody', 'Danışman şu an çevrimiçi görünmüyor.'));
      return;
    }
    setRequestNowLoading(true);
    try {
      const res = await bookingsApi.requestNow({
        consultant_id: consultant.id,
        ...(selectedServiceId ? { service_id: selectedServiceId } : {}),
      });
      Alert.alert(
        t('consultantDetail.requestSentTitle', 'Talep gönderildi'),
        res.message ?? t('consultantDetail.requestSentBody', 'Danışman onayladığında bildirim alacaksınız.'),
        [{ text: t('common.ok', 'Tamam'), onPress: () => router.push('/(tabs)/bookings' as any) }],
      );
    } catch (err: unknown) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('consultantDetail.requestFailed', 'Talep gönderilemedi.'));
    } finally {
      setRequestNowLoading(false);
    }
  };

  const handleBooking = () => {
    if (!consultant || !selectedSlot) return;
    const svc = selectedService;
    const price =
      svc != null
        ? String(svc.price)
        : resolvedMediaType === 'video' && canShowVideoOption
          ? String(videoSessionPrice)
          : consultant.session_price;
    const duration = svc?.duration_minutes ?? consultant.session_duration;
    const isFree = svc?.is_free === 1 || Number(price) === 0;

    router.push({
      pathname: '/booking/checkout',
      params: {
        consultantId: consultant.id,
        resourceId: selectedSlot.resource_id,
        slotId: selectedSlot.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedSlot.slot_time.substring(0, 5),
        price: String(price),
        duration: String(duration),
        name: consultant.full_name ?? '',
        topic,
        ...(resolvedMediaType ? { mediaType: resolvedMediaType } : {}),
        ...(svc?.id ? { serviceId: svc.id, serviceName: svc.name } : {}),
        ...(isFree ? { free: '1' } : {}),
      },
    });
  };

  const footerPrice = displaySessionPrice;
  const footerIsFree = selectedService?.is_free === 1 || footerPrice === 0;

  if (loading || !consultant) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const isOnline = typeof consultant.is_online === 'boolean'
    ? consultant.is_online
    : Number(consultant.is_online ?? consultant.is_available) === 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          {consultant.avatar_url && (
            <Image source={{ uri: consultant.avatar_url }} style={styles.heroBg} blurRadius={10} />
          )}
          
          <SafeAreaView edges={['top']}>
            <View style={styles.topNav}>
              <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
                <ChevronLeft size={24} color={colors.text} />
              </Pressable>
              <Pressable
                style={[styles.chatBtn, authHydrating && { opacity: 0.5 }]}
                onPress={handleMessage}
                disabled={authHydrating}
              >
                <MessageSquare size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.profileArea}>
              <View style={styles.avatarContainer}>
                {consultant.avatar_url ? (
                  <Image source={{ uri: consultant.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{consultant.full_name?.[0]}</Text></View>
                )}
                {isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.nameRow}>
                <Text style={styles.name}>{consultant.full_name}</Text>
                <ShieldCheck size={18} color={colors.gold} />
              </View>
              
              <Text style={styles.expertise}>{consultant.expertise.join(' · ')}</Text>

              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Star size={14} color={colors.gold} fill={colors.gold} />
                  <Text style={styles.metricVal}>{consultant.rating_avg}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text style={styles.metricVal}>{consultant.session_duration} dk</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Globe size={14} color={colors.textMuted} />
                  <Text style={styles.metricVal}>{consultant.languages.map(l => l.toUpperCase()).join('/')}</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('consultant.about')}</Text>
          <Text style={styles.bio}>{consultant.bio || t('consultantDetail.noBio', 'Bu danışman henüz bir açıklama eklememiş.')}</Text>
        </View>

        {mediaSettings?.audio_enabled || mediaSettings?.video_enabled ? (
          <View style={styles.section}>
            {mediaSettings.audio_enabled ? (
              <View style={styles.mediaQuestionCard}>
                <View style={styles.mediaQuestionHeader}>
                  <Text style={styles.mediaQuestionTitle}>
                    {t('mediaMessages.audioQuestionTitle', 'Sesli soru gönder')}
                  </Text>
                  <Text style={styles.mediaQuestionPrice}>
                    {Math.ceil(mediaSettings.audio_price)} {mediaSettings.currency}
                  </Text>
                </View>
                <Text style={styles.mediaQuestionText}>
                  {t('mediaMessages.audioQuestionDesc', 'Kısa bir ses kaydı gönderin; danışman yanıtladığında bildirim alırsınız.')}
                </Text>
                <Pressable
                  style={[
                    styles.mediaQuestionBtn,
                    recording && styles.mediaQuestionBtnRecording,
                    mediaQuestionLoading && styles.mediaQuestionBtnDisabled,
                  ]}
                  onPress={handleAudioQuestionPress}
                  disabled={mediaQuestionLoading}
                >
                  {mediaQuestionLoading ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Mic size={16} color={colors.ink} />
                  )}
                  <Text style={styles.mediaQuestionBtnText}>
                    {recording
                      ? t('mediaMessages.stopAndSend', 'Durdur ve Gönder')
                      : t('mediaMessages.recordAudio', 'Sesli Soru Kaydet')}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {mediaSettings.video_enabled ? (
              <View style={[styles.mediaQuestionCard, { marginTop: mediaSettings.audio_enabled ? 12 : 0 }]}>
                <View style={styles.mediaQuestionHeader}>
                  <Text style={styles.mediaQuestionTitle}>
                    {t('mediaMessages.videoQuestionTitle', 'Görüntülü soru gönder')}
                  </Text>
                  <Text style={styles.mediaQuestionPrice}>
                    {Math.ceil(mediaSettings.video_price)} {mediaSettings.currency}
                  </Text>
                </View>
                <Text style={styles.mediaQuestionText}>
                  {t('mediaMessages.videoQuestionDesc', 'Kısa bir video kaydı gönderin; danışman video veya sesli yanıt verebilir.')}
                </Text>
                <Pressable
                  style={[styles.mediaQuestionBtn, mediaQuestionLoading && styles.mediaQuestionBtnDisabled]}
                  onPress={handleVideoQuestionPress}
                  disabled={mediaQuestionLoading || Boolean(recording)}
                >
                  {mediaQuestionLoading ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Video size={16} color={colors.ink} />
                  )}
                  <Text style={styles.mediaQuestionBtnText}>{t('mediaMessages.recordVideo', 'Video Soru Kaydet')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Services (FAZ 29) */}
        {servicesLoading ? (
          <View style={styles.section}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : services.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Hizmetler</Text>
            </View>
            {services.map((svc) => {
              const active = selectedServiceId === svc.id;
              const isFree = svc.is_free === 1 || Number(svc.price) === 0;
              return (
                <Pressable
                  key={svc.id}
                  style={[styles.serviceCard, active && styles.serviceCardActive]}
                  onPress={() => setSelectedServiceId(svc.id)}
                >
                  <View style={styles.serviceCardHeader}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    <Text style={styles.servicePrice}>
                      {isFree ? t('common.free', 'Ücretsiz') : `₺${Math.round(Number(svc.price))}`}
                    </Text>
                  </View>
                  <Text style={styles.serviceMeta}>{svc.duration_minutes} dakika</Text>
                  {svc.description ? (
                    <Text style={styles.serviceDesc} numberOfLines={active ? 6 : 2}>
                      {svc.description}
                    </Text>
                  ) : null}
                  {isFree ? (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>TANIŞMA GÖRÜŞMESİ</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {canShowVideoOption ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Video size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Görüşme türü</Text>
            </View>
            <View style={styles.mediaRow}>
              <Pressable
                style={[styles.mediaChip, mediaType === 'audio' && styles.mediaChipActive]}
                onPress={() => setMediaType('audio')}
              >
                <Mic
                  size={16}
                  color={mediaType === 'audio' ? colors.ink : colors.gold}
                />
                <Text
                  style={[
                    styles.mediaChipText,
                    mediaType === 'audio' && styles.mediaChipTextActive,
                  ]}
                >
                  Sesli · ₺{Math.round(baseSessionPrice)}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.mediaChip, mediaType === 'video' && styles.mediaChipActive]}
                onPress={() => setMediaType('video')}
              >
                <Video
                  size={16}
                  color={mediaType === 'video' ? colors.ink : colors.gold}
                />
                <Text
                  style={[
                    styles.mediaChipText,
                    mediaType === 'video' && styles.mediaChipTextActive,
                  ]}
                >
                  Görüntülü · ₺{Math.round(videoSessionPrice)}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.mediaHint}>
              Görüntülü seanslar uygulama içi video görüşme ile yapılır.
            </Text>
          </View>
        ) : null}

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={colors.gold} />
            <Text style={styles.sectionTitle}>Randevu Tarihi</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScroll}>
            {dates.map((date, i) => {
              const active = isSameDay(date, selectedDate);
              return (
                <Pressable 
                  key={i} 
                  style={[styles.dateBtn, active && styles.dateBtnActive]}
                  onPress={() => { setSelectedDate(date); setSelectedSlot(null); }}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>{format(date, 'EEE', { locale: dateLocale })}</Text>
                  <Text style={[styles.dateNum, active && styles.dateTextActive]}>{format(date, 'd')}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Slots Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.gold} />
            <Text style={styles.sectionTitle}>Müsait Saatler</Text>
          </View>
          {slotsLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
          ) : slots.length === 0 ? (
            <View style={styles.emptySlots}>
              <Text style={styles.emptySlotsText}>Bu tarih için müsait randevu bulunmuyor.</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => {
                const active = selectedSlot?.id === slot.id;
                const isFull = (slot.reserved_count || 0) >= slot.capacity;
                return (
                  <Pressable 
                    key={slot.id}
                    style={[styles.slotBtn, active && styles.slotBtnActive, isFull && styles.slotBtnFull]}
                    onPress={() => !isFull && setSelectedSlot(slot)}
                    disabled={isFull}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive, isFull && styles.slotTextFull]}>
                      {slot.slot_time.substring(0, 5)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {isOnline ? (
            <Pressable
              style={[styles.requestNowBtn, requestNowLoading && { opacity: 0.6 }]}
              onPress={handleRequestNow}
              disabled={requestNowLoading}
            >
              {requestNowLoading ? (
                <ActivityIndicator color={colors.gold} />
              ) : (
                <>
                  <Zap size={18} color={colors.gold} />
                  <Text style={styles.requestNowText}>Hemen Görüşme Talep Et</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </View>

      </ScrollView>

      {/* Floating Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>
            {selectedService ? selectedService.name : t('consultantDetail.sessionFeeLabel', 'Seans Ücreti')}
          </Text>
          <Text style={styles.footerPriceVal}>
            {footerIsFree ? t('common.free', 'Ücretsiz') : `₺${Math.round(footerPrice)}`}
          </Text>
        </View>
        <Pressable 
          style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
          onPress={handleBooking}
          disabled={!selectedSlot}
        >
          <Zap size={18} color={colors.ink} />
          <Text style={styles.bookBtnText}>{t('consultant.bookNow')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
