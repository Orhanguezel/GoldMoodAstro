'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useListServicesPublicQuery } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath, safeStr, SERVICE_FALLBACK_IMG, toCdnSrc, isValidImageSrc, excerpt } from '@/integrations/shared';

const FEATURES: Record<string, string[]> = {
  de: ['Ganzkörperbehandlung', 'Energetische Ausrichtung', 'Hausbesuch', 'Mindestens 120 Min.', 'Achtsame Berührung', 'Individuell angepasst'],
  en: ['Full body treatment', 'Energetic alignment', 'Home visit', 'At least 120 min.', 'Mindful touch', 'Individually adapted'],
  tr: ['Tüm vücut uygulaması', 'Enerjetik hizalama', 'Ev ziyareti', 'En az 120 dk.', 'Bilinçli dokunuş', 'Bireysel uyarlama'],
};

const ServiceSection: React.FC<{ locale?: string }> = ({ locale: explicitLocale }) => {
  const locale = useLocaleShort(explicitLocale);
  const { ui } = useUiSection('ui_services', locale as any);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useListServicesPublicQuery({
    locale, limit: 1, order: 'display_order.asc',
  } as any, { skip: !mounted });

  const service = useMemo(() => {
    const items = Array.isArray((data as any)?.items) ? ((data as any).items as any[]) : [];
    const s = items[0];
    if (!s) {
      if (isLoading) return null;
      return { id: 'ph-1', title: ui('ui_services_placeholder_title', 'Energetische Massage'), summary: '', slug: '', src: SERVICE_FALLBACK_IMG };
    }
    const imgBase = safeStr(s?.featured_image_url) || safeStr(s?.image_url) || safeStr(s?.featured_image);
    const title = safeStr(s?.title) || safeStr(s?.name) || 'Energetische Massage';
    const rawSummary = safeStr(s?.summary) || safeStr(s?.short_description) || safeStr(s?.description);
    const summary = rawSummary ? excerpt(rawSummary, 240) : '';
    let srcCandidate = imgBase ? (toCdnSrc(imgBase, 800, 600, 'fill') || imgBase) : '';
    const finalSrc = isValidImageSrc(srcCandidate) ? srcCandidate : SERVICE_FALLBACK_IMG;
    return { id: safeStr(s?.id) || 's-1', title, summary, slug: safeStr(s?.slug), src: finalSrc };
  }, [data, ui, isLoading]);

  const href = service?.slug
    ? localizePath(locale, `/services/${encodeURIComponent(service.slug)}`)
    : localizePath(locale, '/services');

  const features = FEATURES[locale || 'de'] || FEATURES.de;

  return (
    <section className="bg-bg-secondary py-28 lg:py-36" style={{ padding: '7rem 4%' }}>
      {/* Header */}
      <div className="text-center max-w-[600px] mx-auto mb-16 reveal">
        <span className="section-label">{ui('ui_services_sublabel', 'Leistungen')}</span>
        <h2 className="font-serif text-[clamp(2rem,4vw,3.4rem)] font-light leading-[1.2] mb-5">
          {ui('ui_services_title', 'Energetische Entspannungsmassage')}
        </h2>
        <p className="text-text-secondary font-light leading-[1.8] text-base max-w-[560px] mx-auto">
          {service?.summary || ui('ui_services_desc',
            locale === 'de' ? 'Energetische Massage verbindet klassische Techniken mit energetischer Koerperarbeit. Durch achtsame Beruehrung bei Ihnen zu Hause.'
            : locale === 'tr' ? 'Enerjetik masaj, klasik teknikleri enerjetik beden calismasi ile birlestirir. Evinizde bilincli dokunusla.'
            : 'Energetic massage combines classical techniques with energetic bodywork. Through mindful touch at your home.'
          )}
        </p>
      </div>

      {/* Service Showcase Card */}
      <div className="max-w-[1300px] mx-auto">
        {(!mounted || (isLoading && !service)) ? (
          <div className="bg-bg-card border border-border-light overflow-hidden reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-80 lg:h-[500px] bg-bg-card-hover animate-pulse" />
              <div className="p-10 lg:p-16 space-y-6">
                <div className="h-10 bg-bg-card-hover rounded w-3/4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 bg-bg-card-hover rounded w-full animate-pulse" />
                  <div className="h-4 bg-bg-card-hover rounded w-5/6 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : service ? (
          <div className="bg-bg-card border border-border-light overflow-hidden transition-all duration-500 hover:border-border-hover reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative h-80 lg:h-[520px] overflow-hidden bg-bg-card-hover">
                <Image
                  src={service.src}
                  alt={service.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                  priority
                />
              </div>

              {/* Content */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <span className="text-[0.7rem] tracking-[0.25em] uppercase text-brand-primary mb-4 flex items-center gap-3">
                  <span className="w-[40px] h-px bg-brand-primary" />
                  {ui('ui_services_sublabel', 'Leistungen')}
                </span>

                <h3 className="font-serif text-[clamp(1.8rem,3vw,2.8rem)] font-light leading-[1.2] mb-6">
                  {service.title}
                </h3>

                {service.summary && (
                  <p className="text-text-secondary font-light leading-[1.8] mb-8">{service.summary}</p>
                )}

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-10">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-text-secondary text-sm font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary flex-shrink-0" />
                      {ui(`ui_services_feature_${i + 1}`, f)}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href={href} className="btn-premium">
                    <span>{ui('ui_services_btn_detail', 'Mehr Erfahren')}</span>
                  </Link>
                  <Link href={localizePath(locale, '/appointment')} className="btn-outline-premium">
                    {ui('ui_services_btn_book', 'Termin Buchen')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ServiceSection;
