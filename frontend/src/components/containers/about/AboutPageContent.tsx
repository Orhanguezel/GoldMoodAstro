// =============================================================
// FILE: src/components/containers/about/AboutPageContent.tsx
// goldmoodastro – About Page Content (SINGLE PAGE) (I18N + SAFE)
// =============================================================

'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';

// Helpers
import { useLocaleShort, useUiSection } from '@/i18n';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { localizePath } from '@/integrations/shared';

type AboutCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  founderTitle: string;
  founderParagraphs: string[];
  methodologyTitle: string;
  methodologyParagraphs: string[];
  experienceTitle: string;
  experienceParagraphs: string[];
  differentiatorsTitle: string;
  differentiators: Array<{ title: string; body: string }>;
  authorBio: string;
};

const ABOUT_COPY: Record<string, AboutCopy> = {
  tr: {
    eyebrow: 'GoldMoodAstro Manifestosu',
    title: 'Ruhsal rehberliği daha anlaşılır, güvenli ve erişilebilir hale getiriyoruz.',
    lead:
      'GoldMoodAstro; astroloji, tarot, numeroloji ve ilişki içgörüsünü tek bir danışmanlık platformunda buluşturur. Amacımız sabit cevaplar vermek değil; seçimlerin daha sakin, bağlamlı ve öz güvenli görülmesine alan açmaktır.',
    founderTitle: 'Kurucu Hikayesi',
    founderParagraphs: [
      'GoldMoodAstro, kurucu Pınar Demircioğlu’nun ruhsal rehberliği daha güvenli ve modern bir deneyime dönüştürme vizyonuyla şekillendi. İnsanlar hassas anlarda rehberlik arar; iyi bir platform doğru danışmanı bulmayı, seansı anlamayı, güvenli ödeme yapmayı ve görüşmeye teknik sürtünme olmadan başlamayı kolaylaştırmalıdır.',
      'Bu yüzden GoldMoodAstro’da teknoloji gösterinin yıldızı değil, danışmanlığı koruyan sessiz yapıdır. Kullanıcılar profilleri, uzmanlıkları, yorumları, seans süresini ve fiyatları karşılaştırabilir. Danışmanlar ise müsaitlik, hizmet, mesaj ve görüşme akışlarını profesyonel bir düzende yönetir.',
    ],
    methodologyTitle: 'Yöntem',
    methodologyParagraphs: [
      'Astroloji hesaplamalarında Swiss Ephemeris tabanlı teknik yaklaşım kullanılır. Doğum haritası, gezegen konumları, evler, açılar ve yükselen burç yorum için güvenilir bir zemin oluşturur.',
      'Tarot içerikleri Rider-Waite-Smith sembolizmini temel alır. Kartlar değişmez kader cümleleri değil; soru, duygu ve olasılıkları anlamaya yardım eden sembolik bir dil olarak ele alınır. Numeroloji isim ve doğum tarihini yaşam yolu, kader sayısı ve kişisel döngüler üzerinden yorumlar.',
    ],
    experienceTitle: 'Ekip ve Deneyim',
    experienceParagraphs: [
      'GoldMoodAstro ekibi yazılım, ürün tasarımı, astroloji, tarot, editoryal çalışma ve kullanıcı deneyimini bir araya getirir. Deneyimi yalnızca içerikle değil; danışman seçimi, randevu, ödeme, hatırlatma, canlı sesli görüşme, mesajlaşma ve yorum sonrası bütün yolculukla ölçeriz.',
      'Danışmanlarımız doğum haritası analizi, ilişki astrolojisi, tarot, numeroloji, mood rehberliği, kariyer ve ilişki odaklı destek gibi farklı uzmanlıklar sunar. Güven; uzmanlık, dil, hizmet, müsaitlik ve yorumların görünür olmasıyla başlar.',
    ],
    differentiatorsTitle: 'GoldMood’u farklı kılan ne?',
    differentiators: [
      { title: 'Şeffaf danışman seçimi', body: 'Profil, uzmanlık, paket, puan ve müsaitlik bilgileri randevu öncesinde görünür.' },
      { title: 'Bütünleşik seans akışı', body: 'Randevu, ödeme, hatırlatma, mesajlaşma ve uygulama içi sesli görüşme tek sakin deneyim olarak tasarlanır.' },
      { title: 'Sorumlu rehberlik dili', body: 'Korku temelli veya manipülatif iddialardan kaçınır; farkındalık, seçenekler ve duygusal güvenliğe odaklanırız.' },
    ],
    authorBio:
      'GoldMoodAstro içerikleri astroloji, tarot, numeroloji ve ruhsal rehberliği daha anlaşılır ve sorumlu kullanılır hale getirmek için hazırlanır.',
  },
  en: {
    eyebrow: 'GoldMoodAstro Manifesto',
    title: 'We make spiritual guidance clearer, safer and easier to access.',
    lead:
      'GoldMoodAstro brings astrology, tarot, numerology and relationship insight into one consultation platform. We do not aim to hand people fixed answers; we create a guided space where choices can be seen with more calm, context and self-trust.',
    founderTitle: 'Founder Story',
    founderParagraphs: [
      'GoldMoodAstro was shaped by founder Pınar Demircioğlu’s vision for spiritual guidance and by a simple observation: people look for guidance at sensitive moments, but the digital experience around that guidance is often scattered. A good platform should help users find the right consultant, understand the session clearly, pay safely and start the conversation without technical friction.',
      'Technology is therefore not the hero of GoldMoodAstro. It is the quiet structure that protects the consultation. Users can compare profiles, expertise, reviews, session duration and pricing. Consultants can manage availability, services, messages and calls through a professional workflow. The founding principle is practical: spiritual guidance can be thoughtful, ethical and modern at the same time.',
    ],
    methodologyTitle: 'Methodology',
    methodologyParagraphs: [
      'For astrology calculations, GoldMoodAstro follows a Swiss Ephemeris based approach. Birth charts, planetary positions, houses, aspects and rising signs are treated as technical foundations for interpretation. Calculation does not replace the consultant; it gives the conversation a more reliable ground.',
      'Tarot content is primarily informed by Rider-Waite-Smith symbolism. Cards are not treated as fixed fate statements, but as a symbolic language for questions, emotions and possibilities. Numerology interprets names and birth dates through life path, destiny number and personal cycles. Across all methods, our aim is awareness rather than fear.',
    ],
    experienceTitle: 'Team and Experience',
    experienceParagraphs: [
      'The GoldMoodAstro team combines software, product design, astrology, tarot, editorial work and user experience. We measure experience through the whole journey: choosing a consultant, booking a slot, paying, receiving reminders, joining the voice session, messaging and reviewing afterwards.',
      'Our consultants bring different expertise areas, including birth chart analysis, relationship astrology, tarot, numerology, mood guidance, career and relationship-focused support. Trust starts with visible information: expertise, languages, services, availability and reviews.',
    ],
    differentiatorsTitle: 'Why GoldMood?',
    differentiators: [
      { title: 'Transparent consultant choice', body: 'Profiles, expertise, packages, ratings and availability are visible before booking.' },
      { title: 'Integrated session flow', body: 'Booking, payment, reminders, messaging and in-app voice calls are designed as one calm experience.' },
      { title: 'Responsible guidance language', body: 'We avoid fear-based or manipulative claims and focus on awareness, options and emotional safety.' },
    ],
    authorBio:
      'GoldMoodAstro content makes astrology, tarot, numerology and spiritual guidance easier to understand and use responsibly.',
  },
};

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);
  const { ui: uiX } = useUiSection('ui_extra' as any);
  const copyFallback = useMemo(() => (locale === 'tr' ? ABOUT_COPY.tr : ABOUT_COPY.en), [locale]);

  const readUi = useCallback(
    (key: string, fallback: any) => {
      const v = ui(key, '');
      if (!v || v === key) return fallback;
      if (typeof fallback === 'object' && (v.startsWith('[') || v.startsWith('{'))) {
        try { return JSON.parse(v); } catch { return fallback; }
      }
      return v;
    },
    [ui],
  );

  const copy = useMemo<AboutCopy>(() => ({
    eyebrow: readUi('ui_about_eyebrow', copyFallback.eyebrow),
    title: readUi('ui_about_title', copyFallback.title),
    lead: readUi('ui_about_lead', copyFallback.lead),
    founderTitle: readUi('ui_about_founder_title', copyFallback.founderTitle),
    founderParagraphs: readUi('ui_about_founder_paragraphs', copyFallback.founderParagraphs),
    methodologyTitle: readUi('ui_about_methodology_title', copyFallback.methodologyTitle),
    methodologyParagraphs: readUi('ui_about_methodology_paragraphs', copyFallback.methodologyParagraphs),
    experienceTitle: readUi('ui_about_experience_title', copyFallback.experienceTitle),
    experienceParagraphs: readUi('ui_about_experience_paragraphs', copyFallback.experienceParagraphs),
    differentiatorsTitle: readUi('ui_about_diff_title', copyFallback.differentiatorsTitle),
    differentiators: readUi('ui_about_diff_items', copyFallback.differentiators),
    authorBio: readUi('ui_about_author_bio', copyFallback.authorBio),
  }), [readUi, copyFallback]);

  return (
    <div className="relative z-10 text-(--gm-text)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-50"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, color-mix(in srgb, var(--gm-primary) 16%, transparent) 0%, transparent 75%)',
        }}
      />

      <div className="relative">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-(--gm-primary)/25 bg-(--gm-surface) p-7 md:p-12 shadow-(--gm-shadow-card) relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-(--gm-primary) via-(--gm-accent) to-(--gm-gold)" />
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-(--gm-primary)">
              {copy.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-serif leading-tight text-(--gm-text) md:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-(--gm-text-dim) font-serif italic">{copy.lead}</p>
          </div>

          <div className="mt-10 space-y-8">
            {[
              { title: copy.founderTitle, paragraphs: copy.founderParagraphs },
              { title: copy.methodologyTitle, paragraphs: copy.methodologyParagraphs },
              { title: copy.experienceTitle, paragraphs: copy.experienceParagraphs },
            ].map((section, idx) => (
              <section
                key={section.title}
                className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-7 md:p-10 shadow-(--gm-shadow-soft) hover:border-(--gm-primary)/30 hover:shadow-(--gm-shadow-card) transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-(--gm-primary)/10 text-(--gm-primary) font-serif text-lg font-bold">
                    {idx + 1}
                  </span>
                  <h2 className="text-2xl font-serif text-(--gm-text)">{section.title}</h2>
                </div>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-(--gm-text-dim)">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12">
            <div className="text-center mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-(--gm-primary) mb-2">
                ✦ {uiX('ui_extra_b2_about_edge_label', 'What makes us different')} ✦
              </p>
              <h2 className="text-2xl md:text-3xl font-serif text-(--gm-text)">{copy.differentiatorsTitle}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {copy.differentiators.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 hover:border-(--gm-primary)/40 hover:shadow-(--gm-shadow-gold) hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-(--gm-primary)/10 flex items-center justify-center mb-4 group-hover:bg-(--gm-primary)/20 transition-colors">
                    <span className="text-(--gm-primary) text-lg">✦</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-(--gm-text)">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-(--gm-text-dim)">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-12 rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-7 md:p-10 shadow-(--gm-shadow-soft)">
            <AuthorBio
              name="Pınar Demircioğlu"
              title={uiX('ui_extra_b2_about_founder_title', 'GoldMoodAstro Founder')}
              bio={copy.authorBio}
              expertise={['Product', 'Astrology Platform', 'Spiritual Guidance']}
              certificates={['Swiss Ephemeris', 'Rider-Waite-Smith']}
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              href={localizePath(locale, '/editorial-policy')}
              className="inline-flex items-center gap-3 rounded-full bg-(--gm-primary) hover:bg-(--gm-primary-dark) px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-(--gm-bg) shadow-(--gm-shadow-card) hover:shadow-(--gm-shadow-gold) transition-all"
            >
              {uiX('ui_extra_b2_about_editorial_cta', 'Editoryal politika ve metodoloji')}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPageContent;
