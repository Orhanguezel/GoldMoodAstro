import React from 'react';
import {
  IconActivity,
  IconHeart,
  IconMoon,
  IconSmile,
  IconSun,
  IconZap,
} from '@/components/ui/icons';

type ServiceIconProps = {
  label: string;
  size?: number;
};

export function ServiceIcon({ label, size = 40 }: ServiceIconProps) {
  const t = (label || '').toLowerCase();

  if (/sport|sports|spor|athlet|athletik|deep\s*tissue|tiefen|tiefengewebe/.test(t))
    return <IconActivity size={size} />;
  if (/relax|relaxing|entspann|calm|ruhe|anti\s*stress|stress|stres/.test(t))
    return <IconMoon size={size} />;
  if (/thai|thaimassage|shiatsu|reflex|reflexzonen|fuß|fuss|foot|ayak/.test(t))
    return <IconZap size={size} />;
  if (/aroma|aromatherapy|aroma\s*therap|öl|oel|oil/.test(t)) return <IconHeart size={size} />;
  if (/hot\s*stone|stone|taş|tas|stein/.test(t)) return <IconSun size={size} />;
  if (/face|gesicht|yüz|yuz|beauty|kosmetik|cosmetic/.test(t)) return <IconSmile size={size} />;

  return <IconHeart size={size} />;
}
