import React from 'react';
import Link from 'next/link';

export default function TransparencySection({ locale = 'tr' }: { locale?: string }) {
  return (
    <section className="py-32 bg-(--gm-bg) border-t border-(--gm-border-soft)">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <span className="section-label">Membership</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-(--gm-text)">
            Transparent pricing,<br/>
            <em className="text-(--gm-gold) italic">no hidden terms.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 reveal items-stretch">
          {/* Free Card */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl p-10 relative transition-all duration-500 hover:-translate-y-2 hover:shadow-(--gm-shadow-card) hover:border-(--gm-gold)/40 group flex flex-col">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-(--gm-gold)/30 text-(--gm-gold-dim) rounded-full">
              Free
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold-dim) uppercase mb-6">
              Guest
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-text)">
              <sup className="text-2xl font-normal text-(--gm-gold-dim) mr-1 -top-7 relative">₺</sup>0<small className="text-base text-(--gm-muted) font-normal tracking-wide ml-1">/ mo</small>
            </div>
            <p className="italic text-(--gm-text-dim) mb-8 text-sm leading-relaxed">
              Meet the stars, no commitment.
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text-dim) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> Basic birth chart view
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> Short daily reading
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> Sign compatibility (summary)
              </li>
            </ul>
            <Link href={`/${locale}/register`} className="w-full py-4 text-center rounded-full border border-(--gm-border) text-(--gm-text) text-xs font-bold uppercase tracking-[0.2em] hover:bg-(--gm-surface-high) transition-all mt-auto">
              Start for Free
            </Link>
          </div>

          {/* Premium Monthly Card — Recommended */}
          <div
            className="rounded-2xl p-10 relative transition-all duration-500 hover:-translate-y-2 hover:shadow-(--gm-shadow-glow-gold) group border-2 border-(--gm-gold) bg-(--gm-bg-deep) text-(--gm-text) flex flex-col transform lg:scale-105 z-10 shadow-(--gm-shadow-card)"
            style={{
              backgroundImage:
                'radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--gm-gold) 15%, transparent), transparent 60%)',
            }}
          >
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-(--gm-gold) text-(--gm-bg-deep) font-bold bg-(--gm-gold) rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              Recommended
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold) uppercase mb-6 font-bold">
              Premium Monthly
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-gold) drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              <sup className="text-2xl font-normal text-(--gm-gold) mr-1 -top-7 relative">₺</sup>149<small className="text-base font-normal tracking-wide ml-1 text-(--gm-gold)/60">/ mo</small>
            </div>
            <p className="italic mb-8 text-sm leading-relaxed text-(--gm-text-dim)">
              Limitless depth, flexible payment.
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> Detailed birth chart analysis
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> Daily · weekly · monthly forecast
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> Synastry & composite charts
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> Tarot reading (inc. Celtic Cross)
              </li>
            </ul>
            <Link href={`/${locale}/pricing`} className="w-full py-4 text-center rounded-full bg-(--gm-gold) text-(--gm-bg-deep) text-xs font-bold uppercase tracking-[0.25em] hover:scale-[1.02] transition-transform mt-auto shadow-(--gm-shadow-gold)">
              Select Now
            </Link>
          </div>

          {/* Premium Yearly Card */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl p-10 relative transition-all duration-500 hover:-translate-y-2 hover:shadow-(--gm-shadow-card) hover:border-(--gm-gold)/40 group flex flex-col">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-(--gm-gold)/30 text-(--gm-gold) bg-(--gm-gold)/10 rounded-full">
              Best Value
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold-dim) uppercase mb-6">
              Premium Yearly
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-text) flex items-baseline">
              <sup className="text-2xl font-normal text-(--gm-gold-dim) mr-1 -top-7 relative">₺</sup>1499<small className="text-base text-(--gm-muted) font-normal tracking-wide ml-1">/ yr</small>
            </div>
            <p className="italic text-(--gm-text-dim) mb-8 text-sm leading-relaxed">
              2 months free. Uninterrupted experience.
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text-dim) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> All features in Monthly
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> 20% discount for astrologer sessions
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> VIP priority support
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> Comprehensive year-ahead overview
              </li>
            </ul>
            <Link href={`/${locale}/pricing`} className="w-full py-4 text-center rounded-full border border-(--gm-gold) text-(--gm-gold) text-xs font-bold uppercase tracking-[0.2em] hover:bg-(--gm-gold) hover:text-(--gm-bg-deep) transition-all mt-auto shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-(--gm-shadow-gold)">
              Pre-Register
            </Link>
          </div>
        </div>

        <div className="mt-20 flex flex-col md:flex-row items-center gap-6 p-8 border border-(--gm-gold)/20 bg-(--gm-gold)/5 rounded-2xl reveal">
          <div className="flex-shrink-0 text-(--gm-gold) bg-(--gm-gold)/10 p-4 rounded-full">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
              <path d="M18 3 L30 9 V18 C30 24, 25 30, 18 33 C11 30, 6 24, 6 18 V9 Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M13 18 L17 22 L24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-display text-[11px] tracking-[0.2em] text-(--gm-gold) uppercase mb-2 font-bold">
              Transparency Guarantee
            </div>
            <p className="text-(--gm-text-dim) text-sm font-light leading-relaxed">
              Free trial starts without asking for a credit card. You manually approve the transition to Premium — no one charges you without your knowledge. Canceling is just a click away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
