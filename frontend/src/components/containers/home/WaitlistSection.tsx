'use client';

import React, { useState } from 'react';

export default function WaitlistSection({ locale = 'tr' }: { locale?: string }) {
  const isTr = locale === 'tr';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate API call for now (can be connected to actual endpoint later)
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <section className="py-40 bg-[var(--gm-bg)] relative overflow-hidden" id="waitlist">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--gm-gold)]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--gm-gold)]/30 to-transparent" />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="font-display text-[11px] tracking-[0.4em] text-[var(--gm-gold-deep)] uppercase mb-6 reveal">
          {isTr ? 'Yakında Açılıyor' : 'Opening Soon'}
        </div>

        <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-[1.1] text-[var(--gm-text)] mb-8 reveal">
          {isTr ? 'Sıraya girin —' : 'Join the queue —'}<br/>
          <em className="text-[var(--gm-gold)] italic">{isTr ? 'ilk açılanlardan siz olun.' : 'be the first to unlock.'}</em>
        </h2>

        <p className="text-[var(--gm-text-dim)] text-lg font-light leading-relaxed mb-12 max-w-xl mx-auto reveal">
          {isTr 
            ? 'Lansman öncesi kayıt olanlara, ilk üç ay %50 indirim ve kişisel doğum haritası raporu hediye.' 
            : 'Pre-launch registrants get 50% off the first three months and a free personal birth chart report.'}
        </p>

        {status === 'success' ? (
          <div className="border border-[var(--gm-gold)]/30 bg-[var(--gm-gold)]/5 p-8 max-w-md mx-auto reveal">
            <h4 className="font-display text-[14px] tracking-[0.3em] text-[var(--gm-gold)] uppercase mb-3">
              ✦ {isTr ? 'TEŞEKKÜRLER' : 'THANK YOU'} ✦
            </h4>
            <p className="text-[var(--gm-text-dim)] font-light italic">
              {isTr ? 'Yıldızlar hizalandığında ilk size haber vereceğiz.' : 'We will let you know first when the stars align.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8 reveal">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isTr ? "e-posta adresiniz" : "your email address"}
              required
              disabled={status === 'loading'}
              className="flex-1 bg-[var(--gm-bg-deep)] border border-[var(--gm-border)] rounded-none px-6 py-4 text-[var(--gm-text)] focus:outline-none focus:border-[var(--gm-gold)] placeholder:text-[var(--gm-muted)] placeholder:tracking-wider placeholder:text-sm font-sans transition-colors disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="btn-premium whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : isTr ? 'Sıraya Gir' : 'Join Queue'}
            </button>
          </form>
        )}

        <p className="font-display text-[9px] tracking-[0.2em] text-[var(--gm-muted)] uppercase mt-8 reveal">
          {isTr 
            ? 'Sadece e-posta. Telefon istemiyoruz. İstediğiniz zaman çıkış yapabilirsiniz.' 
            : 'Email only. No phone needed. You can opt out anytime.'}
        </p>
      </div>
    </section>
  );
}
