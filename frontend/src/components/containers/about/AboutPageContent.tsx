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
    title: 'Ruhsal rehberliği daha anlaşılır, güvenilir ve erişilebilir yapmak için buradayız.',
    lead:
      'GoldMoodAstro; astroloji, tarot, numeroloji ve ilişki dinamiklerini tek bir danışmanlık deneyiminde buluşturan bir platformdur. Amacımız insanlara kesin hükümler vermek değil, karar anlarında daha bilinçli, sakin ve kendilerine yakın hissettiren bir rehberlik alanı açmaktır.',
    founderTitle: 'Kurucu Hikayesi',
    founderParagraphs: [
      'GoldMoodAstro fikri, Murat Kısıkçılar’ın dijital ürün deneyimiyle insanların hayatlarında daha kişisel, daha güven veren ve daha kolay ulaşılabilir rehberlik arayışını bir araya getirme isteğinden doğdu. Murat için iyi bir platform yalnızca hızlı çalışan ekranlardan ibaret değildir; kullanıcıyı doğru uzmana taşıyan, ödeme ve randevu akışını güvenle çözen, seans başladığında teknik detayları aradan kaldıran görünmez bir düzen demektir.',
      'Bu nedenle GoldMoodAstro’da teknoloji, spiritüel danışmanlığın önüne geçmez; ona alan açar. Kullanıcı danışman seçerken profil, uzmanlık, yorum, seans süresi ve ücret gibi bilgileri şeffaf biçimde görür. Danışman ise kendi takvimini, paketlerini, mesajlarını ve görüşmelerini yönetebileceği profesyonel bir panelle çalışır. Kurucu perspektifimiz basittir: ruhsal rehberlik, dijital dünyada da özenli, etik ve anlaşılır olabilir.',
      'GoldMoodAstro’nun ilk hedefi astroloji veya tarot merakını tek seferlik bir eğlenceye indirgemek değil, danışmanla kullanıcı arasında güvenli bir konuşma zemini kurmaktır. Bazen bir doğum haritası kişinin tekrar eden ilişki döngülerini görmesine yardımcı olur. Bazen bir tarot açılımı kararsızlık anında farklı olasılıkları isimlendirir. Bazen numeroloji, kişinin kendi ritmini ve karar alma biçimini fark etmesi için sade bir ayna tutar.',
      'Murat’ın ürün yaklaşımında en kritik soru şudur: Kullanıcı seansa girmeden önce kendini daha güvende, daha bilgili ve daha az yalnız hissediyor mu? Bu yüzden platform yalnızca danışman listesi sunmaz; danışmanların hangi konularda çalıştığını, hangi dillerde hizmet verdiğini, hangi paketleri sunduğunu ve seansın nasıl ilerleyeceğini görünür kılar. Kullanıcı bir randevu oluşturduğunda ödeme, hatırlatma, mesajlaşma ve sesli görüşme adımları aynı akış içinde kalır. Böylece asıl odak teknik ayrıntılar değil, danışmanla kurulacak anlamlı görüşme olur.',
      'GoldMoodAstro’nun uzun vadeli vizyonu, Türkiye’den başlayarak farklı dillerde hizmet veren güvenilir bir ruhsal danışmanlık ağı kurmaktır. Bu ağda danışmanların emeği görünür olmalı, kullanıcıların soruları ciddiyetle karşılanmalı ve her içerik sorumlu bir dille yazılmalıdır. Astroloji, tarot veya numeroloji bir insanın hayatını tek başına yönetmez; ancak kişi kendi duygusunu, ihtiyacını ve olasılıklarını daha iyi gördüğünde karar alma biçimi değişebilir. Platformun varlık sebebi tam olarak bu farkındalık alanını büyütmektir.',
    ],
    methodologyTitle: 'Metodoloji',
    methodologyParagraphs: [
      'Astroloji tarafında hesaplama katmanımız Swiss Ephemeris yaklaşımını temel alır. Doğum haritası, gezegen konumları, evler, açılar ve yükselen burç gibi teknik başlıklar saniye hassasiyetinde ele alınır. Bu teknik hesaplama, danışmanın sezgisel ve yorumlayıcı emeğinin yerine geçmez; yorumun daha sağlam bir zemin üzerinde kurulmasına yardımcı olur.',
      'Tarot içeriklerinde Rider-Waite-Smith sembolizmi ana referans kabul edilir. Kartlar kesin gelecek bildirimi olarak değil; soru, duygu, davranış ve olasılıkları konuşulabilir hale getiren sembolik bir dil olarak ele alınır. Numeroloji tarafında isim ve doğum tarihi üzerinden hayat yolu, kader sayısı ve kişisel döngüler yorumlanır. Her yöntemde ortak ilkemiz aynıdır: kişiyi korkutmak yerine farkındalık, sorumluluk ve seçenek duygusunu güçlendirmek.',
      'İçeriklerimiz editoryal kontrolden geçer. AI destekli üretim kullanılan alanlarda amaç otomasyonla otorite taklidi yapmak değil; bilgiyi daha okunabilir, tutarlı ve erişilebilir hale getirmektir. GoldMoodAstro’da yayınlanan genel içerikler kişisel danışmanlık yerine geçmez. Kişisel harita, ilişki veya yaşam kararları için bire bir seans, kullanıcı bağlamını ve sorusunu dikkate aldığı için daha uygundur.',
      'Danışmanlık dili konusunda özellikle dikkat ettiğimiz birkaç sınır vardır. Kullanıcıya korku veren, bağımlılık oluşturan, kesin felaket veya kesin mucize vadeden ifadeler GoldMoodAstro yaklaşımına uygun değildir. Bir danışman güçlü bir sembol gördüğünde bile bunu kişinin seçimini elinden alacak şekilde değil, üzerinde düşünülebilecek bir tema olarak aktarmalıdır. İlişki, kariyer, aile veya ruh hali gibi hassas başlıklarda amaç yargılamak değil; kişinin kendini daha iyi duymasına, seçeneklerini ayırt etmesine ve gerekiyorsa profesyonel destek aramasına alan açmaktır.',
    ],
    experienceTitle: 'Ekip ve Deneyim',
    experienceParagraphs: [
      'GoldMoodAstro ekibi; yazılım geliştirme, ürün tasarımı, astroloji, tarot, içerik editörlüğü ve kullanıcı deneyimi alanlarının birleşiminden oluşur. Kombine deneyimimizi yalnızca yıl sayısıyla değil, kullanıcıya temas eden her küçük akışta ölçüyoruz: danışman bulma, uygun saat seçme, ödeme, hatırlatma, sesli görüşme, mesajlaşma ve görüşme sonrası değerlendirme.',
      'Danışmanlarımız farklı uzmanlıklardan gelir: doğum haritası, ilişki astrolojisi, tarot, numeroloji, mood danışmanlığı, kariyer ve ilişki odaklı rehberlik. Her profilin uzmanlık alanı, dil bilgisi, seans paketi ve kullanıcı yorumları görünür olmalıdır. Çünkü güven, güzel cümlelerden önce şeffaf bilgiyle başlar.',
      'Bu deneyim anlayışı mobil uygulama, web arayüzü ve danışman panelinde aynen devam eder. Kullanıcı için önemli olan, ne zaman kiminle görüşeceğini ve görüşmenin ona ne sağlayabileceğini net biçimde bilmektir. Danışman için önemli olan ise zamanını, paketlerini, uygunluk durumunu ve kullanıcı iletişimini düzenli yönetebilmektir. GoldMoodAstro bu iki tarafı aynı ciddiyetle ele alır. Çünkü iyi bir seans yalnızca doğru yorumla değil, o yorumun gerçekleştiği güvenli operasyonel ortamla da ilgilidir.',
    ],
    differentiatorsTitle: 'Neden GoldMood?',
    differentiators: [
      {
        title: 'Şeffaf uzman seçimi',
        body: 'Kullanıcılar danışman profillerini, uzmanlıklarını, paketlerini, puanlarını ve müsaitliklerini tek ekranda karşılaştırabilir. Böylece seans, belirsiz bir deneme yerine bilinçli bir seçimle başlar.',
      },
      {
        title: 'Teknik olarak bütünleşik seans akışı',
        body: 'Randevu, ödeme, hatırlatma, mesaj ve uygulama içi sesli görüşme aynı platform mantığında çalışır. Kullanıcı ve danışman için dağınık araçlar yerine tek, sakin ve takip edilebilir bir deneyim hedeflenir.',
      },
      {
        title: 'Sorumlu ruhsal rehberlik dili',
        body: 'GoldMoodAstro korku, manipülasyon veya kesin kader söylemi üzerine kurulmaz. İçerik ve seans dili; farkındalık, seçenekler, kişisel sorumluluk ve duygusal güvenlik ilkeleriyle şekillenir.',
      },
    ],
    authorBio:
      'GoldMoodAstro içerikleri; astroloji, tarot, numeroloji ve ruhsal danışmanlık başlıklarını kullanıcıların karar anlarında daha sakin, bilinçli ve kendilerine yakın hissetmeleri için hazırlar.',
  },
  en: {
    eyebrow: 'GoldMoodAstro Manifesto',
    title: 'We make spiritual guidance clearer, safer and easier to access.',
    lead:
      'GoldMoodAstro brings astrology, tarot, numerology and relationship insight into one consultation platform. We do not aim to hand people fixed answers; we create a guided space where choices can be seen with more calm, context and self-trust.',
    founderTitle: 'Founder Story',
    founderParagraphs: [
      'GoldMoodAstro was shaped by Murat Kısıkçılar’s product perspective and by a simple observation: people look for guidance at sensitive moments, but the digital experience around that guidance is often scattered. A good platform should help users find the right consultant, understand the session clearly, pay safely and start the conversation without technical friction.',
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
  de: {
    eyebrow: 'GoldMoodAstro Manifest',
    title: 'Wir machen spirituelle Beratung verständlicher, sicherer und leichter zugänglich.',
    lead:
      'GoldMoodAstro verbindet Astrologie, Tarot, Numerologie und Beziehungsfragen in einer Plattform für Beratung. Unser Ziel sind keine starren Antworten, sondern ein ruhiger Raum für Orientierung, Kontext und bewusstere Entscheidungen.',
    founderTitle: 'Gründungsgeschichte',
    founderParagraphs: [
      'GoldMoodAstro entstand aus Murat Kısıkçılars Produktperspektive und der Beobachtung, dass Menschen in sensiblen Momenten Orientierung suchen, die digitale Erfahrung rund um Beratung aber oft unübersichtlich ist. Eine gute Plattform soll helfen, die passende Beratungsperson zu finden, den Ablauf zu verstehen, sicher zu bezahlen und ohne technische Hürden ins Gespräch zu kommen.',
      'Technologie steht bei GoldMoodAstro deshalb nicht im Vordergrund. Sie bildet die ruhige Struktur, die Beratung möglich macht. Nutzer sehen Profile, Fachgebiete, Bewertungen, Dauer und Preise. Berater verwalten Verfügbarkeit, Angebote, Nachrichten und Gespräche in einem professionellen Ablauf.',
    ],
    methodologyTitle: 'Methodik',
    methodologyParagraphs: [
      'Für astrologische Berechnungen nutzt GoldMoodAstro einen Swiss-Ephemeris-basierten Ansatz. Geburtshoroskope, Planetenstände, Häuser, Aspekte und Aszendenten bilden die technische Grundlage. Die Berechnung ersetzt nicht die Beratung, sondern macht sie nachvollziehbarer.',
      'Tarot-Inhalte orientieren sich vor allem an der Rider-Waite-Smith-Symbolik. Karten werden nicht als feste Zukunftsaussage verstanden, sondern als symbolische Sprache für Fragen, Gefühle und Möglichkeiten. Numerologie deutet Namen und Geburtsdaten über Lebensweg, Schicksalszahl und persönliche Zyklen.',
    ],
    experienceTitle: 'Team und Erfahrung',
    experienceParagraphs: [
      'Das GoldMoodAstro Team verbindet Software, Produktdesign, Astrologie, Tarot, Redaktion und User Experience. Erfahrung zeigt sich für uns im gesamten Weg: Beratung wählen, Termin buchen, bezahlen, erinnert werden, Gespräch starten, schreiben und bewerten.',
      'Unsere Berater bringen unterschiedliche Schwerpunkte mit: Geburtshoroskop, Beziehungsastrologie, Tarot, Numerologie, Mood-Beratung, Karriere und Beziehung. Vertrauen beginnt mit sichtbaren Informationen zu Expertise, Sprachen, Leistungen, Verfügbarkeit and Bewertungen.',
    ],
    differentiatorsTitle: 'Warum GoldMood?',
    differentiators: [
      { title: 'Transparente Beraterwahl', body: 'Profile, Fachgebiete, Pakete, Bewertungen und Verfügbarkeit sind vor der Buchung sichtbar.' },
      { title: 'Integrierter Sitzungsablauf', body: 'Termin, Zahlung, Erinnerungen, Nachrichten und In-App-Audio arbeiten als ruhiger gemeinsamer Ablauf.' },
      { title: 'Verantwortungsvolle Sprache', body: 'Wir vermeiden Angst und Manipulation und fokussieren Bewusstsein, Optionen und emotionale Sicherheit.' },
    ],
    authorBio:
      'GoldMoodAstro Inhalte machen Astrologie, Tarot, Numerologie und spirituelle Beratung verständlich und verantwortungsvoll nutzbar.',
  },
};

const AboutPageContent: React.FC = () => {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_about', locale as any);
  const copyFallback = useMemo(() => {
    if (locale === 'en' || locale === 'de') return ABOUT_COPY[locale];
    return ABOUT_COPY.tr;
  }, [locale]);

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
                ✦ {locale === 'tr' ? 'Farkımız' : locale === 'de' ? 'Unsere Stärke' : 'Our Edge'} ✦
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
              name="Murat Kısıkçılar"
              title={locale === 'tr' ? 'GoldMoodAstro Kurucusu' : locale === 'de' ? 'Gründer von GoldMoodAstro' : 'Founder of GoldMoodAstro'}
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
              {locale === 'tr' ? 'Editoryal politika ve metodoloji' : locale === 'de' ? 'Redaktionelle Richtlinie und Methodik' : 'Editorial policy and methodology'}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPageContent;
