import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { BannerSlider } from '@/components/BannerSlider';
import { BannerWidget } from '@/components/BannerWidget';
import { BannerUpsell } from '@/components/BannerUpsell';
import type { BannerPlacement } from '@/types';

type Props = {
  placement: BannerPlacement;
  variant?: 'slider' | 'widget';
  style?: StyleProp<ViewStyle>;
};

/** House-promo slider/widget + free kullanıcı upsell (FAZ 41) */
export function PromoBannerSection({ placement, variant = 'slider', style }: Props) {
  return (
    <View>
      {variant === 'widget' ? (
        <BannerWidget placement={placement} style={style} />
      ) : (
        <BannerSlider placement={placement} style={style} />
      )}
      <BannerUpsell />
    </View>
  );
}
