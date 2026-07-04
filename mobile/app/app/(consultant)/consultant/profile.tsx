import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, UserCog } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { consultantSelfApi } from '@/lib/api';
import { useAppTheme, type AppTheme } from '@/theme';
import type { ConsultantSelfProfile, ConsultantSelfService } from '@/types';

import { logger } from '@/lib/logger';
type ServiceDraft = {
  name: string;
  description: string;
  duration: string;
  price: string;
  media_type: 'audio' | 'video';
  is_free: boolean;
};

const EMPTY_SERVICE: ServiceDraft = {
  name: '',
  description: '',
  duration: '45',
  price: '',
  media_type: 'audio',
  is_free: false,
};

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    kicker: { fontFamily: font.sansBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
    title: { fontFamily: font.display, fontSize: 26, color: colors.text, marginTop: 4 },
    scroll: { padding: spacing.lg, paddingBottom: 48, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
    help: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    label: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
    input: { minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontFamily: font.sansBold, fontSize: 14 },
    textarea: { minHeight: 96, textAlignVertical: 'top' },
    twoCol: { flexDirection: 'row', gap: 10 },
    flex: { flex: 1 },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { flex: 1, height: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    chipText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted },
    chipTextActive: { color: colors.ink },
    btn: { height: 44, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    btnText: { fontFamily: font.sansBold, fontSize: 13, color: colors.ink },
    outlineBtn: { height: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    outlineText: { fontFamily: font.sansBold, fontSize: 12, color: colors.text },
    dangerText: { fontFamily: font.sansBold, fontSize: 12, color: colors.danger },
    serviceCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, backgroundColor: colors.bgDeep, padding: 12, gap: 8 },
    serviceTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
    serviceMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
    empty: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  });
}

