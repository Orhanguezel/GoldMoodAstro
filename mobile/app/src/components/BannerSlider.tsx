import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Linking,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function buildScreenStyles(t: AppTheme, sliderWidth: number) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    bannerWrap: {
      width: sliderWidth,
      height: 160,
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.inkDeep,
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
      fontSize: 22,
      fontFamily: font.display,
      marginBottom: 4,
      lineHeight: 28,
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
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.line,
    },
    dotActive: {
      width: 18,
      backgroundColor: colors.gold,
    },
  });
}

interface Props {
  placement: BannerPlacement;
  style?: StyleProp<ViewStyle>;
}

export function BannerSlider({ placement, style }: Props) {
  const { i18n } = useTranslation();
  const { isPremium, loading: premiumLoading } = usePremium();
  const { isAuthenticated, authHydrating } = useAuth();
  const theme = useAppTheme();
  const { colors } = theme;
  const sliderWidth = SCREEN_WIDTH - theme.spacing.lg * 2;
  const styles = useMemo(() => buildScreenStyles(theme, sliderWidth), [theme, sliderWidth]);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (authHydrating || premiumLoading) return;
    setLoading(true);
    loadBanners();
  }, [placement, i18n.language, authHydrating, isAuthenticated, isPremium]);

  useEffect(() => {
    if (banners.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * sliderWidth, animated: true });
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, sliderWidth]);

  const loadBanners = async () => {
    try {
      const data = await bannersApi.list({
        placement,
        locale: i18n.language,
      });
      setBanners(data);
    } catch (e) {
      logger.error('BannerSlider error:', e);
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

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / sliderWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (premiumLoading || isPremium) return null;
  if (loading || banners.length === 0) return null;

  const locale = i18n.language;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={sliderWidth}
        snapToAlignment="center"
      >
        {banners.map((banner) => {
          const title = locale === 'tr' ? banner.title_tr || banner.code : banner.title_en || banner.code;
          const subtitle = locale === 'tr' ? banner.subtitle_tr : banner.subtitle_en;
          const cta = locale === 'tr' ? banner.cta_label_tr : banner.cta_label_en;
          const imageUrl = banner.image_url_mobile || banner.image_url;

          return (
            <Pressable
              key={banner.id}
              style={({ pressed }) => [styles.bannerWrap, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={() => handlePress(banner)}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(26, 23, 21, 0.9)']} style={styles.overlay}>
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
        })}
      </ScrollView>

      {banners.length > 1 ? (
        <View style={styles.pagination}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
