import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, ChevronLeft, Clock, MapPin, Sparkles } from 'lucide-react-native';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { birthChartsApi, geocodeApi } from '@/lib/api';
import type { BigThreePreviewResponse, BigThreeSlotPayload } from '@/types';

export default function BigThreeScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  const [place, setPlace] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BigThreePreviewResponse | null>(null);

  const resolvePlace = async () => {
    if (!city.trim()) return;
    try {
      const geo = await geocodeApi.search(city.trim());
      setPlace({ lat: geo.lat, lng: geo.lng, label: geo.label });
      setCity(geo.label);
    } catch {
      setPlace(null);
    }
  };

  const submit = async () => {
    if (!date.trim() || !time.trim() || !city.trim()) {
      Alert.alert('Eksik bilgi', 'Doğum tarihi, saati ve yeri girin.');
      return;
    }
    try {
      setLoading(true);
      const resolved = place?.label === city ? place : await geocodeApi.search(city.trim());

      const payload = {
        name: name.trim() || 'Önizleme',
        dob: normalizeDate(date),
        tob: normalizeTime(time),
        pob_lat: resolved.lat,
        pob_lng: resolved.lng,
        pob_label: resolved.label,
      };

      const data = await birthChartsApi.previewBigThree(payload);
      setResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Hesaplanamadı';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Büyük Üçlü</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Güneş, Ay ve Yükselen burcunuzu doğum verilerinizle hesaplayın. Kayıt gerekmez.
            </Text>

            <View style={styles.form}>
              <Field
                label="İSİM (OPSİYONEL)"
                icon={<Sparkles size={18} color={colors.goldDim} />}
                input={
                  <TextInput
                    style={styles.input}
                    placeholder="Haritada görünecek isim"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                }
              />
              <Field
                label="DOĞUM TARİHİ"
                icon={<Calendar size={18} color={colors.goldDim} />}
                input={
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-AA-GG veya GG.AA.YYYY"
                    placeholderTextColor={colors.textMuted}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="numbers-and-punctuation"
                  />
                }
              />
              <Field
                label="DOĞUM SAATİ"
                icon={<Clock size={18} color={colors.goldDim} />}
                input={
                  <TextInput
                    style={styles.input}
                    placeholder="SS:DD"
                    placeholderTextColor={colors.textMuted}
                    value={time}
                    onChangeText={setTime}
                    keyboardType="numbers-and-punctuation"
                  />
                }
              />
              <Field
                label="DOĞUM YERİ"
                icon={<MapPin size={18} color={colors.goldDim} />}
                input={
                  <TextInput
                    style={styles.input}
                    placeholder="Şehir / ilçe"
                    placeholderTextColor={colors.textMuted}
                    value={city}
                    onChangeText={(v) => {
                      setCity(v);
                      setPlace(null);
                    }}
                    onBlur={resolvePlace}
                  />
                }
              />
              {place ? <Text style={styles.hint}>Konum: {place.label}</Text> : null}
            </View>

            <Pressable
              style={[styles.submit, loading && styles.submitDisabled]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bgDeep} />
              ) : (
                <Text style={styles.submitText}>Hesapla</Text>
              )}
            </Pressable>

            {result ? (
              <View style={styles.resultBlock}>
                <Text style={styles.resultKicker}>SONUÇ</Text>
                <SlotCard title="Güneş" slot={result.big_three.sun} />
                <SlotCard title="Ay" slot={result.big_three.moon} />
                <SlotCard title="Yükselen" slot={result.big_three.ascendant} />

                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => router.push('/(tabs)/birth-chart' as any)}
                >
                  <Text style={styles.secondaryBtnText}>Tam doğum haritam</Text>
                </Pressable>
                <Text style={styles.ctaHint}>{result.cta.message}</Text>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  icon,
  input,
}: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon}
        {input}
      </View>
    </View>
  );
}

function SlotCard({ title, slot }: { title: string; slot: BigThreeSlotPayload | null }) {
  if (!slot) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMuted}>—</Text>
      </View>
    );
  }

  const display = slot.kb_title || slot.sign_label || slot.sign;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSign}>{display}</Text>
      </View>
      {slot.slot === 'ascendant' && slot.tob_unknown ? (
        <Text style={styles.warning}>
          Kesin yükselen için doğum saatinizi doğrulayın; tahmini hesaplama kullanıldıysa yükselen
          yaklaşıktır.
        </Text>
      ) : null}
      {slot.image_url ? (
        <Image source={{ uri: slot.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : null}
      {slot.summary ? <Text style={styles.summary}>{slot.summary}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
  fieldGroup: { gap: 6 },
  label: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  hint: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: -8,
  },
  submit: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { fontFamily: font.sansBold, fontSize: 16, color: colors.bgDeep },
  resultBlock: { gap: 12 },
  resultKicker: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.goldDeep,
    letterSpacing: 2,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  cardTop: { marginBottom: 8 },
  cardTitle: { fontFamily: font.sansBold, fontSize: 12, color: colors.textMuted },
  cardSign: { fontFamily: font.display, fontSize: 22, color: colors.gold, marginTop: 4 },
  cardMuted: { fontFamily: font.sans, color: colors.textMuted },
  warning: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.warning,
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderRadius: radius.md,
    marginBottom: 10,
    backgroundColor: colors.inkDeep,
  },
  summary: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textDim,
    lineHeight: 21,
  },
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldDim,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  ctaHint: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});

function normalizeDate(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})[./\-\s](\d{2})[./\-\s](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

function normalizeTime(value: string) {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  return trimmed;
}
