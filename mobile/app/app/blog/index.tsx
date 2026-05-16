import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { customPagesApi } from '@/lib/api';
import { pickPublishedPages, type CustomPageRow } from '@/lib/cms';

function buildStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: { flex: 1, fontFamily: font.display, fontSize: 20, color: colors.text },
    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    cardTitle: { fontFamily: font.display, fontSize: 17, color: colors.text, marginBottom: 8 },
    cardSummary: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });
}

export default function BlogListScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { i18n } = useTranslation();

  const [posts, setPosts] = useState<CustomPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const locale = i18n.language?.slice(0, 2) ?? 'tr';
    const rows = await customPagesApi.list({
      module_key: 'blog',
      locale,
      limit: 30,
      orderDir: 'desc',
    });
    setPosts(pickPublishedPages(rows));
  }, [i18n.language]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Blog</Text>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <BookOpen size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { marginTop: 12 }]}>
                  Henüz yayınlanmış blog yazısı yok.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => {
                  if (!item.slug) return;
                  router.push({
                    pathname: '/blog/[slug]' as any,
                    params: { slug: item.slug, title: item.title ?? '' },
                  });
                }}
              >
                <Text style={styles.cardTitle}>{item.title ?? 'Yazı'}</Text>
                {item.summary ? (
                  <Text style={styles.cardSummary} numberOfLines={3}>
                    {item.summary}
                  </Text>
                ) : null}
                <ChevronRight size={16} color={colors.gold} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
