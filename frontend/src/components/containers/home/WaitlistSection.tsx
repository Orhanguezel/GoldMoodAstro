'use client';

import React, { useState } from 'react';
import { useSubscribeNewsletterMutation } from '@/integrations/rtk/public/newsletter_public.endpoints';
import { useUiSection } from '@/i18n';

export default function WaitlistSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_extra' as any);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeNewsletter] = useSubscribeNewsletterMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      await subscribeNewsletter({
        email,
        locale,
        meta: { source: 'home_waitlist' },
      }).unwrap();
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-40 bg-[var(--gm-bg)] relative overflow-hidden" id="waitlist">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--gm-gold)]/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--gm-gold)]/30 to-transparent" />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="font-display text-[11px] tracking-[0.4em] text-[var(--gm-gold-deep)] uppercase mb-6">
          {ui('ui_extra_b4_waitlist_eyebrow', 'Opening Soon')}
        </div>

        <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-[1.1] text-[var(--gm-text)] mb-8">
          {ui('ui_extra_b4_waitlist_title_1', 'Join the waitlist -')}<br/>
          <em className="text-[var(--gm-gold)] italic">{ui('ui_extra_b4_waitlist_title_2', 'be among the first in.')}</em>
        </h2>

        <p className="text-[var(--gm-text-dim)] text-lg font-light leading-relaxed mb-12 max-w-xl mx-auto">
          {ui('ui_extra_b4_waitlist_desc', 'Early signups receive 50% off for the first three months and a personal birth chart report as a gift.')}
        </p>

        {status === 'success' ? (
          <div className="border border-[var(--gm-gold)]/30 bg-[var(--gm-gold)]/5 p-8 max-w-md mx-auto">
            <h4 className="font-display text-[14px] tracking-[0.3em] text-[var(--gm-gold)] uppercase mb-3">
              ✦ {ui('ui_extra_b4_waitlist_thanks', 'THANK YOU')} ✦
            </h4>
            <p className="text-[var(--gm-text-dim)] font-light italic">
              {ui('ui_extra_b4_waitlist_thanks_desc', 'We will notify you first when the stars align.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui('ui_extra_b4_waitlist_email_placeholder', 'your email address')}
              required
              disabled={status === 'loading'}
              className="flex-1 bg-[var(--gm-bg-deep)] border border-[var(--gm-border)] rounded-none px-6 py-4 text-[var(--gm-text)] focus:outline-none focus:border-[var(--gm-gold)] placeholder:text-[var(--gm-muted)] placeholder:tracking-wider placeholder:text-sm font-sans transition-colors disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="btn-premium whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : ui('ui_extra_b4_waitlist_submit', 'Join Waitlist')}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-sm text-[var(--gm-error)] mt-4">
            {ui('ui_extra_b4_waitlist_error', 'Could not register. Please try again.')}
          </p>
        )}

        <p className="font-display text-[9px] tracking-[0.2em] text-[var(--gm-muted)] uppercase mt-8">
          {ui('ui_extra_b4_waitlist_footnote', 'Email only. We do not ask for your phone number. You can unsubscribe anytime.')}
        </p>
      </div>
    </section>
  );
}
