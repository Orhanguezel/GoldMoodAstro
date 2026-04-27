import React from 'react';

const COPY = {
  tr: {
    eyebrow: 'Deneyim',
    title: 'Sade ve <em>derin</em> bir<br/>astroloji rehberi.',
    features: [
      {
        num: '— I —',
        title: 'Kendi <em>doğum haritanızı</em><br/>her zaman cebinizde taşıyın.',
        body: 'Swiss Ephemeris altyapısıyla saniye hassasiyetinde hesaplanmış natal harita. Gezegenler, evler, açılar ve transit etkiler — yorumlanmış, görselleştirilmiş, paylaşılabilir.',
        meta: ['Natal Harita', 'Transitler', 'Açı Yorumları'],
      },
      {
        num: '— II —',
        title: 'Sabah ışığında size özel<br/><em>bir paragraf.</em>',
        body: 'Bugünün gezegen geçişleri, sizin haritanızla nasıl konuşuyor? Yapay zeka ile yazılmış ama astrolog tarafından kalibre edilmiş bir günlük rehber. Aynı cümleyi iki kez okumazsınız.',
        meta: ['Günlük', 'Haftalık', 'Aylık Öngörü'],
      },
      {
        num: '— III —',
        title: 'İki ruhun <em>haritası</em><br/>üst üste gelince.',
        body: 'Sinastri, sadece "uyumlu mu?" sorusunun cevabı değil — iki insanın hangi alanda birbirini güçlendireceğini, hangisinde sınanacağını gösteren bir derinlik aracıdır. Partnerinizle haritalarınızı paylaşın.',
        meta: ['Sinastri', 'Kompozit Harita', 'Ortak Transit'],
      }
    ]
  },
  en: {
    eyebrow: 'Experience',
    title: 'A simple yet <em>deep</em><br/>astrology guide.',
    features: [
      {
        num: '— I —',
        title: 'Keep your <em>birth chart</em><br/>always in your pocket.',
        body: 'A natal chart calculated with second precision using the Swiss Ephemeris infrastructure. Planets, houses, aspects, and transiting effects — interpreted, visualized, shareable.',
        meta: ['Natal Chart', 'Transits', 'Aspect Readings'],
      },
      {
        num: '— II —',
        title: 'A unique paragraph<br/><em>in the morning light.</em>',
        body: 'How do today\'s planetary transits speak to your chart? A daily guide written by AI but calibrated by an astrologer. You will not read the same sentence twice.',
        meta: ['Daily', 'Weekly', 'Monthly Forecast'],
      },
      {
        num: '— III —',
        title: 'When two souls\' <em>charts</em><br/>overlap.',
        body: 'Synastry is not just the answer to "are we compatible?" — it is a tool of depth showing where two people will empower each other, and where they will be tested. Share your charts with your partner.',
        meta: ['Synastry', 'Composite Chart', 'Shared Transit'],
      }
    ]
  }
};

