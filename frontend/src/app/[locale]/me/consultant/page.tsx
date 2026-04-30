import type { Metadata } from 'next';
import ConsultantDashboard from '@/components/containers/consultant-dashboard/ConsultantDashboard';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Danışman Paneli' : 'Consultant Dashboard',
    robots: { index: false, follow: false },
  };
}

export default async function ConsultantDashboardPage({ params }: Props) {
  const { locale } = await params;
  return <ConsultantDashboard locale={locale} />;
}
