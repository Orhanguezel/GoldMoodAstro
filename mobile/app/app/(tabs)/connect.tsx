import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  FlatList, 
  ActivityIndicator,
  Image,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react-native';

import { consultantsApi } from '@/lib/api';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Consultant } from '@/types';
import SkeletonView from '@/src/components/SkeletonView';

export default function ConnectScreen() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadConsultants = useCallback(async () => {
    try {
      const data = await consultantsApi.list();
      setConsultants(data);
    } catch (error) {
      console.error('Load consultants error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConsultants();
    }, [loadConsultants])
  );

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
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{item.full_name?.[0] || 'C'}</Text>
            </View>
          )}
          {item.is_available && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <ShieldCheck size={14} color={colors.gold} />
          </View>
          <Text style={styles.expertise} numberOfLines={1}>{item.expertise.join(' · ')}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Star size={12} color={colors.gold} fill={colors.gold} />
              <Text style={styles.statVal}>{item.rating_avg}</Text>
              <Text style={styles.statCount}>({item.rating_count})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.statVal}>{item.session_duration} dk</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.price}>₺{Math.round(Number(item.session_price))}</Text>
          <View style={styles.arrowCircle}>
            <ChevronRight size={16} color={colors.gold} />
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.features}>
          <Zap size={12} color={colors.gold} />
          <Text style={styles.featuresText}>Hemen Görüşebilir</Text>
        </View>
        <Pressable 
          style={styles.actionBtn}
          onPress={() => router.push(`/consultant/${item.id}` as any)}
        >
          <Text style={styles.actionBtnText}>Profil</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerKicker}>UZMAN REHBERLER</Text>
            <Text style={styles.headerTitle}>Danışmanlar</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}><Search size={20} color={colors.text} /></Pressable>
            <Pressable style={styles.iconBtn}><SlidersHorizontal size={20} color={colors.text} /></Pressable>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.catBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map(cat => (
              <Pressable 
                key={cat.id} 
                onPress={() => setFilter(cat.id)}
                style={[styles.catBtn, filter === cat.id && styles.catBtnActive]}
              >
                <Text style={[styles.catText, filter === cat.id && styles.catTextActive]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading && !refreshing ? (
          <View style={styles.list}>
            {[1, 2, 3, 4].map(i => (
              <SkeletonView key={i} width="100%" height={160} borderRadius={24} style={{ marginBottom: 16 }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={consultants}
            keyExtractor={item => item.id}
            renderItem={renderConsultant}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConsultants(); }} tintColor={colors.gold} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Şu an uygun danışman bulunmuyor.</Text>
              </View>
            }
          />
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.lg },
  headerKicker: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontFamily: font.display, fontSize: 28, color: colors.text },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  catBar: { marginBottom: spacing.lg },
  catScroll: { paddingHorizontal: spacing.lg, gap: 10 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  catBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catText: { fontFamily: font.sansMedium, fontSize: 13, color: colors.textDim },
  catTextActive: { fontFamily: font.sansBold, color: colors.bgDeep },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgDeep },
  avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: font.display, fontSize: 24, color: colors.bgDeep },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.surface },
  cardBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: font.display, fontSize: 18, color: colors.text },
  expertise: { fontFamily: font.sans, fontSize: 13, color: colors.goldDim, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  statCount: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
  statDivider: { width: 1, height: 10, backgroundColor: colors.lineSoft },
  cardRight: { alignItems: 'flex-end', gap: 12 },
  price: { fontFamily: font.display, fontSize: 20, color: colors.text },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201, 169, 97, 0.1)', alignItems: 'center', justifyContent: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  features: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuresText: { fontFamily: font.sansMedium, fontSize: 12, color: colors.gold },
  actionBtn: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.goldDim },
  actionBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted },
});
