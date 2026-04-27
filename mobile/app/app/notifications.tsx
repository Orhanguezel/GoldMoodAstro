import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Bell, CheckCircle2, Info, AlertTriangle, MessageCircle } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { notificationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.list();
      setNotifications(res?.items || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Mark as read error:', err);
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

  if (loading && !refreshing) {
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
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <Pressable onPress={() => notificationsApi.markAllAsRead().then(fetchNotifications)} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Hepsini Oku</Text>
          </Pressable>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
          }
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.notifCard, !item.is_read && styles.notifUnread]}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <View style={styles.notifIcon}>
                {getIcon(item.type)}
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifText}>{item.body}</Text>
                <Text style={styles.notifTime}>
                  {format(parseISO(item.created_at), 'd MMM, HH:mm', { locale: tr })}
                </Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Bell size={40} color={colors.inkDeep} />
              </View>
              <Text style={styles.emptyText}>Henüz bir bildiriminiz bulunmuyor.</Text>
            </View>
          }
        />

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
    backgroundColor: 'rgba(201, 169, 97, 0.05)',
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
