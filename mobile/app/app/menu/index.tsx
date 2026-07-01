import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    borderColor: colors.lineSoft,
  },
  headerTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  list: { paddingBottom: spacing['2xl'] },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.lineSoft,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  footerSectionLabel: {
    fontFamily: font.sansBold,
    fontSize: 11,
    color: colors.goldDeep,
    letterSpacing: 1.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  footerColumnTitle: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineSoft,
    gap: 12,
  },
  rowPressed: { backgroundColor: colors.surface },
  rowTitle: {
    flex: 1,
    fontFamily: font.sansMedium,
    fontSize: 16,
    color: colors.textDim,
    lineHeight: 22,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errText: { fontFamily: font.sans, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  retry: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  retryText: { fontFamily: font.sansBold, fontSize: 13, color: colors.gold },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { navigationApi, getPublicWebUrl } from '@/lib/api';
import { resolveMenuLink } from '@/lib/menuRoutes';

import type { PublicMenuItemDto, FooterSectionPublic } from '@/types';

export default function MenuScreen() {
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  function MenuRow({
    title,
    depth,
    hasChildren,
    expanded,
    navigable,
    onPress,
  }: {
    title: string;
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
    navigable: boolean;
    onPress: () => void;
  }) {
    const pad = Math.min(depth, 6) * spacing.md;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { paddingLeft: spacing.lg + pad },
          pressed && styles.rowPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {hasChildren ? (
          <ChevronDown
            size={18}
            color={colors.textMuted}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        ) : navigable ? (
          <ChevronRight size={18} color={colors.gold} />
        ) : null}
      </Pressable>
    );
  }

  const { t, i18n } = useTranslation();
  const [headerItems, setHeaderItems] = useState<PublicMenuItemDto[]>([]);
  const [footerItems, setFooterItems] = useState<PublicMenuItemDto[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const webOrigin = useMemo(() => getPublicWebUrl(), []);
  const locale = i18n.language;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, f, s] = await Promise.all([
        navigationApi.listHeaderMenu(locale),
        navigationApi.listFooterMenu(locale),
        navigationApi.listFooterSections(locale),
      ]);
      setHeaderItems(h);
      setFooterItems(f);
      setFooterSections(s);
    } catch {
      setError(t('navigation.loadError'));
      setHeaderItems([]);
      setFooterItems([]);
      setFooterSections([]);
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    load();
  }, [load]);

  const navigateItem = useCallback(
    (item: PublicMenuItemDto) => {
      const href = ((item.href ?? item.url) || '').trim();
      const childList = item.children?.filter(Boolean) ?? [];
      const hasChildren = childList.length > 0;

      if (!href && hasChildren) {
        setExpanded((e) => {
          const open = e[item.id] !== false;
          return { ...e, [item.id]: !open };
        });
        return;
      }

      if (!href) return;

      const target = resolveMenuLink(href, locale, webOrigin);
      if (!target) return;

      if (target.kind === 'expo') {
        router.push(target.path as Parameters<typeof router.push>[0]);
        return;
      }

      router.push({
        pathname: '/webview/index',
        params: {
          url: encodeURIComponent(target.url),
          title: item.title ?? '',
        },
      } as any);
    },
    [locale, webOrigin],
  );

  const renderBranch = (nodes: PublicMenuItemDto[], depth: number): React.ReactNode[] => {
    return nodes.flatMap((node) => {
      const children = node.children?.filter(Boolean) ?? [];
      const hasChildren = children.length > 0;
      const href = ((node.href ?? node.url) || '').trim();
      const isOpen = expanded[node.id] !== false;

      const row = (
        <MenuRow
          key={node.id}
          title={node.title || '—'}
          depth={depth}
          hasChildren={hasChildren}
          expanded={isOpen}
          navigable={Boolean(href)}
          onPress={() => navigateItem(node)}
        />
      );

      const childRows = hasChildren && isOpen ? renderBranch(children, depth + 1) : [];

      return [row, ...childRows];
    });
  };

  const renderFooter = () => {
    if (!footerSections.length || !footerItems.length) return null;
    return (
      <>
        <View style={styles.footerDivider} />
        <Text style={styles.footerSectionLabel}>{t('navigation.siteLinks')}</Text>
        {footerSections.map((sec) => {
          const links = footerItems
            .filter((i) => i.section_id === sec.id)
            .sort((a, b) => (a.position ?? a.order_num ?? 0) - (b.position ?? b.order_num ?? 0));
          if (!links.length) return null;
          return (
            <View key={sec.id}>
              <Text style={styles.footerColumnTitle}>{sec.title || sec.slug}</Text>
              {links.map((item) => (
                <MenuRow
                  key={item.id}
                  title={item.title || '—'}
                  depth={0}
                  hasChildren={false}
                  expanded={false}
                  navigable
                  onPress={() => navigateItem(item)}
                />
              ))}
            </View>
          );
        })}
      </>
    );
  };

  const emptyNav = headerItems.length === 0 && footerItems.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('navigation.menuTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.gold} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errText}>{error}</Text>
            <Pressable style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>{t('common.tryAgain')}</Text>
            </Pressable>
          </View>
        ) : emptyNav ? (
          <View style={styles.center}>
            <Text style={styles.errText}>{t('navigation.empty')}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {headerItems.length > 0 ? renderBranch(headerItems, 0) : null}
            {renderFooter()}
            <View style={styles.footerDivider} />
            <Text style={styles.footerSectionLabel}>{t('menu.appSection')}</Text>
            <MenuRow
              title={t('menu.aboutSupport')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/info' as any)}
            />
            <MenuRow
              title={t('menu.astrologerReport')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/karne' as any)}
            />
            <MenuRow
              title={t('menu.celebrities')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/unluler' as any)}
            />
            <MenuRow
              title={t('menu.blog')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/blog' as any)}
            />
            <MenuRow
              title={t('menu.becomeConsultant')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/become-consultant' as any)}
            />
            <MenuRow
              title={t('menu.legalPrivacy')}
              depth={0}
              hasChildren={false}
              expanded={false}
              navigable
              onPress={() => router.push('/legal' as any)}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
