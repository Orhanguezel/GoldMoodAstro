'use client';

import React, { useMemo } from 'react';

import Banner from '@/layout/banner/Breadcrum';
import AppointmentPageContent from '@/components/containers/appointment/AppointmentPageContent';
import GutscheinHomeCta from '@/components/containers/gutschein/GutscheinHomeCta';
import { LayoutSeoBridge } from '@/seo';

import { useLocaleShort, useUiSection } from '@/i18n';
import { isValidUiText } from '@/integrations/shared';
import { safeStr, toCdnSrc } from '@/integrations/shared';

export default function AppointmentPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_appointment', locale as any);

  const fbTitle = useMemo(() => {
    if (locale === 'de') return 'Termin buchen';
    if (locale === 'tr') return 'Randevu Al';
    return 'Book Appointment';
  }, [locale]);

  const bannerTitle = useMemo(() => {
    const key = 'ui_appointment_page_title';
    const v = safeStr(ui(key, ''));
    return isValidUiText(v, key) ? v : fbTitle;
  }, [ui, fbTitle]);

  const pageTitle = useMemo(() => {
    const key = 'ui_appointment_meta_title';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;
    return `${bannerTitle || fbTitle} | Energetische Massage`;
  }, [ui, bannerTitle, fbTitle]);

  const pageDescription = useMemo(() => {
    const key = 'ui_appointment_meta_description';
    const v = safeStr(ui(key, ''));
    if (isValidUiText(v, key)) return v;

    const key2 = 'ui_appointment_page_lead';
    const d = safeStr(ui(key2, ''));
    if (isValidUiText(d, key2)) return d;

    if (locale === 'de')
      return 'Terminanfrage: Therapeutin wählen, Datum und Uhrzeit auswählen und Anfrage senden. Sitzungen nach Vereinbarung.';
    if (locale === 'tr')
      return 'Randevu talebi oluşturun: terapist seçin, tarih ve saat belirleyin ve talebinizi gönderin.';
    return 'Request an appointment: choose a therapist, pick a date and time, and submit your request.';
  }, [ui, locale]);

  const ogImageOverride = useMemo(() => {
    const key = 'ui_appointment_og_image';
    const raw = safeStr(ui(key, ''));
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    return toCdnSrc(raw, 1200, 630, 'fill') || raw;
  }, [ui]);

  return (
    <>
      <LayoutSeoBridge
        title={pageTitle}
        description={pageDescription}
        ogImage={ogImageOverride}
        noindex={false}
      />

      <Banner title={bannerTitle} />
      <AppointmentPageContent />

      <section className="w-full bg-brand-light py-16">
        <div className="container mx-auto px-4">
          <GutscheinHomeCta locale={locale || undefined} />
        </div>
      </section>
    </>
  );
}
