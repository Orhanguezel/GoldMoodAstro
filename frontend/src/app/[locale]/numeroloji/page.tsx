import React from 'react';
import NumerologyHub from '@/components/containers/numerology/NumerologyHub';
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
    pageKey: 'numeroloji',
    pathname: '/numeroloji',
    fallback: {
      title: 'Ücretsiz Numeroloji Analizi — İsim ve Kader Sayısı',
      description: 'İsminizdeki ve doğum tarihinizdeki gizli kodları çözün. Kader sayısı, ruh güdüsü ve hayat yolu analizi.',
    },
  });
}

export default async function NumerologyPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/numeroloji`;
  const faqItems = [
    {
      question: locale === 'tr' ? 'Numeroloji nedir?' : 'What is numerology?',
      answer: locale === 'tr'
        ? 'Numeroloji, isim ve doğum tarihi üzerinden hayat yolu, kader sayısı ve kişisel döngüler gibi sembolik anlamları yorumlayan sistemdir.'
        : 'Numerology interprets symbolic meanings such as life path, destiny number and personal cycles through name and birth date.',
    },
    {
      question: locale === 'tr' ? 'Numeroloji analizi ne işe yarar?' : 'What is numerology analysis useful for?',
      answer: locale === 'tr'
        ? 'Numeroloji analizi kişinin güçlü yanlarını, tekrar eden kalıplarını ve karar süreçlerinde dikkat edebileceği temaları fark etmesine yardımcı olur.'
        : 'Numerology analysis helps a person notice strengths, repeating patterns and themes to consider in decision-making.',
    },
  ];
  const intro =
    locale === 'tr'
      ? {
          eyebrow: 'Numeroloji Rehberi',
          title: 'Numeroloji nedir, nasıl hesaplanır ve neyi fark ettirir?',
          lead:
            'Numeroloji, isim ve doğum tarihindeki sayıları sembolik bir harita gibi okuyarak kişinin ritmini, motivasyonunu ve tekrar eden yaşam temalarını anlamaya yardımcı olur.',
          summary:
            'Numeroloji kesin kader söylemez; isim, doğum tarihi ve sayı sembolizmi üzerinden kişinin güçlü yanlarını, karar alma biçimini ve dönemsel temalarını fark etmesine destek olur. GoldMoodAstro’da numeroloji, öz farkındalık ve kişisel ritim odağıyla yorumlanır.',
          sections: [
            {
              title: 'Numeroloji nasıl yapılır?',
              paragraphs: [
                'Numeroloji analizinde doğum tarihi ve isimdeki harfler belirli sayı değerlerine dönüştürülür. Bu değerler hayat yolu, kader sayısı, ruh güdüsü ve kişisel yıl gibi başlıklarda yorumlanır. Her sayı tek başına kesin bir karakter etiketi değildir; daha çok kişinin hangi temalara doğal olarak çekildiğini ve hangi alanlarda tekrar eden derslerle karşılaşabileceğini gösteren sembolik bir dildir.',
                'GoldMoodAstro numeroloji deneyimi, bu sembolleri sade ve uygulanabilir şekilde sunmayı hedefler. Kullanıcı yalnızca bir sayı sonucu görmekle kalmaz; bu sayının karar, ilişki, çalışma düzeni, duygusal ihtiyaç ve kişisel gelişim alanlarında nasıl okunabileceğini de görür.',
              ],
            },
            {
              title: 'Numeroloji ne öğrenmene yardımcı olur?',
              paragraphs: [
                'Numeroloji kişinin güçlü yanlarını, zorlandığı davranış kalıplarını ve dönemsel olarak hangi temalara daha açık olduğunu fark etmesine yardımcı olabilir. Örneğin hayat yolu sayısı genel yön duygusunu anlatırken, kişisel yıl sayısı belirli bir dönemde hangi enerjinin daha baskın olduğunu anlamayı kolaylaştırır.',
                'Bu analizler karar vermek için tek kaynak olmamalıdır; fakat kişinin kendini gözlemlemesi için güçlü bir başlangıç noktası sunabilir. Özellikle ilişki, kariyer ve kişisel ritim konularında “neden hep aynı döngüye giriyorum?” sorusuna daha yapılandırılmış bir bakış sağlar.',
              ],
            },
            {
              title: 'GoldMoodAstro numeroloji yaklaşımı',
              paragraphs: [
                'GoldMoodAstro numerolojiyi korku veya kesin kehanet diliyle kullanmaz. Sayılar, kişinin potansiyelini anlamasına ve kendi seçim alanını genişletmesine yardımcı olan semboller olarak ele alınır. Bir sayı zorlayıcı bir temaya işaret ediyorsa, bu bir mahkumiyet değil, üzerinde çalışılabilecek bir farkındalık alanıdır.',
                'Numeroloji sonucunu daha verimli kullanmak için doğum tarihinizi doğru girmek, isim bilgisini tutarlı yazmak ve çıkan yorumu günlük hayatınızdaki tekrar eden davranışlarla birlikte düşünmek önemlidir.',
                'Bir numeroloji raporu en çok, kişi sonucu kendi yaşam deneyimiyle karşılaştırdığında anlam kazanır. Örneğin bir sayı bağımsızlık temasını vurguluyorsa, bu yalnızca bağımsızsın demek değildir; kişinin ne zaman kendi kararını savunduğunu, ne zaman yalnız kalmaktan korktuğunu ve hangi ilişkilerde özgürlüğünü daha dengeli ifade edebileceğini araştırması için bir davettir.',
                'GoldMoodAstro’da numeroloji, danışmanlık görüşmelerine hazırlık aracı olarak da kullanılabilir. Kullanıcı hayat yolu, kader sayısı veya kişisel yıl yorumunu okuduktan sonra danışmana daha net sorularla gelebilir: “Bu döngüde hangi kararı ertelediğimi fark ediyorum?”, “İlişkilerimde hangi sayı teması tekrar ediyor?” veya “Kariyer yönümü seçerken hangi motivasyonum baskın?” Bu sorular numerolojiyi soyut bir meraktan çıkarıp uygulanabilir bir farkındalık çalışmasına dönüştürür.',
              ],
            },
          ],
        }
      : {
          eyebrow: 'Numerology Guide',
          title: 'What is numerology, how is it calculated and what can it reveal?',
          lead:
            'Numerology reads numbers in names and birth dates as symbolic patterns for rhythm, motivation and repeating life themes.',
          summary:
            'Numerology does not define fixed fate. It supports self-awareness by interpreting name, birth date and number symbolism around strengths, decision style and personal cycles.',
          sections: [
            { title: 'How numerology works', paragraphs: ['Birth dates and letters are converted into number values such as life path, destiny number, soul urge and personal year.', 'GoldMoodAstro presents these symbols in clear language so users can connect numbers with daily choices, relationships and personal growth.'] },
            { title: 'What numerology can show', paragraphs: ['Numerology can help users notice strengths, repeating patterns and themes that become more active in certain periods.', 'It should not be the only source for decisions, but it can create a useful structure for self-observation.'] },
            { title: 'GoldMoodAstro numerology approach', paragraphs: ['We avoid fear-based or deterministic language. Numbers are treated as symbols that widen awareness and choice.', 'For a better reading, enter birth data carefully and compare the result with recurring patterns in daily life.'] },
          ],
        };

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <JsonLd
        id="numerology-schema"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: locale === 'tr' ? 'Numeroloji' : 'Numerology', item: pageUrl },
          ]),
          articleSchema({
            headline: locale === 'tr' ? 'Numeroloji Analizi' : 'Numerology Analysis',
            description: locale === 'tr'
              ? 'İsim, doğum tarihi, hayat yolu ve kişisel döngüler üzerinden numeroloji rehberi.'
              : 'Numerology guide through name, birth date, life path and personal cycles.',
            image: `${siteUrl}/img/natal_chart.png`,
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
      <NumerologyHub />
      <FaqAccordion items={faqItems} title={locale === 'tr' ? 'Numeroloji Hakkında Sorular' : 'Numerology Questions'} />
      <AuthorBio
        name="GoldMoodAstro Editorial Team"
        title={locale === 'tr' ? 'Numeroloji ve kişisel döngü editörleri' : 'Numerology and personal cycles editors'}
        bio={locale === 'tr'
          ? 'GoldMoodAstro numeroloji içerikleri, isim ve doğum tarihi sembolizmini kişisel farkındalık odağıyla anlaşılır hale getirir.'
          : 'GoldMoodAstro numerology content makes name and birth date symbolism understandable through personal awareness.'}
        expertise={['Numeroloji', 'Kişisel Döngüler', 'Farkındalık']}
      />
    </main>
  );
}
