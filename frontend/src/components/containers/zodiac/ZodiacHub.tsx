'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import Image from 'next/image';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { ZODIAC_SIGNS } from '@/lib/zodiac/signs';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function ZodiacHub() {
  const locale = useLocaleShort();

  return (
    <section className="reveal">
      <div className="text-center mb-16">
        <h1 className={`${cinzel.className} text-4xl md:text-5xl lg:text-6xl mb-6 text-(--gm-gold)`}>
          Zodyak Kuşağı
        </h1>
        <p className="text-lg text-(--gm-text-dim) max-w-2xl mx-auto italic">
          Gökyüzünün rehberliğinde burçların derinliklerini keşfedin. Karakter analizlerinden günlük yorumlara kadar her şey burada.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={localizePath(locale, '/burcunu-ogren')}
            className="inline-flex items-center rounded-full border border-(--gm-gold)/30 bg-(--gm-gold)/10 px-5 py-3 text-sm font-semibold text-(--gm-gold) transition hover:bg-(--gm-gold) hover:text-(--gm-bg)"
          >
            Burcunu öğren
          </Link>
          <Link
            href={localizePath(locale, '/unluler-ve-burclari')}
            className="inline-flex items-center rounded-full border border-(--gm-border-soft) px-5 py-3 text-sm font-semibold text-(--gm-text) transition hover:border-(--gm-gold)/40 hover:text-(--gm-gold)"
          >
            Ünlüler ve burçları
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {ZODIAC_SIGNS.map((sign, idx) => (
          <motion.div
            key={sign.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              href={localizePath(locale, `/burclar/${sign.key}`)}
              className="group block relative p-6 rounded-2xl bg-(--gm-surface) border border-(--gm-border-soft) hover:border-(--gm-gold)/50 transition-all duration-500 overflow-hidden shadow-(--gm-shadow-soft) hover:shadow-(--gm-shadow-glow)"
            >
              {/* Background Glow */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-(--gm-gold)/5 blur-3xl rounded-full group-hover:bg-(--gm-gold)/10 transition-colors" />
              
              <div className="relative flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4 transform group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src={sign.image}
                    alt={sign.label}
                    fill
                    className="object-contain"
                  />
                </div>
                
                <span className="text-3xl mb-1 opacity-50 group-hover:opacity-100 transition-opacity">{sign.symbol}</span>
                <h3 className={`${cinzel.className} text-xl md:text-2xl text-(--gm-text) mb-1`}>
                  {sign.label}
                </h3>
                <p className="text-xs font-medium text-(--gm-gold) uppercase tracking-widest mb-2">
                  {sign.date}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-(--gm-gold)/5 border border-(--gm-gold)/10">
                    <span className="text-[10px] font-bold text-(--gm-gold) uppercase">{sign.element}</span>
                  </div>
                  <div className="px-3 py-1 rounded-full border border-(--gm-border-soft)" style={{ backgroundColor: `${sign.accent}18`, color: sign.accent }}>
                    <span className="text-[10px] font-bold uppercase">{sign.modality}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
