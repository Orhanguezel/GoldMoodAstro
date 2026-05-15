import React, { useMemo } from 'react';
import Link from 'next/link';
import { localizePath } from '@/integrations/shared';
import { useUiSection } from '@/i18n';
import {
  Compass,
  Layers,
  Hash,
  Heart,
  Briefcase,
  Moon,
  ChevronRight
} from 'lucide-react';

const CATEGORIES_FALLBACK = [
  { id: 'astrology', label: 'Astroloji', icon: Compass, desc: 'Doğum haritası ve gezegen etkileriyle hayatınıza rehberlik edin.' },
  { id: 'tarot', label: 'Tarot', icon: Layers, desc: 'Kartların sembolizmiyle bilinçaltınızın kapılarını aralayın.' },
  { id: 'numerology', label: 'Numeroloji', icon: Hash, desc: 'Sayıların gizemli dünyasında kaderinizin kodlarını çözün.' },
  { id: 'mood', label: 'Ruhsal Rehberlik', icon: Moon, desc: 'İçsel huzur ve denge için manevi bir yolculuğa çıkın.' },
  { id: 'career', label: 'Kariyer & Para', icon: Briefcase, desc: 'İş hayatınızda doğru zamanı ve fırsatları keşfedin.' },
  { id: 'relationship', label: 'İlişki & Aşk', icon: Heart, desc: 'Sevgi bağlarınızı güçlendirin, uyumu yıldızlarda arayın.' },
];

export default function ExpertiseCategoriesSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);
  
  const copy = useMemo(() => ({
    label: ui('ui_home_expertise_label', 'Kategoriler'),
    title: ui('ui_home_expertise_title', 'Uzmanlık Alanlarını <span class="text-[var(--gm-gold)]">Keşfedin</span>'),
    desc: ui('ui_home_expertise_desc', 'Hangi alanda rehberliğe ihtiyacınız varsa, o alanın en deneyimli danışmanları burada sizi bekliyor.'),
    cta: ui('ui_home_expertise_cta', 'Danışmanları İncele')
  }), [ui]);

  const categories = useMemo(() => {
    return CATEGORIES_FALLBACK.map(cat => ({
      ...cat,
      label: ui(`ui_home_expertise_cat_${cat.id}_label`, cat.label),
      desc: ui(`ui_home_expertise_cat_${cat.id}_desc`, cat.desc)
    }));
  }, [ui]);

  return (
    <section className="py-24 bg-[var(--gm-bg)] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="font-display text-[10px] tracking-[0.5em] text-[var(--gm-gold-deep)] uppercase mb-4 block">
            {copy.label}
          </span>
          <h2 
            className="font-display text-3xl md:text-5xl text-[var(--gm-text)] mb-6"
            dangerouslySetInnerHTML={{ __html: copy.title }}
          />
          <p className="font-serif italic text-[var(--gm-text-dim)] max-w-2xl mx-auto">
            {copy.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="reveal"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <Link
                href={`${localizePath(locale, '/consultants')}?expertise=${cat.id}`}
                className="group p-8 rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/20 hover:border-[var(--gm-gold)]/40 transition-all duration-500 block h-full relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                  <cat.icon size={120} strokeWidth={0.5} className="text-[var(--gm-gold)]" />
                </div>
 
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-glow-gold/10">
                    <cat.icon size={28} />
                  </div>
 
                  <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-3 group-hover:text-[var(--gm-gold)] transition-colors">
                    {cat.label}
                  </h3>
 
                  <p className="text-sm text-[var(--gm-text-dim)] leading-relaxed mb-8 flex-grow">
                    {cat.desc}
                  </p>
 
                  <div className="flex items-center gap-2 text-[var(--gm-gold)] font-display text-[10px] tracking-widest uppercase font-bold group/btn">
                    <span>{copy.cta}</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
