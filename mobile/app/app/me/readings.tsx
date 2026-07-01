import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Star,
  Coffee,
  Moon,
  Binary,
  Heart,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { historyApi, type ReadingHistoryItem, type ReadingHistoryType } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type FilterId = 'all' | ReadingHistoryType;

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
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
    navTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
    deleteAllBtn: { paddingHorizontal: 10, paddingVertical: 8 },
    deleteAllText: {
      fontFamily: font.sansBold,
      fontSize: 11,
      color: colors.danger,
      letterSpacing: 0.5,
    },
    filterScroll: { marginBottom: spacing.md, paddingLeft: spacing.lg },
    filterInner: { flexDirection: 'row', gap: 8, paddingRight: spacing.lg },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    filterChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    filterText: { fontFamily: font.sansMedium, fontSize: 12, color: colors.textDim },
    filterTextActive: { fontFamily: font.sansBold, color: colors.ink },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: 12 },
    loaderWrap: { padding: 40, alignItems: 'center' },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      gap: 12,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    typeLabel: { fontFamily: font.sansBold, fontSize: 10, letterSpacing: 1 },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.textMuted,
      opacity: 0.3,
    },
    dateText: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
    summaryText: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
    snippetText: {
      fontFamily: font.sans,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    cardActions: { flexDirection: 'row', gap: 10 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    actionBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
    actionBtnDanger: { borderColor: 'rgba(229, 91, 77, 0.35)' },
    actionBtnText: { fontFamily: font.sansBold, fontSize: 11, color: colors.text },
    actionBtnTextPrimary: { color: colors.ink },
    actionBtnTextDanger: { color: colors.danger },
    guestWrap: {
      flex: 1,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    guestTitle: { fontFamily: font.display, fontSize: 22, color: colors.text, textAlign: 'center' },
    guestDesc: {
      fontFamily: font.sans,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    guestBtn: {
      backgroundColor: colors.gold,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: radius.pill,
    },
    guestBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
    emptyWrap: {
      paddingVertical: 80,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    emptyTitle: { fontFamily: font.display, fontSize: 20, color: colors.textMuted, marginTop: 12 },
    emptyDesc: {
      fontFamily: font.sans,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });
}

const FILTERS: { id: FilterId; labelKey: string }[] = [
  { id: 'all', labelKey: 'readings.filterAll' },
  { id: 'tarot', labelKey: 'readings.filterTarot' },
  { id: 'coffee', labelKey: 'readings.filterCoffee' },
  { id: 'dream', labelKey: 'readings.filterDream' },
  { id: 'synastry', labelKey: 'readings.filterSynastry' },
  { id: 'yildizname', labelKey: 'readings.filterYildizname' },
  { id: 'numerology', labelKey: 'readings.filterNumerology' },
];

function typeConfig(colors: AppTheme['colors']) {
  return {
    tarot: { labelKey: 'readings.typeTarot', icon: Star, color: colors.gold },
    coffee: { labelKey: 'readings.typeCoffee', icon: Coffee, color: colors.goldDim },
    dream: { labelKey: 'readings.typeDream', icon: Moon, color: colors.goldDeep },
    numerology: { labelKey: 'readings.typeNumerology', icon: Binary, color: colors.gold },
    yildizname: { labelKey: 'readings.typeYildizname', icon: Sparkles, color: colors.goldLight },
    synastry: { labelKey: 'readings.typeSynastry', icon: Heart, color: colors.gold },
  } as const;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const TYPE_CONFIG = useMemo(() => typeConfig(colors), [colors]);

  const { isAuthenticated, authHydrating } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await historyApi.getUserHistory(50);
      setHistory(data);
    } catch (e) {
      console.error('Load history error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authHydrating) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadHistory();
  }, [authHydrating, isAuthenticated, loadHistory]);

  const filtered = useMemo(
    () => (filter === 'all' ? history : history.filter((h) => h.type === filter)),
    [history, filter],
  );

  const confirmDeleteOne = (item: ReadingHistoryItem) => {
    Alert.alert(t('readings.deleteOneTitle'), t('readings.deleteOneConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('readings.delete'),
        style: 'destructive',
        onPress: async () => {
          const key = `${item.type}:${item.id}`;
          setDeletingId(key);
          try {
            await historyApi.deleteReading(item.type, item.id);
            setHistory((prev) => prev.filter((h) => !(h.type === item.type && h.id === item.id)));
          } catch (e: unknown) {
            Alert.alert(t('common.error'), e instanceof Error ? e.message : t('readings.deleteFailed'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      t('readings.deleteAllTitle'),
      t('readings.deleteAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('readings.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              await historyApi.deleteAll();
              setHistory([]);
            } catch (e: unknown) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('readings.deleteFailed'));
            }
          },
        },
      ],
    );
  };

  const openReading = (item: ReadingHistoryItem) => {
    router.push({
      pathname: '/me/readings/[type]/[id]',
      params: { type: item.type, id: item.id },
    } as any);
  };

  if (authHydrating) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.gold} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.navHeader}>
            <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.gold} />
            </Pressable>
            <Text style={styles.navTitle}>{t('readings.title')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.guestWrap}>
            <Clock size={48} color={colors.gold} />
            <Text style={styles.guestTitle}>{t('readings.guestTitle')}</Text>
            <Text style={styles.guestDesc}>
              {t('readings.guestDesc')}
            </Text>
            <Pressable style={styles.guestBtn} onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.guestBtnText}>{t('readings.guestLogin')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.navTitle}>{t('readings.title')}</Text>
          {history.length > 0 ? (
            <Pressable onPress={confirmDeleteAll} style={styles.deleteAllBtn}>
              <Text style={styles.deleteAllText}>{t('readings.deleteAll')}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterInner}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{t(f.labelKey)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadHistory();
              }}
              tintColor={colors.gold}
            />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((item) => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;
              const deleteKey = `${item.type}:${item.id}`;
              const isDeleting = deletingId === deleteKey;

              return (
                <View key={deleteKey} style={styles.card}>
                  <Pressable style={styles.cardTop} onPress={() => openReading(item)}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: config.color + '15',
                          borderColor: config.color + '33',
                        },
                      ]}
                    >
                      <Icon size={22} color={config.color} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.typeLabel, { color: config.color }]}>
                          {t(config.labelKey)}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.dateText}>
                          {new Date(item.created_at).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      <Text style={styles.summaryText} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.snippet ? (
                        <Text style={styles.snippetText} numberOfLines={2}>
                          {item.snippet}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </Pressable>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => openReading(item)}
                    >
                      <ExternalLink size={14} color={colors.ink} />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>{t('readings.open')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => confirmDeleteOne(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <>
                          <Trash2 size={14} color={colors.danger} />
                          <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>{t('readings.delete')}</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyWrap}>
              <Clock size={48} color={colors.line} />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? t('readings.emptyAll') : t('readings.emptyCategory')}
              </Text>
              <Text style={styles.emptyDesc}>
                {t('readings.emptyDesc')}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
