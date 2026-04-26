import { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  Pressable, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { consultantsApi } from '@/lib/api';
import { ConsultantCard } from '@/components/ConsultantCard';
import { useFavorites } from '@/hooks/useFavorites';
import type { Consultant } from '@/types';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { favorites, refresh: refreshFavorites } = useFavorites();
  
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoriteConsultants = async () => {
    if (favorites.length === 0) {
      setConsultants([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // API currently doesn't support multiple IDs in list, 
      // so we fetch them one by one or fetch all and filter.
      // For now, let's fetch all and filter for simplicity if count is small,
      // or just fetch by ID if possible.
      const items = await consultantsApi.list();
      const filtered = items.filter(c => (favorites || []).includes(c.id));
      setConsultants(filtered);
    } catch (err) {
      console.error('Failed to fetch favorite consultants:', err);
      setConsultants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshFavorites().then(fetchFavoriteConsultants);
    }, [favorites.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavoriteConsultants();
  }, [favorites.length]);

  if (loading && !refreshing) {
    return (
      <View style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.amethyst} size="large" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.favorites')}</Text>
      </View>

      <FlatList
        data={consultants}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ConsultantCard 
            consultant={item} 
            onPress={() => router.push(`/consultant/${item.id}`)} 
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amethyst} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz favori danışmanınız yok.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.emptyBtnText}>{t('bookings.emptyCta')}</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  header: { padding: spacing.lg },
  title: { fontSize: 24, fontFamily: font.display, color: colors.stardust },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyText: { color: colors.muted, fontFamily: font.sans, fontSize: 15, textAlign: 'center' },
  emptyBtn: { backgroundColor: colors.amethyst, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill },
  emptyBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 14 },
});
