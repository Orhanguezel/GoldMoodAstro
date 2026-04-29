import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Info, ChevronRight, MapPin, Sparkles } from 'lucide-react-native';

import { birthChartsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BirthChart, NatalChart, PlanetKey, PlanetPlacement } from '@/types';

const { width } = Dimensions.get('window');

const PLANET_ORDER: PlanetKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const HOUSE_DESCS: Record<number, string> = {
  1: 'Kişilik, dış görünüş ve hayata yaklaşım.',
  2: 'Maddi değerler, özgüven ve kaynaklar.',
  3: 'İletişim, yakın çevre ve zihinsel yapı.',
  4: 'Yuva, aile, kökler ve içsel dünya.',
  5: 'Aşk, yaratıcılık, çocuklar ve hobiler.',
  6: 'Günlük rutin, sağlık ve hizmet alanı.',
  7: 'İkili ilişkiler, ortaklıklar ve evlilik.',
  8: 'Dönüşüm, derinlik ve ortak paylaşımlar.',
  9: 'Yüksek öğrenim, inançlar ve keşifler.',
  10: 'Kariyer, toplumsal statü ve hedefler.',
  11: 'Sosyal çevre, idealler ve arkadaşlıklar.',
  12: 'Bilinçaltı, mahremiyet ve spiritüellik.',
};

function point(longitude: number, radiusValue: number, center = 150) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: center + radiusValue * Math.cos(angle),
    y: center + radiusValue * Math.sin(angle),
  };
}

function formatDegree(p: PlanetPlacement) {
  const degree = Math.floor(p.degree_in_sign);
  const minutes = Math.round((p.degree_in_sign - degree) * 60);
  return `${degree}°${String(minutes).padStart(2, '0')}`;
}

