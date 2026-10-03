import type { Metadata } from 'next';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';

type Locale = 'tr' | 'en' | 'de';

const content = {
  tr: {
    title: 'GoldMoodAstro hesabını silme',
    intro: 'GoldMoodAstro uygulamasında oluşturduğunuz hesabın silinmesini buradan isteyebilirsiniz.',
    stepTitle: 'Silme talebi nasıl gönderilir?',
    step: 'Hesabınızla giriş yapın, Gizlilik ve Hesap sayfasında “Hesabımı Sil” bölümünden talebi onaylayın. Aynı işlemi mobil uygulamada Profil → Gizlilik ve Veri bölümünden de yapabilirsiniz.',
    action: 'Giriş yapıp silme talebi oluştur',
    signedIn: 'Zaten giriş yaptıysanız hesap silme sayfasına gidin',
    timingTitle: 'Süre ve veriler',
    timing: 'Talep oluşturulduğunda hesabınız 7 gün sonrasına silinmek üzere planlanır. Bu süre içinde aynı sayfadan talebinizi iptal edebilirsiniz. Planlanan tarihten sonra sunucu hesabı ve ona bağlı uygulama kayıtlarını siler; işlem periyodik olarak yürütülür. Yasal olarak saklanması gereken kayıtlar için Gizlilik Politikası geçerlidir.',
    help: 'Hesabınıza erişemiyorsanız destek@goldmoodastro.com adresinden yardım isteyin. Güvenlik için hesap sahipliğini doğrulamamız gerekebilir.',
    privacy: 'Gizlilik Politikası',
  },
  en: {
    title: 'Delete your GoldMoodAstro account',
    intro: 'You can request deletion of the account you created in the GoldMoodAstro app here.',
    stepTitle: 'How to submit a deletion request',
    step: 'Sign in to your account, open Privacy and Account, and confirm the request under Delete My Account. You can also use Profile → Privacy and Data in the mobile app.',
    action: 'Sign in and request deletion',
    signedIn: 'Already signed in? Open account deletion',
    timingTitle: 'Timing and data',
    timing: 'After you submit a request, account deletion is scheduled for 7 days later. You can cancel the request from the same page during that period. After the scheduled date, the server deletes the account and linked app records in its periodic sweep. The Privacy Policy describes records that must be kept for legal reasons.',
    help: 'If you cannot access your account, contact destek@goldmoodastro.com for help. We may need to verify account ownership for security.',
    privacy: 'Privacy Policy',
  },
  de: {
    title: 'GoldMoodAstro-Konto löschen',
    intro: 'Hier können Sie die Löschung Ihres in der GoldMoodAstro-App erstellten Kontos beantragen.',
    stepTitle: 'So stellen Sie den Löschantrag',
    step: 'Melden Sie sich an, öffnen Sie Datenschutz und Konto und bestätigen Sie den Antrag unter Konto löschen. In der mobilen App finden Sie dies unter Profil → Datenschutz und Daten.',
    action: 'Anmelden und Löschung beantragen',
    signedIn: 'Bereits angemeldet? Zur Kontolöschung',
    timingTitle: 'Frist und Daten',
    timing: 'Nach Ihrem Antrag wird die Kontolöschung für 7 Tage später geplant. In dieser Zeit können Sie den Antrag auf derselben Seite zurückziehen. Danach löscht der Server das Konto und verknüpfte App-Daten im regelmäßigen Löschlauf. Die Datenschutzerklärung beschreibt gesetzlich aufzubewahrende Daten.',
    help: 'Wenn Sie keinen Zugriff auf Ihr Konto haben, wenden Sie sich an destek@goldmoodastro.com. Zum Schutz Ihres Kontos kann eine Identitätsprüfung nötig sein.',
    privacy: 'Datenschutzerklärung',
  },
} as const;

function normalizeLocale(value: string): Locale {
  return value === 'en' || value === 'de' ? value : 'tr';
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = content[normalizeLocale(locale)];
  return { title: t.title, description: t.intro };
}

export default async function AccountDeletionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = content[locale];
  const privacyPath = `/${locale}/profile/privacy`;

  return (
    <PageContainer pad="large">
      <main className="mx-auto max-w-[var(--gm-w-narrow)] space-y-6 text-(--gm-text)">
        <header>
          <h1 className="font-serif text-3xl">{t.title}</h1>
          <p className="mt-3 text-(--gm-text-dim)">{t.intro}</p>
        </header>
        <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 sm:p-7">
          <h2 className="font-serif text-xl">{t.stepTitle}</h2>
          <p className="mt-3 leading-relaxed text-(--gm-text-dim)">{t.step}</p>
          <div className="mt-5 flex flex-col items-start gap-4">
            <Link className="inline-flex min-h-11 items-center rounded-full bg-(--gm-gold) px-5 font-bold text-(--gm-bg-deep)" href={`/${locale}/login?next=${encodeURIComponent(privacyPath)}`}>
              {t.action}
            </Link>
            <Link className="text-(--gm-gold) underline underline-offset-4" href={privacyPath}>{t.signedIn}</Link>
          </div>
        </section>
        <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 sm:p-7">
          <h2 className="font-serif text-xl">{t.timingTitle}</h2>
          <p className="mt-3 leading-relaxed text-(--gm-text-dim)">{t.timing}</p>
          <p className="mt-4 leading-relaxed text-(--gm-text-dim)">{t.help}</p>
          <Link className="mt-4 inline-block text-(--gm-gold) underline underline-offset-4" href={`/${locale}/privacy-policy`}>{t.privacy}</Link>
        </section>
      </main>
    </PageContainer>
  );
}
