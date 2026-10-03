import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { customerThreadsApi, getAssetUrl, type CustomerThread } from '@/lib/api';
import { safeRouterBack } from '@/lib/navigation';
import { logger } from '@/lib/logger';

function stylesFor(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, fontFamily: font.display, fontSize: 23, color: colors.text },
    list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    row: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: radius.md, backgroundColor: colors.surface },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 48, height: 48 },
    avatarText: { fontFamily: font.sansBold, color: colors.gold, fontSize: 17 },
    body: { flex: 1, gap: 4 },
    name: { fontFamily: font.sansBold, color: colors.text, fontSize: 15 },
    preview: { fontFamily: font.sans, color: colors.textMuted, fontSize: 13 },
    meta: { fontFamily: font.sans, color: colors.textMuted, fontSize: 11 },
    badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
    badgeText: { fontFamily: font.sansBold, color: colors.ink, fontSize: 11 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    centerText: { color: colors.textMuted, fontFamily: font.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    action: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.gold },
    actionText: { color: colors.ink, fontFamily: font.sansBold, fontSize: 14 },
  });
}

export default function CustomerInboxScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => stylesFor(theme), [theme]);
  const { colors } = theme;
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [result, setResult] = useState<{ userId: string; threads: CustomerThread[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const userId = user?.id;
  const currentUserId = useRef(userId);
  currentUserId.current = userId;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const threads = await customerThreadsApi.list();
      if (currentUserId.current === userId) setResult({ userId, threads });
    } catch (err) {
      logger.error('Customer inbox load failed:', err);
      if (currentUserId.current === userId) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const threads = result && result.userId === userId ? result.threads : [];
  const dateLocale = i18n.language.startsWith('de') ? 'de-DE' : i18n.language.startsWith('en') ? 'en-US' : 'tr-TR';

  const renderThread = ({ item }: { item: CustomerThread }) => {
    const name = item.consultant?.display_name || item.consultant?.full_name || t('inbox.consultantFallback', 'Danışman');
    const avatar = getAssetUrl(item.consultant?.avatar_url);
    const unreadCount = Number(item.unread_count) || 0;
    const when = new Date(item.last_message?.created_at || item.updated_at);
    return (
      <Pressable
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`${name}${unreadCount ? `, ${unreadCount} ${t('inbox.unreadCount', 'okunmamış mesaj')}` : ''}`}
        onPress={() => router.push(`/messages/${encodeURIComponent(item.thread_id)}?name=${encodeURIComponent(name)}` as Href)}
      >
        <View style={styles.avatar}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.preview} numberOfLines={2}>{item.last_message?.text || t('inbox.noMessage', 'Henüz mesaj yok')}</Text>
          <Text style={styles.meta}>{item.context_type === 'booking' ? `${t('inbox.bookingLabel', 'Randevu')} · ` : item.context_type === 'consultant_lead' ? `${t('inbox.leadLabel', 'Ön görüşme')} · ` : ''}{Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}</Text>
        </View>
        {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => safeRouterBack('/(tabs)/profile')} accessibilityRole="button" accessibilityLabel={t('common.back', 'Geri')}><ChevronLeft size={24} color={colors.gold} /></Pressable>
        <Text style={styles.title}>{t('inbox.title', 'Mesajlarım')}</Text>
      </View>
      {authLoading || (loading && !result) ? <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
        : !isAuthenticated ? <View style={styles.center}><MessageCircle size={42} color={colors.gold} /><Text style={styles.centerText}>{t('inbox.loginRequired', 'Mesajlarınızı görmek için giriş yapın.')}</Text><Pressable style={styles.action} onPress={() => router.push({ pathname: '/auth/login', params: { next: '/messages' } })}><Text style={styles.actionText}>{t('auth.loginShort', 'Giriş yap')}</Text></Pressable></View>
        : error && threads.length === 0 ? <View style={styles.center}><Text style={styles.centerText}>{t('inbox.loadError', 'Mesajlar yüklenemedi.')}</Text><Pressable style={styles.action} onPress={() => void load()}><Text style={styles.actionText}>{t('inbox.retry', 'Tekrar dene')}</Text></Pressable></View>
        : <FlatList data={threads} keyExtractor={(item) => item.thread_id} renderItem={renderThread} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.gold} />} ListEmptyComponent={<View style={styles.center}><MessageCircle size={42} color={colors.gold} /><Text style={styles.centerText}>{t('inbox.empty', 'Henüz mesajınız yok. Bir danışmana mesaj gönderdiğinizde konuşmanız burada görünür.')}</Text><Pressable style={styles.action} onPress={() => router.push('/(tabs)/connect')}><Text style={styles.actionText}>{t('inbox.browseConsultants', 'Danışmanları incele')}</Text></Pressable></View>} />}
    </SafeAreaView>
  );
}
