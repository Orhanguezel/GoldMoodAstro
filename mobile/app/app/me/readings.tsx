import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Star, 
  Coffee, 
  Moon, 
  Binary, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Clock
} from 'lucide-react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { historyApi } from '@/lib/api';

const { width } = Dimensions.get('window');

const TYPE_CONFIG: Record<string, { label: string, icon: any, color: string, route: string }> = {
  tarot: { label: 'TAROT', icon: Star, color: colors.gold, route: '/tarot/reading' },
  coffee: { label: 'KAHVE', icon: Coffee, color: colors.goldDim, route: '/coffee/reading' },
  dream: { label: 'RÜYA', icon: Moon, color: colors.goldDeep, route: '/dreams/reading' },
  numerology: { label: 'NUMEROLOJİ', icon: Binary, color: colors.gold, route: '/numerology/reading' },
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await historyApi.getUserHistory();
      setHistory(data);
    } catch (e) {
      console.error('Load history error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.navTitle}>Geçmiş Yorumlar</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} tintColor={colors.gold} />}
        >
          {loading && !refreshing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : history.length > 0 ? (
            history.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.tarot;
              const Icon = config.icon;
              
              return (
                <Pressable 
                  key={`${item.type}-${item.id}`} 
                  style={styles.card}
                  onPress={() => router.push(`${config.route}?id=${item.id}` as any)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: config.color + '15', borderColor: config.color + '33' }]}>
                    <Icon size={24} color={config.color} />
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
                      <View style={styles.dot} />
                      <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <Text style={styles.summaryText} numberOfLines={1}>
                      {item.summary || `${config.label} Yorumu`}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyWrap}>
              <Clock size={48} color={colors.line} />
              <Text style={styles.emptyTitle}>Henüz yorumun yok</Text>
              <Text style={styles.emptyDesc}>Bilinçaltındaki gizemleri çözmek için bir yorum başlat.</Text>
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
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  scrollContent: { padding: spacing.lg, gap: 12 },
  loaderWrap: { padding: 40, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, gap: 16 },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeLabel: { fontFamily: font.sansBold, fontSize: 10, letterSpacing: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted, opacity: 0.3 },
  dateText: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
  summaryText: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  emptyWrap: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontFamily: font.display, fontSize: 20, color: colors.textMuted, marginTop: 12 },
  emptyDesc: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
