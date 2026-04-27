import React from 'react';

const COPY = {
  tr: {
    eyebrow: 'BİZİM SÖZÜMÜZ',
    title: 'Neden <em>Gold Mood</em>?',
    promises: [
      {
        num: '01',
        title: 'Gerçek Uzmanlar',
        text: 'AI ile değil, alanında onaylı ve puanlanmış gerçek astrologlarla görüşürsünüz.',
        target: 'GÜVENİLİRLİK'
      },
      {
        num: '02',
        title: 'Mahremiyet',
        text: 'Telefon numaranızı istemiyoruz. Tüm görüşmeler uçtan uca şifreli ve anonimdir.',
        target: 'GİZLİLİK'
      },
      {
        num: '03',
        title: 'Şeffaf Ücretlendirme',
        text: 'Sürpriz ücretler yok. Dakika bazlı veya paket usulü net fiyatlarla çalışıyoruz.',
        target: 'ŞEFFAFLIK'
      }
    ]
  },
  en: {
    eyebrow: 'OUR PROMISE',
    title: 'Why <em>Gold Mood</em>?',
    promises: [
      {
        num: '01',
        title: 'Real Experts',
        text: 'You talk to certified and rated real astrologers, not AI bots.',
        target: 'TRUST'
      },
      {
        num: '02',
        title: 'Privacy First',
        text: 'We don\'t ask for your phone number. All calls are end-to-end encrypted and anonymous.',
        target: 'PRIVACY'
      },
      {
        num: '03',
        title: 'Transparent Pricing',
        text: 'No hidden fees. We work with clear per-minute or package-based pricing.',
        target: 'TRANSPARENCY'
      }
    ]
  }
};

export default function PromisesSection({ locale = 'tr' }: { locale?: string }) {
  const copy = COPY[locale as keyof typeof COPY] || COPY.tr;

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="section-label">{copy.eyebrow}</span>
          <h2 
            className="font-serif text-[clamp(2.5rem,5vw,4rem)] italic font-light text-[var(--gm-text)] leading-tight"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--gm-border-soft)] border border-[var(--gm-border-soft)]">
          {copy.promises.map((p, i) => (
            <div key={i} className="bg-[var(--gm-bg)] p-12 hover:bg-[var(--gm-bg-deep)] transition-colors group reveal">
              <span className="font-display text-6xl text-[var(--gm-gold)] opacity-30 block mb-8 group-hover:opacity-50 transition-opacity">
                {p.num}
              </span>
              <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4">{p.title}</h3>
              <p className="text-[var(--gm-text-dim)] leading-relaxed mb-8">{p.text}</p>
              <span className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-muted)] uppercase">
                {p.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
