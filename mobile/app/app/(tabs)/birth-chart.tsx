import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Info, ChevronRight, MapPin } from 'lucide-react-native';

import { birthChartsApi, geocodeApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BirthChart, GeocodeResult, NatalChart, PlanetKey, PlanetPlacement } from '@/types';

const { width } = Dimensions.get('window');

const PLANET_ORDER: PlanetKey[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

const HOUSE_DESCS: Record<number, string> = {
  1: 'Kişilik, dış görünüş, başlangıçlar.',
  2: 'Maddi değerler, özgüven, kaynaklar.',
  3: 'İletişim, yakın çevre, eğitim.',
  4: 'Yuva, kökler, aile, mahremiyet.',
  5: 'Yaratıcılık, aşk, çocuklar, eğlence.',
  6: 'Günlük rutin, sağlık, hizmet.',
  7: 'İkili ilişkiler, ortaklıklar, evlilik.',
  8: 'Dönüşüm, ortak kaynaklar, krizler.',
  9: 'Yüksek öğrenim, inançlar, uzak yollar.',
  10: 'Kariyer, toplumdaki yer, hedefler.',
  11: 'Sosyal çevre, idealler, dostluklar.',
  12: 'Bilinçaltı, izolasyon, spiritüellik.',
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
  const aspectLines = chart.aspects.slice(0, 20);

  return (
    <View style={styles.wheelWrap}>
      <Svg width={300} height={300} viewBox="0 0 300 300">
        {/* Background Rings */}
        <Circle cx={150} cy={150} r={136} stroke={colors.line} strokeWidth={1} fill={colors.bgDeep} />
        <Circle cx={150} cy={150} r={108} stroke={colors.line} strokeWidth={1} fill="none" />
        <Circle cx={150} cy={150} r={72} stroke={colors.lineSoft} strokeWidth={1} fill="none" />

        {/* Signs & Divisions */}
        {Array.from({ length: 12 }).map((_, i) => {
          const longitude = i * 30;
          const a = point(longitude, 72);
          const b = point(longitude, 136);
          const label = point(longitude + 15, 123);
          return (
            <G key={`sign-${i}`}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.lineSoft} strokeWidth={1} />
              <SvgText
                x={label.x}
                y={label.y + 6}
                fill={colors.goldDim}
                fontSize={16}
                textAnchor="middle"
              >
                {SIGN_SYMBOLS[i]}
              </SvgText>
            </G>
          );
        })}

        {/* Aspect Lines */}
        {aspectLines.map((aspect, i) => {
          const a = chart.planets[aspect.planet_a];
          const b = chart.planets[aspect.planet_b];
          if (!a || !b) return null;
          const p1 = point(a.longitude, 68);
          const p2 = point(b.longitude, 68);
          const isMajor = aspect.type === 'conjunction' || aspect.type === 'opposition' || aspect.type === 'trine' || aspect.type === 'square';
          return (
            <Line
              key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isMajor ? colors.gold : colors.line}
              strokeOpacity={isMajor ? 0.3 : 0.15}
              strokeWidth={1}
            />
          );
        })}

        {/* Planets */}
        {planets.map((planet, i) => {
          const p = point(planet.longitude, 90 + (i % 2) * 10);
          return (
            <G key={planet.key}>
              <Circle cx={p.x} cy={p.y} r={10} fill={colors.bgDeep} />
              <SvgText
                x={p.x}
                y={p.y + 5}
                fill={planet.retrograde ? colors.warning : colors.gold}
                fontSize={16}
                textAnchor="middle"
              >
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
  
  const selected = useMemo(
    () => charts.find((chart) => chart.id === selectedId) ?? charts[0] ?? null,
    [charts, selectedId]
  );

  const loadCharts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const rows = await birthChartsApi.list();
      setCharts(rows);
      if (rows[0] && !selectedId) setSelectedId(rows[0].id);
    } catch (error) {
      console.error('Birth charts load error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login' as any);
      return;
    }
    loadCharts();
  }, [authLoading, isAuthenticated, loadCharts]);

  if (authLoading || loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Gök Günlüğü</Text>
            <Pressable 
              style={styles.addIconBtn} 
              onPress={() => router.push('/onboarding/birthdata' as any)}
            >
              <Plus size={20} color={colors.gold} />
            </Pressable>
          </View>

          {/* Chart Selector (Horizontal) */}
          {charts.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              <View style={styles.tabsContainer}>
                {charts.map(chart => (
                  <Pressable 
                    key={chart.id}
                    onPress={() => setSelectedId(chart.id)}
                    style={[styles.tab, selectedId === chart.id && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, selectedId === chart.id && styles.tabTextActive]}>
                      {chart.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {selected ? (
            <View style={styles.chartArea}>
              
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{selected.name}</Text>
                  <View style={styles.profileMeta}>
                    <MapPin size={10} color={colors.textMuted} />
                    <Text style={styles.profileMetaText}>{selected.pob_label}</Text>
                  </View>
                  <Text style={styles.profileDate}>
                    {new Date(selected.dob).toLocaleDateString('tr-TR')} · {selected.tob.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.ascBadge}>
                  <Text style={styles.ascLabel}>ASC</Text>
                  <Text style={styles.ascValue}>{selected.chart_data.ascendant.sign_label}</Text>
                </View>
              </View>

              {/* Visual Wheel */}
              <ChartWheel chart={selected.chart_data} />

              {/* Planets Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Gezegen Yerleşimleri</Text>
                  <Info size={14} color={colors.goldDim} />
                </View>
                
                <View style={styles.planetGrid}>
                  {PLANET_ORDER.map(key => {
                    const planet = selected.chart_data.planets[key];
                    if (!planet) return null;
                    return (
                      <View key={key} style={styles.planetCard}>
                        <View style={styles.planetHeader}>
                          <Text style={styles.planetSym}>{planet.symbol}</Text>
                          <Text style={styles.planetLabel}>{planet.name}</Text>
                        </View>
                        <Text style={styles.planetSign}>{planet.sign_label}</Text>
                        <View style={styles.planetFooter}>
                          <Text style={styles.planetDeg}>{formatDegree(planet)}</Text>
                          <Text style={styles.planetHouse}>{planet.house}. Ev</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Houses Section */}
              <View style={[styles.section, { marginTop: spacing.xl }]}>
                <Text style={styles.sectionTitle}>Ev Analizi</Text>
                <View style={styles.houseList}>
                  {selected.chart_data.houses.map(house => (
                    <View key={house.house} style={styles.houseItem}>
                      <View style={styles.houseNumberWrap}>
                        <Text style={styles.houseNumber}>{house.house}</Text>
                      </View>
                      <View style={styles.houseBody}>
                        <Text style={styles.houseSign}>{house.sign_label} Kesen</Text>
                        <Text style={styles.houseDesc}>{HOUSE_DESCS[house.house]}</Text>
                      </View>
                      <ChevronRight size={14} color={colors.line} />
                    </View>
                  ))}
                </View>
              </View>

            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Gökyüzü Haritası Bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                Analizlerinizi görebilmek için bir doğum haritası oluşturmalısınız.
              </Text>
              <Pressable 
                style={styles.primaryBtn}
                onPress={() => router.push('/onboarding/birthdata' as any)}
              >
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: font.display,
    fontSize: 26,
    color: colors.text,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },

  // Tabs
  tabsScroll: {
    marginBottom: spacing.xl,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  tabText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.bgDeep,
  },

  // Chart Area
  chartArea: {
    gap: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.text,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  profileMetaText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  profileDate: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  ascBadge: {
    alignItems: 'center',
    backgroundColor: colors.inkDeep,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  ascLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    opacity: 0.8,
  },
  ascValue: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.gold,
    marginTop: 2,
  },

  wheelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgDeep,
    borderRadius: radius.xl,
    marginVertical: spacing.md,
  },

  // Planets
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 2,
  },
  planetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  planetCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  planetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planetSym: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.gold,
  },
  planetLabel: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.text,
  },
  planetSign: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.goldDim,
    marginBottom: 8,
  },
  planetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 8,
  },
  planetDeg: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.textMuted,
  },
  planetHouse: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.textMuted,
  },

  // Houses
  houseList: {
    gap: 10,
  },
  houseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    gap: 14,
  },
  houseNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  houseNumber: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  houseBody: {
    flex: 1,
  },
  houseSign: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.text,
  },
  houseDesc: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing['2xl'],
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  primaryBtnText: {
    fontFamily: font.sansBold,
    fontSize: 15,
    color: colors.bgDeep,
  },
});
