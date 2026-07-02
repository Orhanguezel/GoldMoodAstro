import ContentModuleClient from '@/app/(main)/admin/_components/common/ContentModuleClient';

const STATIC_PAGE_MODULES = [
  'about',
  'faq',
  'privacy',
  'privacy_notice',
  'terms',
  'kvkk',
  'legal_notice',
  'cookies',
  'editorial_policy',
  'consultant_agreement',
  'consultant_agreement_v1',
  'payout_faq',
];

export const metadata = {
  title: 'İçerik ve Hukuki Sayfalar | GoldMoodAstro Admin',
};

export default function Page() {
  return (
    <ContentModuleClient
      moduleKeys={STATIC_PAGE_MODULES}
      title="İçerik / Hukuki Sayfalar"
      description="Hakkımızda, SSS, KVKK, gizlilik, kullanım şartları, danışman sözleşmesi ve ödeme bilgilendirme sayfalarını tr/en/de düzenleyin."
      eyebrow="İçerik Yönetimi"
      newLabel="Yeni Sayfa"
      emptyLabel="Henüz statik veya hukuki sayfa yok."
      formNewTitle="Yeni İçerik Sayfası"
      formEditTitle="İçerik Sayfasını Düzenle"
      storageFolder="pages"
      aiCaution="Hukuki/statik içeriklerde mevcut hukuki anlamı koru; yeni hüküm, taahhüt, süre, oran veya sorumluluk uydurma. Yalnız biçim, açıklık, başlık ve okunabilirliği iyileştir."
    />
  );
}
