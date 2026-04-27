import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  FlatList, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  Clock, 
  ChevronRight,
  ShieldCheck 
} from 'lucide-react-native';

import { consultantsApi } from '@/lib/api';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Consultant } from '@/types';

export default function ConnectScreen() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    try {
      const data = await consultantsApi.list();
      setConsultants(data);
    } catch (error) {
      console.error('Load consultants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'astrology', label: 'Astroloji' },
    { id: 'tarot', label: 'Tarot' },
    { id: 'numerology', label: 'Numeroloji' },
  ];

  const renderConsultant = ({ item }: { item: Consultant }) => (
    <Pressable 
      style={styles.card}
      onPress={() => router.push(`/consultant/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{item.full_name?.[0] || 'C'}</Text>
            </View>
          )}
          <View style={[styles.statusIndicator, item.is_available ? styles.statusOnline : styles.statusOffline]} />
        </View>
        
        <View style={styles.infoArea}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.full_name}</Text>
            {item.approval_status === 'approved' && <ShieldCheck size={16} color={colors.gold} />}
          </View>
          <Text style={styles.expertise}>{item.expertise.join(' · ')}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={12} color={colors.gold} fill={colors.gold} />
              <Text style={styles.statText}>{item.rating_avg}</Text>
              <Text style={styles.statSubText}>({item.rating_count})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.statText}>{item.session_duration} dk</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceArea}>
          <Text style={styles.price}>₺{Math.round(Number(item.session_price))}</Text>
          <ChevronRight size={20} color={colors.line} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badgeContainer}>
          {item.languages.map(lang => (
            <View key={lang} style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{lang.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <Pressable 
          style={styles.bookBtn}
          onPress={() => router.push(`/consultant/${item.id}` as any)}
        >
          <Text style={styles.bookBtnText}>Randevu Al</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Sticky Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Danışmanlar</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconBtn}>
              <Search size={20} color={colors.textDim} />
            </Pressable>
            <Pressable style={styles.headerIconBtn}>
              <SlidersHorizontal size={20} color={colors.textDim} />
            </Pressable>
          </View>
        </View>

        {/* Categories Bar */}
        <View style={styles.categoriesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
            {categories.map(cat => (
              <Pressable 
                key={cat.id}
                onPress={() => setFilter(cat.id)}
                style={[styles.categoryBtn, filter === cat.id && styles.categoryBtnActive]}
              >
                <Text style={[styles.categoryText, filter === cat.id && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.gold} size="large" />
          </View>
        ) : (
          <FlatList
            data={consultants}
            keyExtractor={item => item.id}
            renderItem={renderConsultant}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Henüz bir danışman bulunmuyor.</Text>
              </View>
            }
          />
        )}

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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },

  // Categories
  categoriesBar: {
    marginBottom: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoryBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  categoryText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.textDim,
  },
  categoryTextActive: {
    color: colors.bgDeep,
    fontFamily: font.sansBold,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgDeep,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.bgDeep,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  statusOnline: {
    backgroundColor: colors.success,
  },
  statusOffline: {
    backgroundColor: colors.textMuted,
  },
  infoArea: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: font.display,
    fontSize: 17,
    color: colors.text,
  },
  expertise: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.goldDim,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.text,
  },
  statSubText: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 10,
    backgroundColor: colors.line,
  },
  priceArea: {
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.gold,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  langBadge: {
    backgroundColor: colors.inkDeep,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  langBadgeText: {
    fontFamily: font.mono,
    fontSize: 9,
    color: colors.textMuted,
  },
  bookBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  bookBtnText: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.bgDeep,
  },

  empty: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
  },
});