export default function FeaturesNew({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const copy = COPY[isTr ? 'tr' : 'en'];

  return (
    <section className="py-32 px-6 bg-[var(--gm-bg-deep)] relative border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 reveal">
          <span className="font-display text-[11px] tracking-[0.42em] text-[var(--gm-gold-deep)] uppercase mb-6 block">
            {copy.eyebrow}
          </span>
          <h2 
            className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-[var(--gm-text)]"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
        </div>

        <div className="space-y-32">
          {/* Feature 1: Birth chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal">
            <div>
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[0].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[0].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[0].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[0].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <svg viewBox="0 0 300 300" fill="none" className="w-full max-w-[400px]">
                <circle cx="150" cy="150" r="130" stroke="#C9A961" strokeWidth="1"/>
                <circle cx="150" cy="150" r="100" stroke="#C9A961" strokeWidth="0.5" opacity="0.6"/>
                <circle cx="150" cy="150" r="60" stroke="#C9A961" strokeWidth="0.5" opacity="0.4"/>
                <line x1="20" y1="150" x2="280" y2="150" stroke="#C9A961" strokeWidth="0.5" opacity="0.5"/>
                <line x1="150" y1="20" x2="150" y2="280" stroke="#C9A961" strokeWidth="0.5" opacity="0.5"/>
                <line x1="62" y1="62" x2="238" y2="238" stroke="#C9A961" strokeWidth="0.5" opacity="0.3"/>
                <line x1="238" y1="62" x2="62" y2="238" stroke="#C9A961" strokeWidth="0.5" opacity="0.3"/>
                <g stroke="#A8884A" strokeWidth="1">
                  <line x1="150" y1="20" x2="150" y2="35"/>
                  <line x1="150" y1="265" x2="150" y2="280"/>
                  <line x1="20" y1="150" x2="35" y2="150"/>
                  <line x1="265" y1="150" x2="280" y2="150"/>
                </g>
                <circle cx="220" cy="80" r="5" fill="#C9A961"/>
                <circle cx="80" cy="180" r="4" fill="#A8884A"/>
                <circle cx="200" cy="220" r="6" fill="#C9A961"/>
                <circle cx="100" cy="100" r="3" fill="#C9A961"/>
                <text x="150" y="155" textAnchor="middle" fontFamily="Cinzel" fontSize="14" fill="#A8884A" letterSpacing="2">☿</text>
              </svg>
            </div>
          </div>

          {/* Feature 2: Daily reading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal md:direction-rtl">
            <div className="md:order-2">
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[1].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[1].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[1].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[1].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-start md:order-1">
              <svg viewBox="0 0 300 300" fill="none" className="w-full max-w-[400px]">
                <circle cx="150" cy="150" r="50" fill="#C9A961" opacity="0.15"/>
                <circle cx="150" cy="150" r="35" fill="#C9A961" opacity="0.3"/>
                <circle cx="150" cy="150" r="20" fill="#C9A961"/>
                <g stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="150" y1="60" x2="150" y2="80"/>
                  <line x1="150" y1="220" x2="150" y2="240"/>
                  <line x1="60" y1="150" x2="80" y2="150"/>
                  <line x1="220" y1="150" x2="240" y2="150"/>
                  <line x1="86" y1="86" x2="100" y2="100"/>
                  <line x1="200" y1="200" x2="214" y2="214"/>
                  <line x1="214" y1="86" x2="200" y2="100"/>
                  <line x1="100" y1="200" x2="86" y2="214"/>
                </g>
                <text x="150" y="156" textAnchor="middle" fontFamily="Cinzel" fontSize="16" fill="#FAF6EF">☉</text>
              </svg>
            </div>
          </div>

          {/* Feature 3: Sinastri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center reveal">
            <div>
              <div className="font-display text-[14px] tracking-[0.2em] text-[var(--gm-gold)] mb-6">
                {copy.features[2].num}
              </div>
              <h3 
                className="font-serif text-3xl lg:text-4xl text-[var(--gm-text)] leading-snug mb-6 [&>em]:text-[var(--gm-gold)] [&>em]:italic"
                dangerouslySetInnerHTML={{ __html: copy.features[2].title }}
              />
              <p className="text-[var(--gm-text-dim)] font-light leading-relaxed text-lg mb-8">
                {copy.features[2].body}
              </p>
              <div className="flex flex-wrap gap-4 font-display text-[9px] tracking-[0.3em] uppercase text-[var(--gm-gold-deep)]">
                {copy.features[2].meta.map((m, i) => (
                  <span key={i} className="border border-[var(--gm-gold)]/30 py-2 px-4 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <svg viewBox="0 0 300 300" fill="none" className="w-full max-w-[400px]">
                <circle cx="120" cy="150" r="70" stroke="#C9A961" strokeWidth="1"/>
                <circle cx="180" cy="150" r="70" stroke="#A8884A" strokeWidth="1"/>
                <circle cx="120" cy="150" r="50" stroke="#C9A961" strokeWidth="0.5" opacity="0.4"/>
                <circle cx="180" cy="150" r="50" stroke="#A8884A" strokeWidth="0.5" opacity="0.4"/>
                <circle cx="150" cy="150" r="6" fill="#C9A961"/>
                <circle cx="120" cy="80" r="4" fill="#C9A961"/>
                <circle cx="180" cy="220" r="4" fill="#A8884A"/>
                <circle cx="60" cy="150" r="3" fill="#C9A961" opacity="0.7"/>
                <circle cx="240" cy="150" r="3" fill="#A8884A" opacity="0.7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
