import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { birthChartsApi, geocodeApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BirthChart, GeocodeResult, NatalChart, PlanetKey, PlanetPlacement } from '@/types';

const PLANET_ORDER: PlanetKey[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç',
  taurus: 'Boğa',
  gemini: 'İkizler',
  cancer: 'Yengeç',
  leo: 'Aslan',
  virgo: 'Başak',
  libra: 'Terazi',
  scorpio: 'Akrep',
  sagittarius: 'Yay',
  capricorn: 'Oğlak',
  aquarius: 'Kova',
  pisces: 'Balık',
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
  const aspectLines = chart.aspects.slice(0, 18);

  return (
    <View style={styles.wheelWrap}>
      <Svg width={300} height={300} viewBox="0 0 300 300">
        <Circle cx={150} cy={150} r={136} stroke={colors.line} strokeWidth={1} fill={colors.bgDeep} />
        <Circle cx={150} cy={150} r={108} stroke={colors.line} strokeWidth={1} fill="none" />
        <Circle cx={150} cy={150} r={72} stroke={colors.lineSoft} strokeWidth={1} fill="none" />

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
                fill={colors.gold}
                fontSize={18}
                fontFamily={font.serif}
                textAnchor="middle"
              >
                {SIGN_SYMBOLS[i]}
              </SvgText>
            </G>
          );
        })}

        {aspectLines.map((aspect, i) => {
          const a = chart.planets[aspect.planet_a];
          const b = chart.planets[aspect.planet_b];
          if (!a || !b) return null;
          const p1 = point(a.longitude, 65);
          const p2 = point(b.longitude, 65);
          const stroke =
            aspect.type === 'trine' || aspect.type === 'sextile' ? colors.success : colors.goldDim;
          return (
            <Line
              key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={stroke}
              strokeOpacity={0.42}
              strokeWidth={1}
            />
          );
        })}

        {planets.map((planet, i) => {
          const p = point(planet.longitude, 92 + (i % 2) * 9);
          return (
            <SvgText
              key={planet.key}
              x={p.x}
              y={p.y + 6}
              fill={planet.retrograde ? colors.warning : colors.text}
              fontSize={20}
              fontFamily={font.serif}
              textAnchor="middle"
            >
              {planet.symbol}
            </SvgText>
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
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('Ben');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [tzOffset, setTzOffset] = useState('180');

  const selected = useMemo(
    () => charts.find((chart) => chart.id === selectedId) ?? charts[0] ?? null,
    [charts, selectedId],
  );

  const loadCharts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const rows = await birthChartsApi.list();
      setCharts(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
      setShowForm(rows.length === 0);
    } catch (error) {
      console.error('Birth charts load failed:', error);
      setCharts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadCharts();
  }, [authLoading, isAuthenticated, loadCharts]);

  const resolvePlace = async () => {
    if (placeQuery.trim().length < 2) return;
    try {
      const result = await geocodeApi.search(placeQuery);
      setPlace(result);
    } catch {
      Alert.alert('Konum bulunamadı', 'Doğum yerini şehir ve ülke ile tekrar deneyin.');
    }
  };

  const createChart = async () => {
    if (!name.trim() || !dob.trim() || !tob.trim() || !place) {
      Alert.alert('Eksik bilgi', 'İsim, doğum tarihi, saat ve doğum yeri gerekli.');
      return;
    }

    setSaving(true);
    try {
      const created = await birthChartsApi.create({
        name: name.trim(),
        dob: dob.trim(),
        tob: tob.trim(),
        pob_lat: place.lat,
        pob_lng: place.lng,
        pob_label: place.label,
        tz_offset: Number(tzOffset || 0),
      });
      setCharts((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setShowForm(false);
    } catch (error) {
      console.error('Birth chart create failed:', error);
      Alert.alert('Harita oluşturulamadı', 'Bilgileri kontrol edip tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Doğum Haritası</Text>
          <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addBtnText}>{showForm ? 'Kapat' : 'Yeni Harita'}</Text>
          </Pressable>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Harita adı" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" />
            <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor={colors.textMuted} value={tob} onChangeText={setTob} keyboardType="numbers-and-punctuation" />
            <View style={styles.placeRow}>
              <TextInput
                style={[styles.input, styles.placeInput]}
                placeholder="Doğum yeri"
                placeholderTextColor={colors.textMuted}
                value={placeQuery}
                onChangeText={(value) => {
                  setPlaceQuery(value);
                  setPlace(null);
                }}
                onSubmitEditing={resolvePlace}
              />
              <Pressable style={styles.lookupBtn} onPress={resolvePlace}>
                <Text style={styles.lookupText}>Bul</Text>
              </Pressable>
            </View>
            {place && <Text style={styles.placeLabel}>{place.label}</Text>}
            <TextInput
              style={styles.input}
              placeholder="Timezone dakika offseti"
              placeholderTextColor={colors.textMuted}
              value={tzOffset}
              onChangeText={setTzOffset}
              keyboardType="numbers-and-punctuation"
            />
            <Pressable style={[styles.primaryBtn, saving && styles.disabledBtn]} onPress={createChart} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? 'Hesaplanıyor...' : 'Haritayı Oluştur'}</Text>
            </Pressable>
          </View>
        )}

        {charts.length > 0 && (
          <FlatList
            horizontal
            data={charts}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartTabs}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chartTab, selected?.id === item.id && styles.chartTabActive]}
                onPress={() => setSelectedId(item.id)}
              >
                <Text style={[styles.chartTabText, selected?.id === item.id && styles.chartTabTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        )}

        {selected ? (
          <View style={styles.chartCard}>
            <View style={styles.chartMeta}>
              <Text style={styles.chartName}>{selected.name}</Text>
              <Text style={styles.chartPlace}>{selected.pob_label}</Text>
              <Text style={styles.chartDate}>
                {selected.dob} · {String(selected.tob).slice(0, 5)}
              </Text>
            </View>
            <ChartWheel chart={selected.chart_data} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gezegen Yerleşimleri</Text>
              {PLANET_ORDER.map((key) => {
                const planet = selected.chart_data.planets[key];
                if (!planet) return null;
                return (
                  <View key={key} style={styles.placementRow}>
                    <Text style={styles.planetSymbol}>{planet.symbol}</Text>
                    <View style={styles.placementMain}>
                      <Text style={styles.planetName}>{planet.name}</Text>
                      <Text style={styles.planetDetail}>
                        {SIGN_LABELS[planet.sign] ?? planet.sign_label} · {formatDegree(planet)} · {planet.house}. ev
                        {planet.retrograde ? ' · Retro' : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>İlk haritanı oluştur</Text>
            <Text style={styles.emptyText}>Doğum tarihi, saat ve yer bilgisi ile natal harita hesaplanır.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { color: colors.text, fontFamily: font.display, fontSize: 26 },
  addBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 9 },
  addBtnText: { color: colors.gold, fontFamily: font.sansBold, fontSize: 13 },
  form: { gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.lg },
  input: { height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: spacing.md, color: colors.text, fontFamily: font.sans, backgroundColor: colors.bgDeep },
  placeRow: { flexDirection: 'row', gap: spacing.sm },
  placeInput: { flex: 1 },
  lookupBtn: { height: 46, minWidth: 68, borderRadius: radius.sm, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  lookupText: { color: colors.bgDeep, fontFamily: font.sansBold },
  placeLabel: { color: colors.textDim, fontFamily: font.sans, fontSize: 12, lineHeight: 17 },
  primaryBtn: { height: 48, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  disabledBtn: { opacity: 0.6 },
  primaryText: { color: colors.bgDeep, fontFamily: font.sansBold, fontSize: 15 },
  chartTabs: { gap: spacing.sm, paddingBottom: spacing.md },
  chartTab: { paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chartTabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chartTabText: { color: colors.textDim, fontFamily: font.sansMedium, fontSize: 13 },
  chartTabTextActive: { color: colors.bgDeep },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  chartMeta: { marginBottom: spacing.md },
  chartName: { color: colors.text, fontFamily: font.display, fontSize: 22 },
  chartPlace: { color: colors.textDim, fontFamily: font.sans, fontSize: 13, marginTop: 4 },
  chartDate: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
  wheelWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  section: { marginTop: spacing.md },
  sectionTitle: { color: colors.gold, fontFamily: font.sansBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  placementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  planetSymbol: { width: 30, color: colors.gold, fontFamily: font.serif, fontSize: 22, textAlign: 'center' },
  placementMain: { flex: 1 },
  planetName: { color: colors.text, fontFamily: font.sansBold, fontSize: 14 },
  planetDetail: { color: colors.textDim, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontFamily: font.display, fontSize: 20 },
  emptyText: { color: colors.textDim, fontFamily: font.sans, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
