import React, { useMemo, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Share,
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  navHeader: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineSoft },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold + '10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold + '30' },
  scrollContent: { paddingBottom: 60 },
  hero: { alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing['2xl'] },
  heroImageWrap: { width: width * 0.5, height: width * 0.5, marginBottom: 20 },
  heroImage: { width: '100%', height: '100%' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
  heroEmoji: { fontSize: 16 },
  heroDate: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold, letterSpacing: 1 },
  heroTitle: { fontFamily: font.display, fontSize: 40, color: colors.text, marginBottom: 8 },
  heroSummary: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 24 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 2 },
  dailyCard: { borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.gold + '20' },
  readingText: { fontFamily: font.sans, fontSize: 16, color: colors.text, lineHeight: 26 },
  cardDivider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 20 },
  dailyStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.goldDim, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontFamily: font.sansBold, fontSize: 16, color: colors.text },
  contentCard: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  contentText: { fontFamily: font.sans, fontSize: 15, color: colors.textDim, lineHeight: 24 },
});
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Briefcase, 
  Star, 
  Info,
  Share2
} from 'lucide-react-native';


import { horoscopesApi, localDateFromYmd } from '@/lib/api';
import SkeletonView from '@/components/SkeletonView';

const { width } = Dimensions.get('window');

const SIGNS_MAP: Record<string, { label: string; date: string; emoji: string }> = {
  aries: { label: 'Koç', date: '21 Mart - 19 Nisan', emoji: '♈' },
  taurus: { label: 'Boğa', date: '20 Nisan - 20 Mayıs', emoji: '♉' },
  gemini: { label: 'İkizler', date: '21 Mayıs - 20 Haziran', emoji: '♊' },
  cancer: { label: 'Yengeç', date: '21 Haziran - 22 Temmuz', emoji: '♋' },
  leo: { label: 'Aslan', date: '23 Temmuz - 22 Ağustos', emoji: '♌' },
  virgo: { label: 'Başak', date: '23 Ağustos - 22 Eylül', emoji: '♍' },
  libra: { label: 'Terazi', date: '23 Eylül - 22 Ekim', emoji: '♎' },
  scorpio: { label: 'Akrep', date: '23 Ekim - 21 Kasım', emoji: '♏' },
  sagittarius: { label: 'Yay', date: '22 Kasım - 21 Aralık', emoji: '♐' },
  capricorn: { label: 'Oğlak', date: '22 Aralık - 19 Ocak', emoji: '♑' },
  aquarius: { label: 'Kova', date: '20 Ocak - 18 Şubat', emoji: '♒' },
  pisces: { label: 'Balık', date: '19 Şubat - 20 Mart', emoji: '♓' },
};

const ZODIAC_IMAGES: Record<string, ImageSourcePropType> = {
  aries: require('../../assets/zodiac/aries.png'),
  taurus: require('../../assets/zodiac/taurus.png'),
  gemini: require('../../assets/zodiac/gemini.png'),
  cancer: require('../../assets/zodiac/cancer.png'),
  leo: require('../../assets/zodiac/leo.png'),
  virgo: require('../../assets/zodiac/virgo.png'),
  libra: require('../../assets/zodiac/libra.png'),
  scorpio: require('../../assets/zodiac/scorpio.png'),
  sagittarius: require('../../assets/zodiac/sagittarius.png'),
  capricorn: require('../../assets/zodiac/capricorn.png'),
  aquarius: require('../../assets/zodiac/aquarius.png'),
  pisces: require('../../assets/zodiac/pisces.png'),
};

