import type { Metadata } from 'next';

import Banner from '@/layout/banner/Breadcrum';
import ServiceDetail from '@/components/containers/services/ServiceDetail';
import { fetchPrimaryServicePublic, fetchSeoObject, buildMetadataFromSeo } from '@/seo/server';
import { excerpt, normPath, absUrlJoin, safeStr } from '@/integrations/shared';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const [seo, service] = await Promise.all([
    fetchSeoObject(locale),
    fetchPrimaryServicePublic({ locale }),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/services') });

  if (!service) return base;

  const pageTitle =
    safeStr(service.meta_title) || safeStr(service.name) || 'Energetische Entspannungsmassage';
  const pageDescription = excerpt(
    safeStr(service.meta_description) || safeStr(service.description),
    180,
  );
  const imageRaw =
    safeStr((service as any)?.featured_image_url) ||
    safeStr(service.image_url) ||
    safeStr(service.featured_image);
  const baseUrl = base.metadataBase?.toString() || '';
  const imageAbs = imageRaw ? absUrlJoin(baseUrl, imageRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(imageAbs ? { images: [{ url: imageAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(imageAbs ? { images: [imageAbs] } : {}),
    },
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  const service = await fetchPrimaryServicePublic({ locale });

  const title = safeStr(service?.name) || 'Energetische Entspannungsmassage';
  const slug = safeStr(service?.slug);

  return (
    <>
      <Banner title={title} />
      {slug ? (
        <ServiceDetail forcedSlug={slug} hideBackLink />
      ) : (
        <section className="py-20 text-center text-text-secondary">
          Der Service wird gerade vorbereitet.
        </section>
      )}
    </>
  );
}
