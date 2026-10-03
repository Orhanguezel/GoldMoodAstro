import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
  },
  markAllBtn: {
    paddingHorizontal: 8,
  },
  markAllText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.gold,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  notifCard: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    alignItems: 'flex-start',
    gap: 16,
  },
  notifUnread: {
    backgroundColor: colors.gold + '0D',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  notifBody: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
  },
  notifTitleUnread: {
    fontFamily: font.sansBold,
    color: colors.text,
  },
  notifText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { ChevronLeft, Bell, CheckCircle2, Info, AlertTriangle, MessageCircle } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { de, enUS, tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';


import { notificationsApi, type AppNotification } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('de') ? de : i18n.language?.startsWith('en') ? enUS : tr;

  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(false);
      const res = await notificationsApi.list();
      setNotifications(res.data);
    } catch (err) {
      logger.error('Failed to fetch notifications:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const task = setTimeout(() => { void fetchNotifications(); }, 0);
    return () => clearTimeout(task);
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      logger.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((previous) => previous.map((notification) => ({ ...notification, is_read: true })));
    } catch (err) {
      logger.error('Mark all as read error:', err);
      setError(true);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed': return <CheckCircle2 size={18} color={colors.success} />;
      case 'message': return <MessageCircle size={18} color={colors.gold} />;
      case 'reminder': return <Info size={18} color={colors.info} />;
      case 'alert': return <AlertTriangle size={18} color={colors.warning} />;
      default: return <Bell size={18} color={colors.gold} />;
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('notifications.title', 'Bildirimler')}</Text>
          <Pressable onPress={handleMarkAllAsRead} style={styles.markAllBtn} disabled={!isAuthenticated || notifications.length === 0}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead', 'Hepsini Oku')}</Text>
          </Pressable>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
          ListHeaderComponent={error ? (
            <Pressable onPress={() => { setLoading(true); void fetchNotifications(); }} style={styles.emptyContainer} accessibilityRole="button">
              <Text style={styles.emptyText}>{t('notifications.loadError')}</Text>
              <Text style={styles.markAllText}>{t('common.retry')}</Text>
            </Pressable>
          ) : null}
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.notifCard, !item.is_read && styles.notifUnread]}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <View style={styles.notifIcon}>
                {getIcon(item.type ?? '')}
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifText}>{item.body ?? item.message}</Text>
                <Text style={styles.notifTime}>
                  {item.created_at ? format(parseISO(item.created_at), 'd MMM, HH:mm', { locale: dateLocale }) : ''}
                </Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
          ListEmptyComponent={!isAuthenticated ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('notifications.loginRequired')}</Text></View>
          ) : error ? null : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Bell size={40} color={colors.inkDeep} />
              </View>
              <Text style={styles.emptyText}>{t('notifications.empty', 'Henüz bir bildiriminiz bulunmuyor.')}</Text>
            </View>
          )}
        />

      </SafeAreaView>
    </View>
  );
}
