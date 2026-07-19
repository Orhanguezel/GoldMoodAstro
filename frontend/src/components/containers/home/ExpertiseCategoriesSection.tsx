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
  astrology: { label: 'Astroloji', desc: 'Doğum haritası ve gezegen etkileriyle rehberlik.' },
  birth_chart: { label: 'Doğum Haritası', desc: 'Detaylı natal harita analizi.' },
  tarot: { label: 'Tarot', desc: 'Kart sembolleri üzerinden farkındalık rehberliği.' },
  numerology: { label: 'Numeroloji', desc: 'Sayıların diliyle yaşam yolu içgörüsü.' },
  coffee: { label: 'Kahve Falı', desc: 'Fincan sembollerinin geleneksel yorumu.' },
  relationship: { label: 'İlişki ve Aşk', desc: 'İlişki dinamikleri ve sinastri rehberliği.' },
  mood: { label: 'Ruhsal Rehberlik', desc: 'İç denge ve farkındalık için destek.' },
  career: { label: 'Kariyer ve Para', desc: 'İş yaşamı ve maddi akış için rehberlik.' },
  dream_interpretation: { label: 'Rüya Tabiri', desc: 'Rüya sembollerinin yorumu.' },
  energy_healing: { label: 'Enerji Şifası', desc: 'Enerji dengeleme ve şifa çalışmaları.' },
  spiritual_guidance: { label: 'Ruhsal Rehberlik', desc: 'Spiritüel yolculukta destek.' },
  nefes_terapisi: { label: 'Nefes Terapisi', desc: 'Bilinçli nefes teknikleriyle stres azaltma ve iç denge.' },
  bioenerji: { label: 'Bioenerji', desc: 'Bedenin enerji akışını dengeleme çalışmaları.' },
  reiki: { label: 'Reiki', desc: 'Evrensel yaşam enerjisiyle şifa seansları.' },
  yasam_koclugu: { label: 'Yaşam Koçluğu', desc: 'Hedef belirleme, motivasyon ve kişisel gelişim rehberliği.' },
  bilincalti_donusum: { label: 'Bilinçaltı Dönüşüm', desc: 'Bilinçaltı kalıpları fark etme ve dönüştürme.' },
  psikoloji: { label: 'Psikoloji', desc: 'Lisanslı psikolog desteğiyle bireysel danışmanlık.' },
  fizyonomi: { label: 'Fizyonomi', desc: 'Yüz hatlarının geleneksel yorumuyla karakter okuması.' },
};

export default function ExpertiseCategoriesSection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);
  const { data: serviceCategories = [] } = useListServiceCategoriesPublicQuery();
  
  const copy = useMemo(() => ({
    label: ui('ui_home_expertise_label', 'Kategoriler'),
    title: ui('ui_home_expertise_title', 'Uzmanlık <span class="text-[var(--gm-gold)]">Alanlarını Keşfet</span>'),
    desc: ui('ui_home_expertise_desc', 'Hangi rehberliğe ihtiyacınız varsa, o alandaki deneyimli danışmanlar burada sizi bekliyor.'),
    cta: ui('ui_home_expertise_cta', 'Danışmanları Gör')
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
