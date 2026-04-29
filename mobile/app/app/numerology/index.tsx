import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Binary, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  User,
  Calendar,
  Hash,
  Heart,
  Target,
  Zap
} from 'lucide-react-native';
import { router } from 'expo-router';

import { colors, font, radius, spacing } from '@/theme/tokens';
import { numerologyApi } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function NumerologyScreen() {
  const [formData, setFormData] = useState({ full_name: '', birth_date: '' });
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    if (!formData.full_name || !formData.birth_date) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('processing');
    
    try {
      const res = await numerologyApi.calculate({
        ...formData,
        locale: 'tr'
      });
      setResult(res);
      setStep('result');
    } catch (e) {
      console.error('Numerology error:', e);
      Alert.alert('Hata', 'Hesaplama yapılırken bir hata oluştu.');
      setStep('input');
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
                <Binary size={40} color={colors.gold} />
              </View>
              <Text style={styles.headerTitle}>Numeroloji</Text>
              <Text style={styles.headerSubtitle}>İsminizdeki sayısal kodları çözün.</Text>
            </View>

            <View style={styles.formCard}>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>AD SOYAD (DOĞUMDAKİ)</Text>
                  <View style={styles.inputWrap}>
                    <User size={18} color={colors.goldDim} />
                    <TextInput
                      style={styles.input}
                      value={formData.full_name}
                      onChangeText={(val) => setFormData(prev => ({ ...prev, full_name: val }))}
                      placeholder="Örn: Ali Yılmaz"
                      placeholderTextColor={colors.textMuted + '66'}
                    />
                  </View>
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>DOĞUM TARİHİ (YYYY-AA-GG)</Text>
                  <View style={styles.inputWrap}>
                    <Calendar size={18} color={colors.goldDim} />
                    <TextInput
                      style={styles.input}
                      value={formData.birth_date}
                      onChangeText={(val) => setFormData(prev => ({ ...prev, birth_date: val }))}
                      placeholder="1990-05-24"
                      placeholderTextColor={colors.textMuted + '66'}
                      keyboardType="numeric"
                    />
                  </View>
               </View>
            </View>

            <Pressable 
              style={[styles.primaryBtn, (!formData.full_name || !formData.birth_date) && { opacity: 0.5 }]} 
              onPress={handleCalculate}
              disabled={!formData.full_name || !formData.birth_date}
            >
              <LinearGradient colors={[colors.goldDeep, colors.gold]} style={styles.btnGradient}>
                <Text style={styles.primaryBtnText}>HESAPLA & YORUMLA</Text>
                <ChevronRight size={18} color={colors.bgDeep} />
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
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.processingTitle}>Sayılar Analiz Ediliyor...</Text>
          <Text style={styles.processingSubtitle}>İsminizin ve tarihinizin titreşimi kadim kodlarla eşleşiyor.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={styles.navHeader}>
            <Pressable onPress={() => setStep('input')} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.gold} />
            </Pressable>
          </View>

          <View style={styles.resultHeader}>
             <Sparkles size={24} color={colors.gold} style={{ marginBottom: 12 }} />
             <Text style={styles.resultTitle}>Sayıların Gücü</Text>
             <Text style={styles.resultName}>{formData.full_name}</Text>
          </View>

          <View style={styles.numbersGrid}>
            {[
              { label: 'Hayat Yolu', value: result?.calculation?.lifePath, icon: Target, color: '#60a5fa' },
              { label: 'Kader', value: result?.calculation?.destiny, icon: Zap, color: colors.gold },
              { label: 'Ruh Güdüsü', value: result?.calculation?.soulUrge, icon: Heart, color: '#f87171' },
              { label: 'Kişilik', value: result?.calculation?.personality, icon: Hash, color: '#34d399' },
            ].map((item, i) => (
              <LinearGradient
                key={i}
                colors={[colors.surface, colors.inkDeep]}
                style={styles.numberBox}
              >
                 <item.icon size={16} color={item.color} style={{ marginBottom: 8 }} />
                 <Text style={styles.numberValue}>{item.value}</Text>
                 <Text style={styles.numberLabel}>{item.label}</Text>
              </LinearGradient>
            ))}
          </View>

          <LinearGradient
            colors={[colors.inkDeep, colors.surface]}
            style={styles.interpretationBox}
          >
            <Sparkles size={20} color={colors.gold} style={{ marginBottom: 16, opacity: 0.3 }} />
            <Text style={styles.interpretationText}>{result?.interpretation}</Text>
          </LinearGradient>

          <Pressable 
            style={styles.resetBtn} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStep('input');
              setFormData({ full_name: '', birth_date: '' });
              setResult(null);
            }}
          >
            <RotateCcw size={16} color={colors.gold} />
            <Text style={styles.resetBtnText}>YENİ ANALİZ</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  navHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  header: { padding: spacing.xl, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: font.display, fontSize: 32, color: colors.text, textAlign: 'center' },
  headerSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  formCard: { margin: spacing.lg, padding: 24, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.inkDeep, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.lineSoft },
  input: { flex: 1, fontFamily: font.sans, fontSize: 16, color: colors.text },
  primaryBtn: { marginHorizontal: spacing.xl, borderRadius: radius.pill, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  primaryBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.bgDeep, letterSpacing: 1 },
  
  processingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  processingTitle: { fontFamily: font.display, fontSize: 24, color: colors.gold, marginTop: 24 },
  processingSubtitle: { fontFamily: font.serif, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  
  resultContent: { paddingBottom: 40 },
  resultHeader: { padding: spacing.xl, alignItems: 'center' },
  resultTitle: { fontFamily: font.display, fontSize: 32, color: colors.text },
  resultName: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  numbersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.lg, justifyContent: 'center' },
  numberBox: { width: (width - 40 - 12) / 2, backgroundColor: colors.surface, padding: 20, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center' },
  numberValue: { fontFamily: font.display, fontSize: 28, color: colors.text },
  numberLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },
  interpretationBox: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft },
  interpretationText: { fontFamily: font.sans, fontSize: 16, color: colors.textDim, lineHeight: 28 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, marginTop: 20 },
  resetBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold, letterSpacing: 1 },
});
