import SeoQualityDetailClient from '../../_components/seo-quality-detail-client';

export const metadata = {
  title: 'SEO Analizi | GoldMoodAstro Admin',
};

export default async function SeoQualityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  return <SeoQualityDetailClient type={p.type} id={p.id} locale={sp.locale || 'tr'} />;
}
