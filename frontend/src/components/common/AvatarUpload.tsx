'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { PhotoCaptureInput, type PrepareImageResult } from './image-capture';

type Props = {
  /** Mevcut avatar URL (varsa) */
  src?: string | null;
  /** Avatar yoksa gösterilecek baş harfler */
  initials: string;
  /** Yükleme tamamlanınca yeni URL ile çağrılır */
  onUploaded: (url: string) => void;
  /** Boyut (px) */
  size?: number;
  /** Bucket adı (default: uploads) */
  bucket?: string;
  /** Klasör (default: avatars) */
  folder?: string;
};

export default function AvatarUpload({
  src,
  initials,
  onUploaded,
  size = 96,
  bucket = 'uploads',
  folder = 'avatars',
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [upload, { isLoading }] = useUploadToBucketMutation();

  async function handlePicked(result: PrepareImageResult) {
    const { file: processedFile } = result;
    
    // Anında lokal önizleme
    const localUrl = URL.createObjectURL(processedFile);
    setPreview(localUrl);

    try {
      const res = await upload({ bucket, files: processedFile, path: folder, upsert: true }).unwrap();
      const item = res.items?.[0];
      const url = item?.url || (item?.path ? `/uploads/${item.path}` : '');
      if (!url) throw new Error('upload_url_missing');
      onUploaded(url);
      toast.success('Profil resmi güncellendi');
    } catch (err) {
      toast.error('Resim yüklenemedi. Tekrar deneyin.');
      setPreview(null);
    }
  }

  const handlePickerError = (code: string) => {
    if (code === 'not_an_image') {
      toast.error('Lütfen bir resim dosyası seçin.');
    } else if (code === 'too_large') {
      toast.error('Resim 25 MB altında olmalı.');
    } else {
      toast.error('Resim seçilirken bir hata oluştu.');
    }
  };

  const display = preview || src || '';

  return (
    <div className="relative shrink-0">
      <PhotoCaptureInput
        capture="user"
        offerGalleryChoice={true}
        onPicked={handlePicked}
        onError={handlePickerError}
        prepareOptions={{
          maxEdge: 1600,
          quality: 0.8,
          targetMaxKB: 600
        }}
      >
        <div
          className="relative shrink-0 group"
          style={{ width: size, height: size }}
          role="button"
          aria-label="Profil resmini değiştir"
        >
          <div className="w-full h-full rounded-full border-2 border-(--gm-gold)/30 p-1 overflow-hidden">
            {display ? (
              <img src={display} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-(--gm-bg-deep) flex items-center justify-center text-(--gm-gold) font-display text-2xl">
                {initials}
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-full bg-(--gm-bg-deep)/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isLoading ? (
              <Loader2 size={20} className="text-(--gm-gold) animate-spin" />
            ) : (
              <Camera size={20} className="text-(--gm-gold)" />
            )}
          </div>
        </div>
      </PhotoCaptureInput>
    </div>
  );
}
