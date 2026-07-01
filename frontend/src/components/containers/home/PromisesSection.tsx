import React from 'react';
import { useUiSection } from '@/i18n';

const COPY = {
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
  const { ui } = useUiSection('ui_home', locale as any);
  const fb = COPY.en;
  const copy = {
    eyebrow: ui('ui_home_promises_eyebrow', fb.eyebrow),
    title: ui('ui_home_promises_title', fb.title),
    promises: [
      {
        num: fb.promises[0].num,
        title: ui('ui_home_promises_1_title', fb.promises[0].title),
        text: ui('ui_home_promises_1_text', fb.promises[0].text),
        target: ui('ui_home_promises_1_target', fb.promises[0].target),
      },
      {
        num: fb.promises[1].num,
        title: ui('ui_home_promises_2_title', fb.promises[1].title),
        text: ui('ui_home_promises_2_text', fb.promises[1].text),
        target: ui('ui_home_promises_2_target', fb.promises[1].target),
      },
      {
        num: fb.promises[2].num,
        title: ui('ui_home_promises_3_title', fb.promises[2].title),
        text: ui('ui_home_promises_3_text', fb.promises[2].text),
        target: ui('ui_home_promises_3_target', fb.promises[2].target),
      },
    ],
  };

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
