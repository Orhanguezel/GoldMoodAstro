import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Share
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingBottom: 20 },
  scrollContent: { paddingBottom: 40 },
  navHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.xl, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: font.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  headerSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  guideSection: { padding: spacing.xl, gap: 24 },
  guideItem: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  guideNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  guideNumberText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
  guideTitle: { fontFamily: font.sansBold, fontSize: 16, color: colors.textDim },
  guideDesc: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  primaryBtn: { marginHorizontal: spacing.xl, borderRadius: radius.pill, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink, letterSpacing: 1 },
  
  waitContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  timerCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.gold + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  timerText: { fontFamily: font.sansBold, fontSize: 40, color: colors.gold },
  waitTitle: { fontFamily: font.display, fontSize: 24, color: colors.text },
  waitSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic', paddingHorizontal: 20 },

  stepTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, textAlign: 'center' },
  stepSubtitle: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  uploadGrid: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.lg, marginTop: 20 },
  uploadBox: { width: (width - 60) / 3, height: ((width - 60) / 3) * 1.33, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', backgroundColor: colors.surface + '40', overflow: 'hidden' },
  uploadBoxActive: { borderStyle: 'solid', borderColor: colors.gold },
  previewWrap: { flex: 1 },
  previewImg: { width: '100%', height: '100%' },
  checkBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  placeholderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  placeholderText: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 1 },
  placeholderSubText: { fontFamily: font.sans, fontSize: 8, color: colors.textMuted },
  miniLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15 },
  miniLoaderText: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted },
  
  processingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  processingTitle: { fontFamily: font.display, fontSize: 24, color: colors.gold, marginTop: 24 },
  processingSubtitle: { fontFamily: font.serif, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  
  resultContent: { paddingBottom: 40 },
  resultHeader: { padding: spacing.xl, alignItems: 'center' },
  resultTitle: { fontFamily: font.display, fontSize: 32, color: colors.text },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.lg, marginBottom: 24 },
  symbolCard: { borderRadius: radius.lg, overflow: 'hidden', minWidth: (width - 60) / 3, borderWidth: 1, borderColor: colors.lineSoft },
  symbolInner: { flex: 1, padding: 12, alignItems: 'center' },
  symbolIcon: { fontSize: 24, marginBottom: 4 },
  symbolName: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, textTransform: 'uppercase', letterSpacing: 1 },
  confidenceBar: { width: '100%', height: 2, backgroundColor: colors.gold + '20', borderRadius: 1, marginTop: 6 },
  confidenceFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 1 },

  interpretationBox: { marginHorizontal: spacing.lg, padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  interpretationText: { fontFamily: font.serif, fontSize: 18, color: colors.textDim, lineHeight: 30, fontStyle: 'italic' },
  resultActions: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.lg, marginTop: 32, marginBottom: 20 },
  actionBtn: { flex: 1, height: 56, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnGold: { borderColor: colors.gold + '44', backgroundColor: colors.gold + '08' },
  actionBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted, letterSpacing: 1 },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera, 
  Coffee, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Timer,
  Share2
} from 'lucide-react-native';
import { router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';


import { useTranslation } from 'react-i18next';

import { coffeeApi, storageApi } from '@/lib/api';
import ConsultantFunnelCTA from '@/components/ConsultantFunnelCTA';

const { width } = Dimensions.get('window');

export default function CoffeeScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [step, setStep] = useState<'intro' | 'wait' | 'upload' | 'processing' | 'result'>('intro');
  const [images, setImages] = useState<string[]>([]); // local uris
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `Kahve Falım: ${result?.interpretation?.substring(0, 200)}... \n\nGoldMoodAstro ile geleceğini keşfet!\n\nKeşfet: https://goldmoodastro.com/tr/kahve-fali/result/${result.id}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=coffee`,
        title: t('coffee.shareTitle'),
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const takePhoto = async (index: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('coffee.permissionTitle'), t('coffee.permissionBody'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = result.assets[0].uri;
      
      const newImages = [...images];
      newImages[index] = uri;
      setImages(newImages);
      
      // Upload
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: `coffee_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
        
        const res = await storageApi.upload(formData); 
        const newIds = [...imageIds];
        newIds[index] = res.id;
        setImageIds(newIds);
      } catch (e) {
        console.error('Upload error:', e);
        Alert.alert(t('common.errorTitle'), t('coffee.uploadError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (imageIds.filter(Boolean).length < 3) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('processing');
    
    try {
      const res = await coffeeApi.read({
        image_ids: imageIds,
        locale: 'tr'
      });
      setResult(res);
      setStep('result');
    } catch (e) {
      console.error('Coffee read error:', e);
      Alert.alert(t('common.errorTitle'), t('coffee.readError'));
      setStep('upload');
    }
  };

  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.navHeader}>
              <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
                <ChevronLeft size={24} color={colors.gold} />
              </Pressable>
            </View>

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Coffee size={40} color={colors.gold} />
              </View>
              <Text style={styles.headerTitle}>{t('coffee.introTitle')}</Text>
              <Text style={styles.headerSubtitle}>{t('coffee.introSubtitle')}</Text>
            </View>

            <View style={styles.guideSection}>
              {[
                { title: t('coffee.guide1Title'), desc: t('coffee.guide1Desc') },
                { title: t('coffee.guide2Title'), desc: t('coffee.guide2Desc') },
                { title: t('coffee.guide3Title'), desc: t('coffee.guide3Desc') },
              ].map((item, i) => (
                <View key={i} style={styles.guideItem}>
                  <View style={styles.guideNumber}><Text style={styles.guideNumberText}>{i+1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideTitle}>{item.title}</Text>
                    <Text style={styles.guideDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable 
              style={styles.primaryBtn} 
              onPress={() => {
                setStep('wait');
                setTimerActive(true);
              }}
            >
              <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.btnGradient}>
                <Text style={styles.primaryBtnText}>{t('coffee.closedCupBtn')}</Text>
                <ChevronRight size={18} color={colors.ink} />
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'wait') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.navHeader}>
            <Pressable onPress={() => setStep('intro')} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.gold} />
            </Pressable>
          </View>

          <View style={styles.waitContent}>
             <View style={styles.timerCircle}>
                <Timer size={40} color={colors.gold} style={{ marginBottom: 10 }} />
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
             </View>
             <Text style={styles.waitTitle}>{t('coffee.waitTitle')}</Text>
             <Text style={styles.waitSubtitle}>
               {t('coffee.waitSubtitle')}
             </Text>

             <Pressable 
               style={[styles.primaryBtn, { marginTop: 40 }]} 
               onPress={() => setStep('upload')}
             >
               <LinearGradient 
                 colors={timeLeft === 0 ? [colors.goldDeep, colors.gold] : [colors.surface, colors.surface]} 
                 style={styles.btnGradient}
               >
                 <Text style={[styles.primaryBtnText, timeLeft > 0 && { color: colors.textMuted }]}>
                   {timeLeft === 0 ? t('coffee.continueBtn') : t('coffee.skipWaitBtn')}
                 </Text>
               </LinearGradient>
             </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'upload') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.navHeader}>
            <Pressable onPress={() => setStep('wait')} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.gold} />
            </Pressable>
          </View>
          
          <View style={styles.header}>
            <Text style={styles.stepTitle}>{t('coffee.uploadTitle')}</Text>
            <Text style={styles.stepSubtitle}>{t('coffee.uploadSubtitle')}</Text>
          </View>

          <View style={styles.uploadGrid}>
            {[
              { label: t('coffee.slotInside1'), desc: t('coffee.slotWalls') },
              { label: t('coffee.slotInside2'), desc: t('coffee.slotBottom') },
              { label: t('coffee.slotPlate'), desc: t('coffee.slotTraces') }
            ].map((slot, idx) => (
              <Pressable 
                key={idx} 
                style={[styles.uploadBox, images[idx] && styles.uploadBoxActive]}
                onPress={() => takePhoto(idx)}
              >
                {images[idx] ? (
                  <View style={styles.previewWrap}>
                    <Image source={{ uri: images[idx] }} style={styles.previewImg} />
                    <View style={styles.checkBadge}>
                      <CheckCircle2 size={24} color={colors.gold} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.placeholderWrap}>
                    <Camera size={32} color={colors.goldDim} />
                    <Text style={styles.placeholderText}>{slot.label}</Text>
                    <Text style={styles.placeholderSubText}>{slot.desc}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {loading && (
            <View style={styles.miniLoader}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={styles.miniLoaderText}>{t('common.loading')}</Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <Pressable 
            style={[styles.primaryBtn, imageIds.filter(Boolean).length < 3 && { opacity: 0.5 }]} 
            onPress={handleStartAnalysis}
            disabled={imageIds.filter(Boolean).length < 3 || loading}
          >
            <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.btnGradient}>
              <Text style={styles.primaryBtnText}>{t('coffee.interpretBtn')}</Text>
              <Sparkles size={18} color={colors.ink} />
            </LinearGradient>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <View style={styles.processingCenter}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.processingTitle}>{t('coffee.processingTitle')}</Text>
          <Text style={styles.processingSubtitle}>{t('coffee.processingSubtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
             <Sparkles size={24} color={colors.gold} style={{ marginBottom: 12 }} />
             <Text style={styles.resultTitle}>{t('coffee.resultTitle')}</Text>
          </View>

          <View style={styles.symbolGrid}>
            {result?.symbols?.map((s: any, i: number) => (
              <View key={i} style={styles.symbolCard}>
                <LinearGradient colors={[colors.surface, colors.surfaceHigh]} style={styles.symbolInner}>
                  <Text style={styles.symbolIcon}>{s.icon || '✨'}</Text>
                  <Text style={styles.symbolName}>{s.name}</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${(s.confidence || 0.8) * 100}%` }]} />
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          <LinearGradient colors={[colors.surface + '88', colors.bgDeep + '88']} style={styles.interpretationBox}>
            <Text style={styles.interpretationText}>{result?.interpretation}</Text>
          </LinearGradient>

          <ConsultantFunnelCTA feature="kahve" intensity="heavy" />

          <View style={styles.resultActions}>
            <Pressable 
              style={[styles.actionBtn, styles.actionBtnGold]} 
              onPress={handleShare}
            >
              <Share2 size={18} color={colors.gold} />
              <Text style={[styles.actionBtnText, { color: colors.gold }]}>{t('common.share')}</Text>
            </Pressable>

            <Pressable 
              style={styles.actionBtn} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep('intro');
                setImages([]);
                setImageIds([]);
                setResult(null);
                setTimeLeft(300);
              }}
            >
              <RotateCcw size={16} color={colors.textMuted} />
              <Text style={styles.actionBtnText}>{t('coffee.newReading')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

