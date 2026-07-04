import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  headerTitles: { flex: 1, minWidth: 0 },
  headerKicker: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontFamily: font.display, fontSize: 28, color: colors.text },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: spacing['2xl'], paddingHorizontal: spacing.lg },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.inkDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold },
  avatarInitial: { fontFamily: font.display, fontSize: 36, color: colors.gold },
  premiumBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.gold, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  heroInfo: { alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontFamily: font.display, fontSize: 24, color: colors.text },
  userEmail: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 12, marginBottom: spacing['3xl'] },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, gap: 12 },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.inkDeep, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.textMuted, letterSpacing: 1 },
  summaryValue: { fontFamily: font.display, fontSize: 18, color: colors.text, marginTop: 2 },
  group: { marginBottom: spacing['2xl'], paddingHorizontal: spacing.lg },
  groupTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 18, borderRadius: radius.lg, marginBottom: 10, borderWidth: 1, borderColor: colors.lineSoft },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuText: { fontFamily: font.sansMedium, fontSize: 15, color: colors.text },
  couponPanel: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, padding: 18 },
  couponHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  couponCount: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, color: colors.ink, textAlign: 'center', lineHeight: 44, fontFamily: font.display, fontSize: 22 },
  couponTitle: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  couponSubtitle: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  couponItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12, marginTop: 12 },
  couponCode: { fontFamily: font.sansBold, fontSize: 13, color: colors.gold, letterSpacing: 1 },
  couponMeta: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textMuted },
  couponEmpty: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  footer: { alignItems: 'center', marginTop: 20, paddingBottom: 40 },
  footerVersion: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textMuted },
  footerCopy: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted, marginTop: 4 },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, router } from 'expo-router';
import { 
  User, 
  Settings, 
  CreditCard, 
  Crown, 
  Wallet, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  CalendarDays,
  Bell,
  MessageSquare,
  Star,
  BriefcaseBusiness,
} from 'lucide-react-native';


