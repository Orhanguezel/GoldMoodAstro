import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1 },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, gap: 20 },
  section: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.lineSoft, gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  sectionTitle: { fontFamily: font.display, fontSize: 16, color: colors.gold, letterSpacing: 1 },
  inputGroup: { gap: 8 },
  label: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  input: { backgroundColor: colors.inkDeep, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.lineSoft, fontFamily: font.sans, fontSize: 16, color: colors.text },
  chartCard: { backgroundColor: colors.inkDeep, borderRadius: radius.xl, padding: 16, gap: 12 },
  chartHeader: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft, paddingBottom: 8, marginBottom: 4 },
  chartTitle: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 1 },
  chartGrid: { gap: 8 },
  chartItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartValue: { fontFamily: font.sans, fontSize: 13, color: colors.textDim },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  rowDesc: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.danger + '33', backgroundColor: colors.danger + '08' },
  dangerBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.danger, letterSpacing: 1 },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { 
  User, 
  Bell, 
  ShieldAlert, 
  Trash2, 
  Save,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react-native';


import { profilesApi, birthChartsApi, getAssetUrl } from '@/lib/api';
import AvatarUpload from '@/components/AvatarUpload';

function initialsFromName(name?: string | null) {
  return (name || 'GM')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [primaryChart, setPrimaryChart] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    push_notifications: true,
    email_notifications: true
  });

  const loadData = async () => {
    try {
      const [p, charts] = await Promise.all([
        profilesApi.getMyProfile(),
        birthChartsApi.listMyBirthCharts()
      ]);
      setProfile(p);
      setPrimaryChart(charts?.[0]);
      setFormData({
        full_name: p?.full_name || '',
        push_notifications: !!p?.push_notifications,
        email_notifications: !!p?.email_notifications
      });
    } catch (e) {
      logger.error('Settings load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      await profilesApi.upsertMyProfile({
        profile: {
          full_name: formData.full_name,
          avatar_url: profile?.avatar_url,
          push_notifications: formData.push_notifications ? 1 : 0,
          email_notifications: formData.email_notifications ? 1 : 0
        }
      });
      Alert.alert(t('common.success', 'Başarılı'), t('profile.settingsUpdated', 'Ayarlarınız güncellendi.'));
    } catch (e) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.settingsUpdateError', 'Güncelleme yapılamadı.'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.navTitle}>{t('profile.settingsTitle', 'Profil Ayarları')}</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Save size={20} color={colors.gold} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Kişisel Bilgiler */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('profile.personalInfo', 'Kişisel Bilgiler')}</Text>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <AvatarUpload
                uri={profile?.avatar_url}
                initials={initialsFromName(profile?.full_name)}
                onUploaded={(url: string) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))}
                size={90}
              />
              <Text style={[styles.rowDesc, { textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }]}>
                {t('profile.avatarHint', 'Net bir yüz fotoğrafı yükleyin. Yüzünüzün açıkça görünmesi profil onayınızı kolaylaştırır.')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
               <Text style={styles.label}>{t('profile.fullNameLabel', 'AD SOYAD')}</Text>
               <TextInput
                 style={styles.input}
                 value={formData.full_name}
                 onChangeText={(val) => setFormData(prev => ({ ...prev, full_name: val }))}
                 placeholder={t('profile.fullNamePlaceholder', 'Ad Soyad')}
                 placeholderTextColor={colors.textMuted + '66'}
               />
            </View>

            {primaryChart && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{t('profile.birthInfo', 'DOĞUM BİLGİLERİ')}</Text>
                </View>
                <View style={styles.chartGrid}>
                  <View style={styles.chartItem}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={styles.chartValue}>{new Date(primaryChart.dob).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.chartItem}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.chartValue}>{primaryChart.tob}</Text>
                  </View>
                  <View style={styles.chartItem}>
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={styles.chartValue} numberOfLines={1}>{primaryChart.pob_label}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bildirimler */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('settings.notifications', 'Bildirimler')}</Text>
            </View>

            <View style={styles.row}>
               <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{t('profile.pushNotifications', 'Anlık Bildirimler')}</Text>
                  <Text style={styles.rowDesc}>{t('profile.pushNotificationsDesc', 'Günlük yorum ve duyurular')}</Text>
               </View>
               <Switch
                 value={formData.push_notifications}
                 onValueChange={(val) => setFormData(prev => ({ ...prev, push_notifications: val }))}
                 trackColor={{ false: colors.inkDeep, true: colors.gold }}
                 thumbColor={colors.text}
               />
            </View>

            <View style={styles.row}>
               <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{t('profile.emailNotifications', 'E-posta Bildirimleri')}</Text>
                  <Text style={styles.rowDesc}>{t('profile.emailNotificationsDesc', 'Randevu hatırlatmaları')}</Text>
               </View>
               <Switch
                 value={formData.email_notifications}
                 onValueChange={(val) => setFormData(prev => ({ ...prev, email_notifications: val }))}
                 trackColor={{ false: colors.inkDeep, true: colors.gold }}
                 thumbColor={colors.text}
               />
            </View>
          </View>

          {/* Hesap Yönetimi */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldAlert size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>{t('profile.dangerZone', 'Tehlikeli Bölge')}</Text>
            </View>

            <Pressable
               style={styles.dangerBtn}
               onPress={() => {
                 Alert.alert(t('profile.deleteConfirmTitle', 'Emin misiniz?'), t('profile.deleteAccountBody', 'Hesabınız 7 gün sonra kalıcı olarak silinecektir. Bu işlemi 7 gün içinde iptal edebilirsiniz.'), [
                   { text: t('common.giveUp', 'Vazgeç'), style: 'cancel' },
                   { text: t('profile.deleteAccountBtn', 'Hesabımı Sil'), style: 'destructive' }
                 ]);
               }}
            >
               <Trash2 size={16} color={colors.danger} />
               <Text style={styles.dangerBtnText}>{t('profile.deleteAccountUpper', 'HESABI SİL')}</Text>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
