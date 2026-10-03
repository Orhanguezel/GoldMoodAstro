import ContactPage from '@/components/containers/contact/ContactPage';
import PageContainer from '@/components/common/PageContainer';
import { fetchSetting } from '@/i18n/server';
import { safeJson, safeStr } from '@/integrations/shared';
import PageFaqSection from '@/components/seo/PageFaqSection';
import { toLocalizedPublicPath, type PublicLocale } from '@/i18n/localizedRoutes';

type CompanyBrand = Partial<{
  name: string;
  legal_name: string;
  mersis: string;
  tax_office: string;
  tax_no: string;
  trade_registry: string;
  address: string;
  phone: string;
  email: string;
}>;

export const revalidate = 300;

// İletişim sayfası 85 kelimelik ince içerikti ve /tr'de İngilizce yedekler
// basıyordu (SEO katalog 2026-10-03). Aşağıdaki metinler yalnız sitede
// gerçekten var olan akışları anlatır; süre/garanti vaadi içermez.
const COPY = {
  tr: {
    eyebrow: 'Şirket Künyesi',
    h1: 'İletişim ve Destek',
    legalName: 'Ticari Unvan', address: 'Adres', phone: 'Telefon', email: 'E-posta', taxNo: 'Vergi No',
    helpTitle: 'Size nasıl yardımcı olabiliriz?',
    helpIntro: 'Mesajınızı doğru konu başlığıyla gönderirseniz ekibimiz talebinizi daha hızlı ilgili kişiye yönlendirir. Sık sorulan konular için aşağıdaki sayfalar çoğu sorunun cevabını içerir.',
    topics: [
      { title: 'Randevu ve seanslar', body: 'Danışman profillerini uzmanlık, dil, fiyat ve müsaitliğe göre karşılaştırıp anlık ya da planlı seans alabilirsiniz.', linkLabel: 'Danışmanları incele', path: '/consultants' },
      { title: 'Ödeme ve ücretler', body: 'Kart ödemeleri Stripe Checkout ile alınır; kart bilgileriniz GoldMoodAstro sunucularında saklanmaz. Seans ve üyelik ücretleri fiyatlandırma sayfasında açıkça listelenir.', linkLabel: 'Fiyatlandırmayı gör', path: '/pricing' },
      { title: 'Danışman başvurusu', body: 'Astroloji, tarot, numeroloji veya ruhsal rehberlik alanında danışmanlık veriyorsanız başvuru formuyla profilinizi oluşturup onaya gönderebilirsiniz.', linkLabel: 'Danışman ol', path: '/become-consultant' },
      { title: 'İçerik ve editoryal sorular', body: 'Blog ve rehber içeriklerimizin nasıl hazırlandığını, hangi konuların kapsam dışında kaldığını editör politikamızda bulabilirsiniz.', linkLabel: 'Editör politikası', path: '/editorial-policy' },
    ],
    faqTitle: 'İletişim Hakkında Sorular',
    faq: [
      { question: 'Hangi konularda destek alabilirim?', answer: 'Hesap, randevu, ödeme, danışman başvurusu ve kurumsal işbirlikleri için iletişim formunu kullanabilirsiniz. Sık sorulan sorular sayfası da birçok konuyu yanıtlar.' },
      { question: 'Ödeme sırasında kart bilgilerim nerede işlenir?', answer: 'Kart ödemeleri Stripe Checkout üzerinden işlenir. Kart numaranız GoldMoodAstro sunucularına ulaşmaz ve saklanmaz.' },
      { question: 'Danışman olarak nasıl başvururum?', answer: 'Danışman ol sayfasındaki formu doldurup profil bilgilerinizi gönderebilirsiniz. Profiller yayına alınmadan önce ekibimiz tarafından incelenir.' },
    ],
  },
  en: {
    eyebrow: 'Company Details',
    h1: 'Contact and Support',
    legalName: 'Legal name', address: 'Address', phone: 'Phone', email: 'Email', taxNo: 'Tax ID',
    helpTitle: 'How can we help?',
    helpIntro: 'Choosing the right topic helps our team route your message to the right person faster. The pages below answer most common questions.',
    topics: [
      { title: 'Bookings and sessions', body: 'Compare consultant profiles by expertise, language, price and availability, then book an instant or scheduled session.', linkLabel: 'Browse consultants', path: '/consultants' },
      { title: 'Payments and pricing', body: 'Card payments are processed by Stripe Checkout; your card details are not stored on GoldMoodAstro servers. Session and membership prices are listed on the pricing page.', linkLabel: 'See pricing', path: '/pricing' },
      { title: 'Consultant applications', body: 'If you offer astrology, tarot, numerology or spiritual guidance sessions, you can create a profile with the application form and submit it for review.', linkLabel: 'Become a consultant', path: '/become-consultant' },
      { title: 'Content and editorial questions', body: 'Our editorial policy explains how blog and guide content is prepared and which topics are out of scope.', linkLabel: 'Editorial policy', path: '/editorial-policy' },
    ],
    faqTitle: 'Questions About Contacting Us',
    faq: [
      { question: 'What can I get support with?', answer: 'Use the contact form for account, booking, payment, consultant application and partnership questions. The FAQ page also answers many topics.' },
      { question: 'Where are my card details processed?', answer: 'Card payments are processed through Stripe Checkout. Your card number never reaches or is stored on GoldMoodAstro servers.' },
      { question: 'How do I apply as a consultant?', answer: 'Fill in the form on the become-a-consultant page and submit your profile details. Profiles are reviewed by our team before they are published.' },
    ],
  },
  de: {
    eyebrow: 'Impressumsangaben',
    h1: 'Kontakt und Support',
    legalName: 'Firmenname', address: 'Adresse', phone: 'Telefon', email: 'E-Mail', taxNo: 'Steuernummer',
    helpTitle: 'Wie können wir helfen?',
    helpIntro: 'Mit dem passenden Thema leitet unser Team Ihre Nachricht schneller an die richtige Person weiter. Die folgenden Seiten beantworten die häufigsten Fragen.',
    topics: [
      { title: 'Termine und Sitzungen', body: 'Vergleichen Sie Beraterprofile nach Fachgebiet, Sprache, Preis und Verfügbarkeit und buchen Sie eine sofortige oder geplante Sitzung.', linkLabel: 'Berater ansehen', path: '/consultants' },
      { title: 'Zahlung und Preise', body: 'Kartenzahlungen werden über Stripe Checkout abgewickelt; Ihre Kartendaten werden nicht auf GoldMoodAstro-Servern gespeichert. Sitzungs- und Mitgliedspreise stehen auf der Preisseite.', linkLabel: 'Preise ansehen', path: '/pricing' },
      { title: 'Bewerbung als Berater', body: 'Wenn Sie Astrologie, Tarot, Numerologie oder spirituelle Begleitung anbieten, können Sie mit dem Bewerbungsformular ein Profil anlegen und zur Prüfung einreichen.', linkLabel: 'Berater werden', path: '/become-consultant' },
      { title: 'Inhalte und Redaktion', body: 'Unsere Redaktionsrichtlinie erklärt, wie Blog- und Ratgeberinhalte entstehen und welche Themen ausgeschlossen sind.', linkLabel: 'Redaktionsrichtlinie', path: '/editorial-policy' },
    ],
    faqTitle: 'Fragen zur Kontaktaufnahme',
    faq: [
      { question: 'Wobei erhalte ich Unterstützung?', answer: 'Nutzen Sie das Kontaktformular für Fragen zu Konto, Terminen, Zahlungen, Beraterbewerbungen und Kooperationen. Auch die FAQ-Seite beantwortet viele Themen.' },
      { question: 'Wo werden meine Kartendaten verarbeitet?', answer: 'Kartenzahlungen laufen über Stripe Checkout. Ihre Kartennummer erreicht die GoldMoodAstro-Server nicht und wird dort nicht gespeichert.' },
      { question: 'Wie bewerbe ich mich als Berater?', answer: 'Füllen Sie das Formular auf der Seite „Berater werden“ aus. Profile werden vor der Veröffentlichung von unserem Team geprüft.' },
    ],
  },
} as const;

