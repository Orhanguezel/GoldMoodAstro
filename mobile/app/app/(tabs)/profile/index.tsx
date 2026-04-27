import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionsApi, creditsApi } from '@/lib/api';
import type { CreditMe, Subscription } from '@/types';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<CreditMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [subscriptionData, creditsData] = await Promise.all([
        subscriptionsApi.me(),
        creditsApi.me(),
      ]);
      setSubscription(subscriptionData);
      setCredits(creditsData);
    } catch (err) {
      console.error('Profile data fetch failed:', err);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Oturumu Kapat',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profil</Text>
            <Pressable 
              style={styles.settingsBtn}
              onPress={() => router.push('/settings' as any)}
            >
              <Settings size={22} color={colors.textDim} />
            </Pressable>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileHero}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>
                  {user?.full_name?.[0] || 'U'}
                </Text>
              </View>
              {hasActiveSub && (
                <View style={styles.crownBadge}>
                  <Crown size={12} color={colors.bgDeep} />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.full_name || 'Kullanıcı'}</Text>
                <ShieldCheck size={16} color={colors.gold} />
              </View>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Wallet / Subscription Summary Row */}
          <View style={styles.summaryRow}>
            <Pressable 
              style={styles.summaryCard}
              onPress={() => router.push('/profile/credits' as any)}
            >
              <View style={styles.summaryIconWrap}>
                <Wallet size={18} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>KREDİ</Text>
                <Text style={styles.summaryValue}>{credits?.balance || 0}</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={styles.summaryCard}
              onPress={() => router.push('/profile/subscription' as any)}
            >
              <View style={[styles.summaryIconWrap, hasActiveSub && { backgroundColor: colors.gold }]}>
                <Crown size={18} color={hasActiveSub ? colors.bgDeep : colors.goldDim} />
              </View>
              <View>
                <Text style={styles.summaryLabel}>ABONELİK</Text>
                <Text style={[styles.summaryValue, hasActiveSub && { color: colors.gold }]}>
                  {hasActiveSub ? 'Premium' : 'Standart'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Menu Sections */}
          <View style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>HESAP</Text>
            
            <Pressable style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <User size={20} color={colors.goldDim} />
                <Text style={styles.menuItemText}>Bilgilerimi Düzenle</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/profile/subscription' as any)}
            >
              <View style={styles.menuItemLeft}>
                <CreditCard size={20} color={colors.goldDim} />
                <Text style={styles.menuItemText}>Ödeme Yöntemleri</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>
          </View>

          <View style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>UYGULAMA</Text>
            
            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/settings' as any)}
            >
              <View style={styles.menuItemLeft}>
                <Settings size={20} color={colors.goldDim} />
                <Text style={styles.menuItemText}>Ayarlar</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable 
              style={styles.menuItem}
              onPress={() => router.push('/profile/privacy' as any)}
            >
              <View style={styles.menuItemLeft}>
                <AlertTriangle size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>Tehlikeli Bölge</Text>
              </View>
              <ChevronRight size={18} color={colors.line} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <LogOut size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>Çıkış Yap</Text>
              </View>
            </Pressable>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>GoldMoodAstro v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2026 Tüm Hakları Saklıdır.</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },

  // Profile Hero
  profileHero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarInitial: {
    fontFamily: font.display,
    fontSize: 36,
    color: colors.gold,
  },
  crownBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.gold,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  userInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontFamily: font.display,
    fontSize: 22,
    color: colors.text,
  },
  userEmail: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 12,
    marginBottom: spacing['3xl'],
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
    marginTop: 2,
  },

  // Menu Groups
  menuGroup: {
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  menuGroupTitle: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 2,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemText: {
    fontFamily: font.sansMedium,
    fontSize: 15,
    color: colors.text,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  versionText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  copyrightText: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
