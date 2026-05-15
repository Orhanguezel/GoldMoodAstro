import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { storage } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { mobileBrandConfig } from '@/config/brand';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated, authHydrating } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  const switchLang = async () => {
    const next = i18n.language === 'tr' ? 'en' : 'tr';
    await i18n.changeLanguage(next);
    await storage.setLanguage(next);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  if (authHydrating) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Text style={styles.guestHint}>
            Dil tercihi misafir oturumunda da kullanılabilir. Profil ve çıkış için giriş yapın.
          </Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
            <SettingRow
              label={t('settings.language')}
              value={i18n.language === 'tr' ? 'Türkçe' : 'English'}
              onPress={switchLang}
            />
          </View>
          <Pressable style={styles.loginBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.loginBtnText}>Giriş Yap</Text>
          </Pressable>
          <Pressable style={styles.registerBtn} onPress={() => router.push('/auth/register' as any)}>
            <Text style={styles.registerBtnText}>Hesap Oluştur</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.full_name || 'Kullanıcı'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
          <SettingRow
            label={t('settings.language')}
            value={i18n.language === 'tr' ? 'Türkçe' : 'English'}
            onPress={switchLang}
          />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.notifications')}</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.deep, true: colors.amethyst }}
              thumbColor={colors.stardust}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <SettingRow label={t('settings.support')} onPress={() => {}} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Versiyon</Text>
            <Text style={styles.rowValue}>1.0.0 (Gold)</Text>
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>{mobileBrandConfig.appName}</Text>
          <Text style={styles.footerText}>© 2026 {mobileBrandConfig.appName}. Tüm hakları saklıdır.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg },
  title: { fontSize: 28, fontFamily: font.display, color: colors.stardust, marginBottom: spacing.xl },
  guestHint: {
    fontSize: 14,
    fontFamily: font.sans,
    color: colors.muted,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  loginBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.amethyst,
    alignItems: 'center',
    ...shadows.card,
  },
  loginBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  registerBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  registerBtnText: { color: colors.gold, fontFamily: font.sansBold, fontSize: 15 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amethyst,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: colors.stardust, fontSize: 18, fontFamily: font.sansBold },
  profileInfo: { gap: 2 },
  userName: { fontSize: 18, fontFamily: font.display, color: colors.stardust },
  userEmail: { fontSize: 13, color: colors.muted, fontFamily: font.sans },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontFamily: font.sansBold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLabel: { fontSize: 16, color: colors.stardust, fontFamily: font.sans },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowValue: { fontSize: 14, color: colors.muted, fontFamily: font.sans },
  chevron: { fontSize: 20, color: colors.muted, marginBottom: 2 },
  logoutBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontFamily: font.sansBold, fontSize: 16 },
  footer: { marginTop: spacing.xxl, alignItems: 'center', paddingVertical: spacing.xl },
  footerBrand: { fontSize: 16, fontFamily: font.display, color: colors.gold, marginBottom: 4 },
  footerText: { fontSize: 10, color: colors.muted, fontFamily: font.sans },
});
