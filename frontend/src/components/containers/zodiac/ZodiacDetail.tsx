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
import { Star, Heart, Briefcase, Info, Sparkles, ArrowRight, Volume2 } from 'lucide-react';
import ShareCard from '@/components/common/ShareCard';
import { getZodiacMeta } from '@/lib/zodiac/signs';
import { getCelebritiesBySign } from '@/lib/zodiac/celebrities';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import { useBrand } from '@/hooks/useBrand';

const cinzel = Cinzel({ subsets: ['latin'] });
interface ZodiacDetailProps {
  initialTab?: string;
  initialInfo?: any | null;
  initialToday?: any | null;
}

type ZodiacSection = {
  id: string;
  key2: string;
  title: string;
  content: string;
};

export default function ZodiacDetail({ initialTab = 'overview', initialInfo = null, initialToday = null }: ZodiacDetailProps) {
  const { sign, locale } = useParams();
  const { brand } = useBrand();
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

  // Server-side initial data varsa RTK fetch'i atla — SSR'da hemen render olur.
  const { data: infoFromQuery, isLoading: isInfoLoading } = useGetSignInfoQuery(
    { sign: signKey, locale: locale as string },
    { skip: !!initialInfo }
  );
  const { data: todayFromQuery, isLoading: isTodayLoading } = useGetTodayHoroscopeQuery(
    { sign: signKey },
    { skip: !!initialToday }
  );

  const info = infoFromQuery ?? initialInfo;
  const today = todayFromQuery ?? initialToday;
  const summaryText = `${meta.label} burcu ${meta.element} elementi, ${meta.modality} nitelik ve ${meta.ruler} yönetimiyle okunur. Bu profil; karakter, ilişki, kariyer ve ruhsal bakım başlıklarında ${meta.label} enerjisinin güçlü yanlarını ve dikkat edilmesi gereken gölge alanlarını anlaşılır şekilde özetler.`;
  const personalitySection = info?.sections?.find((section: ZodiacSection) => section.key2 === 'personality');
  const loveSection = info?.sections?.find((section: ZodiacSection) => section.key2 === 'love');
  const celebrities = getCelebritiesBySign(signKey, 3);
  const localePrefix = typeof locale === 'string' ? locale : 'tr';
  const faqItems = [
    {
      question: `${meta.label} burcu nedir?`,
      answer: `${meta.label} burcu, güneşin ${meta.label} arketipinden geçtiği dönemde doğan kişilerin temel enerji, motivasyon ve davranış eğilimlerini anlatan astrolojik profildir.`,
    },
    {
      question: `${meta.label} burcu özellikleri nelerdir?`,
      answer: info?.short_summary || `${meta.label} burcu karakter, ilişki, kariyer ve gündelik motivasyon alanlarında kendine özgü güçlü yanlar ve gelişim alanları taşır.`,
    },
    {
      question: `${meta.label} burcu uyumu nasıl yorumlanır?`,
      answer: `${meta.label} burcu uyumu yalnızca güneş burcuyla değil; Ay, Venüs, Mars, yükselen burç ve haritadaki ilişki evleriyle birlikte değerlendirilmelidir.`,
    },
  ];

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
        <h2 className="text-2xl font-bold">Burç bilgisi bulunamadı.</h2>
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
                {meta.date}
              </span>
            </div>
            <h1 className={`${cinzel.className} text-4xl md:text-7xl mb-6 text-(--gm-text) leading-tight`}>
              {meta.label}
            </h1>
            <div className="mb-8 flex flex-wrap justify-center gap-2 md:justify-start">
              {[meta.element, meta.modality, meta.polarity, meta.ruler].filter(Boolean).map((item) => (
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
              &quot;{info.short_summary}&quot;
            </p>
          </div>
        </div>
      </motion.div>

      <section
        data-speakable
        className="mb-12 rounded-[2rem] border border-(--gm-gold)/20 bg-(--gm-gold)/5 p-8 md:p-12 backdrop-blur-sm"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--gm-gold) mb-4">Özetle</p>
        <p className="text-xl md:text-2xl leading-relaxed text-(--gm-text) font-serif italic opacity-90">{summaryText}</p>
      </section>

      <section className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{meta.label} burcu nedir?</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {info.short_summary || summaryText}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{meta.label} burcu özellikleri nelerdir?</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {personalitySection?.content || info.content}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{meta.label} burcu uyumu</h2>
          <p className="text-base leading-relaxed text-(--gm-text-dim) font-serif">
            {loveSection?.content || `${meta.label} burcu uyumu, ilişkide sevgi dili, güven ihtiyacı ve iki kişinin harita bütünlüğü üzerinden okunur.`}
          </p>
        </article>
        <article className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow) transition-shadow">
          <h2 className={`${cinzel.className} text-2xl text-(--gm-gold) mb-4`}>{meta.label} burçlu ünlüler</h2>
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
              {meta.label} burçlu ünlüler listesi hazırlanırken doğum tarihi doğrulanmış kişiler dikkate alınmalıdır.
            </p>
          )}
          <Link
            href={localizePath(localePrefix, '/unluler-ve-burclari')}
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold) hover:text-(--gm-gold-light) transition-colors"
          >
            Tüm ünlü burç arşivi
            <ArrowRight className="size-4" />
          </Link>
        </article>
      </section>

      {/* Main Content Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-8 mb-20">
        <TabsList className="w-full bg-(--gm-bg-deep) p-1.5 rounded-full border border-(--gm-border-soft)">
          <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
            <Info className="w-4 h-4 mr-2" /> Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" /> Günlük Yorum
          </TabsTrigger>
          {info.sections?.map((s: ZodiacSection) => (
            <TabsTrigger key={s.id} value={s.key2} className="rounded-full px-6 data-[state=active]:bg-(--gm-surface) data-[state=active]:text-(--gm-gold) data-[state=active]:shadow-sm">
              {s.key2 === 'love' && <Heart className="w-4 h-4 mr-2" />}
              {s.key2 === 'career' && <Briefcase className="w-4 h-4 mr-2" />}
              {s.key2 === 'personality' && <Star className="w-4 h-4 mr-2" />}
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
                Günlük yorum hazırlanıyor
              </h3>
              <p className="text-(--gm-text-dim) max-w-lg mx-auto leading-relaxed font-serif italic text-lg">
                {meta.label} burcu için bugünün yorumu henüz yayınlanmadı. Astrolog ekibimiz hazırlıyor — yarın tekrar göz at ya da kişiye özel doğum haritası analizi al.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={`/${locale}/birth-chart`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-(--gm-primary) hover:bg-(--gm-primary-dark) text-(--gm-bg) text-xs font-bold uppercase tracking-[0.25em] transition-all hover:scale-105 shadow-md"
                >
                  Doğum Haritamı Çıkar
                </Link>
                <Link
                  href={`/${locale}/consultants?expertise=astrology`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-(--gm-gold)/40 hover:border-(--gm-gold) text-(--gm-gold) text-xs font-bold uppercase tracking-[0.25em] transition-all"
                >
                  Astrologa Danış
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
                      {new Date(todayDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="h-px flex-1 bg-(--gm-gold)/20" />
                  </div>
                )}

                <div className="text-2xl md:text-4xl leading-relaxed text-(--gm-text) mb-16 text-center font-serif italic font-medium opacity-90 max-w-4xl mx-auto">
                  &quot;{todayContent}&quot;
                </div>

                <div className="flex justify-center mb-16">
                  <ShareCard
                    title={`${meta.label} Burcu Günlük Yorumu`}
                    shareText={`${meta.label} burcu için bugünkü yorumum ✨\n"${todayContent.slice(0, 100)}..."\nSenin burcun bugün ne diyor?`}
                    variant="horoscope"
                    data={{
                      sign: meta.label,
                      date: todayDate ? new Date(todayDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '',
                      symbol: meta.symbol,
                      content: todayContent,
                    }}
                  />
                </div>

                {(todayMood != null || todayLuckyNumber != null || todayLuckyColor != null) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {todayMood != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">Günün Modu</div>
                        <div className={`${cinzel.className} text-4xl text-(--gm-text)`}>{String(todayMood)}/10</div>
                      </div>
                    )}
                    {todayLuckyNumber != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">Şanslı Sayı</div>
                        <div className={`${cinzel.className} text-4xl text-(--gm-text)`}>{String(todayLuckyNumber)}</div>
                      </div>
                    )}
                    {todayLuckyColor != null && (
                      <div className="p-8 rounded-2xl bg-(--gm-bg-deep)/40 border border-(--gm-border-soft) text-center backdrop-blur-sm">
                        <div className="text-(--gm-gold) text-xs font-bold mb-4 uppercase tracking-[0.2em] opacity-80">Şanslı Renk</div>
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

        {info.sections?.map((s: ZodiacSection) => (
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

      <div className="mb-20">
        <FaqAccordion items={faqItems} title={`${meta.label} Burcu Hakkında Sorular`} />
      </div>

      <div className="mb-20">
        <AuthorBio
          name={`${brand.name} Editorial Team`}
          title="Astroloji ve ruhsal danışmanlık editörleri"
          bio={`${brand.name} içerikleri, kullanıcıların danışman görüşmelerine daha hazırlıklı gelmesi için astrolojik sembolizm, pratik öz farkındalık ve anlaşılır rehberlik ilkeleriyle hazırlanır.`}
          expertise={['Astroloji', 'Zodyak', 'Ruhsal Danışmanlık']}
          certificates={['Swiss Ephemeris metodolojisi']}
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
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>Burç Uyumu</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            {meta.label} burcunun diğer burçlarla olan aşk ve karakter uyumunu detaylıca inceleyin.
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            UYUMU KEŞFET <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>Doğum Haritası</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            Sadece Güneş burcunuzdan ibaret değilsiniz. Tüm gezegen yerleşimlerinizi ücretsiz hesaplayın.
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            HARİTANI ÇIKAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            <h4 className={`${cinzel.className} text-xl text-(--gm-text)`}>Meditasyon</h4>
          </div>
          <p className="text-(--gm-text-dim) text-sm mb-8 leading-relaxed font-serif italic">
            {meta.label} burcuna özel kısa meditasyon ve günlük affirmasyonları sesli dinleyin.
          </p>
          <div className="text-(--gm-gold) text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
            DİNLE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
