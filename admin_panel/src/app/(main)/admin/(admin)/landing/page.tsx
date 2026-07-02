import ContentModuleClient from '@/app/(main)/admin/_components/common/ContentModuleClient';

export const metadata = {
  title: 'Landing Sayfaları | GoldMoodAstro Admin',
};

export default function Page() {
  return (
    <ContentModuleClient
      moduleKeys={['landing']}
      title="Landing Sayfaları"
      description="Tarot, kahve falı, rüya tabiri, numeroloji, yıldızname, doğum haritası, sinastri ve fiyatlandırma landing içeriklerini çok dilli düzenleyin."
      eyebrow="İçerik Yönetimi"
      emptyLabel="Henüz landing sayfası yok. Seed çalıştırıldığında 8 sayfa burada görünür."
      formEditTitle="Landing Sayfasını Düzenle"
      storageFolder="landing"
      slugEditable={false}
      allowCreate={false}
    />
  );
}
