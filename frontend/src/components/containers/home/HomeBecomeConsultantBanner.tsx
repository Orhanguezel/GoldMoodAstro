import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { localizePath } from '@/integrations/shared';
import { motion } from 'framer-motion';
import { useUiSection } from '@/i18n';

export default function HomeBecomeConsultantBanner({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_become_consultant', locale);
  return (
    <section className="py-24 container mx-auto px-6">
      <div className="relative rounded-[3rem] overflow-hidden bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] shadow-2xl">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[60%] bg-[var(--gm-gold)] opacity-10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-[var(--gm-primary)] opacity-10 blur-[120px] rounded-full" />
        </div>

        <div className="flex flex-col lg:flex-row items-center relative z-10">
          {/* Content Side */}
          <div className="flex-1 p-10 md:p-16 lg:p-20 flex flex-col justify-center text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-1.5 rounded-full border border-(--gm-gold)/30 bg-(--gm-gold)/5 text-(--gm-gold) text-[10px] font-bold uppercase tracking-widest mb-8 self-center lg:self-start"
            >
              <Sparkles size={12} />
              {ui('ui_become_consultant_sparkle', 'Share Your Wisdom')}
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl text-(--gm-text) mb-6 leading-tight tracking-tight"
            >
              {ui('ui_become_consultant_h1_part1', 'Share Your Wisdom,')}<br className="hidden lg:block" /> 
              <span className="text-(--gm-gold) italic"> {ui('ui_become_consultant_h1_part2', 'Become Our Consultant')}</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-serif italic text-(--gm-text-dim) text-lg md:text-xl mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {ui('ui_become_consultant_lead', 'If you are an expert in astrology, tarot or spiritual guidance, join GoldMoodAstro and guide thousands of people.')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center"
            >
              <Link 
                href={localizePath(locale, '/become-consultant')}
                className="group relative px-10 py-5 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold uppercase tracking-[0.25em] text-[11px] transition-all duration-500 hover:scale-105 hover:shadow-(--gm-shadow-gold) overflow-hidden flex items-center gap-3"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {ui('ui_become_consultant_start_btn', 'Apply Now')}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-[var(--gm-text)]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </Link>
              <Link 
                href={localizePath(locale, '/about')}
                className="text-(--gm-text-dim) hover:text-(--gm-gold) font-bold text-[10px] uppercase tracking-widest transition-colors px-6 flex items-center gap-2"
              >
                {ui('ui_become_consultant_eval_note', 'Learn About the Process')}
              </Link>
            </motion.div>
          </div>

          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="w-full lg:w-1/2 relative h-[400px] lg:h-[600px] overflow-hidden border-t lg:border-t-0 lg:border-l border-(--gm-border-soft)"
          >
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-(--gm-surface)/80 via-transparent to-transparent z-10 pointer-events-none" />
            <Image 
              src="/images/become-consultant.png" 
              alt={ui('ui_become_consultant_image_alt', 'Become our consultant')} 
              fill
              className="object-cover object-center transform hover:scale-105 transition-transform duration-[2000ms] ease-out"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
