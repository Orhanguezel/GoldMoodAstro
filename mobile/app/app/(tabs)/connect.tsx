import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';

import { useAppTheme, type AppTheme } from '@/theme';
import { consultantsApi } from '@/lib/api';
import type { Consultant } from '@/types';
import SkeletonView from '@/components/SkeletonView';
import { MenuHeaderButton } from '@/components/MenuHeaderButton';
import {
  FUNNEL_CONFIG,
  FUNNEL_TOPIC_TO_CONNECT_FILTER,
  normalizeFunnelTopic,
} from '@/lib/funnel.config';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitles: { flex: 1, minWidth: 0 },
  headerKicker: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontFamily: font.display, fontSize: 28, color: colors.text },
  topicHint: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterIconBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  searchWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineSoft, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  searchInput: { flex: 1, color: colors.text, fontFamily: font.sansMedium, fontSize: 14 },
  catBar: { marginBottom: spacing.md },
  catScroll: { paddingHorizontal: spacing.lg, gap: 10 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  catBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catText: { fontFamily: font.sansMedium, fontSize: 13, color: colors.textDim },
  catTextActive: { fontFamily: font.sansBold, color: colors.ink },
  filterPanelWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  filterPanel: {
    padding: 12,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    gap: 10,
  },
  filterTitle: { fontFamily: font.sansBold, fontSize: 9, color: colors.goldDeep, letterSpacing: 1.4, marginBottom: 6 },
  togglePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgDeep },
  togglePillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  toggleText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold },
  toggleTextActive: { color: colors.ink },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.lineSoft },
  segmentBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  segmentText: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textDim },
  segmentTextActive: { fontFamily: font.sansBold, color: colors.ink },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceHigh },
  avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: font.display, fontSize: 24, color: colors.ink },
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
  featuresTextMuted: { color: colors.textMuted },
  actionBtn: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.goldDim },
  actionBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });
}

/** Backend JSON / string / dizi karışık gelebilir */
function asStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* tek slug vb. */
    }
    return [s];
  }
  return [];
}

