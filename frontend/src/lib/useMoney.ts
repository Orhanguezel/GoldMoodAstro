'use client';
// =============================================================
// FILE: src/lib/useMoney.ts
//
// Fiyat formatlayıcı hook — kur ayarını site_settings'ten okur, ziyaretçinin
// diline göre ₺ veya € basar. Backend ödeme oturumunu AYNI ayarla çevirdiği
// için ekrandaki tutar ile tahsil edilen tutar birbirini tutar.
// =============================================================
import { useCallback, useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/public/site_settings.endpoints';
import {
  DEFAULT_CURRENCY_CONFIG,
  displayCurrencyFor,
  formatMoney,
  parseCurrencyConfig,
  type CurrencyConfig,
} from './money';

export function useCurrencyConfig(): CurrencyConfig {
  const { data } = useGetSiteSettingByKeyQuery({ key: 'platform_currency', locale: '*' });
  return useMemo(() => {
    if (data?.value === undefined || data?.value === null || data?.value === '') {
      return DEFAULT_CURRENCY_CONFIG;
    }
    return parseCurrencyConfig(data.value);
  }, [data?.value]);
}

/**
 * `money(amountTRY)` → ziyaretçinin para biriminde formatlı metin.
 * `currency` → o an gösterilen para birimi kodu (rozet/etiket için).
 */
export function useMoney(locale?: string) {
  const config = useCurrencyConfig();
  const money = useCallback(
    (amount: string | number | null | undefined, opts?: { decimals?: number }) =>
      formatMoney(amount, locale, config, opts),
    [config, locale],
  );
  return { money, currency: displayCurrencyFor(locale, config), config };
}
