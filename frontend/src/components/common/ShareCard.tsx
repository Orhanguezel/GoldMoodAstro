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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://goldmoodastro.com');
  const enc = encodeURIComponent;

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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      toast.success('Link kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
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
          Paylaş
        </button>
      )}

      {/* Hidden Card for PNG generation */}
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
              {variant === 'birth-chart' && 'Doğum Haritam'}
              {variant === 'tarot' && 'Tarot Falım'}
              {variant === 'coffee' && 'Kahve Falım'}
              {variant === 'yildizname' && 'Yıldıznamem'}
              {variant === 'synastry' && 'Aşk Uyumumuz'}
              {variant === 'dream' && 'Rüya Analizim'}
              {variant === 'horoscope' && 'Günlük Burç Yorumum'}
              {variant === 'numerology' && 'Numeroloji Analizim'}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
            {variant === 'birth-chart' && <BirthChartContent data={data} />}
            {variant === 'tarot' && <TarotContent data={data} />}
            {variant === 'coffee' && <CoffeeContent data={data} />}
            {variant === 'yildizname' && <YildiznameContent data={data} />}
            {variant === 'synastry' && <SynastryContent data={data} />}
            {variant === 'dream' && <DreamContent data={data} />}
            {variant === 'horoscope' && <HoroscopeContent data={data} />}
            {variant === 'numerology' && <NumerologyContent data={data} />}
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

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
                Paylaş
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

const iconBtn = 'inline-flex items-center justify-center rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-3 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/50 hover:text-(--gm-gold-deep)';

// ─── Sub-Components for PNG Card ─────────────────────────────────────

function BirthChartContent({ data }: { data: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SignRow label="Güneş" symbol="☀️" sign={data.sun} />
      <SignRow label="Ay"    symbol="🌙" sign={data.moon} />
      <SignRow label="Yükselen" symbol="↑" sign={data.rising} />
    </div>
  );
}

function TarotContent({ data }: { data: any }) {
  // data: { cards: [{ name, image_url, is_reversed }] }
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
              border: '2px solid #C9A961',
              transform: card.is_reversed ? 'rotate(180deg)' : 'none'
            }} 
          />
          <div style={{ fontSize: 18, color: '#C9A961', textTransform: 'uppercase' }}>{card.name}</div>
        </div>
      ))}
    </div>
  );
}

function CoffeeContent({ data }: { data: any }) {
  // data: { symbols: string[], summary: string }
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {data.symbols?.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 24px', border: '1px solid #C9A961', borderRadius: 40, color: '#C9A961', fontSize: 20 }}>
              {s}
            </div>
          ))}
       </div>
       <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: '#E5DCC8' }}>
          "{data.summary}"
       </div>
    </div>
  );
}

function YildiznameContent({ data }: { data: any }) {
  // data: { name, mother_name, menzil, number }
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ fontSize: 80, color: '#C9A961' }}>{data.number}</div>
       <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase' }}>Senin Sayın</div>
       <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', color: '#FAF6EF' }}>
          Menzilin: {data.menzil}
       </div>
    </div>
  );
}

function SynastryContent({ data }: { data: any }) {
  // data: { partnerA, partnerB, scoreLove, scoreAttraction }
  return (
    <div style={{ gap: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ fontSize: 42 }}>{data.partnerA}</div>
          <div style={{ fontSize: 48, color: '#C9A961' }}>❤️</div>
          <div style={{ fontSize: 42 }}>{data.partnerB}</div>
       </div>
       <div style={{ display: 'flex', gap: 80 }}>
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 64, color: '#C9A961' }}>%{data.scoreLove}</div>
             <div style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>Aşk Uyumu</div>
          </div>
          <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: 64, color: '#C9A961' }}>%{data.scoreAttraction}</div>
             <div style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 2 }}>Çekim</div>
          </div>
       </div>
    </div>
  );
}

function DreamContent({ data }: { data: any }) {
  // data: { symbols: string[], excerpt: string }
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {data.symbols?.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 24px', border: '1px solid #C9A961', borderRadius: 40, color: '#C9A961', fontSize: 20 }}>
              {s}
            </div>
          ))}
       </div>
       <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: '#E5DCC8' }}>
          "{data.excerpt}"
       </div>
    </div>
  );
}

function HoroscopeContent({ data }: { data: any }) {
  // data: { sign, symbol, date, content }
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ 
          fontSize: 160, 
          color: '#C9A961', 
          width: 200, 
          height: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          border: '2px solid rgba(201,169,97,0.3)',
          backgroundColor: 'rgba(201,169,97,0.1)'
       }}>
          {data.symbol}
       </div>
       <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#C9A961', marginBottom: 8 }}>{data.date}</div>
          <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF' }}>{data.sign} Burcu</div>
       </div>
       <div style={{ fontSize: 28, fontFamily: 'Fraunces', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.4, color: '#E5DCC8', maxWidth: 800 }}>
          "{data.content.length > 200 ? data.content.substring(0, 200) + '...' : data.content}"
       </div>
    </div>
  );
}

function NumerologyContent({ data }: { data: any }) {
  // data: { lifePath, destiny, soulUrge, personality }
  return (
    <div style={{ gap: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
       <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          <NumBox label="Hayat Yolu" value={data.lifePath} color="#60a5fa" />
          <NumBox label="Kader" value={data.destiny} color="#C9A961" />
          <NumBox label="Ruh Güdüsü" value={data.soulUrge} color="#f87171" />
          <NumBox label="Kişilik" value={data.personality} color="#34d399" />
       </div>
    </div>
  );
}

function NumBox({ label, value, color }: { label: string; value: number | string; color: string }) {
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
      <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: '#A09888' }}>{label}</div>
    </div>
  );
}

function SignRow({ label, symbol, sign }: { label: string; symbol: string; sign: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(201,169,97,0.12)', border: '1px solid rgba(201,169,97,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
        {symbol}
      </div>
      <div>
        <div style={{ fontSize: 14, letterSpacing: 6, color: '#C9A961', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF', lineHeight: 1 }}>{sign}</div>
      </div>
    </div>
  );
}
