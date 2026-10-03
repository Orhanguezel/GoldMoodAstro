import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  guestContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  guestTitle: { fontFamily: font.display, fontSize: 28, color: colors.text, textAlign: 'center' },
  guestBody: { fontFamily: font.sans, fontSize: 14, lineHeight: 22, color: colors.textDim, textAlign: 'center' },
  guestButton: { minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.gold, marginTop: spacing.md },
  guestButtonText: { fontFamily: font.sansBold, fontSize: 16, color: colors.ink },
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
  summaryCard: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, gap: 12 },
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
  Heart,
  History,
  Star,
  BriefcaseBusiness,
} from 'lucide-react-native';


import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi, creditsApi, campaignsApi, profilesApi, type MobileProfile } from '@/lib/api';
import type { Campaign, CreditMe, Subscription } from '@/types';
import { MenuHeaderButton } from '@/components/MenuHeaderButton';
import { BannerUpsell } from '@/components/BannerUpsell';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const activeUserId = useRef(user?.id);
  activeUserId.current = user?.id;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [accountProfile, setAccountProfile] = useState<MobileProfile | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [credits, setCredits] = useState<CreditMe | null>(null);
  const [campaigns, setCampaigns] = useState<{ active: Campaign[]; redeemed: any[] }>({ active: [], redeemed: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [campaignsFailed, setCampaignsFailed] = useState(false);

  const loadData = useCallback(async (pullToRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const requestedUserId = user?.id;
    if (!pullToRefresh) setLoading(true);
    setDataError(false);
    setCampaignsFailed(false);
    if (!pullToRefresh) {
      setSubscription(null);
      setAccountProfile(null);
      setSubscriptionLoaded(false);
      setCredits(null);
      setCampaigns({ active: [], redeemed: [] });
    }
    try {
      const [subscriptionResult, creditsResult, campaignsResult, profileResult] = await Promise.allSettled([
        subscriptionsApi.me(),
        creditsApi.me(),
        campaignsApi.mine(),
        profilesApi.getMyProfile(),
      ]);
      if (activeUserId.current !== requestedUserId) return;
      if (subscriptionResult.status === 'fulfilled') {
        setSubscription(subscriptionResult.value);
        setSubscriptionLoaded(true);
      }
      if (creditsResult.status === 'fulfilled') setCredits(creditsResult.value);
      if (campaignsResult.status === 'fulfilled') setCampaigns(campaignsResult.value);
      else setCampaignsFailed(true);
      if (profileResult.status === 'fulfilled') setAccountProfile(profileResult.value);
      setDataError([subscriptionResult, creditsResult, campaignsResult, profileResult].some((result) => result.status === 'rejected'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      logger.error('Profile data error:', msg);
    } finally {
      if (activeUserId.current === requestedUserId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!isAuthenticated) return;
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

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.guestContent}>
            <Text style={styles.guestTitle}>{t('profile.guestTitle')}</Text>
            <Text style={styles.guestBody}>{t('profile.guestBody')}</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.guestButton}
              onPress={() => router.push({ pathname: '/auth/login', params: { next: '/(tabs)/profile' } })}
            >
              <Text style={styles.guestButtonText}>{t('auth.loginShort')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const hasActiveSub = subscription?.status === 'active' || subscription?.status === 'grace_period';
  const isConsultant = user?.role === 'consultant' || user?.roles?.includes('consultant');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadData(true); }} tintColor={colors.gold} />}
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
                <Text style={styles.avatarInitial}>{accountProfile?.full_name?.[0] || user?.full_name?.[0] || 'U'}</Text>
              </View>
              {hasActiveSub && <View style={styles.premiumBadge}><Crown size={12} color={colors.ink} /></View>}
            </View>
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{accountProfile?.full_name || user?.full_name || t('profile.defaultUserName', 'Kullanıcı')}</Text>
                <ShieldCheck size={18} color={colors.gold} />
              </View>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Summary Stats */}
          {dataError && (
            <Pressable style={styles.group} onPress={() => { setLoading(true); void loadData(); }} accessibilityRole="button">
              <Text style={styles.couponEmpty}>{t('profile.dataLoadError')}</Text>
              <Text style={styles.couponCode}>{t('common.retry')}</Text>
            </Pressable>
          )}
          <View style={[styles.summaryRow, width < 360 && { flexDirection: 'column' }]}>
            <Pressable style={[styles.summaryCard, width < 360 && { flex: undefined }]} onPress={() => router.push('/profile/credits' as any)}>
              <View style={styles.summaryIcon}><Wallet size={20} color={colors.gold} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.summaryLabel}>{t('profile.creditBalanceLabel', 'KREDİ BAKİYESİ')}</Text>
                <Text style={styles.summaryValue}>{credits ? credits.balance : '—'}</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.summaryCard, width < 360 && { flex: undefined }]} onPress={() => router.push('/profile/subscription' as any)}>
              <View style={[styles.summaryIcon, hasActiveSub && { backgroundColor: colors.gold }]}>
                <Crown size={20} color={hasActiveSub ? colors.ink : colors.goldDim} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.summaryLabel}>{t('profile.membershipTypeLabel', 'ÜYELİK TİPİ')}</Text>
                <Text style={[styles.summaryValue, hasActiveSub && { color: colors.gold }]}>{subscriptionLoaded ? (hasActiveSub ? t('profile.membershipPremium', 'Premium') : t('profile.membershipStandard', 'Standart')) : '—'}</Text>
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

            {isConsultant ? (
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

            <Pressable style={styles.menuItem} onPress={() => router.push('/messages' as any)}>
              <View style={styles.menuLeft}>
                <MessageSquare size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuMessages')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/favorites' as any)}>
              <View style={styles.menuLeft}>
                <Heart size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuFavorites')}</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => router.push('/me/readings' as any)}>
              <View style={styles.menuLeft}>
                <History size={20} color={colors.goldDim} />
                <Text style={styles.menuText}>{t('profile.menuReadings')}</Text>
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

            <Pressable style={styles.menuItem} onPress={() => router.push('/me/settings' as any)}>
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
              {campaignsFailed ? (
                <Text style={styles.couponEmpty}>{t('profile.dataLoadError')}</Text>
              ) : campaigns.active.length === 0 && (
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
