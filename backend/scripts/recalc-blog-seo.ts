// Blog içerik güncellemesi sonrası SEO kalite skorlarını yeniden hesaplar.
// Puanlama calculator'ına DOKUNMAZ — sadece güncel içeriğe göre skoru tazeler.
// Çalıştırma: backend/ içinde `bun scripts/recalc-blog-seo.ts`
import { recalculateScores } from '@goldmood/shared-backend/modules/seoQuality';

const res = await recalculateScores({ type: 'custom_page' });
console.log('SEO recalc (custom_page) tamam:', JSON.stringify(res)?.slice(0, 300));
process.exit(0);
