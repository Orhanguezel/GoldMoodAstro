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

type Props = {
  chart: BirthChart;
  /** Paylaşılabilir public URL (yoksa şu anki sayfa URL'si kullanılır) */
  shareUrl?: string;
};

const SIGN_LABELS_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

export default function ShareBirthChart({ chart, shareUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const url =
    shareUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'https://goldmoodastro.com');

  const sun = chart.chart_data?.planets?.sun?.sign;
  const moon = chart.chart_data?.planets?.moon?.sign;
  const rising = chart.chart_data?.ascendant?.sign;

  const text = `Doğum haritamı GoldMoodAstro'da çıkardım ✨\n☀️ Güneş: ${sunLabel(sun)}  •  🌙 Ay: ${sunLabel(moon)}  •  ↑ Yükselen: ${sunLabel(rising)}\nSeninkini de keşfet:`;

  function sunLabel(sign?: string) {
    if (!sign) return '—';
    return SIGN_LABELS_TR[sign] ?? sign;
  }

  const enc = encodeURIComponent;

  // ─── Görsel oluştur (PNG) ──────────────────────────────────
  async function generatePng(): Promise<{ blob: Blob; file: File } | null> {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#1A1715',
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `dogum-haritam-${Date.now()}.png`, { type: 'image/png' });
      return { blob, file };
    } catch (e) {
      console.error('toPng failed', e);
      return null;
    }
  }

  // ─── Native Web Share (mobile, Instagram dahil) ────────────
  async function nativeShare() {
    setBusy(true);
    try {
      const result = await generatePng();
      const data: ShareData = { title: 'Doğum Haritam', text, url };
      // Görsel paylaşımı destekleniyorsa (mobilde IG, FB Story vs.)
      if (result && (navigator as any).canShare?.({ files: [result.file] })) {
        await navigator.share({ ...data, files: [result.file] });
      } else if ((navigator as any).share) {
        await navigator.share(data);
      } else {
        await copyLink();
      }
    } catch (e) {
      // Kullanıcı iptal etti — sessiz geç
    } finally {
      setBusy(false);
    }
  }

  // ─── Görsel indir ──────────────────────────────────────────
  async function downloadImage() {
    setBusy(true);
    try {
      const result = await generatePng();
      if (!result) {
        toast.error('Görsel oluşturulamadı');
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Görsel indirildi');
    } finally {
      setBusy(false);
    }
  }

  // ─── Link kopyala ──────────────────────────────────────────
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  }

  // ─── Intent URLs ────────────────────────────────────────────
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
        Paylaş
      </button>

      {/* Paylaşılabilir kart — modal'a render edilir, görüntülenmez ama PNG'e dönüşür */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div
          ref={cardRef}
          style={{
            width: 1080,
            height: 1350,
            background: 'linear-gradient(135deg,#2A2620 0%,#3D2E47 60%,#1A1715 100%)',
            color: '#FAF6EF',
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
              <circle cx="100" cy="100" r="98" fill="none" stroke="#C9A961" strokeWidth="0.5" strokeDasharray="3 3"/>
              <circle cx="100" cy="100" r="70" fill="none" stroke="#C9A961" strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="40" fill="none" stroke="#C9A961" strokeWidth="0.5"/>
              <circle cx="100" cy="100" r="4" fill="#C9A961"/>
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 18, letterSpacing: 8, color: '#C9A961', textTransform: 'uppercase', marginBottom: 24 }}>
              GoldMoodAstro
            </div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 64, fontStyle: 'italic', lineHeight: 1.05, marginBottom: 16, color: '#FAF6EF' }}>
              Doğum<br/>Haritam
            </div>
            <div style={{ fontSize: 22, color: '#E5DCC8', fontFamily: 'Manrope, sans-serif' }}>
              {chart.name}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <SignRow label="Güneş" symbol="☀️" sign={sunLabel(sun)} />
            <SignRow label="Ay"    symbol="🌙" sign={sunLabel(moon)} />
            <SignRow label="Yükselen" symbol="↑" sign={sunLabel(rising)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 18, color: '#A09888', fontFamily: 'Manrope, sans-serif' }}>
              goldmoodastro.com
            </div>
            <div style={{ fontSize: 14, letterSpacing: 4, color: '#C9A961', textTransform: 'uppercase' }}>
              Yıldızlarla tanışan modern astroloji
            </div>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
                Paylaş
              </div>
              <h3 className="mt-1 font-serif text-2xl text-(--gm-text)">
                Haritanı paylaş
              </h3>
              <p className="mt-2 text-sm text-(--gm-text-dim)">
                Görsel oluşturulup arkadaşlarına gönderilebilir.
              </p>
            </div>

            {/* Native share + indir */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={nativeShare}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Share2 size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">Hızlı paylaş</span>
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={busy}
                className="inline-flex flex-col items-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-4 text-(--gm-text) transition-colors hover:border-(--gm-gold)/50 disabled:opacity-50"
              >
                <Download size={20} className="text-(--gm-gold-deep)" />
                <span className="text-xs font-medium">Görseli indir</span>
              </button>
            </div>

            <p className="text-[11px] text-(--gm-muted) mb-3 mt-2">
              Instagram için: görseli indir → Instagram → Story / Post olarak yükle
            </p>

            {/* Platforma özel */}
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
              <button type="button" onClick={() => { downloadImage(); toast.info('Görseli indirip Instagram\'a yükleyebilirsin'); }} className={iconBtn} title="Instagram">
                <Instagram size={18} />
              </button>
            </div>

            {/* Linki kopyala */}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text-dim) transition-colors hover:text-(--gm-text)"
            >
              <Copy size={14} />
              Linki kopyala
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const iconBtn =
  'inline-flex items-center justify-center rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-3 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/50 hover:text-(--gm-gold-deep)';

function SignRow({ label, symbol, sign }: { label: string; symbol: string; sign: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(201,169,97,0.12)',
          border: '1px solid rgba(201,169,97,0.4)',
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
        <div style={{ fontSize: 14, letterSpacing: 6, color: '#C9A961', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
          {label}
        </div>
        <div style={{ fontSize: 56, fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', color: '#FAF6EF', lineHeight: 1 }}>
          {sign}
        </div>
      </div>
    </div>
  );
}
