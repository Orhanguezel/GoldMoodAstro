import { Metadata, ResolvingMetadata } from 'next';
import YildiznameResultClient from './YildiznameResultClient';
import { fetchYildiznameReading } from './fetchYildizname.server';

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id, locale } = await params;
  const result = await fetchYildiznameReading(id);

  if (!result) {
    return {
      title: 'Yıldızname Sonucu — GoldMoodAstro',
    };
  }

  const name = result.name;
  const menzil = result.menzil?.name_tr || '';

  const ogImageUrl = `https://goldmoodastro.com/${locale}/yildizname/result/${id}/opengraph-image`;

  return {
    title: `${name} İçin Yıldızname Analizi: ${menzil} — GoldMoodAstro`,
    description: result.result_text?.substring(0, 160) + '...',
    openGraph: {
      title: `${name}'in Yıldızname Menzili: ${menzil}`,
      description: `Ebced hesabı ile ${name} için hazırlanan özel yıldızname analizi.`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: name }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} İçin Yıldızname Analizi`,
      description: `${menzil} menzili analizi.`,
      images: [ogImageUrl],
    },
  };
}

export default async function YildiznameResultPage({ params }: Props) {
  await params; // Next.js 16 — params is a Promise even when unused
  return (
    <main className="min-h-screen bg-bg-deep pt-32 pb-20 px-4">
      <YildiznameResultClient />
    </main>
  );
}
