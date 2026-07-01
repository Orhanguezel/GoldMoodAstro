import React from 'react';
import Link from 'next/link';
import { useUiSection } from '@/i18n';

export default function TransparencySection({ locale = 'tr' }: { locale?: string }) {
  const { ui } = useUiSection('ui_home', locale as any);

  return (
    <section className="py-32 bg-(--gm-bg) border-t border-(--gm-border-soft)">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <span className="section-label">{ui('ui_home_transparency_label', 'Üyelik')}</span>
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-(--gm-text)">
            {ui('ui_home_transparency_title_1', 'Şeffaf fiyatlandırma,')}<br/>
            <em className="text-(--gm-gold) italic">{ui('ui_home_transparency_title_2', 'gizli koşul yok.')}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 reveal items-stretch">
          {/* Free Card */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl p-10 relative transition-all duration-500 hover:-translate-y-2 hover:shadow-(--gm-shadow-card) hover:border-(--gm-gold)/40 group flex flex-col">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-(--gm-gold)/30 text-(--gm-gold-dim) rounded-full">
              {ui('ui_home_transparency_free_badge', 'Ücretsiz')}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold-dim) uppercase mb-6">
              {ui('ui_home_transparency_free_name', 'Misafir')}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-text)">
              <sup className="text-2xl font-normal text-(--gm-gold-dim) mr-1 -top-7 relative">₺</sup>0<small className="text-base text-(--gm-muted) font-normal tracking-wide ml-1">{ui('ui_home_transparency_per_month', '/ ay')}</small>
            </div>
            <p className="italic text-(--gm-text-dim) mb-8 text-sm leading-relaxed">
              {ui('ui_home_transparency_free_tagline', 'Yıldızlarla tanışın, hiçbir taahhüt yok.')}
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text-dim) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> {ui('ui_home_transparency_free_feature_1', 'Temel doğum haritası görünümü')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> {ui('ui_home_transparency_free_feature_2', 'Kısa günlük yorum')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/50 mt-1">✦</span> {ui('ui_home_transparency_free_feature_3', 'Burç uyumu (özet)')}
              </li>
            </ul>
            <Link href={`/${locale}/register`} className="w-full py-4 text-center rounded-full border border-(--gm-border) text-(--gm-text) text-xs font-bold uppercase tracking-[0.2em] hover:bg-(--gm-surface-high) transition-all mt-auto">
              {ui('ui_home_transparency_free_cta', 'Ücretsiz Başla')}
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
              {ui('ui_home_transparency_recommended_badge', 'Önerilen')}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold) uppercase mb-6 font-bold">
              {ui('ui_home_transparency_monthly_name', 'Premium Aylık')}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-gold) drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              <sup className="text-2xl font-normal text-(--gm-gold) mr-1 -top-7 relative">₺</sup>149<small className="text-base font-normal tracking-wide ml-1 text-(--gm-gold)/60">{ui('ui_home_transparency_per_month', '/ ay')}</small>
            </div>
            <p className="italic mb-8 text-sm leading-relaxed text-(--gm-text-dim)">
              {ui('ui_home_transparency_monthly_tagline', 'Sınırsız derinlik, esnek ödeme.')}
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> {ui('ui_home_transparency_monthly_feature_1', 'Detaylı doğum haritası analizi')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> {ui('ui_home_transparency_monthly_feature_2', 'Günlük · haftalık · aylık öngörü')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> {ui('ui_home_transparency_monthly_feature_3', 'Sinastri & kompozit haritalar')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold) mt-1 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">✦</span> {ui('ui_home_transparency_monthly_feature_4', 'Tarot açılımı (Kelt Haçı dahil)')}
              </li>
            </ul>
            <Link href={`/${locale}/pricing`} className="w-full py-4 text-center rounded-full bg-(--gm-gold) text-(--gm-bg-deep) text-xs font-bold uppercase tracking-[0.25em] hover:scale-[1.02] transition-transform mt-auto shadow-(--gm-shadow-gold)">
              {ui('ui_home_transparency_monthly_cta', 'Hemen Seç')}
            </Link>
          </div>

          {/* Premium Yearly Card */}
          <div className="bg-(--gm-surface) border border-(--gm-border-soft) rounded-2xl p-10 relative transition-all duration-500 hover:-translate-y-2 hover:shadow-(--gm-shadow-card) hover:border-(--gm-gold)/40 group flex flex-col">
            <div className="absolute top-6 right-6 font-display text-[9px] tracking-[0.3em] uppercase py-1.5 px-3 border border-(--gm-gold)/30 text-(--gm-gold) bg-(--gm-gold)/10 rounded-full">
              {ui('ui_home_transparency_best_value_badge', 'En Avantajlı')}
            </div>
            <div className="font-display text-[14px] tracking-[0.32em] text-(--gm-gold-dim) uppercase mb-6">
              {ui('ui_home_transparency_yearly_name', 'Premium Yıllık')}
            </div>
            <div className="font-serif font-light text-6xl leading-none mb-2 tracking-tight text-(--gm-text) flex items-baseline">
              <sup className="text-2xl font-normal text-(--gm-gold-dim) mr-1 -top-7 relative">₺</sup>1499<small className="text-base text-(--gm-muted) font-normal tracking-wide ml-1">{ui('ui_home_transparency_per_year', '/ yıl')}</small>
            </div>
            <p className="italic text-(--gm-text-dim) mb-8 text-sm leading-relaxed">
              {ui('ui_home_transparency_yearly_tagline', '2 ay ücretsiz. Kesintisiz deneyim.')}
            </p>
            <ul className="space-y-4 mb-10 text-sm text-(--gm-text-dim) flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> {ui('ui_home_transparency_yearly_feature_1', 'Aylık plandaki tüm özellikler')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> {ui('ui_home_transparency_yearly_feature_2', 'Astrolog seanslarında %20 indirim')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> {ui('ui_home_transparency_yearly_feature_3', 'VIP öncelikli destek')}
              </li>
              <li className="flex items-start gap-3">
                <span className="text-(--gm-gold)/80 mt-1">✦</span> {ui('ui_home_transparency_yearly_feature_4', 'Kapsamlı yıllık genel bakış')}
              </li>
            </ul>
            <Link href={`/${locale}/pricing`} className="w-full py-4 text-center rounded-full border border-(--gm-gold) text-(--gm-gold) text-xs font-bold uppercase tracking-[0.2em] hover:bg-(--gm-gold) hover:text-(--gm-bg-deep) transition-all mt-auto shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-(--gm-shadow-gold)">
              {ui('ui_home_transparency_yearly_cta', 'Ön Kayıt')}
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
              {ui('ui_home_transparency_guarantee_title', 'Şeffaflık Garantisi')}
            </div>
            <p className="text-(--gm-text-dim) text-sm font-light leading-relaxed">
              {ui('ui_home_transparency_guarantee_desc', 'Ücretsiz deneme, kredi kartı istemeden başlar. Premium\'a geçişi manuel olarak siz onaylarsınız — kimse haberiniz olmadan sizden ücret almaz. İptal etmek yalnızca bir tık uzağınızda.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
