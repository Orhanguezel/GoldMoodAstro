import React from 'react';
import ZodiacHub from '@/components/containers/zodiac/ZodiacHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar',
    pathname: '/burclar',
    fallback: {
      title: 'Burçlar ve Özellikleri — GoldMoodAstro',
      description: '12 burcun detaylı özellikleri, karakter analizleri, elementleri ve yönetici gezegenleri. Burcunuzun gizli dünyasını keşfedin.',
    },
  });
}

export default function BurclarPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <ZodiacHub />
    </main>
  );
}
