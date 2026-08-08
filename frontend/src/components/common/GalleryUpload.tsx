'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { prepareImageForUpload } from './image-capture';
import { useUiSection } from '@/i18n';

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  max?: number;
};

// Danışman galeri yükleyici: çoklu görsel seç → her biri client'ta küçültülür →
// toplu yüklenir → mevcut listeye eklenir. Tek tek silinebilir.
export default function GalleryUpload({
  value,
  onChange,
  bucket = 'consultant_avatars',
  folder = 'gallery',
  max = 12,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [upload, { isLoading }] = useUploadToBucketMutation();
  const { ui } = useUiSection('ui_misc' as any);
  const [busy, setBusy] = useState(false);

  const items = Array.isArray(value) ? value : [];
  const remaining = Math.max(0, max - items.length);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList).slice(0, remaining);
    if (picked.length < fileList.length) {
      toast.error(ui('ui_gallery_max_reached', `En fazla ${max} görsel ekleyebilirsiniz.`));
    }
    if (picked.length === 0) return;

    setBusy(true);
    try {
      // Her dosyayı EXIF düzelt + küçült (telefon fotoğrafları büyük gelir).
      const prepared: File[] = [];
      for (const f of picked) {
        if (!f.type.startsWith('image/')) continue;
        try {
          const res = await prepareImageForUpload(f, { maxEdge: 1600, quality: 0.8, targetMaxKB: 600 });
          prepared.push(res.file);
        } catch {
          // hazırlanamayan dosyayı atla
        }
      }
      if (prepared.length === 0) {
        toast.error(ui('ui_gallery_no_valid', 'Yüklenebilir görsel bulunamadı (JPG, PNG, WebP).'));
        return;
      }
      const res = await upload({ bucket, files: prepared, path: folder, upsert: true }).unwrap();
      const urls = (res.items ?? [])
        .map((it) => it?.url || (it?.path ? `/uploads/${it.path}` : ''))
        .filter(Boolean) as string[];
      if (urls.length === 0) throw new Error('upload_url_missing');
      onChange([...items, ...urls]);
      toast.success(ui('ui_gallery_added', `${urls.length} görsel eklendi`));
    } catch (err) {
      console.error('[GalleryUpload] upload failed', err);
      toast.error(ui('ui_gallery_upload_failed', 'Görseller yüklenemedi. Boyut/format kontrol edip tekrar deneyin.'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(i: number) {
    const next = items.slice();
    next.splice(i, 1);
    onChange(next);
  }

  const loading = busy || isLoading;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {items.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={ui('ui_gallery_remove', 'Kaldır')}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="aspect-square rounded-xl border-2 border-dashed border-[var(--gm-gold)]/30 bg-[var(--gm-surface)]/30 flex flex-col items-center justify-center gap-1.5 text-[var(--gm-gold)] hover:bg-[var(--gm-surface)]/50 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {loading ? ui('ui_gallery_uploading', 'Yükleniyor') : ui('ui_gallery_add', 'Görsel ekle')}
            </span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-[var(--gm-text-dim)]">
        {ui('ui_gallery_hint', 'Birden fazla seçebilirsiniz. JPG, PNG veya WebP.')} · {items.length}/{max}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
