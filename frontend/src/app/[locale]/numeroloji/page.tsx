import React from 'react';
import NumerologyHub from '@/components/containers/numerology/NumerologyHub';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ücretsiz Numeroloji Analizi — İsim ve Kader Sayısı Hesaplama — GoldMoodAstro',
  description: 'İsminizdeki ve doğum tarihinizdeki gizli kodları çözün. Kader sayısı, ruh güdüsü ve hayat yolu analizi ile kendinizi daha yakından tanıyın.',
};

export default function NumerologyPage() {
  return (
    <main className="min-h-screen bg-background pt-20">
      <NumerologyHub />
    </main>
  );
}
