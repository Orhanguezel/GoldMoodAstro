import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Image, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { 
  Sparkles, 
  Heart, 
  Briefcase, 
  Zap 
} from 'lucide-react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';

const { width } = Dimensions.get('window');

const SIGNS = [
  { id: 'aries', label: 'Koç', date: '21 Mar - 19 Nis' },
  { id: 'taurus', label: 'Boğa', date: '20 Nis - 20 May' },
  { id: 'gemini', label: 'İkizler', date: '21 May - 20 Haz' },
  { id: 'cancer', label: 'Yengeç', date: '21 Haz - 22 Tem' },
  { id: 'leo', label: 'Aslan', date: '23 Tem - 22 Ağu' },
  { id: 'virgo', label: 'Başak', date: '23 Ağu - 22 Eyl' },
  { id: 'libra', label: 'Terazi', date: '23 Eyl - 22 Eki' },
  { id: 'scorpio', label: 'Akrep', date: '23 Eki - 21 Kas' },
  { id: 'sagittarius', label: 'Yay', date: '22 Kas - 21 Ara' },
  { id: 'capricorn', label: 'Oğlak', date: '22 Ara - 19 Oca' },
  { id: 'aquarius', label: 'Kova', date: '20 Oca - 18 Şub' },
  { id: 'pisces', label: 'Balık', date: '19 Şub - 20 Mar' },
];

const ZODIAC_IMAGES: Record<string, any> = {
  aries: require('@/assets/zodiac/aries.png'),
  taurus: require('@/assets/zodiac/taurus.png'),
  gemini: require('@/assets/zodiac/gemini.png'),
  cancer: require('@/assets/zodiac/cancer.png'),
  leo: require('@/assets/zodiac/leo.png'),
  virgo: require('@/assets/zodiac/virgo.png'),
  libra: require('@/assets/zodiac/libra.png'),
  scorpio: require('@/assets/zodiac/scorpio.png'),
  sagittarius: require('@/assets/zodiac/sagittarius.png'),
  capricorn: require('@/assets/zodiac/capricorn.png'),
  aquarius: require('@/assets/zodiac/aquarius.png'),
  pisces: require('@/assets/zodiac/pisces.png'),
};

export default function ZodiacHubScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Burçlar</Text>
            <Text style={styles.headerSubtitle}>Kozmik kimliğinizi ve günlük enerjinizi keşfedin.</Text>
          </View>

          <View style={styles.grid}>
            {SIGNS.map((sign) => (
              <Pressable 
                key={sign.id} 
                style={styles.gridItem}
                onPress={() => router.push(`/zodiac/${sign.id}` as any)}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={ZODIAC_IMAGES[sign.id]} 
                    style={styles.signImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.signLabel}>{sign.label}</Text>
                <Text style={styles.signDate}>{sign.date}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>ASTROLOJİK ARAÇLAR</Text>
            <View style={styles.toolList}>
              <Pressable 
                style={styles.toolItem}
                onPress={() => router.push('/(tabs)/birth-chart' as any)}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.gold + '15' }]}>
                  <Zap size={20} color={colors.gold} />
                </View>
                <View style={styles.toolBody}>
                  <Text style={styles.toolTitle}>Yükselen Hesapla</Text>
                  <Text style={styles.toolDesc}>Doğum saatinizle tam haritanızı keşfedin.</Text>
                </View>
              </Pressable>

              <Pressable 
                style={styles.toolItem}
                onPress={() => {}} // TODO: Big Three mobile
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.goldDim + '15' }]}>
                  <Sparkles size={20} color={colors.goldDim} />
                </View>
                <View style={styles.toolBody}>
                  <Text style={styles.toolTitle}>Büyük Üçlü</Text>
                  <Text style={styles.toolDesc}>Güneş, Ay ve Yükselen kombinasyonun.</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  headerTitle: { fontFamily: font.display, fontSize: 32, color: colors.gold, marginBottom: 8 },
  headerSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: 12 },
  gridItem: { 
    width: (width - spacing.md * 2 - 24) / 3, 
    backgroundColor: colors.surface, 
    borderRadius: radius.xl, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    marginBottom: 4,
  },
  imageContainer: { width: 60, height: 60, marginBottom: 12 },
  signImage: { width: '100%', height: '100%' },
  signLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  signDate: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
  toolsSection: { paddingHorizontal: spacing.lg, marginTop: spacing['2xl'] },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 10, color: colors.goldDeep, letterSpacing: 2, marginBottom: spacing.lg },
  toolList: { gap: 12 },
  toolItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, 
    borderRadius: radius.lg, 
    gap: 16, 
    borderWidth: 1, 
    borderColor: colors.lineSoft 
  },
  toolIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toolBody: { flex: 1 },
  toolTitle: { fontFamily: font.sansBold, fontSize: 16, color: colors.text },
  toolDesc: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
