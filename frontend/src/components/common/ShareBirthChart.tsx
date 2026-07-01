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
} from 'lucide-react';
import type { BirthChart } from '@/types/common';

import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';

type Props = {
  chart: BirthChart;
  shareUrl?: string;
};

const SIGN_LABELS: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};

export default function ShareBirthChart({ chart, shareUrl }: Props) {
  const { brand } = useBrand();
  const { ui: uiS } = useUiSection('ui_share');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const url =
    shareUrl ||
    (typeof window !== 'undefined' ? window.location.href : brand.public_url || 'https://goldmoodastro.com');

  const sun = chart.chart_data?.planets?.sun?.sign;
  const moon = chart.chart_data?.planets?.moon?.sign;
  const rising = chart.chart_data?.ascendant?.sign;

  const text = `${uiS('ui_share_text_birth_chart_intro', 'I created my birth chart on {brand} ✨').replace('{brand}', brand.name)}\n☀️ ${uiS('ui_share_label_sun', 'Sun')}: ${sunLabel(sun)}  •  🌙 ${uiS('ui_share_label_moon', 'Moon')}: ${sunLabel(moon)}  •  ↑ ${uiS('ui_share_label_rising', 'Rising')}: ${sunLabel(rising)}\n${uiS('ui_share_text_birth_chart_cta', 'Discover yours too:')}`;

  function sunLabel(sign?: string) {
    if (!sign) return '—';
    return SIGN_LABELS[sign] ?? sign;
  }

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
      const file = new File([blob], `birth-chart-${Date.now()}.png`, { type: 'image/png' });
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
      const data: ShareData = { title: uiS('ui_share_card_title_birth_chart', 'My Birth Chart'), text, url };
      if (result && (navigator as any).canShare?.({ files: [result.file] })) {
        await navigator.share({ ...data, files: [result.file] });
      } else if ((navigator as any).share) {
        await navigator.share(data);
      } else {
        await copyLink();
      }
    } catch (e) {
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage() {
    setBusy(true);
    try {
      const result = await generatePng();
      if (!result) {
        toast.error(uiS('ui_share_toast_image_failed', 'Image could not be generated'));
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
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success(uiS('ui_share_toast_link_copied', 'Link copied'));
    } catch {
      toast.error(uiS('ui_share_toast_copy_failed', 'Could not copy'));
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`;
  const whatsappUrl = `https://wa.me/?text=${enc(`${text}\n${url}`)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-(--gm-gold) bg-(--gm-gold)/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-(--gm-gold-deep) transition-colors hover:bg-(--gm-gold) hover:text-(--gm-bg-deep)"
      >
        <Share2 size={14} />
        {uiS('ui_share_button_share', 'Share')}
      </button>

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
              {uiS('ui_share_card_title_birth_chart', 'My Birth Chart')}
            </div>
            <div style={{ fontSize: 22, color: brand.colors.text_secondary, fontFamily: 'Manrope, sans-serif' }}>
              {chart.name}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SignRow label={uiS('ui_share_label_sun', 'Sun')} symbol="☀️" sign={sunLabel(sun)} colors={brand.colors} />
            <SignRow label={uiS('ui_share_label_moon', 'Moon')}    symbol="🌙" sign={sunLabel(moon)} colors={brand.colors} />
            <SignRow label={uiS('ui_share_label_rising', 'Rising')} symbol="↑" sign={sunLabel(rising)} colors={brand.colors} />
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

      {/* Share modal */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--gm-bg-deep)]/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8"
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
                {uiS('ui_share_birth_chart_modal_title', 'Share your chart')}
              </h3>
              <p className="mt-2 text-sm text-(--gm-text-dim)">
                {uiS('ui_share_birth_chart_modal_desc', 'An image can be generated and sent to your friends.')}
              </p>
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

            <p className="text-[11px] text-(--gm-muted) mb-3 mt-2">
              {uiS('ui_share_instagram_instructions', 'For Instagram: download the image, then upload it as a Story or Post.')}
            </p>

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
              <button type="button" onClick={() => { downloadImage(); toast.info(uiS('ui_share_toast_instagram_hint', 'Download the image and upload it to Instagram.')); }} className={iconBtn} title="Instagram">
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

const iconBtn =
  'inline-flex items-center justify-center rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-3 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/50 hover:text-(--gm-gold-deep)';

function SignRow({ label, symbol, sign, colors }: { label: string; symbol: string; sign: string; colors: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${colors.brand_primary}1e`,
          border: `1px solid ${colors.brand_primary}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          flexShrink: 0,
        }}
      >
        {symbol}
      </div>
      <div>
        <div style={{ fontSize: 14, letterSpacing: 6, color: colors.brand_primary, textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
          {label}
        </div>
        <div style={{ fontSize: 56, fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', color: colors.text_primary, lineHeight: 1 }}>
          {sign}
        </div>
      </div>
    </div>
  );
}
