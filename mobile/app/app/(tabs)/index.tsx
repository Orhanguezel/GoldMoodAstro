import { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  Pressable, ScrollView, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { consultantsApi } from '@/lib/api';
import { ConsultantCard } from '@/components/ConsultantCard';
import DailyHoroscopeCard from '@/components/DailyHoroscopeCard';
import { BannerWidget } from '@/components/BannerWidget';
import type { Consultant } from '@/types';

const CATEGORIES = [
  'astrology', 'tarot', 'numerology', 'mood', 'career', 'relationship', 'birth_chart'
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchConsultants = async () => {
    try {
      const res = await consultantsApi.list({ 
        expertise: selectedCategory || undefined 
      });
      setConsultants(res || []);
    } catch (err) {
      console.error('Failed to fetch consultants:', err);
      setConsultants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConsultants();
  }, [selectedCategory]);

  const filteredConsultants = (consultants || []).filter(c => 
    c.full_name?.toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>
            Gold<Text style={styles.brandAccent}>Mood</Text>Astro
          </Text>
        </View>
        
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.search')}
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <Pressable 
            style={[styles.categoryBtn, !selectedCategory && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              Hepsi
            </Text>
          </Pressable>
          {CATEGORIES.map(cat => (
            <Pressable 
              key={cat}
              style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {t(`home.expertise.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.amethyst} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredConsultants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConsultantCard 
              consultant={item} 
              onPress={() => router.push(`/consultant/${item.id}`)} 
            />
          )}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
              <BannerWidget placement="mobile_home" />
              <DailyHoroscopeCard />
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amethyst} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('home.noResults')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  header: { padding: spacing.lg, gap: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: {
    fontSize: 24,
    fontFamily: font.display,
    color: colors.stardust,
    letterSpacing: -0.5,
  },
  brandAccent: { color: colors.gold, fontStyle: 'italic' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.stardust, fontFamily: font.sans, fontSize: 15 },
  categoriesContainer: { marginBottom: spacing.md },
  categoriesScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  categoryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoryBtnActive: { backgroundColor: colors.amethyst, borderColor: colors.amethyst },
  categoryText: { color: colors.stardustDim, fontFamily: font.sansMedium, fontSize: 13 },
  categoryTextActive: { color: colors.stardust },
  list: { padding: spacing.lg, paddingTop: 0 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.muted, fontFamily: font.sans, fontSize: 15 },
});
