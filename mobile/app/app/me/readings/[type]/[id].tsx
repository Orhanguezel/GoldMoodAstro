import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import {
  tarotApi,
  coffeeApi,
  dreamsApi,
  numerologyApi,
  yildiznameApi,
  synastryApi,
  type ReadingHistoryType,
} from '@/lib/api';

function buildStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: 12,
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
    navTitle: { flex: 1, fontFamily: font.display, fontSize: 18, color: colors.text },
    scroll: { padding: spacing.lg, paddingBottom: 48 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
    body: {
      fontFamily: font.sans,
      fontSize: 16,
      color: colors.textDim,
      lineHeight: 26,
    },
    errorText: {
      fontFamily: font.sans,
      fontSize: 14,
      color: colors.danger,
      textAlign: 'center',
    },
  });
}

const VALID_TYPES: ReadingHistoryType[] = [
  'tarot',
  'coffee',
  'dream',
  'numerology',
  'yildizname',
  'synastry',
];

async function loadReading(type: ReadingHistoryType, id: string): Promise<string> {
  switch (type) {
    case 'tarot': {
      const d = await tarotApi.getReading(id);
      return d?.interpretation ?? '';
    }
    case 'coffee': {
      const d = await coffeeApi.getReading(id);
      return d?.interpretation ?? '';
    }
    case 'dream': {
      const d = await dreamsApi.getReading(id);
      return d?.interpretation ?? d?.dream_text ?? '';
    }
    case 'numerology': {
      const d = await numerologyApi.getReading(id);
      return d?.interpretation ?? '';
    }
    case 'yildizname': {
      const d = await yildiznameApi.getReading(id);
      return d?.readingText ?? d?.interpretation ?? d?.result_text ?? '';
    }
    case 'synastry': {
      const d = await synastryApi.getReading(id);
      return (
        d?.result?.reading ??
        d?.reading ??
        d?.content ??
        d?.raw ??
        ''
      );
    }
    default:
      return '';
  }
}

export default function ReadingDetailScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;

  const { type: typeParam, id: idParam } = useLocalSearchParams<{ type: string; id: string }>();
  const type = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validType = type && VALID_TYPES.includes(type as ReadingHistoryType);

  useEffect(() => {
    if (!validType || !id) {
      setError(t('readings.invalidRecord'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadReading(type as ReadingHistoryType, id)
      .then((body) => {
        if (!cancelled) setText(body || t('readings.noContent'));
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('readings.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [validType, type, id, t]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>
            {t('readings.detailTitle')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.gold} size="large" />
          </View>
        ) : error ? (
          <View style={styles.loader}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Text style={styles.body}>{text}</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
