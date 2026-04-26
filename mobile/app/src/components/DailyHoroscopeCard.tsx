// mobile/app/src/components/DailyHoroscopeCard.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, font } from '@/theme/tokens';
import { horoscopesApi } from '@/lib/api';

const SIGNS = [
  { key: 'aries', label: '♈︎' }, { key: 'taurus', label: '♉︎' }, 
  { key: 'gemini', label: '♊︎' }, { key: 'cancer', label: '♋︎' },
  { key: 'leo', label: '♌︎' }, { key: 'virgo', label: '♍︎' }, 
  { key: 'libra', label: '♎︎' }, { key: 'scorpio', label: '♏︎' },
  { key: 'sagittarius', label: '♐︎' }, { key: 'capricorn', label: '♑︎' }, 
  { key: 'aquarius', label: '♒︎' }, { key: 'pisces', label: '♓︎' },
];

export default function DailyHoroscopeCard() {
  const { t, i18n } = useTranslation();
  const [selectedSign, setSelectedSign] = useState('aries');
  const [loading, setLoading] = useState(false);
  const [horoscope, setHoroscope] = useState<any>(null);

  useEffect(() => {
    loadHoroscope();
  }, [selectedSign]);

  async function loadHoroscope() {
    setLoading(true);
    try {
      const res = await horoscopesApi.getToday({ sign: selectedSign });
      setHoroscope(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>GÜNLÜK GÖKYÜZÜ</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.signList}>
        {SIGNS.map((s) => (
          <TouchableOpacity 
            key={s.key} 
            style={[styles.signBtn, selectedSign === s.key && styles.signBtnActive]}
            onPress={() => setSelectedSign(s.key)}
          >
            <Text style={[styles.signIcon, selectedSign === s.key && styles.signIconActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ padding: 40 }} />
        ) : horoscope ? (
          <View>
            <View style={styles.cardHeader}>
              <Text style={styles.signTitle}>{selectedSign.toUpperCase()}</Text>
              <Text style={styles.date}>{new Date(horoscope.date).toLocaleDateString()}</Text>
            </View>
            
            <Text style={styles.content}>
              {i18n.language === 'tr' ? horoscope.content_tr : (horoscope.content_en || horoscope.content_tr)}
            </Text>

            <View style={styles.footer}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>MOD</Text>
                <Text style={styles.statVal}>{horoscope.mood_score}/10</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>ŞANS</Text>
                <Text style={styles.statVal}>#{horoscope.lucky_number}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>RENK</Text>
                <Text style={styles.statVal}>{horoscope.lucky_color}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.error}>Yorum yüklenemedi.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 20 },
  sectionLabel: { fontFamily: font.sansBold, fontSize: 10, letterSpacing: 2, color: colors.gold, marginBottom: 12, paddingHorizontal: 20 },
  signList: { paddingHorizontal: 15, marginBottom: 15 },
  signBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: colors.line },
  signBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  signIcon: { fontSize: 20, color: colors.muted },
  signIconActive: { color: colors.bg },
  card: { backgroundColor: colors.surface, marginHorizontal: 20, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 8 },
  signTitle: { fontFamily: font.serifBold, fontSize: 18, color: colors.gold },
  date: { fontFamily: font.sans, fontSize: 10, color: colors.muted },
  content: { fontFamily: font.serif, fontSize: 15, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.line },
  stat: { alignItems: 'flex-start' },
  statLabel: { fontFamily: font.sansBold, fontSize: 8, color: colors.muted, marginBottom: 4 },
  statVal: { fontFamily: font.sansMedium, fontSize: 12, color: colors.text },
  error: { textAlign: 'center', color: colors.muted, padding: 20 }
});
