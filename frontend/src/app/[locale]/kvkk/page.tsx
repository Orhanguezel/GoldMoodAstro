import LegalCmsPage from '@/components/containers/legal/LegalCmsPage';

export const revalidate = 300;

export default async function KvkkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = 'tr' } = await params;
  return <LegalCmsPage locale={locale} moduleKey="kvkk" fallbackTitle="KVKK Aydınlatma Metni" />;
}
