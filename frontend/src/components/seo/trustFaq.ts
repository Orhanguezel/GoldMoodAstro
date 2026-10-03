// Ana sayfa ve Hakkımızda için SSS içerikleri (SEO katalog 2026-10-03:
// "sıkça sorulan sorular bölümü" ve "somut bilgi" sinyalleri eksikti).
// Yalnız sitede gerçekten çalışan akışları anlatır; marka/şirket adı veriden
// gelir (MARKA KURALI).

import type { FaqAccordionItem } from '@/components/common/FaqAccordion';

type Lang = 'tr' | 'en' | 'de';
export type CompanyFacts = { brand: string; legalName?: string; city?: string };

const lang = (locale: string): Lang => (locale === 'en' || locale === 'de' ? locale : 'tr');

export function homeFaq(locale: string, { brand }: CompanyFacts): { title: string; eyebrow: string; items: FaqAccordionItem[] } {
  const l = lang(locale);
  if (l === 'de') {
    return {
      title: 'Häufige Fragen', eyebrow: 'FAQ',
      items: [
        { question: 'Wie werden die Berater geprüft?', answer: `Jedes Beraterprofil wird vor der Veröffentlichung vom ${brand}-Team geprüft. Profile ohne Freigabe, Foto oder Preis erscheinen nicht in der Liste.` },
        { question: 'Wie läuft eine Live-Sitzung ab?', answer: 'Sie wählen einen Berater, buchen einen Termin oder eine Sofortsitzung und sprechen direkt über die Plattform. Berater mit Videoangebot bieten zusätzlich Videositzungen an.' },
        { question: 'Ist die Zahlung sicher?', answer: `Kartenzahlungen laufen über Stripe Checkout. Ihre Kartennummer erreicht die ${brand}-Server nicht und wird dort nicht gespeichert.` },
        { question: 'Kann ich Numerologie und Aszendent kostenlos berechnen?', answer: 'Ja, Rechner wie Numerologie und Aszendent können Sie kostenlos ausprobieren. Live-Sitzungen mit Beratern sind kostenpflichtig; die Preise stehen offen im jeweiligen Profil.' },
      ],
    };
  }
  if (l === 'en') {
    return {
      title: 'Frequently Asked Questions', eyebrow: 'FAQ',
      items: [
        { question: 'How are consultants approved?', answer: `Every consultant profile is reviewed by the ${brand} team before it is published. Profiles without approval, a photo or a price do not appear in the list.` },
        { question: 'How does a live session work?', answer: 'Choose a consultant, book a scheduled or instant session and talk directly on the platform. Consultants who offer video also provide video sessions.' },
        { question: 'Is payment secure?', answer: `Card payments are processed by Stripe Checkout. Your card number never reaches or is stored on ${brand} servers.` },
        { question: 'Can I calculate numerology and my rising sign for free?', answer: 'Yes, tools such as the numerology and rising sign calculators are free to try. Live sessions with consultants are paid, and prices are shown openly on each profile.' },
      ],
    };
  }
  return {
    title: 'Sıkça Sorulan Sorular', eyebrow: 'SSS',
    items: [
      { question: 'Danışmanlar nasıl onaylanıyor?', answer: `Her danışman profili yayına alınmadan önce ${brand} ekibi tarafından incelenir. Onaylanmamış, fotoğrafı veya seans fiyatı eksik profiller listede görünmez.` },
      { question: 'Canlı seans nasıl yapılır?', answer: 'Danışmanınızı seçip planlı ya da anlık seans alırsınız ve görüşmeyi doğrudan platform üzerinden yaparsınız. Görüntülü seans sunan danışmanlarda görüntülü görüşme seçeneği de bulunur.' },
      { question: 'Ödeme güvenli mi?', answer: `Kart ödemeleri Stripe Checkout ile alınır. Kart numaranız ${brand} sunucularına ulaşmaz ve saklanmaz.` },
      { question: 'Numeroloji ve yükselen burç hesaplama ücretsiz mi?', answer: 'Evet, numeroloji ve yükselen burç hesaplayıcı gibi araçları ücretsiz deneyebilirsiniz. Danışmanlarla canlı seanslar ücretlidir ve fiyatlar her profilde açıkça yazar.' },
    ],
  };
}

export function aboutFaq(locale: string, { brand, legalName, city }: CompanyFacts): { title: string; eyebrow: string; items: FaqAccordionItem[] } {
  const l = lang(locale);
  const operator = legalName ? (city ? `${legalName} (${city})` : legalName) : '';
  if (l === 'de') {
    return {
      title: 'Mission und Vertrauen', eyebrow: 'FAQ',
      items: [
        { question: `Was ist die Mission von ${brand}?`, answer: 'Astrologie, Tarot und Numerologie verständlich, sicher und zugänglich für die Selbstreflexion zu machen – ohne Versprechen fester Ergebnisse.' },
        { question: 'Warum kann ich den Beratern vertrauen?', answer: 'Jedes Profil wird vor der Veröffentlichung geprüft. Fachgebiet, Sprache, Sitzungspreis und Bewertungen aus abgeschlossenen Sitzungen sind im Profil sichtbar.' },
        ...(operator ? [{ question: `Wer betreibt ${brand}?`, answer: `${brand} wird von ${operator} betrieben. Der Service ist auf Türkisch, Englisch und Deutsch verfügbar.` }] : []),
      ],
    };
  }
  if (l === 'en') {
    return {
      title: 'Mission and Trust', eyebrow: 'FAQ',
      items: [
        { question: `What is the mission of ${brand}?`, answer: 'To make astrology, tarot and numerology clear, safe and accessible for self-reflection, without promising fixed outcomes.' },
        { question: 'Why can I trust the consultants?', answer: 'Every profile is reviewed before publication. Expertise, language, session price and reviews from completed sessions are visible on each profile.' },
        ...(operator ? [{ question: `Who operates ${brand}?`, answer: `${brand} is operated by ${operator}. The service is available in Turkish, English and German.` }] : []),
      ],
    };
  }
  return {
    title: 'Misyon ve Güven', eyebrow: 'SSS',
    items: [
      { question: `${brand} misyonu nedir?`, answer: 'Astroloji, tarot ve numerolojiyi kişisel farkındalık için anlaşılır, güvenli ve erişilebilir kılmak; kesin sonuç vaadi yerine düşünmeye yardımcı bir rehberlik sunmak.' },
      { question: 'Danışmanlara neden güvenebilirim?', answer: 'Her profil yayına alınmadan önce incelenir. Uzmanlık alanı, dil, seans fiyatı ve tamamlanmış seanslardan gelen yorumlar her profilde görünür.' },
      ...(operator ? [{ question: `${brand} platformunu kim işletiyor?`, answer: `${brand}, ${operator} tarafından işletilir. Hizmet Türkçe, İngilizce ve Almanca olarak sunulur.` }] : []),
    ],
  };
}
