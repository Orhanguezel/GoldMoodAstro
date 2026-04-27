import React from 'react';
import Link from 'next/link';

export default function TransparencySection({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';

  return (
    <section className="py-32 bg-[var(--gm-bg)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <span className="section-label">{isTr ? 'Üyelik' : 'Membership'}</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-[var(--gm-text)]">
            {isTr ? 'Şeffaf fiyat,' : 'Transparent pricing,'}<br/>
            <em className="text-[var(--gm-gold)] italic">{isTr ? 'saklı koşul yok.' : 'no hidden terms.'}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal">
          {/* Free Card — tema-aware surface */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-sm p-12 relative transition-all duration-400 hover:-translate-y-1 hover:shadow-card hover:border-(--gm-gold)/40 group">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-[var(--gm-gold)] text-[var(--gm-gold-deep)] rounded-full">
              {isTr ? 'Ücretsiz' : 'Free'}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-6">
              {isTr ? 'Misafir' : 'Guest'}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-[var(--gm-text)]">
              <sup className="text-2xl font-normal text-[var(--gm-gold-deep)] mr-1 -top-7 relative">₺</sup>0<small className="text-base text-[var(--gm-muted)] font-normal tracking-wide ml-1">{isTr ? '/ ay' : '/ mo'}</small>
            </div>
            <p className="italic text-[var(--gm-text-dim)] mb-8 text-base leading-relaxed">
              {isTr ? 'Yıldızlarla tanışın, taahhüt aramayın.' : 'Meet the stars, no commitment.'}
            </p>
            <ul className="space-y-4 mb-10 text-[var(--gm-text-dim)]">
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Doğum haritası temel görünümü' : 'Basic birth chart view'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Günlük kısa yorum' : 'Short daily reading'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Burç uyumu (özet)' : 'Sign compatibility (summary)'}
              </li>
            </ul>
            <Link href={`/${locale}/register`} className="btn-outline-premium w-full justify-center">
              {isTr ? 'Ücretsiz Başla' : 'Start for Free'}
            </Link>
          </div>

          {/* Premium Card — her temada sabit koyu accent.
              Sabit ink bg + cream text + altın detay → her iki temada
              dramatik kontrast. Tailwind v4 `var()/opacity` çekincesinden
              kaçınmak için sabit hex değerleri kullanılıyor. */}
          <div
            className="rounded-sm p-12 relative transition-all duration-400 hover:-translate-y-1 hover:shadow-glow group border border-[#A8884A]/40"
            style={{
              backgroundColor: '#1A1715',
              color: '#FAF6EF',
              backgroundImage:
                'radial-gradient(120% 80% at 100% 0%, rgba(201,169,97,0.10), transparent 60%)',
            }}
          >
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-[var(--gm-gold)] text-[var(--gm-gold)] bg-[var(--gm-gold)]/15 rounded-full">
              {isTr ? 'Önerilen' : 'Recommended'}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-[var(--gm-gold)] uppercase mb-6">
              {isTr ? 'Premium' : 'Premium'}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight" style={{ color: '#FAF6EF' }}>
              <sup className="text-2xl font-normal text-[var(--gm-gold)] mr-1 -top-7 relative">₺</sup>149<small className="text-base font-normal tracking-wide ml-1" style={{ color: 'rgba(250,246,239,0.65)' }}>{isTr ? '/ ay' : '/ mo'}</small>
            </div>
            <p className="italic mb-8 text-base leading-relaxed" style={{ color: 'rgba(250,246,239,0.85)' }}>
              {isTr ? 'Sınırsız derinlik, gizli sürpriz yok.' : 'Limitless depth, no hidden surprises.'}
            </p>
            <ul className="space-y-4 mb-10" style={{ color: '#FAF6EF' }}>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Detaylı doğum haritası analizi' : 'Detailed birth chart analysis'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Günlük · haftalık · aylık öngörü' : 'Daily · weekly · monthly forecast'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Sinastri & kompozit haritalar' : 'Synastry & composite charts'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Tarot okuması (Kelt Haçı dahil)' : 'Tarot reading (inc. Celtic Cross)'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Astrolog görüşmesi için indirim' : 'Discount for astrologer sessions'}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[var(--gm-gold)]">✦</span> {isTr ? 'Tek tıkla iptal · 7 gün önceden hatırlatma' : '1-click cancel · 7-day reminder'}
              </li>
            </ul>
            <Link href={`/${locale}/pricing`} className="btn-premium w-full justify-center">
              {isTr ? 'Ön Kayıt Ol' : 'Pre-Register'}
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-center gap-6 p-8 border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/5 reveal">
          <div className="flex-shrink-0 text-[var(--gm-gold)]">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 3 L30 9 V18 C30 24, 25 30, 18 33 C11 30, 6 24, 6 18 V9 Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 18 L17 22 L24 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-display text-[11px] tracking-[0.2em] text-[var(--gm-gold-deep)] uppercase mb-2">
              {isTr ? 'Şeffaflık Garantisi' : 'Transparency Guarantee'}
            </div>
            <p className="text-[var(--gm-text-dim)] font-light leading-relaxed">
              {isTr 
                ? "Ücretsiz deneme süresi kart bilgisi istemeden başlar. Premium'a geçişi siz manuel onaylarsınız — kimse sizden habersiz para çekmez." 
                : "Free trial starts without asking for a credit card. You manually approve the transition to Premium — no one charges you without your knowledge."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
