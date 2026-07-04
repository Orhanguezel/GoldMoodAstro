import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Linking,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import { bannersApi } from '@/lib/api';
import { Banner, BannerPlacement } from '@/types';
import { useTranslation } from 'react-i18next';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

import { logger } from '@/lib/logger';
const { width } = Dimensions.get('window');

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: {
      width: width - spacing.lg * 2,
      alignSelf: 'center',
      height: 140,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.inkDeep,
      marginVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: 20,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
    },
    textColumn: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontFamily: font.display,
      marginBottom: 2,
    },
    subtitle: {
      color: colors.goldDim,
      fontSize: 12,
      fontFamily: font.sansMedium,
      letterSpacing: 0.5,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.gold,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    ctaText: {
      color: colors.ink,
      fontSize: 12,
      fontFamily: font.sansBold,
    },
  });
}

interface Props {
  placement: BannerPlacement;
  style?: StyleProp<ViewStyle>;
}

export function BannerWidget({ placement, style }: Props) {
  const { i18n } = useTranslation();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { isAuthenticated, authHydrating } = useAuth();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authHydrating || premiumLoading) return;
    setLoading(true);
    loadBanners();
  }, [placement, i18n.language, authHydrating, isAuthenticated, isPremium]);

  const loadBanners = async () => {
    try {
      const data = await bannersApi.list({
        placement,
        locale: i18n.language,
      });
      setBanners(data);
    } catch (e) {
      logger.error('BannerWidget error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (banner: Banner) => {
    try {
      await bannersApi.trackClick(banner.id);
    } catch (e) {
      logger.error('Track click error:', e);
    }

    if (banner.link_url) {
      Linking.openURL(banner.link_url).catch((err) => logger.error("Couldn't load page", err));
    }
  };

  if (premiumLoading || isPremium) return null;
  if (loading || banners.length === 0) return null;

  const banner = banners[0];
  const locale = i18n.language;
  const title = locale === 'tr' ? banner.title_tr || banner.code : banner.title_en || banner.code;
  const subtitle = locale === 'tr' ? banner.subtitle_tr : banner.subtitle_en;
  const cta = locale === 'tr' ? banner.cta_label_tr : banner.cta_label_en;
  const imageUrl = banner.image_url_mobile || banner.image_url;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
      onPress={() => handlePress(banner)}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(26, 23, 21, 0.95)']} style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.textColumn}>
            {title ? (
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {cta ? (
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>{cta}</Text>
              <ChevronRight size={14} color={colors.ink} />
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
