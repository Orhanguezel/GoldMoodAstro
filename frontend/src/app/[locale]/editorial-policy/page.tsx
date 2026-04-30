import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, graph } from '@/seo/jsonld';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const COPY = {
  tr: {
    title: 'Editoryal Politika ve Metodoloji',
    description:
      'GoldMoodAstro içeriklerinin nasıl hazırlandığını, AI destekli üretimin nasıl kullanıldığını ve danışmanlık metodolojimizi açıkça anlatıyoruz.',
    back: 'Hakkımızda sayfasına dön',
    sections: [
      {
        title: 'İçerik ilkemiz',
        paragraphs: [
          'GoldMoodAstro’da yayınlanan içerikler, kullanıcıya kesin hükümler vermek için değil, daha bilinçli soru sormasına ve danışman görüşmesine daha hazırlıklı gelmesine yardımcı olmak için hazırlanır. Astroloji, tarot ve numeroloji sembolik dillerdir; kişisel sorumluluğun, tıbbi ya da hukuki kararların yerine geçmez.',
          'Her içerikte sade dil, korku üretmeyen anlatım ve uygulanabilir farkındalık önceliklidir. Kullanıcıyı bağımlı hale getiren, kesin felaket ya da kesin mucize vadeden ifadeleri editoryal olarak uygun bulmayız.',
        ],
      },
      {
        title: 'AI destekli üretim şeffaflığı',
        paragraphs: [
          'Bazı genel bilgilendirme içeriklerinde LLM destekli taslaklama kullanılabilir. Bu kullanımın amacı otorite taklidi yapmak değil; konu başlıklarını düzenlemek, metni daha okunabilir hale getirmek ve çok dilli yayın akışını hızlandırmaktır.',
          'AI destekli taslaklar GoldMoodAstro editoryal ekibi tarafından kontrol edilir. Astroloji, tarot, numeroloji ve ilişki danışmanlığı gibi hassas başlıklarda nihai metin; sorumlu dil, bağlam, etik sınırlar ve platform metodolojisi açısından gözden geçirilir.',
        ],
      },
      {
        title: 'Astroloji metodolojisi',
        paragraphs: [
          'Doğum haritası ve gezegen hesaplamalarında Swiss Ephemeris temelli teknik yaklaşım referans alınır. Gezegen konumları, evler, açılar ve yükselen burç gibi veriler yorumun altyapısını oluşturur; ancak kişisel değerlendirme danışmanın yorum emeğiyle tamamlanır.',
          'Güneş burcu içerikleri genel rehber niteliğindedir. Daha hassas yorum için doğum saati, doğum yeri, Ay burcu, yükselen burç, evler ve açılar birlikte ele alınmalıdır.',
        ],
      },
      {
        title: 'Tarot ve numeroloji yaklaşımı',
        paragraphs: [
          'Tarot içeriklerinde Rider-Waite-Smith sembolizmi ana referanslardan biridir. Kartlar sabit kader cümleleri olarak değil; soru, duygu ve olasılıkları konuşulabilir hale getiren sembolik araçlar olarak yorumlanır.',
          'Numeroloji içerikleri isim ve doğum tarihi üzerinden hayat yolu, kader sayısı ve kişisel döngüleri anlamaya yardımcı olur. Bu yorumlar kişisel kararların yerine geçmez; farkındalık ve öz değerlendirme için kullanılır.',
        ],
      },
      {
        title: 'Kim gözden geçirir?',
        paragraphs: [
          'GoldMoodAstro içerikleri editoryal ekip tarafından hazırlanır ve yayın öncesinde platformun sorumlu rehberlik ilkeleriyle uyumu kontrol edilir. Danışman profilleri, hizmet paketleri ve kullanıcıya temas eden içeriklerde açıklık, doğruluk ve güvenli dil önceliklidir.',
          'Danışmanlık seanslarında verilen yorumlar, ilgili danışmanın uzmanlık alanı ve kullanıcının paylaştığı bağlamla şekillenir. Platform içerikleri genel bilgilendirme; bire bir seanslar ise kişisel değerlendirme alanıdır.',
        ],
      },
    ],
  },
  en: {
    title: 'Editorial Policy and Methodology',
    description:
      'How GoldMoodAstro prepares content, uses AI-assisted drafting and applies responsible spiritual guidance methodology.',
    back: 'Back to About',
    sections: [
      { title: 'Content principle', paragraphs: ['GoldMoodAstro content is written to help users ask clearer questions and prepare for consultations, not to give fixed life decisions.', 'We avoid fear-based claims, dependency language and absolute predictions.'] },
      { title: 'AI-assisted transparency', paragraphs: ['Some general educational content may use LLM-assisted drafting to structure topics and improve readability.', 'Drafts are reviewed by the GoldMoodAstro editorial team for responsible language, context and ethical boundaries.'] },
      { title: 'Astrology methodology', paragraphs: ['Birth chart calculations follow a Swiss Ephemeris based technical approach. Planet positions, houses, aspects and rising signs provide the calculation layer.', 'Sun sign pages are general guides; precise interpretation requires birth time, place, Moon, rising sign, houses and aspects.'] },
      { title: 'Tarot and numerology', paragraphs: ['Tarot content is informed by Rider-Waite-Smith symbolism and treats cards as symbolic guidance, not fixed fate.', 'Numerology interprets names and birth dates for self-awareness, not as a replacement for personal decisions.'] },
      { title: 'Review process', paragraphs: ['GoldMoodAstro content is reviewed by the editorial team before publishing.', 'Platform content is general information; one-to-one sessions provide personal context.'] },
    ],
  },
  de: {
    title: 'Redaktionelle Richtlinie und Methodik',
    description:
      'Wie GoldMoodAstro Inhalte erstellt, KI-gestützte Entwürfe nutzt und verantwortungsvolle spirituelle Beratung einordnet.',
    back: 'Zurück zu Über uns',
    sections: [
      { title: 'Inhaltsprinzip', paragraphs: ['GoldMoodAstro Inhalte sollen klarere Fragen und bessere Vorbereitung auf Beratungen ermöglichen, nicht feste Lebensentscheidungen ersetzen.', 'Wir vermeiden Angstkommunikation, Abhängigkeitssprache und absolute Vorhersagen.'] },
      { title: 'Transparenz zu KI-Unterstützung', paragraphs: ['Einige allgemeine Inhalte können LLM-gestützte Entwürfe nutzen, um Themen zu strukturieren und Lesbarkeit zu verbessern.', 'Entwürfe werden redaktionell auf verantwortungsvolle Sprache, Kontext und ethische Grenzen geprüft.'] },
      { title: 'Astrologische Methodik', paragraphs: ['Berechnungen folgen einem Swiss-Ephemeris-basierten Ansatz. Planetenstände, Häuser, Aspekte und Aszendent bilden die technische Grundlage.', 'Sonnenzeichen-Seiten sind allgemeine Leitfäden; genaue Deutung braucht Geburtszeit, Ort, Mond, Aszendent, Häuser und Aspekte.'] },
      { title: 'Tarot und Numerologie', paragraphs: ['Tarot orientiert sich an Rider-Waite-Smith-Symbolik und versteht Karten als symbolische Beratung, nicht als festes Schicksal.', 'Numerologie deutet Namen und Geburtsdaten zur Selbstreflexion, nicht als Ersatz für persönliche Entscheidungen.'] },
      { title: 'Prüfprozess', paragraphs: ['GoldMoodAstro Inhalte werden vor Veröffentlichung redaktionell geprüft.', 'Plattforminhalte sind allgemeine Information; persönliche Sitzungen liefern individuellen Kontext.'] },
    ],
  },
};