import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi, creditsApi, campaignsApi } from '@/lib/api';
import type { Campaign, CreditMe, Subscription } from '@/types';
import { MenuHeaderButton } from '@/components/MenuHeaderButton';
import { BannerUpsell } from '@/components/BannerUpsell';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<CreditMe | null>(null);
  const [campaigns, setCampaigns] = useState<{ active: Campaign[]; redeemed: any[] }>({ active: [], redeemed: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [subscriptionData, creditsData, campaignsData] = await Promise.all([
        subscriptionsApi.me(),
        creditsApi.me(),
        campaignsApi.mine(),
      ]);
      setSubscription(subscriptionData);
      setCredits(creditsData);
      setCampaigns(campaignsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      logger.error('Profile data error:', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) {
        router.replace('/auth/login' as any);
        return;
      }
      loadData();
    }, [authLoading, isAuthenticated, loadData]),
  );

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle', 'Oturumu Kapat'),
      t('auth.logoutConfirm', 'Çıkış yapmak istediğinize emin misiniz?'),
      [
        { text: t('common.giveUp', 'Vazgeç'), style: 'cancel' },
        { text: t('settings.logout', 'Çıkış Yap'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const hasActiveSub = subscription?.status === 'active' || subscription?.status === 'grace_period';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.gold} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <MenuHeaderButton />
            <View style={styles.headerTitles}>
              <Text style={styles.headerKicker}>{t('profile.headerKicker', 'ÜYE PANELİ')}</Text>
              <Text style={styles.headerTitle}>{t('profile.headerTitle', 'Profilim')}</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/settings' as any)}>
              <Settings size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* User Profile */}
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{user?.full_name?.[0] || 'U'}</Text>
              </View>
              {hasActiveSub && <View style={styles.premiumBadge}><Crown size={12} color={colors.ink} /></View>}
            </View>
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.full_name || t('profile.defaultUserName', 'Kullanıcı')}</Text>
                <ShieldCheck size={18} color={colors.gold} />
              </View>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <Pressable style={styles.summaryCard} onPress={() => router.push('/profile/credits' as any)}>
              <View style={styles.summaryIcon}><Wallet size={20} color={colors.gold} /></View>
              <View>
                <Text style={styles.summaryLabel}>{t('profile.creditBalanceLabel', 'KREDİ BAKİYESİ')}</Text>
                <Text style={styles.summaryValue}>{credits?.balance || 0}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.summaryCard} onPress={() => router.push('/profile/subscription' as any)}>
              <View style={[styles.summaryIcon, hasActiveSub && { backgroundColor: colors.gold }]}>
                <Crown size={20} color={hasActiveSub ? colors.ink : colors.goldDim} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t('profile.membershipTypeLabel', 'ÜYELİK TİPİ')}</Text>
                <Text style={[styles.summaryValue, hasActiveSub && { color: colors.gold }]}>{hasActiveSub ? t('profile.membershipPremium', 'Premium') : t('profile.membershipStandard', 'Standart')}</Text>
              </View>
            </Pressable>
          </View>

          {/* Menu Sections */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t('profile.groupAccount', 'HESAP YÖNETİMİ')}</Text>

            <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/bookings' as any)}>
              <View style={styles.menuLeft}>
                <CalendarDays size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuBookings', 'Randevularım')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            {user?.role === 'consultant' ? (
              <Pressable style={styles.menuItem} onPress={() => router.push('/consultant' as any)}>
                <View style={styles.menuLeft}>
                  <BriefcaseBusiness size={20} color={colors.goldDim} />
                  <Text style={styles.menuText}>{t('profile.menuConsultantPanel', 'Danışman Paneli')}</Text>
                </View>
                <ChevronRight size={18} color={colors.line} />
              </Pressable>
            ) : null}

            <Pressable style={styles.menuItem} onPress={() => router.push('/notifications' as any)}>
              <View style={styles.menuLeft}>
                <Bell size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuNotifications', 'Bildirimler')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/media-messages' as any)}>
              <View style={styles.menuLeft}>
                <MessageSquare size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuMediaMessages', 'Medya Sorularım')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <User size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuProfileInfo', 'Profil Bilgileri')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>
          </View>

          {/* Banner Upsell — FAZ 41 T41-4/5 */}
          <BannerUpsell />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t('profile.groupCoupons', 'KUPONLARIM')}</Text>
            <View style={styles.couponPanel}>
              <View style={styles.couponHeader}>
                <Text style={styles.couponCount}>{campaigns.active.length}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.couponTitle}>{t('profile.couponsValidTitle', 'Geçerli Kampanyalar')}</Text>
                  <Text style={styles.couponSubtitle}>
                    {t('profile.couponsRedeemed', { defaultValue: 'Kullanılmış kupon: {{count}}', count: campaigns.redeemed.length })}
                  </Text>
                </View>
              </View>
              {campaigns.active.slice(0, 3).map((campaign) => (
                <View key={campaign.id} style={styles.couponItem}>
                  <Text style={styles.couponCode}>{campaign.code}</Text>
                  <Text style={styles.couponMeta}>
                    {t('profile.couponDiscount', { defaultValue: '{{value}} indirim', value: campaign.type === 'discount_percentage' ? `%${Number(campaign.value)}` : `${campaign.value}` })}
                  </Text>
                </View>
              ))}
              {campaigns.active.length === 0 && (
                <Text style={styles.couponEmpty}>{t('profile.couponsEmpty', 'Şu anda hesabınıza uygun aktif kupon yok.')}</Text>
              )}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t('profile.groupSupport', 'DESTEK & GÜVENLİK')}</Text>

            <Pressable style={styles.menuItem} onPress={() => router.push('/karne' as any)}>
              <View style={styles.menuLeft}>
                <Star size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuKarne', 'Astrolog Karnesi')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/info' as any)}>
              <View style={styles.menuLeft}>
                <MessageSquare size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuHelp', 'Yardım & Destek')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/profile/privacy' as any)}>
              <View style={styles.menuLeft}>
                <AlertTriangle size={20} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>{t('profile.menuPrivacy', 'Gizlilik ve Veri')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <LogOut size={20} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>{t('profile.logoutTitle', 'Oturumu Kapat')}</Text>
              </View>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerVersion}>GoldMoodAstro v1.0.0</Text>
            <Text style={styles.footerCopy}>{t('profile.footerCopy', '© 2026 Ruhsal Danışmanlık Platformu')}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
