'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  Download,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  X as XIcon,
  Sparkles,
} from 'lucide-react';

import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';

interface ShareCardProps {
  title: string;
  description?: string;
  shareText: string;
  shareUrl?: string;
  variant: 'birth-chart' | 'tarot' | 'coffee' | 'yildizname' | 'synastry' | 'dream' | 'horoscope' | 'numerology';
  data: any;
  trigger?: React.ReactNode;
}

export default function ShareCard({
  title,
  description,
  shareText,
  shareUrl,
  variant,
  data,
  trigger,
}: ShareCardProps) {
  const { brand } = useBrand();
  const { ui: uiS } = useUiSection('ui_share');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : brand.public_url || 'https://goldmoodastro.com');
  const enc = encodeURIComponent;

  async function generatePng(): Promise<{ blob: Blob; file: File } | null> {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: brand.colors.bg_deep,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `goldmood-${variant}-${Date.now()}.png`, { type: 'image/png' });
      return { blob, file };
    } catch (e) {
      console.error('toPng failed', e);
      return null;
    }
  }

  async function nativeShare() {
    setBusy(true);
    try {
      const result = await generatePng();
      const shareData: ShareData = { title, text: shareText, url };
      if (result && (navigator as any).canShare?.({ files: [result.file] })) {
        await navigator.share({ ...shareData, files: [result.file] });
      } else if ((navigator as any).share) {
        await navigator.share(shareData);
      } else {
        await copyLink();
      }
    } catch (e) {
      // User cancelled
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage() {
    setBusy(true);
    try {
      const result = await generatePng();
      if (!result) {
        toast.error(uiS('ui_share_toast_image_failed', 'Image could not be created'));
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(uiS('ui_share_toast_image_downloaded', 'Image downloaded'));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      toast.success(uiS('ui_share_toast_link_copied', 'Link copied'));
    } catch {
      toast.error(uiS('ui_share_toast_copy_failed', 'Could not copy'));
    }
  }

  function withUtm(baseUrl: string, source: string): string {
    try {
      const u = new URL(baseUrl);
      u.searchParams.set('utm_source', source);
      u.searchParams.set('utm_medium', 'social_share');
      u.searchParams.set('utm_campaign', variant);
      return u.toString();
    } catch {
      return baseUrl;
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(withUtm(url, 'twitter'))}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${enc(withUtm(url, 'facebook'))}&quote=${enc(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${enc(`${shareText}\n${withUtm(url, 'whatsapp')}`)}`;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-(--gm-gold) bg-(--gm-gold)/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-(--gm-gold-deep) transition-colors hover:bg-(--gm-gold) hover:text-(--gm-bg-deep)"
        >
          <Share2 size={14} />
          {uiS('ui_share_button_share', 'Share')}
        </button>
      )}

      {/* Hidden Card for PNG generation */}
      <div className="fixed -left-[9999px] -top-[9999px]">
          <div
            ref={cardRef}
            style={{
              width: 1080,
              height: 1350,
              background: `linear-gradient(135deg, ${brand.colors.bg_base} 0%, ${brand.colors.brand_accent} 60%, ${brand.colors.bg_deep} 100%)`,
              color: brand.colors.text_primary,
              padding: 80,
              fontFamily: 'Cinzel, Georgia, serif',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 60, right: 60, opacity: 0.45 }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="98" fill="none" stroke={brand.colors.brand_primary} strokeWidth="0.5" strokeDasharray="3 3"/>
                <circle cx="100" cy="100" r="70" fill="none" stroke={brand.colors.brand_primary} strokeWidth="0.5"/>
                <circle cx="100" cy="100" r="40" fill="none" stroke={brand.colors.brand_primary} strokeWidth="0.5"/>
                <circle cx="100" cy="100" r="4" fill={brand.colors.brand_primary}/>
              </svg>
            </div>
 
            <div>
              <div style={{ fontSize: 18, letterSpacing: 8, color: brand.colors.brand_primary, textTransform: 'uppercase', marginBottom: 24 }}>
                {brand.name}
              </div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 64, fontStyle: 'italic', lineHeight: 1.05, marginBottom: 16, color: brand.colors.text_primary }}>
                {variant === 'birth-chart' && uiS('ui_share_card_title_birth_chart', 'My Birth Chart')}
                {variant === 'tarot' && uiS('ui_share_card_title_tarot', 'My Tarot Reading')}
                {variant === 'coffee' && uiS('ui_share_card_title_coffee', 'My Coffee Reading')}
                {variant === 'yildizname' && uiS('ui_share_card_title_yildizname', 'My Yildizname')}
                {variant === 'synastry' && uiS('ui_share_card_title_synastry', 'Our Love Compatibility')}
                {variant === 'dream' && uiS('ui_share_card_title_dream', 'My Dream Analysis')}
                {variant === 'horoscope' && uiS('ui_share_card_title_horoscope', 'My Daily Horoscope')}
                {variant === 'numerology' && uiS('ui_share_card_title_numerology', 'My Numerology Analysis')}
              </div>
            </div>
 
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
              {variant === 'birth-chart' && <BirthChartContent data={data} colors={brand.colors} />}
              {variant === 'tarot' && <TarotContent data={data} colors={brand.colors} />}
              {variant === 'coffee' && <CoffeeContent data={data} colors={brand.colors} />}
              {variant === 'yildizname' && <YildiznameContent data={data} colors={brand.colors} />}
              {variant === 'synastry' && <SynastryContent data={data} colors={brand.colors} />}
              {variant === 'dream' && <DreamContent data={data} colors={brand.colors} />}
              {variant === 'horoscope' && <HoroscopeContent data={data} colors={brand.colors} />}
              {variant === 'numerology' && <NumerologyContent data={data} colors={brand.colors} />}
            </div>
 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 18, color: brand.colors.text_muted, fontFamily: 'Manrope, sans-serif' }}>
                {brand.domain}
              </div>
              <div style={{ fontSize: 14, letterSpacing: 4, color: brand.colors.brand_primary, textTransform: 'uppercase' }}>
                {brand.tagline}
              </div>
            </div>
          </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--gm-bg-deep)]/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--gm-text-dim) hover:bg-(--gm-bg-deep) hover:text-(--gm-text)"
            >
              <XIcon size={16} />
            </button>

            <div className="mb-6">
              <div className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase">
                {uiS('ui_share_button_share', 'Share')}
              </div>
              <h3 className="mt-1 font-serif text-2xl text-(--gm-text)">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-sm text-(--gm-text-dim)">
                  {description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={nativeShare}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Share2 size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">{uiS('ui_share_button_quick_share', 'Quick share')}</span>
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Download size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">{uiS('ui_share_button_download_image', 'Download image')}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <a href={twitterUrl}    target="_blank" rel="noopener noreferrer" className={iconBtn} title="X (Twitter)">
                <Twitter size={18} />
              </a>
              <a href={facebookUrl}   target="_blank" rel="noopener noreferrer" className={iconBtn} title="Facebook">
                <Facebook size={18} />
              </a>
              <a href={whatsappUrl}   target="_blank" rel="noopener noreferrer" className={iconBtn} title="WhatsApp">
                <MessageCircle size={18} />
              </a>
              <button type="button" onClick={() => { downloadImage(); toast.info(uiS('ui_share_toast_instagram_hint', 'Download the image and upload it to Instagram')); }} className={iconBtn} title="Instagram">
                <Instagram size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text-dim) transition-colors hover:text-(--gm-text)"
            >
              <Copy size={14} />
              {uiS('ui_share_button_copy_link', 'Copy link')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const iconBtn = 'inline-flex items-center justify-center rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-3 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/50 hover:text-(--gm-gold-deep)';

// ─── Sub-Components for PNG Card ─────────────────────────────────────

function BirthChartContent({ data, colors }: { data: any; colors: any }) {
  const { ui: uiS } = useUiSection('ui_share');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SignRow label={uiS('ui_share_label_sun', 'Sun')} symbol="☀️" sign={data.sun} colors={colors} />
      <SignRow label={uiS('ui_share_label_moon', 'Moon')}    symbol="🌙" sign={data.moon} colors={colors} />
      <SignRow label={uiS('ui_share_label_rising', 'Rising')} symbol="↑" sign={data.rising} colors={colors} />
    </div>
  );
}

function TarotContent({ data, colors }: { data: any; colors: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
      {data.cards?.map((card: any, i: number) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img 
            src={card.image_url} 
            style={{ 
              width: 220, 
              height: 360, 
              borderRadius: 12, 
              border: `2px solid ${colors.brand_primary}`,
              transform: card.is_reversed ? 'rotate(180deg)' : 'none'
            }} 
          />
          <div style={{ fontSize: 18, color: colors.brand_primary, textTransform: 'uppercase' }}>{card.name}</div>
        </div>
      ))}
    </div>
  );
}

function CoffeeContent({ data, colors }: { data: any; colors: any }) {
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {data.symbols?.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 24px', border: `1px solid ${colors.brand_primary}`, borderRadius: 40, color: colors.brand_primary, fontSize: 20 }}>
              {s}
            </div>
          ))}
       </div>
       <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: colors.text_secondary }}>
          "{data.summary}"
       </div>
    </div>
  );
}

function YildiznameContent({ data, colors }: { data: any; colors: any }) {
  const { ui: uiS } = useUiSection('ui_share');
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ fontSize: 80, color: colors.brand_primary }}>{data.number}</div>
       <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase' }}>{uiS('ui_share_yildizname_your_number', 'Your Number')}</div>
       <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', color: colors.text_primary }}>
          {uiS('ui_share_yildizname_menzil', 'Your Mansion')}: {data.menzil}
       </div>
    </div>
  );
}

function SynastryContent({ data, colors }: { data: any; colors: any }) {
  const { ui: uiS } = useUiSection('ui_share');
  return (
    <div style={{ gap: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ fontSize: 42 }}>{data.partnerA}</div>
          <div style={{ fontSize: 48, color: colors.brand_primary }}>❤️</div>
          <div style={{ fontSize: 42 }}>{data.partnerB}</div>
       </div>
       <div style={{ display: 'flex', gap: 80 }}>
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 64, color: colors.brand_primary }}>%{data.scoreLove}</div>
             <div style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>{uiS('ui_share_synastry_love_score', 'Love Compatibility')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 64, color: colors.brand_primary }}>%{data.scoreAttraction}</div>
             <div style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>{uiS('ui_share_synastry_attraction', 'Attraction')}</div>
          </div>
       </div>
    </div>
  );
}

function DreamContent({ data, colors }: { data: any; colors: any }) {
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {data.symbols?.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 24px', border: `1px solid ${colors.brand_primary}`, borderRadius: 40, color: colors.brand_primary, fontSize: 20 }}>
              {s}
            </div>
          ))}
       </div>
       <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: colors.text_secondary }}>
          "{data.excerpt}"
       </div>
    </div>
  );
}

function HoroscopeContent({ data, colors }: { data: any; colors: any }) {
  const { ui: uiS } = useUiSection('ui_share');
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ 
          fontSize: 160, 
          color: colors.brand_primary, 
          width: 200, 
          height: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          border: `2px solid ${colors.brand_primary}44`,
          backgroundColor: `${colors.brand_primary}11`
       }}>
          {data.symbol}
       </div>
       <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: colors.brand_primary, marginBottom: 8 }}>{data.date}</div>
          <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', color: colors.text_primary }}>{data.sign} {uiS('ui_share_horoscope_zodiac_suffix', 'Zodiac')}</div>
       </div>
       <div style={{ fontSize: 28, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: colors.text_secondary, maxWidth: 800 }}>
          "{data.content.length > 200 ? data.content.substring(0, 200) + '...' : data.content}"
       </div>
    </div>
  );
}

function NumerologyContent({ data, colors }: { data: any; colors: any }) {
  const { ui: uiS } = useUiSection('ui_share');
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          <NumBox label={uiS('ui_share_numerology_life_path', 'Life Path')} value={data.lifePath} color={colors.info} colors={colors} />
          <NumBox label={uiS('ui_share_numerology_destiny', 'Destiny')} value={data.destiny} color={colors.brand_primary} colors={colors} />
          <NumBox label={uiS('ui_share_numerology_soul_urge', 'Soul Urge')} value={data.soulUrge} color={colors.error} colors={colors} />
          <NumBox label={uiS('ui_share_numerology_personality', 'Personality')} value={data.personality} color={colors.success} colors={colors} />
       </div>
    </div>
  );
}

function NumBox({ label, value, color, colors }: { label: string; value: number | string; color: string; colors: any }) {
  return (
    <div style={{ 
      width: 200, 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      border: `1px solid ${color}44`, 
      borderRadius: 24, 
      padding: '30px 20px', 
      textAlign: 'center' 
    }}>
      <div style={{ fontSize: 56, fontWeight: 'bold', color: color, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: colors.text_muted }}>{label}</div>
    </div>
  );
}

function SignRow({ label, symbol, sign, colors }: { label: string; symbol: string; sign: string; colors: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${colors.brand_primary}1e`, border: `1px solid ${colors.brand_primary}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
        {symbol}
      </div>
      <div>
        <div style={{ fontSize: 14, letterSpacing: 6, color: colors.brand_primary, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: colors.text_primary, lineHeight: 1 }}>{sign}</div>
      </div>
    </div>
  );
}
