'use client';
// =============================================================
// FILE: src/components/common/ShareStoryCard.tsx
//
// Sosyal paylaşım kartı — Instagram/Facebook hikâyesi, reels kapağı ve
// gönderi ölçüsünde hazır PNG indirir.
//
// NEDEN SUNUCUDA ÜRETİLİYOR: mevcut ShareCard, DOM'u html-to-image ile
// resme çeviriyor; ölçü cihazdan cihaza değişiyor ve hikâye için gereken
// 1080×1920 tam oturmuyordu. Bu bileşen /share-image rotasından geliyor:
// ölçü kesin, tipografi her cihazda aynı, renkler site temasından.
//
// Kullanım: sonuç sayfalarında (yıldızname/tarot/numeroloji) imageBase ver,
// bileşen ?format=story|square ekler.
// =============================================================
import React from 'react';
import { Download, Instagram, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { useUiSection } from '@/i18n';

type FormatKey = 'story' | 'square';

interface Props {
  /** Kart üretim rotası, format parametresi olmadan. */
  imageBase: string;
  /** Paylaşım metni (WhatsApp/native share). */
  shareText: string;
  /** Paylaşılacak sayfa adresi; verilmezse mevcut sayfa. */
  shareUrl?: string;
  fileBaseName?: string;
  locale?: string;
}

export default function ShareStoryCard({
  imageBase,
  shareText,
  shareUrl,
  fileBaseName = 'goldmoodastro',
  locale,
}: Props) {
  const { ui } = useUiSection('ui_share' as any, locale);
  const [format, setFormat] = React.useState<FormatKey>('story');
  const [busy, setBusy] = React.useState(false);

  const src = `${imageBase}?format=${format}`;
  const pageUrl =
    shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://goldmoodastro.com');

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('image_failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileBaseName}-${format}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(ui('ui_share_toast_image_downloaded', 'Görsel indirildi'));
    } catch {
      toast.error(ui('ui_share_toast_image_failed', 'Görsel oluşturulamadı'));
    } finally {
      setBusy(false);
    }
  };

  const nativeShare = async () => {
    const nav = navigator as any;
    setBusy(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], `${fileBaseName}-${format}.png`, { type: 'image/png' });
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: shareText, url: pageUrl });
      } else if (nav.share) {
        await nav.share({ text: shareText, url: pageUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${pageUrl}`);
        toast.success(ui('ui_share_toast_copied', 'Bağlantı kopyalandı'));
      }
    } catch {
      /* kullanıcı vazgeçti */
    } finally {
      setBusy(false);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`;

  const tabCls = (active: boolean) =>
    `rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
      active
        ? 'bg-(--gm-gold) text-(--gm-bg-deep)'
        : 'border border-(--gm-border-soft) text-(--gm-text-dim) hover:text-(--gm-text)'
    }`;

  return (
    <div className="rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-xl text-(--gm-text)">
            {ui('ui_share_story_title', 'Sosyal medyada paylaş')}
          </h3>
          <p className="mt-1 text-xs text-(--gm-text-dim)">
            {ui('ui_share_story_desc', 'Hikâye veya gönderi ölçüsünde hazır görsel indir.')}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFormat('story')} className={tabCls(format === 'story')}>
            {ui('ui_share_format_story', 'Hikâye 9:16')}
          </button>
          <button type="button" onClick={() => setFormat('square')} className={tabCls(format === 'square')}>
            {ui('ui_share_format_square', 'Gönderi 1:1')}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div
          className={`overflow-hidden rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) ${
            format === 'story' ? 'w-[200px]' : 'w-[260px]'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={ui('ui_share_story_preview_alt', 'Paylaşım kartı önizlemesi')}
            className="block h-auto w-full"
            loading="lazy"
          />
        </div>

        <div className="flex w-full flex-col gap-3 md:max-w-xs">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-(--gm-gold) px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-(--gm-bg-deep) transition-opacity disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {ui('ui_share_button_download_image', 'Görseli indir')}
          </button>

          <button
            type="button"
            onClick={nativeShare}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-(--gm-border-soft) px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-(--gm-text) transition-colors hover:border-(--gm-gold)/40 disabled:opacity-60"
          >
            <Share2 className="size-4" />
            {ui('ui_share_button_share', 'Paylaş')}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-(--gm-border-soft) px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-(--gm-text-dim) transition-colors hover:text-(--gm-text)"
          >
            WhatsApp
          </a>

          <p className="mt-1 flex items-start gap-2 text-[11px] leading-relaxed text-(--gm-muted)">
            <Instagram className="mt-0.5 size-3.5 shrink-0" />
            {ui(
              'ui_share_story_hint',
              'Instagram ve Facebook hikâyesine eklemek için görseli indirip uygulamadan yükleyin.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