function settingValue<T>(row: Awaited<ReturnType<typeof fetchSetting>>, fallback: T): T {
  return safeJson<T>((row as any)?.value, fallback);
}

export default async function ContactRoutePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = 'tr' } = await params;
  const companyRow = await fetchSetting('company_brand', '*', { revalidate: 300 });
  const company = settingValue<CompanyBrand>(companyRow, {});
  const legalName = safeStr(company.legal_name || company.name || 'GoldMoodAstro');
  const address = safeStr(company.address);
  const phone = safeStr(company.phone);
  const email = safeStr(company.email);
  const lc = (locale === 'en' || locale === 'de' ? locale : 'tr') as PublicLocale;
  const t = COPY[lc];
  const href = (path: string) => `/${lc}${toLocalizedPublicPath(lc, path)}`;

  return (
    <PageContainer pad="large">
      <section className="mb-12 rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-6 md:p-8 shadow-(--gm-shadow-soft)">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-(--gm-gold-dim)">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl text-(--gm-text)">
          {t.h1}
        </h1>
        <dl className="mt-6 grid gap-4 text-sm text-(--gm-text-dim) md:grid-cols-2">
          <div>
            <dt className="font-bold text-(--gm-text)">{t.legalName}</dt>
            <dd className="mt-1">{legalName}</dd>
          </div>
          {address && (
            <div>
              <dt className="font-bold text-(--gm-text)">{t.address}</dt>
              <dd className="mt-1">{address}</dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="font-bold text-(--gm-text)">{t.phone}</dt>
              <dd className="mt-1"><a href={`tel:${phone}`}>{phone}</a></dd>
            </div>
          )}
          {email && (
            <div>
              <dt className="font-bold text-(--gm-text)">{t.email}</dt>
              <dd className="mt-1"><a href={`mailto:${email}`}>{email}</a></dd>
            </div>
          )}
          {safeStr(company.mersis) && (
            <div>
              <dt className="font-bold text-(--gm-text)">MERSİS</dt>
              <dd className="mt-1">{safeStr(company.mersis)}</dd>
            </div>
          )}
          {safeStr(company.tax_no) && (
            <div>
              <dt className="font-bold text-(--gm-text)">{t.taxNo}</dt>
              <dd className="mt-1">{safeStr(company.tax_no)}</dd>
            </div>
          )}
        </dl>
      </section>
      <ContactPage />
      <section className="mt-12 rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-6 md:p-8 shadow-(--gm-shadow-soft)">
        <h2 className="font-serif text-2xl text-(--gm-text)">{t.helpTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-(--gm-text-dim)">{t.helpIntro}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {t.topics.map((topic) => (
            <div key={topic.path} className="rounded-2xl border border-(--gm-border-soft) p-5">
              <h3 className="font-serif text-lg text-(--gm-text)">{topic.title}</h3>
              <p className="mt-2 text-sm leading-6 text-(--gm-text-dim)">{topic.body}</p>
              <a href={href(topic.path)} className="mt-3 inline-block text-sm font-semibold text-(--gm-gold)">
                {topic.linkLabel} →
              </a>
            </div>
          ))}
        </div>
      </section>
      <PageFaqSection
        id="contact-faq"
        items={t.faq.map((item) => ({ ...item }))}
        title={t.faqTitle}
        eyebrow={lc === 'tr' ? 'SSS' : 'FAQ'}
      />
    </PageContainer>
  );
}
