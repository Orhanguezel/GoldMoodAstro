import React from 'react';

const TRUST_ITEMS = {
  tr: [
    {
      num: 'i.',
      title: 'Telefon numarası istemiyoruz.',
      desc: 'Kayıt için sadece e-posta. Apple ve Google girişiyle bunu da atlayabilirsiniz. Numaranız bizde yok — satılmasının yolu yok.'
    },
    {
      num: 'ii.',
      title: 'Hesabınızı silerseniz, gerçekten silinir.',
      desc: '7 gün içinde tüm veriniz veritabanından kalıcı olarak kalkar. "Soft delete" yok, arka planda saklanan bir kopya yok.'
    },
    {
      num: 'iii.',
      title: 'Verinizi indirme hakkınız vardır.',
      desc: 'Tek tıkla tüm verinizi JSON olarak indirebilirsiniz. KVKK ve GDPR uyumu birinci günden mimaride.'
    },
    {
      num: 'iv.',
      title: 'Üçüncü tarafa veri satışı yok.',
      desc: 'Reklam gelirimiz yok, veri ortaklığımız yok. Tek gelir kalemimiz açık fiyatlı aboneliğinizdir — başka bir yerden para kazanma derdimiz yok.'
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
  const isTr = locale === 'tr';
  const items = TRUST_ITEMS[isTr ? 'tr' : 'en'];

  return (
    <section className="py-32 bg-[var(--gm-bg-deep)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-24 reveal">
          <span className="section-label">{isTr ? 'Güven İlkelerimiz' : 'Our Trust Principles'}</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-[var(--gm-text)]">
            {isTr ? 'Veriniz,' : 'Your data,'}<br/>
            <em className="text-[var(--gm-gold)] italic">{isTr ? 'sadece sizin.' : 'is only yours.'}</em>
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
