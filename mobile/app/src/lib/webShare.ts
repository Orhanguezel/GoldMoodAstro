// Mobil paylaşım linkleri: kullanıcının dilindeki kanonik web adresi.
// Slug tablosu web ile ortak (@goldmood/shared-config/publicRoutes); sabit
// `/tr/...` veya İngilizce burç slug'ı 3xx'e düşüyordu (2026-10-03).
import {
  toLocalizedPublicPath,
  toPublicRouteLocale,
} from '@goldmood/shared-config/publicRoutes';
import { getPublicWebUrl } from '@/lib/api';
import { i18n } from '@/lib/i18n';
import { mobileBrandConfig } from '@/config/brand';

/** `/kahve-fali/result/:id` gibi mantıksal yoldan UTM'li paylaşım URL'i. */
export function webShareUrl(logicalPath: string, campaign: string, locale: string = i18n.language): string {
  const lc = toPublicRouteLocale(locale);
  const params = new URLSearchParams({
    utm_source: 'mobile_app',
    utm_medium: 'social_share',
    utm_campaign: campaign,
  });
  return `${getPublicWebUrl()}/${lc}${toLocalizedPublicPath(lc, logicalPath)}?${params.toString()}`;
}

/** Paylaşım metinlerindeki {{brand}} — marka koddan değil yapılandırmadan gelir. */
export function shareBrand(): string {
  return mobileBrandConfig.appName;
}
