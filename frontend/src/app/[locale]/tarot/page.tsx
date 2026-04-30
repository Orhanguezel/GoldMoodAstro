import React from 'react';
import TarotHub from '@/components/containers/tarot/TarotHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import LandingIntro from '@/components/common/LandingIntro';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'tarot',
    pathname: '/tarot',
    fallback: {
      title: 'Ücretsiz Tarot Falı ve Kart Anlamları — GoldMoodAstro',
      description: 'Tek kart, üç kart veya Kelt Haçı açılımı ile Tarot rehberliğini keşfedin. Yapay zeka destekli derinlemesine kart yorumları.',
    },
  });
}

export default async function TarotPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/tarot`;
  const faqItems = [
    {
      question: locale === 'tr' ? 'Tarot falı nedir?' : 'What is a tarot reading?',
      answer: locale === 'tr'
        ? 'Tarot falı, kart sembolleri üzerinden kişinin soru, duygu ve olasılıklarını yorumlayan ruhsal rehberlik yöntemidir.'
        : 'A tarot reading is a spiritual guidance method that interprets questions, emotions and possibilities through card symbols.',
    },
    {
      question: locale === 'tr' ? 'Tarot kesin gelecek söyler mi?' : 'Does tarot predict the future with certainty?',
      answer: locale === 'tr'
        ? 'Tarot kesin kader bildirimi değil, mevcut enerjiler ve seçenekler hakkında farkındalık sağlayan sembolik bir rehberliktir.'
        : 'Tarot is not a fixed fate statement; it is symbolic guidance that brings awareness to current energies and choices.',
    },
  ];
  const intro =
    locale === 'tr'
      ? {
          eyebrow: 'Tarot Rehberliği',
          title: 'Tarot falı nedir, nasıl yapılır ve sana ne gösterir?',
          lead:
            'Tarot, kartların sembolik diliyle kişinin içinde bulunduğu duyguyu, seçenekleri ve karar alanlarını görünür kılan bir rehberlik yöntemidir.',
          summary:
            'Tarot kesin gelecek söylemez; mevcut enerji, soru ve seçenekler üzerine düşünmek için sembolik bir alan açar. GoldMoodAstro’da tarot; tek kart, üç kart ve daha derin açılımlarla karar, ilişki, kariyer ve içsel farkındalık konularında sorumlu bir rehberlik diliyle yorumlanır.',
          sections: [
            {
              title: 'Tarot nasıl çalışır?',
              paragraphs: [
                'Tarot destesi, arketipler ve semboller üzerinden konuşan görsel bir dildir. Bir kart çekildiğinde yalnızca kartın sözlük anlamı değil, sorunun bağlamı, kişinin duygusal durumu ve açılım içindeki kart ilişkileri birlikte değerlendirilir. Bu yüzden tarot, mekanik bir cevap sistemi değildir; daha çok kişinin fark etmekte zorlandığı olasılıkları isimlendiren bir aynadır.',
                'GoldMoodAstro tarot deneyiminde tek kart açılımı hızlı bir içgörü için, üç kart açılımı geçmiş-şimdi-olasılık ekseninde daha dengeli bir okuma için, kapsamlı açılımlar ise karar, ilişki ve yön arayışı gibi daha katmanlı sorular için kullanılır. Her açılımda amaç kullanıcıyı korkutmak değil, sorusuna daha sakin ve bilinçli bakabilmesini sağlamaktır.',
              ],
            },
            {
              title: 'Tarot ne öğrenmene yardımcı olur?',
              paragraphs: [
                'Tarot; bir ilişkinin dinamiğini, bir kararın ardındaki duygu karmaşasını, kariyer yönündeki motivasyonu veya kişinin kendi iç sesini daha net duymasına yardımcı olabilir. Kartlar “şu kesin olacak” demek yerine “şu tema şu anda güçlü görünüyor” der. Bu fark, tarotun sorumlu kullanımında çok önemlidir.',
                'Bir açılım sonrasında kullanıcı genellikle üç şeyi daha net görür: asıl sorusunun ne olduğunu, hangi duygunun kararını etkilediğini ve hangi seçeneğin daha fazla farkındalık istediğini. Bu nedenle tarot, günlük meraktan öte bir öz değerlendirme pratiği olarak da kullanılabilir.',
              ],
            },
            {
              title: 'GoldMoodAstro tarot yaklaşımı',
              paragraphs: [
                'GoldMoodAstro tarot içerikleri Rider-Waite-Smith sembolizmini temel alır, ancak dili modern ve anlaşılır tutar. Kartlar korku, bağımlılık veya kesin kader iddiası için kullanılmaz. Aksine, kullanıcının seçeneklerini görmesine, sınırlarını anlamasına ve gerekiyorsa bir danışmanla daha derin bir konuşma başlatmasına yardımcı olur.',
                'Tarot açılımını daha verimli kullanmak için soruyu net kurmak önemlidir. “Ne olacak?” yerine “Bu konuda neyi görmem gerekiyor?”, “Bu ilişkide hangi dinamik baskın?” veya “Bu kararı verirken hangi ihtiyacımı gözden kaçırıyorum?” gibi sorular daha besleyici cevaplar üretir.',
                'Bir tarot yorumu okurken kartın olumlu ya da zorlayıcı görünmesine hemen karar vermemek gerekir. Bazı kartlar ilk bakışta ağır hissettirse de aslında sınır koyma, bitişi kabul etme, kendini koruma veya daha gerçekçi bir seçim yapma çağrısı taşıyabilir. Aynı şekilde parlak görünen kartlar da bazen acele iyimserliği değil, fırsatı bilinçli kullanma sorumluluğunu anlatır.',
                'GoldMoodAstro’da tarot, kişisel danışmanlıkla birleştiğinde daha derinleşir. Kullanıcı açılım sonucunu bir danışmanla konuşarak kartların kendi hikayesinde hangi duyguya, ilişki dinamiğine veya karar alanına temas ettiğini daha iyi anlayabilir. Böylece tarot yalnızca fal bakma deneyimi olmaktan çıkar; kişinin içsel pusulasını dinlediği, seçeneklerini tarttığı ve daha sakin karar aldığı bir farkındalık pratiğine dönüşür.',
              ],
            },
          ],
        }
      : {
          eyebrow: 'Tarot Guidance',
          title: 'What is tarot, how does it work and what can it show you?',
          lead:
            'Tarot is a symbolic guidance method that helps reveal emotions, options and decision patterns through the language of cards.',
          summary:
            'Tarot does not give fixed future statements. It opens a symbolic space to reflect on current energy, questions and choices. On GoldMoodAstro, tarot is interpreted through responsible guidance for relationships, career, decisions and self-awareness.',
          sections: [
            {
              title: 'How tarot works',
              paragraphs: [
                'A tarot deck speaks through archetypes and symbols. A card is not read only by its dictionary meaning; the question, emotional context and the relationship between cards all matter. Tarot is therefore not a mechanical answer system, but a mirror for possibilities that may be hard to name.',
                'Single card readings offer quick insight, three card spreads create a broader timeline, and deeper spreads help with layered questions about decisions, relationships and direction.',
              ],
            },
            {
              title: 'What tarot can help you learn',
              paragraphs: [
                'Tarot can clarify relationship dynamics, emotional confusion around a choice, career motivation or the quiet voice underneath a question. It does not say “this will happen”; it says “this theme is asking for attention.”',
                'After a reading, users often see the real question, the emotion influencing the decision and the option that requires more awareness.',
              ],
            },
            {
              title: 'GoldMoodAstro tarot approach',
              paragraphs: [
                'GoldMoodAstro tarot content is informed by Rider-Waite-Smith symbolism and written in clear modern language. We avoid fear, dependency and absolute fate claims.',
                'A strong tarot question is specific and reflective. Instead of “what will happen?”, ask “what do I need to see here?” or “which dynamic is active in this relationship?”',
              ],
            },
          ],
        };

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <JsonLd
        id="tarot-schema"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: locale === 'tr' ? 'Tarot' : 'Tarot', item: pageUrl },
          ]),
          articleSchema({
            headline: locale === 'tr' ? 'Tarot Falı ve Kart Anlamları' : 'Tarot Reading and Card Meanings',
            description:
              locale === 'tr'
                ? 'Tek kart, üç kart ve Kelt Haçı açılımlarıyla tarot rehberliği, kart anlamları ve ruhsal yorumlar.'
                : 'Tarot guidance with single card, three card and Celtic Cross spreads, card meanings and spiritual interpretations.',
            image: `${siteUrl}/img/tarot.png`,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(faqItems),
        ])}
      />
      <LandingIntro {...intro} />
      <TarotHub />
      <FaqAccordion items={faqItems} title={locale === 'tr' ? 'Tarot Hakkında Sorular' : 'Tarot Questions'} />
      <AuthorBio
        name="GoldMoodAstro Editorial Team"
        title={locale === 'tr' ? 'Tarot ve sembolizm editörleri' : 'Tarot and symbolism editors'}
        bio={locale === 'tr'
          ? 'GoldMoodAstro tarot içerikleri, kart sembollerini gündelik farkındalık ve sorumlu ruhsal rehberlik diliyle yorumlamak için hazırlanır.'
          : 'GoldMoodAstro tarot content interprets card symbols through everyday awareness and responsible spiritual guidance.'}
        expertise={['Tarot', 'Sembolizm', 'Ruhsal Rehberlik']}
      />
    </main>
  );
}
