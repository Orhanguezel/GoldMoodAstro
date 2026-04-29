'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import Image from 'next/image';

const cinzel = Cinzel({ subsets: ['latin'] });

const shortSigns = [
  { key: 'aries', label: 'Koç' },
  { key: 'taurus', label: 'Boğa' },
  { key: 'gemini', label: 'İkizler' },
  { key: 'cancer', label: 'Yengeç' },
  { key: 'leo', label: 'Aslan' },
  { key: 'virgo', label: 'Başak' },
  { key: 'libra', label: 'Terazi' },
  { key: 'scorpio', label: 'Akrep' },
  { key: 'sagittarius', label: 'Yay' },
  { key: 'capricorn', label: 'Oğlak' },
  { key: 'aquarius', label: 'Kova' },
  { key: 'pisces', label: 'Balık' },
];

export default function ZodiacGridSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-5">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--gm-gold)_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className={`${cinzel.className} text-3xl md:text-5xl mb-4 text-[var(--gm-gold)]`}>
            Burcunuzu Keşfedin
          </h2>
          <p className="text-[var(--gm-text-dim)] font-serif italic max-w-2xl mx-auto">
            Kişiliğinizin derinliklerine inin, günlük yorumlarınızı okuyun ve kozmik yolculuğunuzda rehberlik alın.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {shortSigns.map((sign, idx) => (
            <motion.div
              key={sign.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/burclar/${sign.key}`}
                className="group flex flex-col items-center p-4 rounded-2xl bg-[var(--gm-surface)] border border-[var(--gm-border-soft)] hover:border-[var(--gm-gold-dim)] transition-all duration-500 shadow-sm hover:shadow-glow"
              >
                <div className="relative w-12 h-12 md:w-16 md:h-16 mb-3 transform group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src={`/uploads/zodiac/${sign.key}.png`}
                    alt={sign.label}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`${cinzel.className} text-sm md:text-base text-[var(--gm-text)] group-hover:text-[var(--gm-gold)] transition-colors`}>
                  {sign.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link 
            href="/burclar" 
            className="text-[var(--gm-gold)] font-bold text-xs uppercase tracking-[0.3em] hover:text-[var(--gm-gold-light)] transition-colors inline-flex items-center gap-2 group"
          >
            TÜM BURÇLAR VE ARAÇLAR
            <span className="w-8 h-px bg-[var(--gm-gold)] group-hover:w-12 transition-all" />
          </Link>
        </div>
      </div>
    </section>
  );
}
