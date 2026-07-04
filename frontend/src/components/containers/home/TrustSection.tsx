import React from 'react';
import { useUiSection } from '@/i18n';

const TRUST_ITEMS = {
  tr: [
    {
      num: 'i.',
      title: 'Telefon numaranızı istemiyoruz.',
      desc: 'Kayıt için yalnızca e-posta yeterlidir. Apple veya Google ile girişte bunu da hızla geçebilirsiniz. Numaranız bizde olmadığı için satılması da mümkün değildir.'
    },
    {
      num: 'ii.',
      title: 'Hesabınızı silerseniz gerçekten silinir.',
      desc: '7 gün içinde verileriniz veritabanından kalıcı olarak kaldırılır. Arka planda saklanan gizli bir kopya tutulmaz.'
    },
    {
      num: 'iii.',
      title: 'Verilerinizi indirme hakkınız var.',
      desc: 'Tüm verilerinizi tek tıkla JSON olarak indirebilirsiniz. KVKK ve GDPR uyumu ilk günden itibaren tasarımın parçasıdır.'
    },
    {
      num: 'iv.',
      title: 'Üçüncü taraflara veri satışı yok.',
      desc: 'Reklam geliri veya veri ortaklığı modelimiz yoktur. Gelirimiz şeffaf abonelik ve hizmet akışından gelir.'
    }
  ],
  en: [
    {
      num: 'i.',
      title: 'We do not ask for your phone number.',
      desc: 'Email only for registration. You can even skip this with Apple and Google login. We do not have your number — there is no way to sell it.'
    },
    {
      num: 'ii.',
      title: 'If you delete your account, it is truly deleted.',
      desc: 'Within 7 days, all your data is permanently removed from the database. No "soft delete", no copy stored in the background.'
    },
    {
      num: 'iii.',
      title: 'You have the right to download your data.',
      desc: 'You can download all your data as JSON with a single click. KVKK and GDPR compliance built-in from day one.'
    },
    {
      num: 'iv.',
      title: 'No data sale to third parties.',
      desc: 'We have no ad revenue, no data partnerships. Our only source of income is your transparent subscription — we have no intention of making money elsewhere.'
    }
  ]
};

export default function TrustSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);
  const fb = locale === 'tr' ? TRUST_ITEMS.tr : TRUST_ITEMS.en;
  const items = [
    {
      num: fb[0].num,
      title: ui('ui_home_trust_1_title', fb[0].title),
      desc: ui('ui_home_trust_1_desc', fb[0].desc),
    },
    {
      num: fb[1].num,
      title: ui('ui_home_trust_2_title', fb[1].title),
      desc: ui('ui_home_trust_2_desc', fb[1].desc),
    },
    {
      num: fb[2].num,
      title: ui('ui_home_trust_3_title', fb[2].title),
      desc: ui('ui_home_trust_3_desc', fb[2].desc),
    },
    {
      num: fb[3].num,
      title: ui('ui_home_trust_4_title', fb[3].title),
      desc: ui('ui_home_trust_4_desc', fb[3].desc),
    },
  ];

  return (
    <section className="py-32 bg-[var(--gm-bg-deep)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-24 reveal">
          <span className="section-label">{ui('ui_home_trust_eyebrow', locale === 'tr' ? 'Güven İlkelerimiz' : 'Our Trust Principles')}</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-[var(--gm-text)]">
            {ui('ui_home_trust_title_1', locale === 'tr' ? 'Verileriniz,' : 'Your data,')}<br/>
            <em className="text-[var(--gm-gold)] italic">{ui('ui_home_trust_title_2', locale === 'tr' ? 'yalnızca sizindir.' : 'is only yours.')}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="font-display text-4xl text-[var(--gm-gold)] opacity-50 italic">
                {item.num}
              </div>
              <div>
                <h3 className="font-serif text-xl text-[var(--gm-text)] mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[var(--gm-text-dim)] font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
