import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { safeRouterBack } from '@/lib/navigation';
import { customPagesApi } from '@/lib/api';
import { extractHtmlFromPage, type CustomPageRow } from '@/lib/cms';
import { CmsHtmlView } from '@/components/CmsHtmlView';

function buildStyles(t: AppTheme) {
  const { colors, spacing, font } = t;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.lineSoft,
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
    title: { flex: 1, fontFamily: font.display, fontSize: 18, color: colors.text },
  });
}

export default function BlogPostScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { colors } = theme;
  const { i18n } = useTranslation();

  const params = useLocalSearchParams<{ slug?: string | string[]; title?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug ?? '';
  const fallbackTitle = Array.isArray(params.title) ? params.title[0] : params.title ?? 'Blog';

  const [page, setPage] = useState<CustomPageRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const locale = i18n.language?.slice(0, 2) ?? 'tr';
    setLoading(true);
    customPagesApi
      .getBySlug(slug, locale)
      .then(setPage)
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug, i18n.language]);

  const html = extractHtmlFromPage(page);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeRouterBack()}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {page?.title?.trim() || fallbackTitle}
          </Text>
        </View>
        <CmsHtmlView html={html} loading={loading} />
      </SafeAreaView>
    </View>
  );
}
