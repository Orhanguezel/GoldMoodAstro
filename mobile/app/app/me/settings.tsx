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
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold + '15', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
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
  MapPin,
  Lock,
} from 'lucide-react-native';


import { profilesApi, birthChartsApi, authApi } from '@/lib/api';
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
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [primaryChart, setPrimaryChart] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    push_notifications: true,
    email_notifications: true
  });
  const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' });

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const p = await profilesApi.getMyProfile();
      setProfile(p);
      setFormData({
        full_name: p?.full_name || '',
        phone: typeof p?.phone === 'string' ? p.phone : '',
        address_line1: typeof p?.address_line1 === 'string' ? p.address_line1 : '',
        city: typeof p?.city === 'string' ? p.city : '',
        push_notifications: p?.push_notifications == null ? true : !!p.push_notifications,
        email_notifications: p?.email_notifications == null ? true : !!p.email_notifications
      });
      // The birth chart is an optional summary; its failure must not hide account settings.
      try {
        const charts = await birthChartsApi.listMyBirthCharts();
        setPrimaryChart(charts?.[0] ?? null);
      } catch {
        setPrimaryChart(null);
      }
    } catch (e) {
      logger.error('Settings load error:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  const handleSave = async () => {
    if (saving || loadError) return;
    const fullName = formData.full_name.trim();
    if (!fullName) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.fullNameRequired', 'Ad soyad boş bırakılamaz.'));
      return;
    }
    setSaving(true);
    try {
      const updated = await profilesApi.upsertMyProfile({
        profile: {
          full_name: fullName,
          phone: formData.phone.trim(),
          address_line1: formData.address_line1.trim(),
          city: formData.city.trim(),
          ...(typeof profile?.avatar_url === 'string' && profile.avatar_url ? { avatar_url: profile.avatar_url } : {}),
          push_notifications: formData.push_notifications ? 1 : 0,
          email_notifications: formData.email_notifications ? 1 : 0
        }
      });
      setProfile(updated);
      Alert.alert(t('common.success', 'Başarılı'), t('profile.settingsUpdated', 'Ayarlarınız güncellendi.'));
    } catch (e) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.settingsUpdateError', 'Güncelleme yapılamadı.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (changingPassword) return;
    if (!passwordData.current) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.currentPasswordRequired', 'Mevcut şifrenizi girin.'));
      return;
    }
    if (passwordData.next.length < 6) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.passwordTooShort', 'Şifre en az 6 karakter olmalı.'));
      return;
    }
    if (passwordData.next !== passwordData.confirm) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.passwordsMismatch', 'Şifreler eşleşmiyor.'));
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.updateUser({ password: passwordData.next, current_password: passwordData.current });
      setPasswordData({ current: '', next: '', confirm: '' });
      Alert.alert(t('common.success', 'Başarılı'), t('profile.passwordUpdated', 'Şifre güncellendi.'));
    } catch (e) {
      Alert.alert(t('common.error', 'Bir hata oluştu'), t('profile.passwordUpdateError', 'Şifre güncellenemedi.'));
    } finally {
      setChangingPassword(false);
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
          <Pressable onPress={handleSave} disabled={saving || loadError} accessibilityRole="button" accessibilityLabel={t('profile.save', 'Kaydet')} style={[styles.saveBtn, (saving || loadError) && { opacity: 0.5 }]}>
            <Save size={20} color={colors.gold} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loadError && (
            <View style={styles.section}>
              <Text style={styles.rowTitle}>{t('profile.loadError', 'Profil ayarları yüklenemedi.')}</Text>
              <Pressable onPress={() => void loadData()} accessibilityRole="button" style={[styles.saveBtn, { width: 'auto', minHeight: 48, paddingHorizontal: 20 }]}>
                <Text style={[styles.rowTitle, { color: colors.gold }]}>{t('profile.retry', 'Tekrar dene')}</Text>
              </Pressable>
            </View>
          )}
          {/* Kişisel Bilgiler */}
          {!loadError && <View style={styles.section}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.phoneLabel', 'TELEFON')}</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(phone) => setFormData(prev => ({ ...prev, phone }))} keyboardType="phone-pad" autoComplete="tel" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.addressLabel', 'ADRES')}</Text>
              <TextInput style={styles.input} value={formData.address_line1} onChangeText={(address_line1) => setFormData(prev => ({ ...prev, address_line1 }))} autoComplete="street-address" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.cityLabel', 'ŞEHİR')}</Text>
              <TextInput style={styles.input} value={formData.city} onChangeText={(city) => setFormData(prev => ({ ...prev, city }))} autoComplete="off" />
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
          </View>}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('profile.securityTitle', 'Güvenlik')}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.currentPassword', 'Mevcut şifre')}</Text>
              <TextInput style={styles.input} value={passwordData.current} onChangeText={(current) => setPasswordData(prev => ({ ...prev, current }))} secureTextEntry autoComplete="current-password" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.newPassword', 'Yeni şifre')}</Text>
              <TextInput style={styles.input} value={passwordData.next} onChangeText={(next) => setPasswordData(prev => ({ ...prev, next }))} secureTextEntry autoComplete="new-password" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.confirmPassword', 'Yeni şifre tekrar')}</Text>
              <TextInput style={styles.input} value={passwordData.confirm} onChangeText={(confirm) => setPasswordData(prev => ({ ...prev, confirm }))} secureTextEntry autoComplete="new-password" />
            </View>
            <Pressable onPress={handleChangePassword} disabled={changingPassword} accessibilityRole="button" style={[styles.saveBtn, { width: 'auto', minHeight: 48, paddingHorizontal: 20 }, changingPassword && { opacity: 0.5 }]}>
              <Text style={[styles.rowTitle, { color: colors.gold }]}>{changingPassword ? t('profile.updatingPassword', 'Güncelleniyor...') : t('profile.updatePassword', 'Şifreyi güncelle')}</Text>
            </Pressable>
          </View>

          {/* Bildirimler */}
          {!loadError && <View style={styles.section}>
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
          </View>}

          {!loadError && <Pressable onPress={handleSave} disabled={saving} accessibilityRole="button" style={[styles.saveBtn, { width: 'auto', paddingHorizontal: 24, minHeight: 48, gap: 8 }, saving && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color={colors.gold} /> : <Save size={18} color={colors.gold} />}
            <Text style={[styles.rowTitle, { color: colors.gold }]}>{saving ? t('profile.saving', 'Kaydediliyor...') : t('profile.save', 'Kaydet')}</Text>
          </Pressable>}

          {/* Hesap Yönetimi */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShieldAlert size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>{t('profile.dangerZone', 'Tehlikeli Bölge')}</Text>
            </View>

            <Pressable
               style={styles.dangerBtn}
               onPress={() => router.push('/profile/privacy' as never)}
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
