'use client';

import { useMemo } from 'react';

import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { safeStr, safeJson } from '@/integrations/shared';

import { useLocaleShort, useUiSection } from '@/i18n';
import { useBrand } from '@/hooks/useBrand';
import { Cinzel } from 'next/font/google';
import PageContainer from '@/components/common/PageContainer';
import ContactForm from './ContactForm';

const cinzel = Cinzel({ subsets: ['latin'] });

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

export default function ContactPage() {
  const locale = useLocaleShort();
  const { brand } = useBrand();
  const { ui } = useUiSection('ui_contact', locale as any);

  const t = useMemo(
    () => ({
      subprefix: safeStr(ui('ui_contact_subprefix', brand.name || 'GoldMoodAstro')),
      sublabel: safeStr(ui('ui_contact_sublabel', 'Contact')),
      titleLeft: safeStr(ui('ui_contact_title_left', 'Contact Us')),
      tagline: safeStr(
        ui(
          'ui_contact_tagline',
          'Send us a message for questions and session booking requests. Our team will get back to you shortly.',
        ),
      ),

      formTitle: safeStr(ui('ui_contact_form_title', 'Send a message')),
      firstName: safeStr(ui('ui_contact_first_name', 'Ad*')),
      lastName: safeStr(ui('ui_contact_last_name', 'Soyad')),
      phone: safeStr(ui('ui_contact_phone', 'Telefon*')),
      email: safeStr(ui('ui_contact_email', 'E-posta*')),
      subject: safeStr(ui('ui_contact_subject_label', 'Konu*')),
      message: safeStr(ui('ui_contact_message_label', 'Mesaj*')),
      messagePh: safeStr(ui('ui_contact_message_placeholder', 'Write your message...')),

      topicLabel: safeStr(ui('ui_contact_select_label', 'Konu')),
      topicAppointment: safeStr(ui('ui_contact_service_cooling_towers', 'Booking request')),
      topicQuestion: safeStr(ui('ui_contact_service_maintenance', 'Soru / bilgi')),
      topicCollab: safeStr(ui('ui_contact_service_modernization', 'Collaboration')),
      topicOther: safeStr(ui('ui_contact_service_other', 'Other')),

      termsPrefix: safeStr(ui('ui_contact_terms_prefix', 'Kabul ediyorum:')),
      terms: safeStr(ui('ui_contact_terms', 'Privacy Policy')),
      conditions: safeStr(ui('ui_contact_conditions', 'Terms of Use')),

      submit: safeStr(ui('ui_contact_submit', 'Send')),
      sending: safeStr(ui('ui_contact_sending', 'Sending...')),
      success: safeStr(ui('ui_contact_success', 'Thank you. Your message has been sent.')),
      errorGeneric: safeStr(ui('ui_contact_error_generic', 'Could not send. Please try again.')),

      errRequired: safeStr(ui('ui_contact_error_required', 'Bu alan zorunludur.')),
      errEmail: safeStr(ui('ui_contact_error_email', 'Enter a valid email address.')),
      errPhone: safeStr(ui('ui_contact_error_phone', 'Enter a valid phone number.')),
      errMinMessage: safeStr(
        ui('ui_contact_error_message', 'Write a message with at least 10 characters.'),
      ),

      subjectBase: safeStr(ui('ui_contact_subject_base', 'Contact Message')),
      addressLabel: safeStr(ui('ui_contact_address_label', 'Adres')),
      mapTitle: safeStr(ui('ui_contact_map_title', 'Konum')),
      infoTitle: safeStr(ui('ui_contact_info_title', 'Contact information')),
      infoNoteTitle: safeStr(ui('ui_contact_info_note_title', 'Not')),
    }),
    [ui, brand.name],
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      {/* Left: info + map */}
      <div className="lg:col-span-5 space-y-12">
        <div className="space-y-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-(--gm-gold) mb-3">
            <span>{t.subprefix}</span>{' '}
            <span className="text-(--gm-muted)">{t.sublabel}</span>
          </div>
          <h2 className={`${cinzel.className} text-4xl md:text-5xl text-(--gm-text) leading-tight`}>
            {t.titleLeft}
          </h2>
          <p className="text-(--gm-text-dim) leading-relaxed text-lg font-serif italic opacity-80">{t.tagline}</p>
        </div>

        {/* Contact information */}
        <div className="bg-(--gm-surface) shadow-(--gm-shadow-card) border border-(--gm-border-soft) p-10 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-(--gm-gold)/5 rounded-full blur-3xl group-hover:bg-(--gm-gold)/10 transition-colors" />
          <h3 className={`${cinzel.className} text-xl text-(--gm-text) mb-8`}>
            {t.infoTitle}
          </h3>

          <div className="space-y-6 text-base text-(--gm-text-dim) relative">
            {primaryPhone && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-(--gm-gold)/10 rounded-xl flex items-center justify-center text-(--gm-gold)">
                   <strong className="sr-only">{t.phone}</strong>
                   <span className="text-xl">📞</span>
                </div>
                <a className="text-(--gm-text) hover:text-(--gm-gold) transition-colors font-medium" href={`tel:${primaryPhone}`}>
                  {primaryPhone}
                </a>
              </div>
            )}

            {emailTo && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-(--gm-gold)/10 rounded-xl flex items-center justify-center text-(--gm-gold)">
                   <strong className="sr-only">{t.email}</strong>
                   <span className="text-xl">✉️</span>
                </div>
                <a className="text-(--gm-text) hover:text-(--gm-gold) transition-colors font-medium" href={buildMailto(emailTo)}>
                  {emailTo}
                </a>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-(--gm-gold)/10 rounded-xl flex items-center justify-center text-(--gm-gold) shrink-0">
                   <strong className="sr-only">{t.addressLabel}</strong>
                   <span className="text-xl">📍</span>
                </div>
                <div className="pt-2">
                  <span className="text-(--gm-text) font-medium">{address}</span>
                  {address2 && <span className="block mt-1 opacity-70">{address2}</span>}
                </div>
              </div>
            )}

            {notes && (
              <div className="pt-8 border-t border-(--gm-border-soft) flex gap-4">
                <div className="w-10 h-10 bg-(--gm-gold)/10 rounded-xl flex items-center justify-center text-(--gm-gold) shrink-0">
                   <span className="text-xl">📝</span>
                </div>
                <div className="pt-2">
                  <strong className="text-(--gm-text) text-sm uppercase tracking-widest">{t.infoNoteTitle}</strong>
                  <div className="mt-2 text-sm italic leading-relaxed">{notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {mapCfg.embed_url && (
          <div className="bg-(--gm-surface) shadow-(--gm-shadow-soft) border border-(--gm-border-soft) overflow-hidden rounded-[2.5rem]">
            <div className="px-8 py-5 border-b border-(--gm-border-soft) flex items-center justify-between">
              <h3 className={`${cinzel.className} text-sm tracking-widest text-(--gm-text)`}>{mapCfg.title}</h3>
              <div className="w-2 h-2 bg-[var(--gm-success)] rounded-full animate-pulse shadow-[0_0_8px_var(--gm-success)]" />
            </div>
            <iframe
              title={mapCfg.title}
              src={mapCfg.embed_url}
              height={mapCfg.height}
              className="w-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>

      {/* Right: form */}
      <div className="lg:col-span-7">
        <ContactForm locale={locale} t={t} />
      </div>
    </div>
  );
}
