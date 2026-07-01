import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MapPin, Calendar, Clock, Sparkles } from 'lucide-react-native';

import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { storage } from '@/lib/storage';
import { birthChartsApi, geocodeApi, hydrateAuthTokenFromStorage } from '@/lib/api';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safe: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
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
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: 40,
    },
    titleArea: {
      marginBottom: spacing['2xl'],
    },
    kicker: {
      fontFamily: font.sansBold,
      fontSize: 10,
      color: colors.goldDeep,
      letterSpacing: 2,
      marginBottom: 8,
    },
    title: {
      fontFamily: font.display,
      fontSize: 32,
      color: colors.text,
      lineHeight: 40,
      marginBottom: 12,
    },
    subtitle: {
      fontFamily: font.sans,
      fontSize: 15,
      color: colors.textDim,
      lineHeight: 22,
    },
    form: {
      gap: spacing.xl,
      marginBottom: 40,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontFamily: font.sansBold,
      fontSize: 10,
      color: colors.gold,
      letterSpacing: 2,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 56,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 12,
    },
    input: {
      flex: 1,
      fontFamily: font.sans,
      fontSize: 16,
      color: colors.text,
    },
    hint: {
      fontFamily: font.sans,
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: 4,
    },
    footer: {
      marginTop: 'auto',
    },
    calculateBtn: {
      backgroundColor: colors.gold,
      height: 56,
      borderRadius: radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    calculateBtnText: {
      fontFamily: font.sansBold,
      fontSize: 16,
      color: colors.ink,
    },
  });
}

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

export default function BirthdataScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [city, setCity] = useState('');
  const [place, setPlace] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!date || !time || !city) {
      Alert.alert(t('common.missingInfo'), t('common.fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      const token = await hydrateAuthTokenFromStorage();
      if (!token) {
        Alert.alert(
          t('birthdata.accountRequiredTitle'),
          t('birthdata.accountRequiredBody'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('auth.registerBtn'),
              onPress: () =>
                router.push({
                  pathname: '/auth/register',
                  params: { next: '/onboarding/birthdata' },
                } as any),
            },
            {
              text: t('auth.loginShort'),
              onPress: () =>
                router.push({
                  pathname: '/auth/login',
                  params: { next: '/onboarding/birthdata' },
                } as any),
            },
          ],
        );
        return;
      }

      const resolvedPlace = place?.label === city ? place : await geocodeApi.search(city);
      await birthChartsApi.create({
        name: 'Ana Haritam',
        dob: normalizeDate(date),
        tob: normalizeTime(time),
        pob_lat: resolvedPlace.lat,
        pob_lng: resolvedPlace.lng,
        pob_label: resolvedPlace.label,
      });

      await storage.markOnboarded();
      router.replace('/(tabs)/today' as any);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (/no_token|Unauthorized|401/i.test(msg)) {
        Alert.alert(
          t('birthdata.sessionRequiredTitle'),
          t('birthdata.sessionRequiredBody'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('auth.loginShort'),
              onPress: () =>
                router.push({
                  pathname: '/auth/login',
                  params: { next: '/onboarding/birthdata' },
                } as any),
            },
          ],
        );
      } else {
        Alert.alert(t('common.error'), msg || t('birthdata.calcError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const resolvePlace = async () => {
    if (!city.trim()) return;
    try {
      const result = await geocodeApi.search(city.trim());
      setPlace({ lat: result.lat, lng: result.lng, label: result.label });
      setCity(result.label);
    } catch {
      setPlace(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.titleArea}>
              <Text style={styles.kicker}>{t('birthdata.step')}</Text>
              <Text style={styles.title}>{t('birthdata.title')}</Text>
              <Text style={styles.subtitle}>
                {t('birthdata.subtitle')}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('birthdata.dateLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Calendar size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('birthdata.datePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('birthdata.timeLabel')}</Text>
                <View style={styles.inputContainer}>
                  <Clock size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('birthdata.timePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={time}
                    onChangeText={setTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <Text style={styles.hint}>{t('birthdata.timeHint')}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('birthdata.placeLabel')}</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={20} color={colors.goldDim} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('birthdata.placePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={city}
                    onChangeText={(value) => {
                      setCity(value);
                      setPlace(null);
                    }}
                    onBlur={resolvePlace}
                  />
                </View>
                {place ? <Text style={styles.hint}>{t('birthdata.locationFound', { label: place.label })}</Text> : null}
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable
                style={[styles.calculateBtn, loading && styles.btnDisabled]}
                onPress={handleCalculate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <>
                    <Text style={styles.calculateBtnText}>{t('birthdata.calculate')}</Text>
                    <Sparkles size={18} color={colors.ink} />
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
