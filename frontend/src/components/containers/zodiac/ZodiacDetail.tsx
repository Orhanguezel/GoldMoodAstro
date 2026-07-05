'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useGetSignInfoQuery, useGetTodayHoroscopeQuery } from '@/integrations/rtk/hooks';
import { ZodiacSign } from '@/types/common';
import { localizePath } from '@/integrations/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Heart, Briefcase, Info, Sparkles, ArrowRight, Volume2, HeartPulse } from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import { getZodiacMeta, localizeSign } from '@/lib/zodiac/signs';
import { buildZodiacFaq } from '@/lib/zodiac/faq';
import { getCelebritiesBySign } from '@/lib/zodiac/celebrities';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';

const cinzel = Cinzel({ subsets: ['latin'] });
interface ZodiacDetailProps {
  initialTab?: string;
  initialInfo?: any | null;
  initialToday?: any | null;
  sectionFocus?: 'love' | 'career' | 'health';
}

type ZodiacSection = {
  id: string;
  key2: string;
  title: string;
  content: string;
};

export default function ZodiacDetail({ initialTab = 'overview', initialInfo = null, initialToday = null, sectionFocus }: ZodiacDetailProps) {
  const { sign, locale } = useParams();
  const { brand } = useBrand();
  const { ui } = useUiSection('ui_zodiac');
  const signKey = sign as ZodiacSign;
  const meta = getZodiacMeta(signKey) || {
    key: signKey,
    label: signKey,
    date: '',
    symbol: '',
    element: 'Ateş' as const,
    modality: 'Öncü' as const,
    polarity: 'Yang' as const,
    ruler: '',
    accent: brand.colors.brand_secondary || 'var(--gm-gold)',
    image: `/uploads/zodiac/${signKey}.png`,
  };

  const { data: infoFromQuery, isLoading: isInfoLoading } = useGetSignInfoQuery(
    { sign: signKey, locale: locale as string },
    { skip: !!initialInfo }
  );
  const { data: todayFromQuery, isLoading: isTodayLoading } = useGetTodayHoroscopeQuery(
    { sign: signKey, locale: locale as string },
    { skip: !!initialToday }
  );

  const info = infoFromQuery ?? initialInfo;
  const today = todayFromQuery ?? initialToday;
  const localePrefix = typeof locale === 'string' ? locale : 'tr';
  const L = localizeSign(meta, localePrefix);
  const pick = (tr: string, en: string, de: string) =>
    localePrefix === 'tr' ? tr : localePrefix === 'de' ? de : en;
  // Tarih formatı locale'e göre — 'tr-TR' hardcode Almanca sayfada "5 Temmuz" gösteriyordu.
  const intlLocale = localePrefix === 'tr' ? 'tr-TR' : localePrefix === 'de' ? 'de-DE' : 'en-US';
  const summaryText = `${L.label} ${ui('ui_zodiac_summary_p1', 'sign')} ${L.element} ${ui('ui_zodiac_summary_p2', 'element,')} ${L.modality} ${ui('ui_zodiac_summary_p3', 'modality and')} ${L.ruler} ${ui('ui_zodiac_summary_p4', 'rulership. This profile summarizes')} ${L.label} ${ui('ui_zodiac_summary_p5', 'energy strengths and shadow areas in character, relationships, career and spiritual care.')}`;
  const sectionFallbacks: Record<string, { title: string; content: string }> = {
    personality: {
      title: `${L.label} ${pick('Karakteri', 'Personality', 'Persönlichkeit')}`,
      content: info?.content || info?.short_summary || summaryText,
    },
    love: {
      title: `${L.label} ${pick('Aşk ve Uyum', 'Love and Compatibility', 'Liebe & Kompatibilität')}`,
      content: `${L.label} ${ui('ui_zodiac_compat_fallback', 'compatibility is read through love language, trust needs and both complete charts.')}`,
    },
    career: {
      title: `${L.label} ${pick('Kariyer ve Yön', 'Career and Direction', 'Karriere & Richtung')}`,
      content: `${L.label} ${pick(
        'için kariyer okuması motivasyon, odak, çalışma ritmi ve sorumluluk alma biçimini birlikte değerlendirir. En verimli alanlar yalnızca meslek adıyla değil, kişinin doğum haritasındaki bütün yerleşimlerle netleşir.',
        'career readings look at motivation, focus, working rhythm and responsibility style together. The most supportive fields become clearer when the whole birth chart is considered, not only the Sun sign.',
        'Karriere-Deutungen betrachten Motivation, Fokus, Arbeitsrhythmus und Verantwortungsstil gemeinsam. Welche Bereiche wirklich stimmig sind, zeigt sich klarer, wenn das gesamte Geburtshoroskop einbezogen wird.',
      )}`,
    },
    health: {
      title: `${L.label} ${pick('Sağlık ve Yaşam Ritmi', 'Wellness and Life Rhythm', 'Wohlbefinden & Lebensrhythmus')}`,
      content: `${L.label} ${pick(
        'için sağlık ve yaşam ritmi yorumu tıbbi tavsiye yerine farkındalık diliyle ele alınır. Dinlenme, stres yönetimi, beden sinyallerini dinleme ve günlük ritmi sadeleştirme bu bölümün ana odağıdır.',
        'wellness guidance is framed as self-awareness, not medical advice. Rest, stress regulation, listening to body signals and simplifying daily rhythm are the main focus of this section.',
        'Wohlbefinden wird hier als Achtsamkeit verstanden, nicht als medizinischer Rat. Ruhe, Stressregulation, Körpersignale und ein klarerer Tagesrhythmus stehen im Mittelpunkt.',
      )}`,
    },
  };
  const getSection = (key: string): ZodiacSection => {
    const existing = info?.sections?.find((section: ZodiacSection) => section.key2 === key);
    if (existing) return existing;
    const fallback = sectionFallbacks[key] || sectionFallbacks.personality;
    return {
      id: `${signKey}-${key}-fallback`,
      key2: key,
      title: fallback.title,
      content: fallback.content,
    };
  };
  const displaySections = ['personality', 'love', 'career', 'health'].map(getSection);
  const personalitySection = getSection('personality');
  const loveSection = getSection('love');
  const focusedSection = sectionFocus ? getSection(sectionFocus) : null;
  const focusConfig = sectionFocus
    ? {
        love: {
          eyebrow: pick('İlişki Odağı', 'Relationship Focus', 'Beziehungsfokus'),
          subtitle: pick(
            `${L.label} için ilişki odağı; yakınlık kurma, güven ihtiyacı, sevgi dili ve uyum dinamiklerini daha özel bir çerçevede okur.`,
            `${L.label} relationship focus reads closeness, trust needs, love language and compatibility dynamics through a more specific lens.`,
            `${L.label} im Beziehungsfokus betrachtet Nähe, Vertrauen, Liebessprache und Kompatibilität in einem klareren Rahmen.`,
          ),
          href: localizePath(localePrefix, `/burclar/${signKey}/ask`),
          icon: Heart,
        },
        career: {
          eyebrow: pick('Kariyer Odağı', 'Career Focus', 'Karrierefokus'),
          subtitle: pick(
            `${L.label} için kariyer odağı; çalışma ritmi, sorumluluk alma biçimi, motivasyon kaynakları ve sürdürülebilir başarı alışkanlıklarını öne çıkarır.`,
            `${L.label} career focus highlights working rhythm, responsibility style, motivation sources and sustainable success habits.`,
            `${L.label} im Karrierefokus beleuchtet Arbeitsrhythmus, Verantwortungsstil, Motivation und nachhaltige Erfolgsgewohnheiten.`,
          ),
          href: localizePath(localePrefix, `/burclar/${signKey}/kariyer`),
          icon: Briefcase,
        },
        health: {
          eyebrow: pick('Yaşam Ritmi Odağı', 'Wellness Focus', 'Wohlbefinden-Fokus'),
          subtitle: pick(
            `${L.label} için yaşam ritmi odağı; dinlenme, stres farkındalığı, beden sinyalleri ve günlük denge ihtiyacını sembolik dille ele alır.`,
            `${L.label} wellness focus explores rest, stress awareness, body signals and daily balance through symbolic language.`,
            `${L.label} im Wohlbefinden-Fokus betrachtet Ruhe, Stressbewusstsein, Körpersignale und tägliche Balance in symbolischer Sprache.`,
          ),
          href: localizePath(localePrefix, `/burclar/${signKey}/saglik`),
          icon: HeartPulse,
        },
      }[sectionFocus]
    : null;
  const focusNarratives: Record<string, string[]> = {
    love: [
      pick(
        `${L.label} ilişki sayfası, yalnız romantik çekimi değil, güven kurma hızını, kırılganlıkla temas etme biçimini ve tartışma sonrasında yeniden yakınlaşma kapasitesini de merkeze alır.`,
        `${L.label} relationship guidance looks beyond attraction. It focuses on trust rhythm, emotional availability, repair after conflict and the way closeness is built over time.`,
        `${L.label} in Beziehungen betrachtet mehr als Anziehung. Im Mittelpunkt stehen Vertrauen, emotionale Verfügbarkeit, Versöhnung nach Konflikten und die Art, wie Nähe entsteht.`,
      ),
      pick(
        `Uyum okumasını kullanırken sadece "hangi burçla olur" sorusuna sıkışmak yerine, kendi sevgi dilini, beklenti ritmini ve sınır ihtiyacını da gözlemle.`,
        `Use this reading to observe your love language, boundary needs and expectation patterns instead of reducing compatibility to a single sign match.`,
        `Nutze diese Deutung, um Liebessprache, Grenzen und Erwartungsmuster zu beobachten, statt Kompatibilität auf ein einzelnes Zeichen zu reduzieren.`,
      ),
      pick(
        `Bir danışmanla ilişki temasını konuşurken yakınlık beklentin, iletişimde hassaslaştığın anlar ve tekrar eden seçim kalıpların ayrı ayrı ele alınabilir.`,
        `When you bring relationship questions to a consultant, your need for closeness, sensitive communication moments and repeated choice patterns can be explored separately.`,
        `In einer Beratung können Nähebedürfnis, empfindliche Kommunikationsmomente und wiederkehrende Wahlmuster getrennt betrachtet werden.`,
      ),
    ],
    career: [
      pick(
        `${L.label} kariyer sayfası, meslek listesinden çok çalışma ortamı, karar alma temposu ve başarıyı sürdürülebilir kılan alışkanlıklarla ilgilenir.`,
        `${L.label} career guidance is less about a fixed profession list and more about work environment, decision rhythm and habits that make success sustainable.`,
        `${L.label} im Karrierefokus handelt weniger von festen Berufstiteln als von Arbeitsumfeld, Entscheidungstempo und Gewohnheiten, die Erfolg tragfähig machen.`,
      ),
      pick(
        `Bu odağı okurken gündelik iş ritmini, ekip içindeki rolünü ve uzun vadeli hedeflere yaklaşımını birlikte düşün.`,
        `As you read this focus, consider your daily work rhythm, your role inside teams and your relationship with long-term goals.`,
        `Denke beim Lesen an deinen täglichen Arbeitsrhythmus, deine Rolle im Team und deinen Umgang mit langfristigen Zielen.`,
      ),
      pick(
        `Danışman görüşmesine hazırlanırken hangi işlerde zamanın daha hızlı aktığını, hangi sorumlulukların seni tükettiğini ve görünür olmakla güvenli kalmak arasındaki dengeyi not alabilirsin.`,
        `Before a consultation, note which tasks make time move faster, which responsibilities drain you and how you balance visibility with emotional safety.`,
        `Vor einer Beratung kannst du notieren, bei welchen Aufgaben Zeit schneller vergeht, welche Verantwortung dich erschöpft und wie du Sichtbarkeit mit innerer Sicherheit ausbalancierst.`,
      ),
    ],
    health: [
      pick(
        `${L.label} sağlık ve yaşam ritmi sayfası tıbbi teşhis veya tedavi önerisi vermez; bedenle kurulan ilişkiyi daha dikkatli dinlemeye çağırır.`,
        `${L.label} wellness guidance is not medical diagnosis or treatment advice. It invites a more attentive relationship with the body.`,
        `${L.label} im Wohlbefinden ist keine medizinische Diagnose oder Behandlungsempfehlung. Es lädt zu einem aufmerksameren Umgang mit dem Körper ein.`,
      ),
      pick(
        `Bu odağı kişisel bakım listesi gibi değil, tempo ayarı daveti gibi oku.`,
        `Read this focus as an invitation to adjust pace rather than as a checklist.`,
        `Lies diesen Fokus nicht als Checkliste, sondern als Einladung, dein Tempo bewusster zu justieren.`,
      ),
    ],
  };
  const celebrities = getCelebritiesBySign(signKey, 3);
  const zodiacFaq = buildZodiacFaq(meta, localePrefix, info?.short_summary);

  if (!info && (isInfoLoading || isTodayLoading)) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 space-y-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="py-40 text-center">
        <h2 className="text-2xl font-bold">{ui('ui_zodiac_not_found', 'Zodiac information could not be found.')}</h2>
      </div>
    );
  }

  return (
    <div
      className="zodiac-accent-scope"
      style={{ '--gm-zodiac-accent': meta.accent } as React.CSSProperties}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-16 p-8 md:p-16 rounded-[2.5rem] bg-(--gm-surface) border border-(--gm-border-soft) overflow-hidden shadow-(--gm-shadow-glow)"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-(--gm-gold)/5 blur-[100px] rounded-full -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 relative">
          <div className="relative w-48 h-48 md:w-80 md:h-80 flex-shrink-0 animate-float">
            <Image
              src={meta.image}
              alt={info.title}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="text-5xl">{meta.symbol}</span>
              <span className="text-xs font-bold tracking-[0.3em] text-(--gm-gold) uppercase">
                {L.date}
              </span>
            </div>
            <h1 className={`${cinzel.className} text-4xl md:text-7xl mb-6 text-(--gm-text) leading-tight`}>
              {L.label}
            </h1>
            <div className="mb-8 flex flex-wrap justify-center gap-2 md:justify-start">
              {[L.element, L.modality, L.polarity, L.ruler].filter(Boolean).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-(--gm-border-soft) px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-md"
                  style={{ backgroundColor: `${meta.accent}18`, color: meta.accent }}
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-lg md:text-2xl text-(--gm-text-dim) font-serif italic leading-relaxed opacity-80">
              &quot;{focusConfig?.subtitle || info.short_summary}&quot;
            </p>
          </div>
        </div>
      </motion.div>

      {focusedSection && focusConfig && (
        <section
          data-speakable
          className="mb-16 rounded-[2rem] border border-(--gm-gold)/20 bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) md:p-12"
        >
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-(--gm-gold)/10 text-(--gm-gold)">
              <focusConfig.icon className="size-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-(--gm-gold)">
                {focusConfig.eyebrow}
              </p>
              <h2 className={`${cinzel.className} mt-2 text-3xl text-(--gm-text) md:text-5xl`}>
                {focusedSection.title}
              </h2>
            </div>
          </div>

          <div className="max-w-4xl text-xl leading-relaxed text-(--gm-text) opacity-90 whitespace-pre-wrap font-serif">
            {focusedSection.content}
          </div>

          <div className="mt-8 grid gap-5 text-base leading-relaxed text-(--gm-text-dim) md:grid-cols-2">
            {(focusNarratives[focusedSection.key2] || []).map((paragraph) => (
              <p key={paragraph} className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/25 p-5 font-serif">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {displaySections
              .filter((section) => section.key2 !== focusedSection.key2)
              .slice(0, 3)
              .map((section) => {
                const href =
                  section.key2 === 'love'
                    ? localizePath(localePrefix, `/burclar/${signKey}/ask`)
                    : section.key2 === 'career'
                      ? localizePath(localePrefix, `/burclar/${signKey}/kariyer`)
                      : section.key2 === 'health'
                        ? localizePath(localePrefix, `/burclar/${signKey}/saglik`)
                        : localizePath(localePrefix, `/burclar/${signKey}`);
                return (
                  <Link
                    key={section.key2}
                    href={href}
                    className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/30 p-5 transition-colors hover:border-(--gm-gold)/40"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                      {section.title}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-(--gm-text-dim)">
                      {pick('Bu odağı ayrı sayfada oku.', 'Open this focus in its dedicated page.', 'Diesen Fokus auf der eigenen Seite öffnen.')}
                    </p>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {!sectionFocus && (
      <>
      <section
        data-speakable
        className="mb-12 rounded-[2rem] border border-(--gm-gold)/20 bg-(--gm-gold)/5 p-8 md:p-12 backdrop-blur-sm"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--gm-gold) mb-4">{ui('ui_zodiac_summary_label', 'Summary')}</p>
        <p className="text-xl md:text-2xl leading-relaxed text-(--gm-text) font-serif italic opacity-90">{summaryText}</p>
      </section>

      <section className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{L.label} {ui('ui_zodiac_q_what_is', 'sign meaning')}</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {info.short_summary || summaryText}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{L.label} {ui('ui_zodiac_q_traits', 'traits')}</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {personalitySection?.content || info.content}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{L.label} {ui('ui_zodiac_q_compat', 'compatibility')}</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {loveSection?.content || `${L.label} ${ui('ui_zodiac_compat_fallback', 'compatibility is read through love language, trust needs and both complete charts.')}`}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{L.label} {ui('ui_zodiac_q_celebrities', 'celebrities')}</h2>
          {celebrities.length ? (
            <div className="mt-4 grid gap-4">
              {celebrities.map((celebrity) => (
                <div
                  key={celebrity.name}
                  className="rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/30 p-5 flex justify-between items-start"
                >
                  <div>
                    <p className="font-bold text-(--gm-text) text-base">{celebrity.name}</p>
                    <p className="text-xs text-(--gm-gold) font-bold uppercase tracking-widest mt-1">{celebrity.birthday} · {celebrity.field}</p>
                  </div>
                  <p className="text-xs italic text-(--gm-text-dim) max-w-[200px] text-right">{celebrity.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-(--gm-text-dim)">
              {L.label} {ui('ui_zodiac_celebrities_empty', 'celebrity lists should include people with verified birth dates.')}
            </p>
          )}
          <Link
            href={localizePath(localePrefix, '/unluler-ve-burclari')}
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold) hover:text-(--gm-gold-light) transition-colors"
          >
            {ui('ui_zodiac_all_celebrities_link', 'All celebrity zodiac archive')}
            <ArrowRight className="size-4" />
          </Link>
        </article>
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-8 mb-20">
        <TabsList className="w-full bg-(--gm-bg-deep) p-1.5 rounded-full border border-(--gm-border-soft)">
          <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
            <Info className="w-4 h-4 mr-2" /> {ui('ui_zodiac_tab_overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" /> {ui('ui_zodiac_tab_daily', 'Daily Reading')}
          </TabsTrigger>
          {displaySections.map((s: ZodiacSection) => (
            <TabsTrigger key={s.id} value={s.key2} className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
              {s.key2 === 'love' && <Heart className="w-4 h-4 mr-2" />}
              {s.key2 === 'career' && <Briefcase className="w-4 h-4 mr-2" />}
              {s.key2 === 'personality' && <Star className="w-4 h-4 mr-2" />}
              {s.key2 === 'health' && <HeartPulse className="w-4 h-4 mr-2" />}
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-(--gm-surface) p-8 md:p-12 rounded-[2rem] border border-(--gm-border-soft) shadow-(--gm-shadow-soft)"
          >
            <div className="text-xl leading-relaxed whitespace-pre-wrap text-(--gm-text) font-serif opacity-90">
              {info.content}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="daily" className="mt-0">
          {!today && (
            <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-[2rem] p-16 text-center shadow-(--gm-shadow-soft)">
              <Sparkles className="w-16 h-16 text-(--gm-gold) mx-auto mb-6 opacity-40 animate-pulse" />
              <h3 className={`${cinzel.className} text-3xl text-(--gm-text) mb-4`}>
                {ui('ui_zodiac_daily_empty_title', 'Daily reading is being prepared')}
              </h3>
              <p className="text-(--gm-text-dim) max-w-lg mx-auto leading-relaxed font-serif italic text-lg">
                {L.label} {ui('ui_zodiac_daily_empty_text', 'daily reading is not published yet. Our astrology team is preparing it; check again tomorrow or get a personal birth chart analysis.')}
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={`/${locale}/birth-chart`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-(--gm-primary) hover:bg-(--gm-primary-dark) text-(--gm-bg) text-xs font-bold uppercase tracking-[0.25em] transition-all hover:scale-105 shadow-md"
                >
                  {ui('ui_zodiac_cta_birth_chart', 'Create My Birth Chart')}
                </Link>
                <Link
                  href={`/${locale}/consultants?expertise=astrology`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) text-(--gm-gold) text-xs font-bold uppercase tracking-[0.25em] transition-all"
                >
                  {ui('ui_zodiac_cta_ask_astrologer', 'Ask an Astrologer')}
                </Link>
              </div>
            </div>
          )}
          {today && (() => {
            const todayContent = String((today as any)?.contentTr ?? (today as any)?.content ?? '');
            const todayDate = (today as any)?.date as string | undefined;
            const todayMood = (today as any)?.moodScore;
            const todayLuckyNumber = (today as any)?.luckyNumber;
            const todayLuckyColor = (today as any)?.luckyColor;
            return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-(--gm-surface) to-(--gm-bg-deep) p-8 md:p-16 rounded-[3rem] border border-(--gm-gold)/20 relative overflow-hidden shadow-(--gm-shadow-card)"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-40 h-40 text-(--gm-gold)" />
              </div>

              <div className="relative">
                {todayDate && (
                  <div className="flex items-center gap-6 mb-12">
                    <div className="h-px flex-1 bg-(--gm-gold)/20" />
                    <span className={`${cinzel.className} text-(--gm-gold) text-xl tracking-[0.3em] uppercase backdrop-blur-md px-4`}>
                      {new Date(todayDate).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="h-px flex-1 bg-(--gm-gold)/20" />
                  </div>
                )}

                <div className="text-2xl md:text-4xl leading-relaxed text-(--gm-text) mb-16 text-center font-serif italic font-medium opacity-90 max-w-4xl mx-auto">
                  &quot;{todayContent}&quot;
                </div>

                <div className="flex justify-center mb-16">
                  <ShareCard
                    title={`${L.label} ${ui('ui_zodiac_share_title_suffix', 'Daily Reading')}`}
                    shareText={`${L.label} ${ui('ui_zodiac_share_text_intro', 'daily reading for today')}\n"${todayContent.slice(0, 100)}..."\n${ui('ui_zodiac_share_text_outro', 'What does your sign say today?')}`}
                    variant="horoscope"
                    data={{
                      sign: L.label,
                      date: todayDate ? new Date(todayDate).toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' }) : '',
                      symbol: meta.symbol,
                      content: todayContent,
                    }}
                  />
                </div>

                {(todayMood != null || todayLuckyNumber != null || todayLuckyColor != null) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {todayMood != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">{ui('ui_zodiac_mood_label', 'Mood of the Day')}</div>
                        <div className={`${cinzel.className} text-4xl text-(--gm-text)`}>{String(todayMood)}/10</div>
                      </div>
                    )}
                    {todayLuckyNumber != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">{ui('ui_zodiac_lucky_number_label', 'Lucky Number')}</div>
                        <div className={`${cinzel.className} text-4xl text-(--gm-text)`}>{String(todayLuckyNumber)}</div>
                      </div>
                    )}
                    {todayLuckyColor != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">{ui('ui_zodiac_lucky_color_label', 'Lucky Color')}</div>
                        <div className={`${cinzel.className} text-xl font-bold text-(--gm-text) uppercase tracking-widest`}>{String(todayLuckyColor)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            );
          })()}
        </TabsContent>

        {displaySections.map((s: ZodiacSection) => (
          <TabsContent key={s.id} value={s.key2} className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-(--gm-surface) p-8 md:p-12 rounded-[2rem] border border-(--gm-border-soft) shadow-(--gm-shadow-soft)"
            >
              <h3 className={`${cinzel.className} text-3xl mb-8 text-(--gm-gold)`}>{s.title}</h3>
              <div className="text-xl leading-relaxed whitespace-pre-wrap text-(--gm-text) font-serif opacity-90">
                {s.content}
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
      </>
      )}

      {!sectionFocus && (
      <>
      <div className="mb-20">
        <FaqAccordion items={zodiacFaq.items} title={zodiacFaq.title} />
      </div>

      <div className="mb-20">
        <AuthorBio
          name={`${brand.name} Editorial Team`}
          title={ui('ui_zodiac_author_title', 'Astrology and spiritual guidance editors')}
          bio={`${brand.name} ${ui('ui_zodiac_author_bio', 'content is prepared with astrological symbolism, practical self-awareness and clear guidance principles so users can arrive better prepared for consultant sessions.')}`}
          expertise={[ui('ui_zodiac_author_exp_astrology', 'Astrology'), ui('ui_zodiac_author_exp_zodiac', 'Zodiac'), ui('ui_zodiac_author_exp_spiritual', 'Spiritual Guidance')]}
          certificates={[ui('ui_zodiac_author_cert', 'Swiss Ephemeris metodolojisi')]}
        />
      </div>

      {/* Internal Linking CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link
          href={localizePath(localePrefix, `/burclar/uyum/${signKey}-koc`)}
          className="p-10 rounded-[2.5rem] bg-(--gm-surface) border border-(--gm-border-soft) hover:border-(--gm-gold)/40 transition-all group shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow)"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-(--gm-error)/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-[var(--gm-error)]" />
            </div>
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_zodiac_card_compat_title', 'Zodiac Compatibility')}</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            {L.label} {ui('ui_zodiac_card_compat_text', 'love and character compatibility with other signs in detail.')}
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            {ui('ui_zodiac_card_compat_action', 'EXPLORE COMPATIBILITY')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href={localizePath(localePrefix, '/birth-chart')}
          className="p-10 rounded-[2.5rem] bg-(--gm-bg-deep) border border-(--gm-gold)/20 hover:border-(--gm-gold)/40 transition-all group shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow)"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-(--gm-gold)/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-(--gm-gold)" />
            </div>
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_zodiac_card_chart_title', 'Birth Chart')}</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            {ui('ui_zodiac_card_chart_text', 'You are more than your Sun sign. Calculate all your planet placements for free.')}
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            {ui('ui_zodiac_card_chart_action', 'CREATE CHART')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href={localizePath(localePrefix, `/burclar/${signKey}/meditasyon`)}
          className="p-10 rounded-[2.5rem] bg-(--gm-surface) border border-(--gm-border-soft) hover:border-(--gm-gold)/40 transition-all group shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow)"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-(--gm-gold)/10 flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-(--gm-gold)" />
            </div>
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_zodiac_card_meditation_title', 'Meditasyon')}</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            {L.label} {ui('ui_zodiac_card_meditation_text', 'short meditation and daily affirmations in audio form.')}
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            {ui('ui_zodiac_card_meditation_action', 'LISTEN')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
      </>
      )}
    </div>
  );
}
