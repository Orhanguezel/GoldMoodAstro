import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Dimensions, 
  Image,
  TextInput,
  ActivityIndicator,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Layers, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  Info,
  HelpCircle,
  Share2
} from 'lucide-react-native';
import { router } from 'expo-router';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { tarotApi, getAssetUrl } from '@/lib/api';

const { width } = Dimensions.get('window');

const SPREADS = [
  { id: 'one_card', title: 'Tek Kart', desc: 'Hızlı rehberlik', count: 1 },
  { id: 'three_card_general', title: 'Üç Kart', desc: 'Geçmiş-Şimdi-Gelecek', count: 3 },
  { id: 'three_card_decision', title: 'Karar', desc: 'Seçenek Analizi', count: 3 },
  { id: 'celtic_cross', title: 'Kelt Haçı', desc: 'Derin Analiz', count: 10 },
];

export default function TarotScreen() {
  const [step, setStep] = useState<'select' | 'pick' | 'result'>('select');
  const [selectedSpread, setSelectedSpread] = useState(SPREADS[0]);
  const [question, setQuestion] = useState('');
  const [pickedCount, setPickedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleShare = async () => {
    if (!result) return;
    const cards = result.cards?.map((c: any) => c.name).join(', ');
    try {
      await Share.share({
        message: `Tarot Açılımım: ${selectedSpread.title} ✨\n\nKartlarım: ${cards}\n\nGoldMoodAstro ile kartların rehberliğini keşfedin!\n\nKeşfet: https://goldmoodastro.com/tr/tarot/reading/${result.id}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=tarot`,
        title: 'GoldMoodAstro Tarot',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartPick = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('pick');
  };

  const handlePickCard = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextCount = pickedCount + 1;
    setPickedCount(nextCount);

    if (nextCount === selectedSpread.count) {
      setLoading(true);
      try {
        const res = await tarotApi.draw({
          spread_type: selectedSpread.id,
          question,
          locale: 'tr'
        });
        setResult(res);
        setStep('result');
      } catch (e) {
        console.error('Tarot draw error:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  if (step === 'select') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tarot Rehberi</Text>
              <Text style={styles.headerSubtitle}>Kartların gizemli dünyasına hoş geldiniz.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AÇILIM TİPİ SEÇİN</Text>
              <View style={styles.spreadGrid}>
                {SPREADS.map(s => (
                  <Pressable 
                    key={s.id} 
                    style={[styles.spreadItem, selectedSpread.id === s.id && styles.spreadItemActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSpread(s);
                    }}
                  >
                    <View style={[styles.spreadIcon, selectedSpread.id === s.id && styles.spreadIconActive]}>
                      <Layers size={20} color={selectedSpread.id === s.id ? colors.bg : colors.gold} />
                    </View>
                    <Text style={[styles.spreadLabel, selectedSpread.id === s.id && styles.spreadLabelActive]}>{s.title}</Text>
                    <Text style={styles.spreadDesc}>{s.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SORUNUZ (OPSİYONEL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Neye odaklanmak istersiniz?"
                placeholderTextColor={colors.textMuted + '66'}
                value={question}
                onChangeText={setQuestion}
                multiline
              />
            </View>

            <Pressable style={styles.primaryBtn} onPress={handleStartPick}>
              <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.btnGradient}>
                <Text style={styles.primaryBtnText}>KART SEÇİMİNE GEÇ</Text>
                <ChevronRight size={18} color={colors.bgDeep} />
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.pickHeader}>
            <Text style={styles.pickTitle}>{selectedSpread.count} Kart Seçin</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(pickedCount / selectedSpread.count) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{pickedCount} / {selectedSpread.count} seçildi</Text>
          </View>

          <View style={styles.deckContainer}>
             <ScrollView contentContainerStyle={styles.cardsScroll} showsVerticalScrollIndicator={false}>
               <View style={styles.cardsGrid}>
                 {[...Array(21)].map((_, i) => (
                   <Pressable 
                    key={i} 
                    style={styles.deckCard} 
                    onPress={handlePickCard}
                    disabled={loading}
                   >
                     <Image source={require('@/assets/tarot/back.png')} style={styles.cardBackImg} resizeMode="cover" />
                   </Pressable>
                 ))}
               </View>
             </ScrollView>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.loadingText}>Kartlar yorumlanıyor...</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
             <Sparkles size={24} color={colors.gold} style={{ marginBottom: 12 }} />
             <Text style={styles.resultTitle}>Kozmik Yanıt</Text>
             {question ? (
               <View style={styles.questionBox}>
                 <HelpCircle size={14} color={colors.textMuted} />
                 <Text style={styles.questionText}>&quot;{question}&quot;</Text>
               </View>
             ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultCardsList}>
            {result?.cards?.map((card: any, i: number) => (
              <View key={i} style={styles.resultCardItem}>
                <Text style={styles.positionText}>{card.position_name}</Text>
                <View style={[styles.cardFrame, card.is_reversed && { transform: [{ rotate: '180deg' }] }]}>
                  <Image 
                    source={card.image_url ? { uri: getAssetUrl(card.image_url) } : require('@/assets/tarot/back.png')} 
                    style={styles.resultCardImg} 
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardOverlay}>
                    <Text style={styles.cardNameText}>{card.name}</Text>
                  </LinearGradient>
                </View>
                {card.is_reversed && <Text style={styles.reversedBadge}>TERS</Text>}
              </View>
            ))}
          </ScrollView>

          <View style={styles.interpretationSection}>
            <View style={styles.interHeader}>
              <Info size={16} color={colors.gold} />
              <Text style={styles.interTitle}>Yorumunuz</Text>
            </View>
            <View style={styles.interCard}>
               <Text style={styles.interText}>{result?.interpretation}</Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <Pressable 
              style={[styles.actionBtn, styles.actionBtnGold]} 
              onPress={handleShare}
            >
              <Share2 size={18} color={colors.gold} />
              <Text style={[styles.actionBtnText, { color: colors.gold }]}>PAYLAŞ</Text>
            </Pressable>

            <Pressable 
              style={styles.actionBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep('select');
                setPickedCount(0);
                setResult(null);
              }}
            >
              <RotateCcw size={16} color={colors.textMuted} />
              <Text style={styles.actionBtnText}>YENİ AÇILIM</Text>
            </Pressable>
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
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 10, color: colors.goldDeep, letterSpacing: 2, marginBottom: spacing.lg },
  spreadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  spreadItem: { width: (width - 40 - 12) / 2, backgroundColor: colors.surface, padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  spreadItemActive: { borderColor: colors.gold, backgroundColor: colors.inkDeep },
  spreadIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  spreadIconActive: { backgroundColor: colors.gold },
  spreadLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.text, marginBottom: 4 },
  spreadLabelActive: { color: colors.gold },
  spreadDesc: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
  input: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, color: colors.text, fontFamily: font.sans, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.lineSoft },
  primaryBtn: { marginHorizontal: spacing.lg, borderRadius: radius.pill, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.bgDeep, letterSpacing: 1 },
  
  pickHeader: { padding: spacing.lg, alignItems: 'center' },
  pickTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, marginBottom: 16 },
  progressContainer: { width: '100%', height: 4, backgroundColor: colors.line, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: colors.gold },
  progressText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, marginTop: 8, letterSpacing: 1 },
  deckContainer: { flex: 1 },
  cardsScroll: { paddingHorizontal: 10, paddingBottom: 40 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  deckCard: { width: (width - 60) / 4, height: ((width - 60) / 4) * 1.6, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  cardBackImg: { width: '100%', height: '100%', opacity: 0.8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingText: { color: colors.gold, marginTop: 20, fontFamily: font.sansBold },

  resultContent: { paddingBottom: 40 },
  resultHeader: { padding: spacing.xl, alignItems: 'center' },
  resultTitle: { fontFamily: font.display, fontSize: 32, color: colors.text },
  questionBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  questionText: { fontFamily: font.serif, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  resultCardsList: { paddingHorizontal: spacing.lg, gap: 20, marginBottom: 40 },
  resultCardItem: { alignItems: 'center', gap: 12 },
  positionText: { fontFamily: font.sansBold, fontSize: 10, color: colors.goldDim, letterSpacing: 1 },
  cardFrame: { 
    width: 160, 
    height: 260, 
    borderRadius: 20, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: colors.gold, 
    shadowColor: colors.gold, 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 20, 
    elevation: 8,
    backgroundColor: colors.bgDeep,
  },
  resultCardImg: { width: '100%', height: '100%', opacity: 1 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  cardNameText: { fontFamily: font.display, fontSize: 16, color: 'white', textAlign: 'center', textShadowColor: 'black', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  reversedBadge: { fontFamily: font.sansBold, fontSize: 10, color: colors.danger, letterSpacing: 2, marginTop: 8, backgroundColor: colors.danger + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  interpretationSection: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
  interHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  interTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 2 },
  interCard: { backgroundColor: colors.surface, padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  interText: { fontFamily: font.sans, fontSize: 16, color: colors.textDim, lineHeight: 26 },
  resultActions: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.lg, marginTop: 10, marginBottom: 40 },
  actionBtn: { flex: 1, height: 56, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnGold: { borderColor: colors.gold + '44', backgroundColor: colors.gold + '08' },
  actionBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted, letterSpacing: 1 },
});
