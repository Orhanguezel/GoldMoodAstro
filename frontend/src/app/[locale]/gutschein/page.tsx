'use client';

import Banner from '@/layout/banner/Breadcrum';
import GutscheinPageContent from '@/components/containers/gutschein/GutscheinPageContent';
import { LayoutSeoBridge } from '@/seo';
import { useLocaleShort } from '@/i18n';

const META: Record<string, { title: string; description: string; banner: string }> = {
  de: {
    banner: 'Gutscheine',
    title: 'Gutscheine | Energetische Massage',
    description: 'Verschenken Sie Entspannung mit einem Gutschein für unsere Massagen und Wellnessbehandlungen. Festbeträge oder Wunschbetrag wählbar.',
  },
  tr: {
    banner: 'Hediye Çekleri',
    title: 'Hediye Çekleri | Energetische Massage',
    description: 'Masaj ve wellness hizmetlerimiz için hediye çeki alın. Sabit tutarlar veya özel tutar seçeneği.',
  },
  en: {
    banner: 'Gift Vouchers',
    title: 'Gift Vouchers | Energetische Massage',
    description: 'Give the gift of relaxation with a voucher for our massage and wellness treatments. Choose a fixed amount or enter your own.',
  },
};

export default function GutscheinPage() {
  const locale = useLocaleShort() || 'de';
  const meta = META[locale] ?? META['de'];

  return (
    <>
      <LayoutSeoBridge
        title={meta.title}
        description={meta.description}
        noindex={false}
      />
      <Banner title={meta.banner} />
      <GutscheinPageContent />
    </>
  );
}
