import React, { useMemo } from 'react';
import Link from 'next/link';
import { localizePath } from '@/integrations/shared';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';
import { useUiSection } from '@/i18n';
import {
  Compass,
  Layers,
  Hash,
  Heart,
  Briefcase,
  Moon,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const ICONS = {
  astrology: Compass,
  birth_chart: Compass,
  tarot: Layers,
  numerology: Hash,
  relationship: Heart,
  career: Briefcase,
  mood: Moon,
} as const;

const CATEGORIES_FALLBACK = [
  { id: 'astrology', icon: Compass },
  { id: 'tarot', icon: Layers },
  { id: 'numerology', icon: Hash },
  { id: 'mood', icon: Moon },
  { id: 'career', icon: Briefcase },
  { id: 'relationship', icon: Heart },
];

const CATEGORY_COPY_FALLBACK: Record<string, { label: string; desc: string }> = {
  astrology: { label: 'Astrology', desc: 'Guidance through birth charts and planetary influences.' },
  birth_chart: { label: 'Birth Chart', desc: 'Detailed natal chart analysis.' },
  tarot: { label: 'Tarot', desc: 'Guidance through the symbolism of the cards.' },
  numerology: { label: 'Numerology', desc: 'Life path insight through the language of numbers.' },
  coffee: { label: 'Coffee Reading', desc: 'Traditional interpretation of cup symbols.' },
  relationship: { label: 'Relationship & Love', desc: 'Relationship dynamics and synastry guidance.' },
  mood: { label: 'Spiritual Guidance', desc: 'Support for inner balance and awareness.' },
  career: { label: 'Career & Money', desc: 'Guidance for work life and financial flow.' },
  dream_interpretation: { label: 'Dream Interpretation', desc: 'Interpretation of dream symbols.' },
  energy_healing: { label: 'Energy Healing', desc: 'Energy balancing and healing work.' },
  spiritual_guidance: { label: 'Spiritual Guidance', desc: 'Support on the spiritual journey.' },
  nefes_terapisi: { label: 'Breath Therapy', desc: 'Stress relief and inner balance through conscious breathing techniques.' },
  bioenerji: { label: 'Bioenergy', desc: 'Balancing the body’s energy flow and healing work.' },
  reiki: { label: 'Reiki', desc: 'Healing sessions with universal life energy.' },
  yasam_koclugu: { label: 'Life Coaching', desc: 'Guidance for goal setting, motivation, and personal growth.' },
  bilincalti_donusum: { label: 'Subconscious Transformation', desc: 'Noticing and transforming subconscious patterns.' },
  psikoloji: { label: 'Psychology', desc: 'Individual counseling with licensed psychologist support.' },
};

export default function ExpertiseCategoriesSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  
  const copy = useMemo(() => ({
    label: ui('ui_home_expertise_label', 'Categories'),
    title: ui('ui_home_expertise_title', 'Explore <span class="text-[var(--gm-gold)]">Areas of Expertise</span>'),
    desc: ui('ui_home_expertise_desc', 'Whatever kind of guidance you need, the most experienced consultants in that field are waiting here.'),
    cta: ui('ui_home_expertise_cta', 'View Consultants')
  }), [ui]);

  const categories = useMemo(() => {
    const source = serviceCategories.length
      ? serviceCategories.slice(0, 6).map((cat) => ({
          id: cat.slug,
          icon: ICONS[cat.slug as keyof typeof ICONS] ?? Sparkles,
        }))
      : CATEGORIES_FALLBACK;

    return source.map(cat => ({
      ...cat,
      label: ui(`ui_home_expertise_cat_${cat.id}_label`, CATEGORY_COPY_FALLBACK[cat.id]?.label ?? cat.id),
      desc: ui(`ui_home_expertise_cat_${cat.id}_desc`, CATEGORY_COPY_FALLBACK[cat.id]?.desc ?? ''),
    }));
  }, [serviceCategories, ui]);

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
