import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  CloudMoon, 
  Sparkles, 
  ChevronLeft, 
  Send, 
  RotateCcw,
  BookOpen,
  Share2,
  Star,
  Moon,
  ArrowRight
} from 'lucide-react-native';
import { router } from 'expo-router';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { dreamsApi } from '@/lib/api';

const { width } = Dimensions.get('window');

const LOADING_PHASES = [
  'Rüyandaki sembolleri okuyorum...',
  'Bilinçaltının derinliklerine iniyorum...',
  'Anlamlarıyla harmanlıyorum...',
  'Arketipleri analiz ediyorum...',
  'Kişisel yorumunu hazırlıyorum...'
];

export default function DreamsScreen() {
  const [dreamText, setDreamText] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [result, setResult] = useState<any>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === 'processing') {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 2500);

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleInterpret = async () => {
    if (dreamText.length < 50) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Eksik Bilgi', 'Lütfen rüyanızı biraz daha detaylı anlatın (en az 50 karakter).');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep('processing');
    
    try {
      const res = await dreamsApi.interpret({
        dream_text: dreamText,
        locale: 'tr'
      });
      setResult(res.data || res);
      setStep('result');
    } catch (e: any) {
      console.error('Dream interpretation error:', e);
      Alert.alert('Hata', e?.message || 'Rüya yorumlanırken bir hata oluştu.');
      setStep('input');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rüya Yorumum ✨\n\n${result?.interpretation?.substring(0, 200)}... \n\nGoldMoodAstro ile rüyanı keşfet!\n\nKeşfet: https://goldmoodastro.com/tr/ruya-tabiri/result/${result.id}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=dream`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (step === 'input') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.navHeader}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <ChevronLeft size={24} color={colors.gold} />
              </Pressable>
            </View>

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <CloudMoon size={40} color={colors.gold} />
              </View>
              <Text style={styles.headerTitle}>Rüya Tabiri</Text>
              <Text style={styles.headerSubtitle}>Bilinçaltının uykudaki gizli dilini çözün.</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Rüyanızda neler gördünüz? Mekanlar, kişiler, renkler ve hissettiklerinizi detaylıca anlatın..."
                  placeholderTextColor={colors.textMuted + '66'}
                  value={dreamText}
                  onChangeText={setDreamText}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.inputFooter}>
                   <View style={styles.charHint}>
                     <BookOpen size={12} color={dreamText.length < 50 ? colors.warning : colors.gold} />
                     <Text style={[styles.charHintText, dreamText.length < 50 && { color: colors.warning }]}>
                       {dreamText.length} / 2000 Karakter
                     </Text>
                   </View>
                   <Text style={styles.statusText}>
                     {dreamText.length < 50 ? 'Yetersiz' : dreamText.length < 200 ? 'İyi' : 'Harika!'}
                   </Text>
                </View>
              </View>
            </View>

            <Pressable 
              style={[styles.primaryBtn, dreamText.length < 50 && { opacity: 0.5 }]} 
              onPress={handleInterpret}
              disabled={dreamText.length < 50}
            >
              <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.btnGradient}>
                <Text style={styles.primaryBtnText}>RÜYAMI YORUMLA</Text>
                <Send size={16} color={colors.bgDeep} />
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <View style={styles.processingCenter}>
          <View style={styles.animContainer}>
             <Animated.View style={[styles.spinnerCircle, { transform: [{ rotate: spin }] }]} />
             <View style={styles.moonCenter}>
                <Moon size={48} color={colors.gold} fill={colors.gold + '20'} />
             </View>
             {[...Array(6)].map((_, i) => (
               <View 
                key={i} 
                style={[
                  styles.starParticle, 
                  { 
                    top: 50 + Math.sin(i) * 80, 
                    left: 50 + Math.cos(i) * 80,
                    opacity: 0.6
                  }
                ]}
               >
                 <Star size={8} color={colors.gold} fill={colors.gold} />
               </View>
             ))}
          </View>
          
          <View style={styles.phaseTextContainer}>
            <Text style={styles.processingTitle}>{LOADING_PHASES[loadingPhase]}</Text>
            <Text style={styles.processingSubtitle}>Lütfen bekleyin, rüyanız analiz ediliyor...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeader}>
             <Text style={styles.resultOverline}>Rüya Mesajı</Text>
             <Text style={styles.resultTitle}>Rüya Analizi</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.symbolsScroll}
          >
            {result?.symbols?.map((s: any, i: number) => (
              <View key={i} style={styles.symbolCard}>
                <Text style={styles.symbolIcon}>{s.icon || '✨'}</Text>
                <Text style={styles.symbolName}>{s.name}</Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${(s.confidence || 0.9) * 100}%` }]} />
                </View>
                {s.meaning && (
                  <Text style={styles.symbolMeaning} numberOfLines={3}>"{s.meaning}"</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <LinearGradient colors={[colors.surface + '88', colors.bgDeep + '88']} style={styles.interpretationBox}>
            <Text style={styles.interpretationText}>{result?.interpretation}</Text>
            
            <View style={styles.footerNote}>
               <Text style={styles.footerNoteText}>
                 * Bu yorum psikolojik arketipler ve kadim semboloji temel alınarak üretilmiştir.
               </Text>
            </View>
          </LinearGradient>

          <Pressable 
            style={styles.promoCard}
            onPress={() => router.push('/(tabs)/tarot?spread=one_card' as any)}
          >
            <LinearGradient 
              colors={[colors.gold + '15', colors.bgDeep]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={styles.promoGradient}
            >
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>🌙 Bu Rüyanın Yansıması</Text>
                <Text style={styles.promoDesc}>Enerjini bugüne taşımak için 1 tarot kartı çek.</Text>
                <View style={styles.promoAction}>
                  <Text style={styles.promoActionText}>KART ÇEK</Text>
                  <ArrowRight size={14} color={colors.gold} />
                </View>
              </View>
              <Star size={60} color={colors.gold} opacity={0.1} style={styles.promoBgIcon} />
            </LinearGradient>
          </Pressable>

          <View style={styles.resultActions}>
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Share2 size={20} color={colors.text} />
              <Text style={styles.shareBtnText}>PAYLAŞ</Text>
            </Pressable>

            <Pressable 
              style={styles.resetBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep('input');
                setDreamText('');
                setResult(null);
              }}
            >
              <RotateCcw size={16} color={colors.gold} />
              <Text style={styles.resetBtnText}>YENİ RÜYA</Text>
            </Pressable>
          </View>

          <Pressable 
            style={styles.consultantCta}
            onPress={() => router.push('/(tabs)/connect' as any)}
          >
            <Text style={styles.consultantCtaText}>Daha derin analiz için bir astrolog ile görüşün →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  navHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.xl, alignItems: 'center' },
  iconCircle: { width: 84, height: 84, borderRadius: 32, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.gold + '30' },
  headerTitle: { fontFamily: font.display, fontSize: 36, color: colors.text, textAlign: 'center' },
  headerSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 10, fontStyle: 'italic', paddingHorizontal: 20 },
  inputSection: { padding: spacing.lg, marginBottom: spacing.md },
  inputCard: { backgroundColor: colors.surface + '80', borderRadius: radius.xl, padding: 24, borderWidth: 1, borderColor: colors.lineSoft },
  textArea: { height: 240, fontFamily: font.serif, fontSize: 18, color: colors.text, lineHeight: 28 },
  inputFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.lineSoft, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  charHintText: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, textTransform: 'uppercase' },
  primaryBtn: { marginHorizontal: spacing.xl, borderRadius: radius.pill, overflow: 'hidden', elevation: 5, shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.bgDeep, letterSpacing: 2 },
  
  processingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  animContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  spinnerCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.gold + '30', borderStyle: 'dashed' },
  moonCenter: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.gold + '10', alignItems: 'center', justifyContent: 'center' },
  starParticle: { position: 'absolute' },
  phaseTextContainer: { marginTop: 40, alignItems: 'center' },
  processingTitle: { fontFamily: font.display, fontSize: 24, color: colors.gold, textAlign: 'center', paddingHorizontal: 20 },
  processingSubtitle: { fontFamily: font.serif, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  
  resultContent: { paddingBottom: 60 },
  resultHeader: { padding: spacing.xl, alignItems: 'center', paddingTop: 20 },
  resultOverline: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 },
  resultTitle: { fontFamily: font.display, fontSize: 42, color: colors.text },
  
  symbolsScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  symbolCard: { backgroundColor: colors.surface, width: 140, borderRadius: radius.lg, padding: 16, marginRight: 12, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center' },
  symbolIcon: { fontSize: 24, marginBottom: 4 },
  symbolName: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  confidenceBar: { width: '100%', height: 2, backgroundColor: colors.gold + '20', borderRadius: 1, marginTop: 6, marginBottom: 8 },
  confidenceFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 1 },
  symbolMeaning: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },

  interpretationBox: { marginHorizontal: spacing.lg, padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  interpretationText: { fontFamily: font.serif, fontSize: 18, color: colors.textDim, lineHeight: 30, fontStyle: 'italic' },
  footerNote: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  footerNoteText: { fontFamily: font.serif, fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },

  promoCard: { margin: spacing.lg, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.gold + '20' },
  promoGradient: { padding: 24, flexDirection: 'row', alignItems: 'center' },
  promoContent: { flex: 1 },
  promoTitle: { fontFamily: font.display, fontSize: 18, color: colors.gold, marginBottom: 8 },
  promoDesc: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  promoAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoActionText: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 1 },
  promoBgIcon: { position: 'absolute', right: -10, bottom: -10 },

  resultActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: 12, marginTop: 10 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surface, paddingVertical: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft },
  shareBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.text, letterSpacing: 1 },
  resetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  resetBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold, letterSpacing: 1 },
  
  consultantCta: { padding: 20, alignItems: 'center' },
  consultantCtaText: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, opacity: 0.8 },
});