function slugify(value: string) {
  const map: Record<string, string> = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
  return value
    .toLowerCase()
    .trim()
    .replace(/[ığüşöç]/g, (char) => map[char] || char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `service-${Date.now()}`;
}

export default function ConsultantProfileScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [profile, setProfile] = useState<ConsultantSelfProfile | null>(null);
  const [services, setServices] = useState<ConsultantSelfService[]>([]);
  const [bio, setBio] = useState('');
  const [sessionPrice, setSessionPrice] = useState('');
  const [sessionDuration, setSessionDuration] = useState('30');
  const [videoPrice, setVideoPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [supportsVideo, setSupportsVideo] = useState(false);
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_SERVICE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hydrateProfile = (next: ConsultantSelfProfile) => {
    setProfile(next);
    setBio(next.bio ?? '');
    setSessionPrice(next.session_price == null ? '' : String(next.session_price));
    setSessionDuration(next.session_duration == null ? '30' : String(next.session_duration));
    setVideoPrice(next.video_session_price == null ? '' : String(next.video_session_price));
    setIsAvailable(Number(next.is_available ?? 1) === 1);
    setSupportsVideo(Number(next.supports_video ?? 0) === 1);
  };

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextServices] = await Promise.all([
        consultantSelfApi.profile(),
        consultantSelfApi.services(),
      ]);
      hydrateProfile(nextProfile);
      setServices(nextServices);
    } catch (err) {
      logger.error('Consultant profile load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    const price = Number(sessionPrice);
    const duration = Number(sessionDuration);
    const video = Number(videoPrice || 0);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(duration) || duration <= 0) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.invalidProfile', 'Ücret ve süre alanlarını kontrol edin.'));
      return;
    }
    setSaving(true);
    try {
      await consultantSelfApi.updateProfile({
        bio: bio.trim() || null,
        session_price: price,
        session_duration: Math.round(duration),
        video_session_price: video,
        is_available: isAvailable ? 1 : 0,
        supports_video: supportsVideo ? 1 : 0,
      });
      await load();
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.profile.saved', 'Profil kaydedildi.'));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.saveError', 'Profil kaydedilemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const createService = async () => {
    const duration = Number(draft.duration);
    const price = draft.is_free ? 0 : Number(draft.price);
    if (!draft.name.trim() || !Number.isFinite(duration) || duration < 15 || (!draft.is_free && (!Number.isFinite(price) || price <= 0))) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.invalidService', 'Hizmet adı, süre ve ücret alanlarını kontrol edin.'));
      return;
    }
    setSaving(true);
    try {
      const baseSlug = slugify(draft.name);
      await consultantSelfApi.createService({
        name: draft.name.trim(),
        slug: `${baseSlug}-${draft.media_type === 'video' ? 'goruntulu' : 'sesli'}`,
        description: draft.description.trim() || null,
        duration_minutes: Math.round(duration),
        price,
        media_type: draft.media_type,
        is_free: draft.is_free ? 1 : 0,
        is_active: 1,
      });
      setDraft(EMPTY_SERVICE);
      setServices(await consultantSelfApi.services());
      Alert.alert(t('common.success', 'Başarılı'), t('consultantPanel.profile.serviceCreated', 'Hizmet eklendi.'));
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.serviceCreateError', 'Hizmet eklenemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleService = async (service: ConsultantSelfService) => {
    setSaving(true);
    try {
      await consultantSelfApi.updateService(service.id, { is_active: service.is_active === 1 ? 0 : 1 });
      setServices(await consultantSelfApi.services());
    } catch (err) {
      Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.serviceUpdateError', 'Hizmet güncellenemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteService = (service: ConsultantSelfService) => {
    Alert.alert(
      t('consultantPanel.profile.deleteServiceTitle', 'Hizmeti sil'),
      t('consultantPanel.profile.deleteServiceBody', '{{name}} silinsin mi?', { name: service.name }),
      [
        { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
        {
          text: t('common.delete', 'Sil'),
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await consultantSelfApi.deleteService(service.id);
              setServices(await consultantSelfApi.services());
            } catch (err) {
              Alert.alert(t('common.error', 'Hata'), t('consultantPanel.profile.serviceDeleteError', 'Hizmet silinemedi.'));
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('consultantPanel.profile.kicker', 'PROFİL & HİZMET')}</Text>
          <Text style={styles.title}>{t('consultantPanel.profile.title', 'Danışman profili')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <UserCog size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('consultantPanel.profile.profileInfo', 'Profil bilgileri')}</Text>
            </View>
            <Text style={styles.label}>{t('consultantPanel.profile.bio', 'BİYOGRAFİ')}</Text>
            <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} multiline maxLength={5000} />
            <View style={styles.twoCol}>
              <View style={styles.flex}>
                <Text style={styles.label}>{t('consultantPanel.profile.sessionPrice', 'SEANS ÜCRETİ')}</Text>
                <TextInput style={styles.input} value={sessionPrice} onChangeText={setSessionPrice} keyboardType="decimal-pad" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>{t('consultantPanel.profile.sessionDuration', 'SÜRE DK')}</Text>
                <TextInput style={styles.input} value={sessionDuration} onChangeText={setSessionDuration} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>{t('consultantPanel.profile.available', 'Profil müsait')}</Text>
              <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>{t('consultantPanel.profile.supportsVideo', 'Video destekler')}</Text>
              <Switch value={supportsVideo} onValueChange={setSupportsVideo} />
            </View>
            {supportsVideo && (
              <>
                <Text style={styles.label}>{t('consultantPanel.profile.videoPrice', 'VIDEO SEANS ÜCRETİ')}</Text>
                <TextInput style={styles.input} value={videoPrice} onChangeText={setVideoPrice} keyboardType="decimal-pad" />
              </>
            )}
            <Pressable style={styles.btn} onPress={saveProfile} disabled={saving || !profile}>
              {saving ? <ActivityIndicator color={colors.ink} /> : null}
              <Text style={styles.btnText}>{t('consultantPanel.profile.saveProfile', 'Profili Kaydet')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Plus size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('consultantPanel.profile.newService', 'Yeni hizmet')}</Text>
            </View>
            <Text style={styles.label}>{t('consultantPanel.profile.serviceName', 'HİZMET ADI')}</Text>
            <TextInput style={styles.input} value={draft.name} onChangeText={(name) => setDraft((prev) => ({ ...prev, name }))} />
            <Text style={styles.label}>{t('consultantPanel.profile.serviceDescription', 'AÇIKLAMA')}</Text>
            <TextInput style={[styles.input, styles.textarea]} value={draft.description} onChangeText={(description) => setDraft((prev) => ({ ...prev, description }))} multiline />
            <View style={styles.chipRow}>
              {(['audio', 'video'] as const).map((type) => {
                const active = draft.media_type === type;
                return (
                  <Pressable key={type} style={[styles.chip, active && styles.chipActive]} onPress={() => setDraft((prev) => ({ ...prev, media_type: type }))}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {type === 'audio' ? t('consultantPanel.profile.audio', 'Sesli') : t('consultantPanel.profile.video', 'Görüntülü')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.twoCol}>
              <View style={styles.flex}>
                <Text style={styles.label}>{t('consultantPanel.profile.duration', 'SÜRE DK')}</Text>
                <TextInput style={styles.input} value={draft.duration} onChangeText={(duration) => setDraft((prev) => ({ ...prev, duration }))} keyboardType="number-pad" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>{t('consultantPanel.profile.price', 'ÜCRET')}</Text>
                <TextInput style={styles.input} value={draft.price} onChangeText={(price) => setDraft((prev) => ({ ...prev, price }))} keyboardType="decimal-pad" editable={!draft.is_free} />
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>{t('consultantPanel.profile.freeService', 'Ücretsiz hizmet')}</Text>
              <Switch value={draft.is_free} onValueChange={(is_free) => setDraft((prev) => ({ ...prev, is_free, price: is_free ? '0' : prev.price }))} />
            </View>
            <Pressable style={styles.btn} onPress={createService} disabled={saving}>
              <Text style={styles.btnText}>{t('consultantPanel.profile.createService', 'Hizmet Ekle')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('consultantPanel.profile.servicesTitle', 'Hizmetler')}</Text>
            {services.length === 0 ? (
              <Text style={styles.empty}>{t('consultantPanel.profile.noServices', 'Henüz hizmet yok.')}</Text>
            ) : services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.serviceTitle}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>
                      {service.media_type === 'video' ? t('consultantPanel.profile.video', 'Görüntülü') : t('consultantPanel.profile.audio', 'Sesli')}
                      {' · '}
                      {service.duration_minutes} dk · {service.is_free === 1 ? t('consultantPanel.profile.free', 'Ücretsiz') : `${Number(service.price).toLocaleString('tr-TR')} ${service.currency}`}
                    </Text>
                  </View>
                  <Switch value={service.is_active === 1} onValueChange={() => toggleService(service)} disabled={saving} />
                </View>
                {!!service.description && <Text style={styles.help}>{service.description}</Text>}
                <Pressable style={styles.outlineBtn} onPress={() => deleteService(service)} disabled={saving}>
                  <View style={styles.titleRow}>
                    <Trash2 size={14} color={colors.danger} />
                    <Text style={styles.dangerText}>{t('common.delete', 'Sil')}</Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