export default function ConnectScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [language, setLanguage] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (onlineOnly ? 1 : 0) + (language !== 'all' ? 1 : 0) + (minRating > 0 ? 1 : 0);

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
    }, [loadConsultants]),
  );

  const categories = [
    { id: 'all', label: t('connect.catAll') },
    { id: 'astrology', label: t('home.expertise.astrology') },
    { id: 'tarot', label: t('home.expertise.tarot') },
    { id: 'numerology', label: t('home.expertise.numerology') },
    { id: 'relationship', label: t('home.expertise.relationship') },
    { id: 'mood', label: t('connect.catMood') },
    { id: 'career', label: t('home.expertise.career') },
  ];

  const funnelTopic = normalizeFunnelTopic(topic);
  const funnelHeadline = funnelTopic ? FUNNEL_CONFIG[funnelTopic].headlineTr : null;

  useEffect(() => {
    if (!funnelTopic) return;
    const mapped = FUNNEL_TOPIC_TO_CONNECT_FILTER[funnelTopic];
    if (mapped) setFilter(mapped);
  }, [funnelTopic]);

  const languages = [
    { id: 'all', label: t('connect.langAll') },
    { id: 'tr', label: 'TR' },
    { id: 'en', label: 'EN' },
  ];

  const filteredConsultants = consultants.filter((item) => {
    const expertise = asStringArray(item.expertise);
    const text = `${item.full_name ?? ''} ${expertise.join(' ')}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    if (filter !== 'all' && !expertise.includes(filter)) return false;
    if (language !== 'all' && !asStringArray(item.languages).includes(language)) return false;
    if (onlineOnly && !item.is_available) return false;
    if (Number(item.rating_avg ?? 0) < minRating) return false;
    return true;
  });

  const openConsultant = (id: string) => {
    router.push({
      pathname: '/consultant/[id]',
      params: topic ? { id, topic } : { id },
    } as any);
  };

  const renderConsultant = ({ item }: { item: Consultant }) => (
    <Pressable style={styles.card} onPress={() => openConsultant(item.id)}>
      <View style={styles.cardTop}>
        <View style={styles.avatarWrap}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{item.full_name?.[0] || 'C'}</Text>
            </View>
          )}
          {!!item.is_available && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <ShieldCheck size={14} color={colors.gold} />
          </View>
          <Text style={styles.expertise} numberOfLines={1}>{asStringArray(item.expertise).join(' · ')}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Star size={12} color={colors.gold} fill={colors.gold} />
              <Text style={styles.statVal}>{item.rating_avg}</Text>
              <Text style={styles.statCount}>({item.rating_count})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.statVal}>{t('connect.durationMin', { count: item.session_duration })}</Text>
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
          <Zap size={12} color={item.is_available ? colors.gold : colors.textMuted} />
          <Text style={[styles.featuresText, !item.is_available && styles.featuresTextMuted]}>
            {item.is_available ? t('connect.online') : t('connect.scheduled')}
          </Text>
        </View>
        <Pressable style={styles.actionBtn} onPress={() => openConsultant(item.id)}>
          <Text style={styles.actionBtnText}>{t('connect.profile')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <MenuHeaderButton />
          <View style={styles.headerTitles}>
            <Text style={styles.headerKicker}>{t('connect.kicker')}</Text>
            <Text style={styles.headerTitle}>{t('connect.title')}</Text>
            {funnelHeadline ? (
              <Text style={styles.topicHint}>{funnelHeadline}</Text>
            ) : topic ? (
              <Text style={styles.topicHint}>{t('connect.topicHint')}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('connect.searchA11y')}>
              <Search size={20} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={filtersOpen ? t('connect.filtersCloseA11y') : t('connect.filtersOpenA11y')}
              accessibilityState={{ expanded: filtersOpen }}
              onPress={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal size={20} color={colors.text} />
              {activeFilterCount > 0 ? <View style={styles.filterIconBadge} /> : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('connect.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.catBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map((cat) => (
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

        {filtersOpen ? (
          <View style={styles.filterPanelWrap}>
            <View style={styles.filterPanel}>
              <View>
                <Text style={styles.filterTitle}>{t('connect.filterOnlineTitle')}</Text>
                <Pressable
                  onPress={() => setOnlineOnly((v) => !v)}
                  style={[styles.togglePill, onlineOnly && styles.togglePillActive]}
                >
                  <Zap size={13} color={onlineOnly ? colors.ink : colors.gold} />
                  <Text style={[styles.toggleText, onlineOnly && styles.toggleTextActive]}>
                    {onlineOnly ? t('connect.toggleOn') : t('connect.toggleAll')}
                  </Text>
                </Pressable>
              </View>

              <View>
                <Text style={styles.filterTitle}>{t('connect.filterLangTitle')}</Text>
                <View style={styles.segmentRow}>
                  {languages.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setLanguage(item.id)}
                      style={[styles.segmentBtn, language === item.id && styles.segmentBtnActive]}
                    >
                      <Text style={[styles.segmentText, language === item.id && styles.segmentTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.filterTitle}>{t('connect.filterRatingTitle')}</Text>
                <View style={styles.segmentRow}>
                  {[0, 4, 4.5].map((rating) => (
                    <Pressable
                      key={rating}
                      onPress={() => setMinRating(rating)}
                      style={[styles.segmentBtn, minRating === rating && styles.segmentBtnActive]}
                    >
                      <Text style={[styles.segmentText, minRating === rating && styles.segmentTextActive]}>
                        {rating === 0 ? t('connect.catAll') : `${rating}+`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.list}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonView key={i} width="100%" height={160} borderRadius={24} style={{ marginBottom: 16 }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredConsultants}
            keyExtractor={(item) => item.id}
            renderItem={renderConsultant}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConsultants(); }} tintColor={colors.gold} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('connect.emptyFiltered')}</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