export default function ZodiacDetailScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { sign: signParam } = useLocalSearchParams<{ sign?: string | string[] }>();
  const signKey = (Array.isArray(signParam) ? signParam[0] : signParam)?.toLowerCase?.() ?? '';
  const meta = SIGNS_MAP[signKey] || { label: signKey, date: '', emoji: '' };

  const [info, setInfo] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleShare = async () => {
    if (!today) return;
    try {
      await Share.share({
        message: `${meta.label} Burcu Günlük Yorumu ✨\n\n${today.content?.substring(0, 200)}...\n\nGoldMoodAstro ile günlük burç yorumunu oku!\n\nKeşfet: https://goldmoodastro.com/tr/burclar/${signKey}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=horoscope`,
        title: `GoldMoodAstro ${meta.label} Burcu`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!signKey) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setToday(null);
      setInfo(null);
      try {
        const [infoData, todayData] = await Promise.all([
          horoscopesApi.getSignInfo(signKey),
          horoscopesApi.getToday({ sign: signKey }),
        ]);
        if (!cancelled) {
          setInfo(infoData);
          setToday(todayData);
        }
      } catch (error) {
        if (!cancelled) console.error('ZodiacDetailScreen load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [signKey]);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.navHeader}>
            <SkeletonView width={40} height={40} borderRadius={20} />
          </View>
          <View style={{ padding: 20 }}>
            <SkeletonView width="100%" height={240} borderRadius={24} />
            <SkeletonView width={200} height={32} style={{ marginTop: 24 }} />
            <SkeletonView width="100%" height={200} style={{ marginTop: 24 }} borderRadius={16} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack('/(tabs)/zodiac' as any)}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={20} color={colors.gold} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.heroImageWrap}>
              <Image 
                source={ZODIAC_IMAGES[signKey]} 
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroEmoji}>{meta.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.font.sansBold, color: colors.textMuted, fontSize: 9, marginBottom: 2, letterSpacing: 1 }}>
                  BURÇ TARİHLERİ
                </Text>
                <Text style={styles.heroDate}>{meta.date}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{meta.label}</Text>
            <Text style={styles.heroSummary}>&quot;{info?.short_summary}&quot;</Text>
          </View>

          <View style={styles.section}>
            <LinearGradient colors={[colors.inkDeep, colors.surface]} style={styles.dailyCard}>
              <View style={styles.sectionHeader}>
                <Sparkles size={18} color={colors.gold} />
                <Text style={styles.sectionTitle}>GÜNLÜK YORUM</Text>
              </View>
              {(() => {
                const ymd =
                  typeof today?.date === 'string'
                    ? today.date
                    : typeof today?.period_start_date === 'string'
                      ? today.period_start_date
                      : '';
                const d = ymd ? localDateFromYmd(ymd) : null;
                if (!d) return null;
                return (
                  <Text
                    style={{
                      fontFamily: theme.font.sans,
                      fontSize: 12,
                      color: colors.textMuted,
                      marginBottom: 12,
                    }}
                  >
                    {d.toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                );
              })()}
              <Text style={styles.readingText}>
                {today?.content || 'Bugün için henüz yorum hazırlanmadı.'}
              </Text>
              <View style={styles.cardDivider} />
              <View style={styles.dailyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>MOD</Text>
                  <Text style={styles.statValue}>
                    {today?.mood_score != null ? `${today.mood_score}/10` : '—'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>SAYI</Text>
                  <Text style={styles.statValue}>{today?.lucky_number ?? '—'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>RENK</Text>
                  <Text style={styles.statValue}>{today?.lucky_color ?? '—'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>GENEL ÖZELLİKLER</Text>
            </View>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{info?.content}</Text>
            </View>
          </View>

          {info?.sections?.map((s: any) => (
            <View key={s.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                {s.key2 === 'love' && <Heart size={18} color={colors.gold} />}
                {s.key2 === 'career' && <Briefcase size={18} color={colors.gold} />}
                {s.key2 === 'personality' && <Star size={18} color={colors.gold} />}
                <Text style={styles.sectionTitle}>{s.title.toUpperCase()}</Text>
              </View>
              <View style={styles.contentCard}>
                <Text style={styles.contentText}>{s.content}</Text>
              </View>
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
