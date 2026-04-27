import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  Dimensions, 
  Linking,
} from 'react-native';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { bannersApi } from '@/lib/api';
import { Banner, BannerPlacement } from '@/types';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

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
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        style
      ]}
      onPress={() => handlePress(banner)}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(26, 23, 21, 0.95)']}
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
}

const styles = StyleSheet.create({
  container: {
    width: width - (spacing.lg * 2),
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
    color: colors.bgDeep,
    fontSize: 12,
    fontFamily: font.sansBold,
  },
});
