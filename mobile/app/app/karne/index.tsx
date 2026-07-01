import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CheckCircle2, Sparkles, XCircle, HelpCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  reviewOutcomesApi,
  getAssetUrl,
  type PendingOutcomeDto,
  type ReviewOutcomeResponse,
} from '@/lib/api';

const RESPONSES: {
  value: ReviewOutcomeResponse;
  labelKey: string;
  Icon: typeof CheckCircle2;
}[] = [
  { value: 'happened', labelKey: 'karne.happened', Icon: CheckCircle2 },
  { value: 'partially', labelKey: 'karne.partially', Icon: Sparkles },
  { value: 'did_not_happen', labelKey: 'karne.didNotHappen', Icon: XCircle },
  { value: 'no_answer', labelKey: 'karne.noAnswer', Icon: HelpCircle },
];

function buildStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
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
    title: { flex: 1, fontFamily: font.display, fontSize: 20, color: colors.text },
    intro: {
      fontFamily: font.sans,
      fontSize: 13,
      color: colors.textMuted,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.line,
      gap: spacing.md,
    },
    cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.inkDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: { fontFamily: font.display, fontSize: 22, color: colors.gold },
    cardTitle: { fontFamily: font.sansBold, fontSize: 16, color: colors.text },
    cardMeta: { fontFamily: font.sans, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    optionActive: { borderColor: colors.gold, backgroundColor: colors.inkDeep },
    optionText: { fontFamily: font.sansMedium, fontSize: 13, color: colors.textDim, flex: 1 },
    notes: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: 12,
      minHeight: 72,
      fontFamily: font.sans,
      fontSize: 14,
      color: colors.text,
      textAlignVertical: 'top',
    },
    submit: {
      backgroundColor: colors.gold,
      paddingVertical: 14,
      borderRadius: radius.pill,
      alignItems: 'center',
    },
    submitText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
    empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
    emptyText: { fontFamily: font.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
    guestWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
    guestBtn: {
      backgroundColor: colors.gold,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: radius.pill,
    },
    guestBtnText: { fontFamily: font.sansBold, fontSize: 14, color: colors.ink },
  });
}

function OutcomeCard({
  outcome,
  onDone,
  styles,
  colors,
}: {
  outcome: PendingOutcomeDto;
  onDone: () => void;
  styles: ReturnType<typeof buildStyles>;
  colors: AppTheme['colors'];
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReviewOutcomeResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const name = outcome.consultant_name || t('karne.consultant');
  const avatar = getAssetUrl(outcome.consultant_avatar);

  const handleSubmit = async () => {
    if (!selected) {
      Alert.alert(t('karne.missingTitle'), t('karne.selectOption'));
      return;
    }
    setSaving(true);
    try {
      await reviewOutcomesApi.submit(outcome.review_id, selected, notes.trim() || undefined);
      onDone();
    } catch (err: unknown) {
      Alert.alert(t('common.errorTitle'), err instanceof Error ? err.message : t('karne.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{name[0]}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardMeta}>
            {outcome.review_rating != null ? `★ ${outcome.review_rating} · ` : ''}
            {t('karne.followUpDate', { date: new Date(outcome.follow_up_at).toLocaleDateString('tr-TR') })}
          </Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>{t('karne.question')}</Text>
      {RESPONSES.map(({ value, labelKey, Icon }) => {
        const active = selected === value;
        return (
          <Pressable
            key={value}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => setSelected(value)}
          >
            <Icon size={18} color={active ? colors.gold : colors.textMuted} />
            <Text style={[styles.optionText, active && { color: colors.gold }]}>{t(labelKey)}</Text>
          </Pressable>
        );
      })}
      <TextInput
        style={styles.notes}
        placeholder={t('karne.notesPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Pressable style={styles.submit} onPress={handleSubmit} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text style={styles.submitText}>{t('karne.submit')}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function KarneScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { isAuthenticated, authHydrating } = useAuth();
  const [items, setItems] = useState<PendingOutcomeDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await reviewOutcomesApi.listPending();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!authHydrating) load();
  }, [authHydrating, load]);

  if (authHydrating || (isAuthenticated && loading)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>{t('karne.title')}</Text>
          </View>
          <View style={styles.guestWrap}>
            <Sparkles size={48} color={colors.gold} />
            <Text style={styles.emptyText}>
              {t('karne.guestPrompt')}
            </Text>
            <Pressable style={styles.guestBtn} onPress={() => router.push('/auth/login' as any)}>
              <Text style={styles.guestBtnText}>{t('karne.login')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{t('karne.title')}</Text>
        </View>
        <Text style={styles.intro}>
          {t('karne.intro')}
        </Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('karne.empty')}
              </Text>
            </View>
          ) : (
            items.map((o) => (
              <OutcomeCard key={o.id} outcome={o} onDone={load} styles={styles} colors={colors} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
