import React from 'react';

const COPY = {
  tr: {
    eyebrow: 'BİZİM SÖZÜMÜZ',
    title: 'Neden <em>Gold Mood</em>?',
    promises: [
      {
        num: '01',
        title: 'İptal etmek üye olmaktan kolay',
        text: 'Aboneliğinizi tek tıkla, hiçbir form doldurmadan veya bekleme süresi olmadan anında iptal edebilirsiniz. Şeffaflık ana ilkemizdir.',
        target: 'ŞEFFAFLIK'
      },
      {
        num: '02',
        title: 'Her yorum size özel',
        text: 'Genel geçer yorumlar yerine, doğum haritanızın saniye hassasiyetindeki verilerinden beslenen kişisel rehberlik sunuyoruz.',
        target: 'DERİNLİK'
      },
      {
        num: '03',
        title: 'Telefon numaranız bizde yok',
        text: 'Mahremiyetinize saygı duyuyoruz. Kayıt sırasında telefon numaranızı istemiyoruz, tüm iletişim uygulama içinden sağlanır.',
        target: 'GİZLİLİK'
      }
    ]
  },
  en: {
    eyebrow: 'OUR PROMISE',
    title: 'Why <em>Gold Mood</em>?',
    promises: [
      {
        num: '01',
        title: 'Cancelling is easier than joining',
        text: 'You can cancel your subscription instantly with one click, without filling out any forms or waiting. Transparency is our core principle.',
        target: 'TRANSPARENCY'
      },
      {
        num: '02',
        title: 'Every reading is unique to you',
        text: 'Instead of generic readings, we offer personal guidance fed by your birth chart data with second-level precision.',
        target: 'DEPTH'
      },
      {
        num: '03',
        title: 'We don\'t have your phone number',
        text: 'We respect your privacy. We don\'t ask for your phone number during registration; all communication is provided through the app.',
        target: 'PRIVACY'
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
