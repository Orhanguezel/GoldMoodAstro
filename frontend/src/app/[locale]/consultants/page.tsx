import type { Metadata } from 'next';

import ConsultantList from '@/components/containers/consultant/ConsultantList';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ expertise?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'tr' ? 'Danışmanlar' : 'Consultants',
    description:
      locale === 'tr'
        ? 'Uzman danışmanları keşfedin, filtreleyin ve müsait seanslardan randevu alın.'
        : 'Explore expert consultants, filter by expertise, and book an available session.',
  };
}

export default async function ConsultantsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};

  return (
    <main className="min-h-screen py-20" style={{ padding: '5rem 4%' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <span className="section-label">{locale === 'tr' ? 'Uzman Danışmanlar' : 'Expert Consultants'}</span>
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-text mt-2">
            {locale === 'tr' ? 'Danışmanları Keşfet' : 'Explore Consultants'}
          </h1>
          <p className="text-text-muted mt-2 text-sm">
            {locale === 'tr'
              ? 'Astroloji, tarot, numeroloji ve daha fazlasında onaylı uzmanlar.'
              : 'Verified experts in astrology, tarot, numerology and more.'}
          </p>
        </div>

        <ConsultantList locale={locale} initialExpertise={sp.expertise || ''} />
      </div>
    </main>
  );
}
