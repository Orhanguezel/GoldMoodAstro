import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Dimensions,
  Animated,
  Share,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Sparkles, 
  ChevronLeft, 
  User, 
  Heart,
  Calendar,
  RefreshCcw,
  BookOpen,
  Share2,
  ChevronRight,
  ArrowLeft,
  Star,
  ArrowRight,
  Moon
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { colors, font, radius, spacing, shadows } from '@/theme/tokens';
import { yildiznameApi } from '@/lib/api';

const { width } = Dimensions.get('window');

const LOADING_PHASES = [
  'Yıldızlar diziliyor...',
  'Ebced değerleri hesaplanıyor...',
  'Harfler sayıya dönüşüyor...',
  'Menzilin belirleniyor...',
  'Kadim sırlar açılıyor...'
];

export default function YildiznameScreen() {
  const [step, setStep] = useState<'intro' | 'name' | 'mother' | 'year' | 'loading' | 'result'>('intro');
  const [formData, setFormData] = useState({ name: '', mother_name: '', birth_year: '' });
  const [result, setResult] = useState<any>(null);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [step]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === 'loading') {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % LOADING_PHASES.length);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  const handleNext = () => {
    const val = step === 'name' ? formData.name : step === 'mother' ? formData.mother_name : formData.birth_year;
    if (!val) return;
    if (step === 'year' && val.length < 4) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (step === 'name') setStep('mother');
    else if (step === 'mother') setStep('year');
    else if (step === 'year') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'mother') setStep('name');
    else if (step === 'year') setStep('mother');
    else if (step === 'name') setStep('intro');
  };

  const handleSubmit = async () => {
    setStep('loading');
    try {
      const res = await yildiznameApi.read({
        name: formData.name,
        mother_name: formData.mother_name,
        birth_date: `${formData.birth_year}-01-01`
      });
      setResult(res);
      
      setTimeout(() => {
        setStep('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 4000);
    } catch (e) {
      console.error(e);
      setStep('year');
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `${result.name} için Yıldızname Analizi ✨ Menzil: ${result.menzil?.name_tr}\n\n${result.readingText}\n\nKeşfet: https://goldmoodastro.com/tr/yildizname/result/${result.id}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=yildizname`,
        title: 'GoldMoodAstro Yıldızname',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderProgress = () => {
    const steps = ['name', 'mother', 'year'];
    const currentIdx = steps.indexOf(step as any);
    if (currentIdx === -1) return null;

    return (
      <View style={styles.progressContainer}>
        {steps.map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.progressDot, 
              i <= currentIdx && styles.progressDotActive,
              i < currentIdx && styles.progressDotDone
            ]} 
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => step === 'intro' || step === 'result' ? router.back() : handleBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Yıldızname</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.body, { flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {step === 'intro' && (
            <View style={styles.introContent}>
              <View style={styles.introIcon}>
                <Moon size={48} color={colors.gold} />
              </View>
              <Text style={styles.heroTitle}>Yıldızname{'\n'}<Text style={{ color: colors.gold }}>Ebced Sırrı</Text></Text>
              <Text style={styles.heroSub}>İsminin ve anne adının evrendeki sayısal titreşimini keşfet. Kadim Ebced hesabı ile yolunu aydınlat.</Text>
              
              <View style={styles.featureGrid}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>KADİM HESAP</Text>
                  <Text style={styles.featureVal}>Ebced Sistemi</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>AY MENZİLLERİ</Text>
                  <Text style={styles.featureVal}>28 Durak</Text>
                </View>
              </View>

              <Pressable style={styles.mainBtn} onPress={() => setStep('name')}>
                <Text style={styles.mainBtnText}>BAŞLA</Text>
                <ChevronRight size={20} color={colors.bgDeep} />
              </Pressable>
            </View>
          )}

          {(['name', 'mother', 'year'] as const).includes(step as any) && (
            <View style={styles.wizardContent}>
              {renderProgress()}
              
              <View style={styles.wizardCard}>
                <View style={styles.wizardHeader}>
                  <Text style={styles.wizardTitle}>
                    {step === 'name' ? 'Senin İsmin' : step === 'mother' ? 'Annenin İsmi' : 'Doğum Yılın'}
                  </Text>
                  <Text style={styles.wizardSub}>
                    {step === 'name' ? 'Seni çağıran asıl titreşim.' : step === 'mother' ? 'Soy bağını taşıyan manevi kökün.' : 'Dünyaya adım attığın zamanın imzası.'}
                  </Text>
                </View>

                <View style={styles.inputBox}>
                  {step === 'name' ? <User size={24} color={colors.gold} /> : step === 'mother' ? <Heart size={24} color={colors.gold} /> : <Calendar size={24} color={colors.gold} />}
                  <TextInput
                    autoFocus
                    keyboardType={step === 'year' ? 'number-pad' : 'default'}
                    maxLength={step === 'year' ? 4 : 50}
                    style={styles.textInput}
                    placeholder={step === 'name' ? 'Örn: Orhan' : step === 'mother' ? 'Örn: Fatma' : '1990'}
                    placeholderTextColor={colors.textMuted + '44'}
                    value={step === 'name' ? formData.name : step === 'mother' ? formData.mother_name : formData.birth_year}
                    onChangeText={(t) => setFormData({ ...formData, [step === 'year' ? 'birth_year' : step === 'name' ? 'name' : 'mother_name']: t })}
                  />
                </View>

                <Pressable 
                  style={[styles.mainBtn, { opacity: (step === 'name' ? formData.name : step === 'mother' ? formData.mother_name : formData.birth_year).length > 0 ? 1 : 0.5 }]} 
                  onPress={handleNext}
                >
                  <Text style={styles.mainBtnText}>{step === 'year' ? 'YILDIZNAMEMİ AÇ' : 'DEVAM ET'}</Text>
                  <ChevronRight size={20} color={colors.bgDeep} />
                </Pressable>
              </View>
            </View>
          )}

          {step === 'loading' && (
            <View style={styles.loadingContent}>
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Sparkles size={32} color={colors.gold} style={styles.loaderSparkle} />
              </View>
              <Text style={styles.loadingTitle}>{LOADING_PHASES[loadingPhase]}</Text>
              <Text style={styles.loadingSub}>Kadim sırlar çözülüyor...</Text>
            </View>
          )}

          {step === 'result' && result && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScroll}>
              <View style={styles.resultHead}>
                <View style={styles.menzilBadge}>
                  <Star size={12} color={colors.gold} fill={colors.gold} />
                  <Text style={styles.menzilBadgeText}>{result.name?.toUpperCase()} İÇİN ANALİZ</Text>
                </View>
                <Text style={styles.menzilTitle}>Menzilin: <Text style={{ color: colors.gold }}>{result.menzil?.name_tr}</Text></Text>
                <Text style={styles.menzilSub}>Arapça: {result.menzil?.name_ar}</Text>
              </View>

              <View style={styles.resultCards}>
                <View style={styles.resCardWrapper}>
                  <LinearGradient colors={[colors.surface, colors.surfaceHigh]} style={styles.resCard}>
                    <View style={styles.ebcedBadge}>
                      <Text style={styles.ebcedBadgeText}>{result.ebced_total}</Text>
                    </View>
                    <Text style={styles.resCardLabel}>EBCED PUANI</Text>
                  </LinearGradient>
                </View>
                <View style={styles.resCardWrapper}>
                  <LinearGradient colors={[colors.surface, colors.surfaceHigh]} style={styles.resCard}>
                    <Text style={styles.menzilNoText}>{result.menzil_no}</Text>
                    <Text style={styles.resCardLabel}>MENZİL NO</Text>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.summaryBox}>
                <LinearGradient 
                  colors={[colors.gold + '15', 'transparent']} 
                  style={styles.summaryGradient}
                >
                  <Moon size={16} color={colors.gold} style={{ marginBottom: 12 }} />
                  <Text style={styles.summaryText}>{result.menzil?.short_summary}</Text>
                  
                  <View style={styles.categoryContainer}>
                    {result.menzil?.category?.map((cat: string, i: number) => (
                      <View key={i} style={styles.catChip}>
                        <Text style={styles.catChipText}>{cat.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.interpretationBox}>
                <View style={styles.interHeader}>
                  <Sparkles size={16} color={colors.gold} />
                  <Text style={styles.interTitle}>KADİM YORUM</Text>
                </View>
                <Text style={styles.interpretationText}>{result.readingText}</Text>
              </View>

              <Pressable 
                style={styles.promoCard}
                onPress={() => router.push('/(tabs)/connect' as any)}
              >
                <View style={styles.promoInfo}>
                  <Text style={styles.promoTitle}>Derin Analiz İster Misin?</Text>
                  <Text style={styles.promoSub}>Yıldıznameniz ile doğum haritanızın birleşik yorumu için astrolog seçin.</Text>
                </View>
                <ArrowRight size={20} color={colors.gold} />
              </Pressable>

              <View style={styles.resultActions}>
                <Pressable style={styles.actionBtn} onPress={() => setStep('intro')}>
                  <RefreshCcw size={18} color={colors.textMuted} />
                  <Text style={styles.actionBtnText}>YENİ ANALİZ</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.actionBtnGold]} onPress={handleShare}>
                  <Share2 size={18} color={colors.gold} />
                  <Text style={[styles.actionBtnText, { color: colors.gold }]}>PAYLAŞ</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface + '88', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.display, fontSize: 18, color: colors.text, letterSpacing: 1 },
  body: { flex: 1 },
  introContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 24 },
  introIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold + '33' },
  heroTitle: { fontFamily: font.display, fontSize: 42, color: colors.text, textAlign: 'center', lineHeight: 50 },
  heroSub: { fontFamily: font.serif, fontSize: 18, color: colors.textMuted, textAlign: 'center', lineHeight: 28, opacity: 0.8 },
  featureGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  featureItem: { padding: 16, backgroundColor: colors.surface + '44', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', gap: 4 },
  featureLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 1 },
  featureVal: { fontFamily: font.sans, fontSize: 12, color: colors.textDim },
  mainBtn: { width: '100%', height: 64, backgroundColor: colors.gold, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...shadows.gold, marginTop: 12 },
  mainBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.bgDeep, letterSpacing: 1 },
  wizardContent: { flex: 1, paddingHorizontal: 24, paddingTop: 20, gap: 32 },
  progressContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surface },
  progressDotActive: { backgroundColor: colors.gold },
  progressDotDone: { backgroundColor: colors.gold + '66' },
  wizardCard: { backgroundColor: colors.surface + '66', padding: 32, borderRadius: radius.xl * 2, borderWidth: 1, borderColor: colors.lineSoft, gap: 24 },
  wizardHeader: { gap: 8 },
  wizardTitle: { fontFamily: font.display, fontSize: 28, color: colors.text },
  wizardSub: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, fontStyle: 'italic' },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.bgDeep + '88', paddingHorizontal: 20, paddingVertical: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  textInput: { flex: 1, fontFamily: font.serif, fontSize: 24, color: colors.text },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 },
  loaderContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  loaderSparkle: { position: 'absolute' },
  loadingTitle: { fontFamily: font.display, fontSize: 22, color: colors.gold, textAlign: 'center', letterSpacing: 1 },
  loadingSub: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, fontStyle: 'italic' },
  resultScroll: { paddingHorizontal: 20, paddingBottom: 60 },
  resultHead: { alignItems: 'center', gap: 12, marginVertical: 32 },
  menzilBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold + '33' },
  menzilBadgeText: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 1.5 },
  menzilTitle: { fontFamily: font.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  menzilSub: { fontFamily: font.serif, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  resultCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  resCardWrapper: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft },
  resCard: { flex: 1, padding: 16, alignItems: 'center', gap: 8 },
  resCardLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  ebcedBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold + '33' },
  ebcedBadgeText: { fontFamily: font.sansBold, fontSize: 14, color: colors.gold },
  menzilNoText: { fontFamily: font.display, fontSize: 32, color: colors.gold, height: 44, textAlignVertical: 'center' },
  summaryBox: { borderRadius: radius.xl * 1.5, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft, marginBottom: 24 },
  summaryGradient: { padding: 24, alignItems: 'center' },
  summaryText: { fontFamily: font.serifItalic, fontSize: 16, color: colors.textDim, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft },
  catChipText: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 1 },
  interpretationBox: { padding: 24, borderRadius: radius.xl * 2, backgroundColor: colors.surface + '44', borderWidth: 1, borderColor: colors.lineSoft, gap: 16, marginBottom: 32 },
  interHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  interTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 2 },
  interpretationText: { fontFamily: font.serif, fontSize: 18, color: colors.text, lineHeight: 30, textAlign: 'center' },
  promoCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, backgroundColor: colors.gold + '10', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.gold + '22', marginBottom: 32 },
  promoInfo: { flex: 1, gap: 4 },
  promoTitle: { fontFamily: font.display, fontSize: 16, color: colors.gold },
  promoSub: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  resultActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 56, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnGold: { borderColor: colors.gold + '44', backgroundColor: colors.gold + '08' },
  actionBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted, letterSpacing: 1 },
});
