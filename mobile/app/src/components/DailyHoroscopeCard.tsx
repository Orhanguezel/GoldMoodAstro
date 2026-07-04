import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { horoscopesApi, localDateFromYmd } from '@/lib/api';
import { Sparkles, Star, Heart } from 'lucide-react-native';

import { useAppTheme, type AppTheme } from '@/theme';

import { logger } from '@/lib/logger';
function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { 
    marginVertical: spacing.lg 
  },
  sectionTitle: { 
    fontFamily: font.sansBold, 
    fontSize: 10, 
    color: colors.goldDeep, 
    letterSpacing: 2, 
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg 
  },
  signList: { 
    marginBottom: spacing.xl 
  },
  signListContent: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  signBtn: { 
    width: 64, 
    height: 80, 
    borderRadius: radius.lg, 
    backgroundColor: colors.surface, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.line,
    gap: 4,
  },
  signBtnActive: { 
    backgroundColor: colors.inkDeep, 
    borderColor: colors.gold 
  },
  signIcon: { 
    fontSize: 24, 
    color: colors.textMuted 
  },
  signIconActive: { 
    color: colors.gold 
  },
  signName: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.textMuted,
  },
  signNameActive: {
    fontFamily: font.sansBold,
    color: colors.gold,
  },
  card: { 
    backgroundColor: colors.surface, 
    marginHorizontal: spacing.lg, 
    padding: spacing.xl, 
    borderRadius: radius.xl, 
    borderWidth: 1, 
    borderColor: colors.line,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  signMeta: {
    gap: 2,
  },
  signTitle: { 
    fontFamily: font.display, 
    fontSize: 18, 
    color: colors.text 
  },
  date: { 
    fontFamily: font.sans, 
    fontSize: 11, 
    color: colors.textMuted 
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.inkDeep,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  moodText: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
  },
  content: { 
    fontFamily: font.serif, 
    fontSize: 16, 
    color: colors.textDim, 
    lineHeight: 24, 
    fontStyle: 'italic' 
  },
  statsGrid: { 
    flexDirection: 'row', 
    gap: 24,
    marginTop: 24, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: colors.lineSoft 
  },
  statItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: { 
    fontFamily: font.sansBold, 
    fontSize: 8, 
    color: colors.textMuted, 
    letterSpacing: 1 
  },
  statVal: { 
    fontFamily: font.sansBold, 
    fontSize: 12, 
    color: colors.text,
    marginTop: 2,
  },
  errorBox: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
});
}


const { width } = Dimensions.get('window');

const SIGNS = [
  { key: 'aries', label: '♈︎' }, { key: 'taurus', label: '♉︎' },
  { key: 'gemini', label: '♊︎' }, { key: 'cancer', label: '♋︎' },
  { key: 'leo', label: '♌︎' }, { key: 'virgo', label: '♍︎' },
  { key: 'libra', label: '♎︎' }, { key: 'scorpio', label: '♏︎' },
  { key: 'sagittarius', label: '♐︎' }, { key: 'capricorn', label: '♑︎' },
  { key: 'aquarius', label: '♒︎' }, { key: 'pisces', label: '♓︎' },
];

export default function DailyHoroscopeCard() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { t, i18n } = useTranslation();
  const [selectedSign, setSelectedSign] = useState('aries');
  const [loading, setLoading] = useState(false);
  const [horoscope, setHoroscope] = useState<any>(null);

  useEffect(() => {
    loadHoroscope();
  }, [selectedSign, i18n.resolvedLanguage, i18n.language]);

  async function loadHoroscope() {
    setLoading(true);
    try {
      const rawLang = (i18n.resolvedLanguage ?? i18n.language ?? 'tr').trim();
      const apiLocale = rawLang.toLowerCase().startsWith('en') ? 'en' : 'tr';
      let res = await horoscopesApi.getToday({
        sign: selectedSign,
        locale: apiLocale,
      });
      if (!res && apiLocale !== 'tr') {
        res = await horoscopesApi.getToday({ sign: selectedSign, locale: 'tr' });
      }
      if (!res) {
        res = await horoscopesApi.getToday({ sign: selectedSign });
      }
      setHoroscope(res);
    } catch (e) {
      logger.error('Horoscope load error:', e);
      setHoroscope(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedSignData = SIGNS.find(s => s.key === selectedSign);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>GÜNLÜK BURÇ YORUMLARI</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.signList}
        contentContainerStyle={styles.signListContent}
      >
        {SIGNS.map((s) => (
          <Pressable 
            key={s.key} 
            style={[styles.signBtn, selectedSign === s.key && styles.signBtnActive]}
            onPress={() => setSelectedSign(s.key)}
          >
            <Text style={[styles.signIcon, selectedSign === s.key && styles.signIconActive]}>{s.label}</Text>
            <Text style={[styles.signName, selectedSign === s.key && styles.signNameActive]}>{t(`zodiacSign.${s.key}.name`)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ padding: 60 }} />
        ) : horoscope ? (
          <View>
            <View style={styles.cardHeader}>
              <View style={styles.signMeta}>
                <Text style={styles.signTitle}>{selectedSignData ? t(`zodiacSign.${selectedSignData.key}.name`).toUpperCase() : ''}</Text>
                <Text style={styles.date}>
                  {(() => {
                    const ymd =
                      typeof horoscope.date === 'string'
                        ? horoscope.date
                        : typeof horoscope.period_start_date === 'string'
                          ? horoscope.period_start_date
                          : '';
                    const d = ymd ? localDateFromYmd(ymd) : null;
                    const loc = (i18n.resolvedLanguage ?? i18n.language ?? 'tr').toLowerCase().startsWith('en')
                      ? 'en-GB'
                      : 'tr-TR';
                    return d
                      ? d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
                      : '';
                  })()}
                </Text>
              </View>
              <View style={styles.moodBadge}>
                <Sparkles size={12} color={colors.gold} />
                <Text style={styles.moodText}>
                  {horoscope.mood_score ?? horoscope.moodScore ?? '—'}/10 Enerji
                </Text>
              </View>
            </View>
            
            <Text style={styles.content}>
              {horoscope.content ?? horoscope.contentTr ?? ''}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Star size={14} color={colors.goldDim} />
                <View>
                  <Text style={styles.statLabel}>ŞANSLI SAYI</Text>
                  <Text style={styles.statVal}>{horoscope.lucky_number ?? horoscope.luckyNumber ?? '—'}</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <Heart size={14} color={colors.goldDim} />
                <View>
                  <Text style={styles.statLabel}>ŞANSLI RENK</Text>
                  <Text style={styles.statVal}>{horoscope.lucky_color ?? horoscope.luckyColor ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Yorum şu an ulaşılamıyor.</Text>
            {__DEV__ ? (
              <Text style={[styles.errorText, { marginTop: 10, fontSize: 12, textAlign: 'center', opacity: 0.85 }]}>
                Backend ve DB seed kontrolü: terminalde API loglarına bakın. Fiziksel cihazda{' '}
                <Text style={{ fontFamily: theme.font.sansBold }}>EXPO_PUBLIC_API_URL</Text>
                {` `}için Mac IP (örn. http://192.168.x.x:8094/api) kullanın.
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

