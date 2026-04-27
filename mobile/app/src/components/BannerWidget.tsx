import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  Dimensions, 
  Linking,
  ActivityIndicator
} from 'react-native';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { bannersApi } from '@/lib/api';
import { Banner, BannerPlacement } from '@/types';
import { useTranslation } from 'react-i18next';

interface Props {
  placement: BannerPlacement;
  style?: any;
}

const { width } = Dimensions.get('window');

export function BannerWidget({ placement, style }: Props) {
  const { i18n } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, [placement, i18n.language]);

  const loadBanners = async () => {
    try {
      const data = await bannersApi.list({ 
        placement, 
        locale: i18n.language 
      });
      setBanners(data);
    } catch (e) {
      console.error('BannerWidget error:', e);
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

  if (loading || banners.length === 0) return null;

  // For now, just show the first one in the list for a widget
  const banner = banners[0];
  const locale = i18n.language;
  const title = locale === 'tr' ? (banner.title_tr || banner.code) : (banner.title_en || banner.code);
  const subtitle = locale === 'tr' ? banner.subtitle_tr : banner.subtitle_en;
  const cta = locale === 'tr' ? banner.cta_label_tr : banner.cta_label_en;
  const imageUrl = banner.image_url_mobile || banner.image_url;

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container, 
        { opacity: pressed ? 0.9 : 1 },
        style
      ]}
      onPress={() => handlePress(banner)}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.content}>
          {title && <Text style={styles.title} numberOfLines={2}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          
          {cta && (
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>{cta}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - (spacing.md * 2),
    alignSelf: 'center',
    aspectRatio: 2.5, // Slimmer for mobile
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgDeep,
    ...shadows.card,
    marginVertical: spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  content: {
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontFamily: font.displayBold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: font.sans,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: font.sansBold,
  },
});
