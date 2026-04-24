'use client';

import { useMemo } from 'react';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { safeStr, safeJson } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';

import ContactForm from './ContactForm';

// ── Types ──

type ContactInfo = Partial<{
  companyName: string;
  phones: string[];
  email: string;
  address: string;
  addressSecondary: string;
  whatsappNumber: string;
  website: string;
  notes: string;
}>;

// ── Helpers ──

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => safeStr(x)).filter(Boolean);
  return [];
}

function buildMailto(email: string, subject?: string) {
  const e = safeStr(email);
  if (!e) return '';
  const s = safeStr(subject);
  return `mailto:${encodeURIComponent(e)}${s ? `?subject=${encodeURIComponent(s)}` : ''}`;
}

// ── Component ──

export default function ContactPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_contact', locale as any);

  const t = useMemo(
    () => ({
      subprefix: safeStr(ui('ui_contact_subprefix', 'Energetische Massage')),
      sublabel: safeStr(ui('ui_contact_sublabel', 'Contact')),
      titleLeft: safeStr(ui('ui_contact_title_left', 'Contact')),
      tagline: safeStr(
        ui(
          'ui_contact_tagline',
          'For questions and appointment requests, send a message. Sessions are arranged after a short pre-chat and consent.',
        ),
      ),

      formTitle: safeStr(ui('ui_contact_form_title', 'Send a message')),
      firstName: safeStr(ui('ui_contact_first_name', 'First name*')),
      lastName: safeStr(ui('ui_contact_last_name', 'Last name')),
      phone: safeStr(ui('ui_contact_phone', 'Phone*')),
      email: safeStr(ui('ui_contact_email', 'Email*')),
      subject: safeStr(ui('ui_contact_subject_label', 'Subject*')),
      message: safeStr(ui('ui_contact_message_label', 'Message*')),
      messagePh: safeStr(ui('ui_contact_message_placeholder', 'Write your message...')),

      topicLabel: safeStr(ui('ui_contact_select_label', 'Topic')),
      topicAppointment: safeStr(ui('ui_contact_service_cooling_towers', 'Appointment request')),
      topicQuestion: safeStr(ui('ui_contact_service_maintenance', 'Question')),
      topicCollab: safeStr(ui('ui_contact_service_modernization', 'Collaboration')),
      topicOther: safeStr(ui('ui_contact_service_other', 'Other')),

      termsPrefix: safeStr(ui('ui_contact_terms_prefix', 'I agree to the:')),
      terms: safeStr(ui('ui_contact_terms', 'Privacy Policy')),
      conditions: safeStr(ui('ui_contact_conditions', 'Terms')),

      submit: safeStr(ui('ui_contact_submit', 'Send')),
      sending: safeStr(ui('ui_contact_sending', 'Sending...')),
      success: safeStr(ui('ui_contact_success', 'Thanks! Your message has been sent.')),
      errorGeneric: safeStr(ui('ui_contact_error_generic', 'Failed to send. Please try again.')),

      errRequired: safeStr(ui('ui_contact_error_required', 'This field is required.')),
      errEmail: safeStr(ui('ui_contact_error_email', 'Please enter a valid email address.')),
      errPhone: safeStr(ui('ui_contact_error_phone', 'Please enter a valid phone number.')),
      errMinMessage: safeStr(
        ui('ui_contact_error_message', 'Please write a message (at least 10 characters).'),
      ),

      subjectBase: safeStr(ui('ui_contact_subject_base', 'Contact Message')),
      addressLabel: safeStr(ui('ui_contact_address_label', 'Address')),
      mapTitle: safeStr(ui('ui_contact_map_title', 'Location')),
      infoTitle: safeStr(ui('ui_contact_info_title', 'Contact info')),
      infoNoteTitle: safeStr(ui('ui_contact_info_note_title', 'Note')),
    }),
    [ui],
  );

  // ── Contact info (localized) ──
  const { data: contactInfoRaw } = useGetSiteSettingByKeyQuery({
    key: 'contact_info',
    locale,
  } as any);

  const contactInfo = useMemo<ContactInfo>(() => {
    const v = (contactInfoRaw as any)?.value ?? contactInfoRaw;
    return safeJson<ContactInfo>(v, {} as ContactInfo);
  }, [contactInfoRaw]);

  const phones = useMemo(() => asArray(contactInfo?.phones), [contactInfo]);
  const primaryPhone = phones[0] || '';
  const emailTo = safeStr(contactInfo?.email);
  const address = safeStr(contactInfo?.address);
  const address2 = safeStr(contactInfo?.addressSecondary);
  const notes = safeStr(contactInfo?.notes);

  // ── Map config (localized) ──
  const { data: mapRaw } = useGetSiteSettingByKeyQuery({ key: 'contact_map', locale } as any);

  const mapCfg = useMemo(() => {
    const v = (mapRaw as any)?.value ?? mapRaw;
    const parsed = safeJson<any>(v, {});
    return {
      title: safeStr(parsed.title) || t.mapTitle,
      height: Number(parsed.height) || 420,
      embed_url: safeStr(parsed.embed_url),
    };
  }, [mapRaw, t.mapTitle]);

  return (
    <section className="bg-bg-primary py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sol: Bilgi + Harita */}
          <div className="lg:col-span-5">
            <div className="mb-8">
              <div className="text-sm font-normal uppercase tracking-[0.2em] text-brand-primary mb-3">
                <span>{t.subprefix}</span>{' '}
                <span className="text-text-muted">{t.sublabel}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-4">
                {t.titleLeft}
              </h2>
              <p className="text-text-secondary leading-relaxed">{t.tagline}</p>
            </div>

            {/* İletişim bilgileri */}
            <div className="bg-bg-secondary shadow-soft border border-border-light p-6 mb-8">
              <h3 className="text-lg font-light font-serif text-text-primary mb-4">
                {t.infoTitle}
              </h3>

              <div className="space-y-3 text-sm text-text-secondary">
                {primaryPhone && (
                  <div>
                    <strong className="text-text-primary">{t.phone}:</strong>{' '}
                    <a className="text-brand-primary hover:underline" href={`tel:${primaryPhone}`}>
                      {primaryPhone}
                    </a>
                  </div>
                )}

                {emailTo && (
                  <div>
                    <strong className="text-text-primary">{t.email}:</strong>{' '}
                    <a className="text-brand-primary hover:underline" href={buildMailto(emailTo)}>
                      {emailTo}
                    </a>
                  </div>
                )}

                {address && (
                  <div>
                    <strong className="text-text-primary">{t.addressLabel}:</strong>{' '}
                    <span>{address}</span>
                    {address2 && <span className="block">{address2}</span>}
                  </div>
                )}

                {notes && (
                  <div className="pt-3 border-t border-border-light">
                    <strong className="text-text-primary">{t.infoNoteTitle}:</strong>
                    <div className="mt-1">{notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Harita */}
            {mapCfg.embed_url && (
              <div className="bg-bg-secondary shadow-soft border border-border-light overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light">
                  <h3 className="text-lg font-light font-serif text-text-primary">{mapCfg.title}</h3>
                </div>
                <iframe
                  title={mapCfg.title}
                  src={mapCfg.embed_url}
                  height={mapCfg.height}
                  className="w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Sağ: Form */}
          <div className="lg:col-span-7">
            <ContactForm locale={locale} t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}