function getCopy(locale: string) {
  if (locale === 'en' || locale === 'de') return COPY[locale];
  return COPY.tr;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = getCopy(locale);
  return {
    title: `${copy.title} | GoldMoodAstro`,
    description: copy.description,
  };
}

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const pageUrl = `${SITE_URL}/${locale}/editorial-policy`;

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] px-4 py-24 text-[var(--gm-text)] md:py-32">
      <JsonLd
        id="editorial-policy"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
            { name: locale === 'tr' ? 'Hakkımızda' : 'About', item: `${SITE_URL}/${locale}/about` },
            { name: copy.title, item: pageUrl },
          ]),
          articleSchema({
            headline: copy.title,
            description: copy.description,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${SITE_URL}/${locale}/about` },
            publisherId: `${SITE_URL}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />

      <div className="mx-auto max-w-4xl">
        <Link href={`/${locale}/about`} className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-gold)]">
          {copy.back}
        </Link>
        <section data-speakable className="mt-8 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/60 p-6 md:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gm-gold-dim)]">
            GoldMoodAstro
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">{copy.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--gm-text-dim)]">{copy.description}</p>
        </section>

        <div className="mt-10 space-y-6">
          {copy.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/45 p-6 md:p-8">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-[var(--gm-text-dim)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <AuthorBio
          name="GoldMoodAstro Editorial Team"
          title={locale === 'tr' ? 'Editoryal ve metodoloji ekibi' : 'Editorial and methodology team'}
          bio={copy.description}
          expertise={['Astrology', 'Tarot', 'Numerology', 'Editorial Review']}
          certificates={['Swiss Ephemeris', 'Rider-Waite-Smith']}
        />
      </div>
    </main>
  );
}
