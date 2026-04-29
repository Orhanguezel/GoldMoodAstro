import React, { useEffect, useState, useRef } from 'react';
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
  NativeSyntheticEvent
} from 'react-native';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { bannersApi } from '@/lib/api';
import { Banner, BannerPlacement } from '@/types';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - (spacing.lg * 2);

interface Props {
  placement: BannerPlacement;
  style?: any;
}

export function BannerSlider({ placement, style }: Props) {
  const { i18n } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadBanners();
  }, [placement, i18n.language]);

  useEffect(() => {
    if (banners.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * SLIDER_WIDTH, animated: true });
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const data = await bannersApi.list({ 
        placement, 
        locale: i18n.language 
      });
      setBanners(data);
    } catch (e) {
      console.error('BannerSlider error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (banner: Banner) => {
    try {
      await bannersApi.trackClick(banner.id);
    } catch (e) {
      console.error('Track click error:', e);
    }

    if (banner.link_url) {
      Linking.openURL(banner.link_url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SLIDER_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

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
        snapToInterval={SLIDER_WIDTH}
        snapToAlignment="center"
      >
        {banners.map((banner, index) => {
          const title = locale === 'tr' ? (banner.title_tr || banner.code) : (banner.title_en || banner.code);
          const subtitle = locale === 'tr' ? banner.subtitle_tr : banner.subtitle_en;
          const cta = locale === 'tr' ? banner.cta_label_tr : banner.cta_label_en;
          const imageUrl = banner.image_url_mobile || banner.image_url;

          return (
            <Pressable 
              key={banner.id}
              style={({ pressed }) => [
                styles.bannerWrap, 
                { transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
              onPress={() => handlePress(banner)}
            >
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.image} 
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(26, 23, 21, 0.9)']}
                style={styles.overlay}
              >
                <View style={styles.content}>
                  <View style={styles.textColumn}>
                    {title && <Text style={styles.title} numberOfLines={2}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                  </View>
                  
                  {cta && (
                    <View style={styles.ctaButton}>
                      <Text style={styles.ctaText}>{cta}</Text>
                      <ChevronRight size={14} color={colors.bgDeep} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                activeIndex === i && styles.dotActive
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  bannerWrap: {
    width: SLIDER_WIDTH,
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
    color: colors.bgDeep,
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