function ChartWheel({ chart }: { chart: NatalChart }) {
  const planets = PLANET_ORDER.map((key) => chart.planets[key]).filter(Boolean);
  const aspectLines = chart.aspects.slice(0, 15);

  return (
    <View style={styles.wheelWrap}>
      <Svg width={300} height={300} viewBox="0 0 300 300">
        {/* Decorative background rings */}
        <Circle cx={150} cy={150} r={145} stroke={colors.goldDim} strokeWidth={0.5} strokeDasharray="2,4" fill="none" />
        <Circle cx={150} cy={150} r={130} stroke={colors.goldDim} strokeWidth={1} fill="transparent" />
        <Circle cx={150} cy={150} r={105} stroke={colors.line} strokeWidth={1} fill="none" />
        <Circle cx={150} cy={150} r={70} stroke={colors.lineSoft} strokeWidth={1} fill="none" />

        {/* Sign sectors and symbols */}
        {Array.from({ length: 12 }).map((_, i) => {
          const longitude = i * 30;
          const a = point(longitude, 70);
          const b = point(longitude, 130);
          const label = point(longitude + 15, 117);
          return (
            <G key={`sign-${i}`}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.lineSoft} strokeWidth={1} />
              <SvgText x={label.x} y={label.y + 6} fill={colors.gold} fontSize={14} textAnchor="middle" fontWeight="bold">
                {SIGN_SYMBOLS[i]}
              </SvgText>
            </G>
          );
        })}

        {/* Aspect connections */}
        {aspectLines.map((aspect, i) => {
          const a = chart.planets[aspect.planet_a];
          const b = chart.planets[aspect.planet_b];
          if (!a || !b) return null;
          const p1 = point(a.longitude, 68);
          const p2 = point(b.longitude, 68);
          const isMajor = ['conjunction', 'opposition', 'trine', 'square'].includes(aspect.type);
          return (
            <Line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isMajor ? colors.gold : colors.textMuted}
              strokeOpacity={isMajor ? 0.4 : 0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Planets symbols */}
        {planets.map((planet, i) => {
          const p = point(planet.longitude, 88);
          return (
            <G key={planet.key}>
              <Circle cx={p.x} cy={p.y} r={11} fill={colors.inkDeep} />
              <SvgText x={p.x} y={p.y + 5} fill={planet.retrograde ? colors.warning : colors.gold} fontSize={16} textAnchor="middle">
                {planet.symbol}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export default function BirthChartScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [charts, setCharts] = useState<BirthChart[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const selected = useMemo(
    () => charts.find((c) => c.id === selectedId) ?? charts[0] ?? null,
    [charts, selectedId]
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const rows = await birthChartsApi.list();
      setCharts(rows);
      if (rows[0] && !selectedId) setSelectedId(rows[0].id);
    } catch (err) {
      console.error('Birth charts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, selectedId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
        >
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerKicker}>GÖKYÜZÜ ANALİZİ</Text>
              <Text style={styles.headerTitle}>Natal Harita</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => router.push('/onboarding/birthdata' as any)}>
              <Plus size={20} color={colors.gold} />
            </Pressable>
          </View>

          {charts.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              <View style={styles.tabsInner}>
                {charts.map(c => (
                  <Pressable 
                    key={c.id} 
                    onPress={() => setSelectedId(c.id)}
                    style={[styles.tab, selectedId === c.id && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, selectedId === c.id && styles.tabTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {selected ? (
            <View style={styles.chartContent}>
              
              <LinearGradient colors={[colors.inkDeep, colors.surface]} style={styles.heroCard}>
                <View style={styles.heroInfo}>
                  <Text style={styles.headerKicker}>HARİTA SAHİBİ</Text>
                  <Text style={styles.heroName}>{selected.name}</Text>
                  <View style={styles.heroRow}>
                    <MapPin size={10} color={colors.goldDim} />
                    <Text style={styles.heroDetail}>{selected.pob_label}</Text>
                  </View>
                  <Text style={styles.heroDate}>
                    {new Date(selected.dob).toLocaleDateString('tr-TR')} · {selected.tob.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.ascBadge}>
                  <Text style={styles.ascLabel}>ASCENDANT</Text>
                  <Text style={styles.ascValue}>{selected.chart_data.ascendant.sign_label}</Text>
                </View>
              </LinearGradient>

              <LinearGradient colors={[colors.surface, colors.inkDeep]} style={styles.wheelWrap}>
                <ChartWheel chart={selected.chart_data} />
              </LinearGradient>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={16} color={colors.gold} />
                  <Text style={styles.sectionTitle}>GEZEGEN KONUMLARI</Text>
                </View>
                <View style={styles.planetGrid}>
                  {PLANET_ORDER.map(key => {
                    const p = selected.chart_data.planets[key];
                    if (!p) return null;
                    return (
                      <View key={key} style={styles.planetCard}>
                        <View style={styles.planetTop}>
                          <Text style={styles.planetIcon}>{p.symbol}</Text>
                          <Text style={styles.planetName}>{p.name}</Text>
                        </View>
                        <Text style={styles.planetSign}>{p.sign_label}</Text>
                        <View style={styles.planetBottom}>
                          <Text style={styles.planetDegree}>{formatDegree(p)}</Text>
                          <Text style={styles.planetHouse}>{p.house}. Ev</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={16} color={colors.gold} />
                  <Text style={styles.sectionTitle}>EV ANALİZLERİ</Text>
                </View>
                {selected.chart_data.houses.map(h => (
                  <LinearGradient 
                    key={h.house} 
                    colors={[colors.surface, colors.inkDeep]}
                    style={styles.houseRow}
                  >
                    <View style={styles.houseNumBox}>
                      <Text style={styles.houseNum}>{h.house}</Text>
                    </View>
                    <View style={styles.houseBody}>
                      <Text style={styles.houseHeader}>{h.sign_label} Burcu Kesen</Text>
                      <Text style={styles.houseInfo}>{HOUSE_DESCS[h.house]}</Text>
                    </View>
                  </LinearGradient>
                ))}
              </View>

            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Henüz haritanız yok.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/onboarding/birthdata' as any)}>
                <Text style={styles.primaryBtnText}>Yeni Harita Oluştur</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  headerKicker: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontFamily: font.display, fontSize: 28, color: colors.text },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: { marginBottom: spacing.xl, paddingLeft: spacing.lg },
  tabsInner: { flexDirection: 'row', gap: 8, paddingRight: spacing.lg },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  tabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tabText: { fontFamily: font.sansMedium, fontSize: 13, color: colors.textDim },
  tabTextActive: { color: colors.bgDeep },
  chartContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inkDeep,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: font.display, fontSize: 20, color: colors.text, marginBottom: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroDetail: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
  heroDate: { fontFamily: font.sans, fontSize: 12, color: colors.goldDim },
  ascBadge: {
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    padding: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  ascLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 1 },
  ascValue: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold, marginTop: 2 },
  wheelWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  section: { marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 2 },
  planetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planetCard: {
    width: (width - 40 - 10) / 2,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  planetTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  planetIcon: { fontFamily: font.serif, fontSize: 20, color: colors.gold },
  planetName: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  planetSign: { fontFamily: font.sansMedium, fontSize: 14, color: colors.goldDim, marginBottom: 10 },
  planetBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 10 },
  planetDegree: { fontFamily: font.mono, fontSize: 11, color: colors.textMuted },
  planetHouse: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
  houseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 10,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  houseNumBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  houseNum: { fontFamily: font.sansBold, fontSize: 15, color: colors.gold },
  houseBody: { flex: 1 },
  houseHeader: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
  houseInfo: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontFamily: font.display, fontSize: 20, color: colors.text, marginBottom: 20 },
  primaryBtn: { backgroundColor: colors.gold, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.pill },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 15, color: colors.bgDeep },
});
