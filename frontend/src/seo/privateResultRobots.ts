import type { Metadata } from 'next';

/**
 * Kişiye özel okuma/sonuç sayfaları (tarot, kahve falı, rüya, yıldızname,
 * sinastri) indekslenmez. Bu sayfalar paylaşım linkiyle açık kalır ama ad,
 * soru veya doğum bilgisi taşıyabilir; 2026-10-03'e kadar `index, follow`
 * idi ve EN/DE kanonik adresleri robots.txt'ye de takılmıyordu.
 */
export const PRIVATE_RESULT_ROBOTS: Metadata['robots'] = { index: false, follow: true };
