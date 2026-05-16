'use client';

import React, { useRef } from 'react';
import { 
  prepareImageForUpload, 
  type PrepareImageOptions, 
  type PrepareImageResult 
} from './prepareImageForUpload';

export type PhotoCaptureInputProps = {
  onPicked: (result: PrepareImageResult) => void;   // hazırlanmış dosya
  onError?: (code: 'not_an_image' | 'too_large' | 'unknown') => void;
  /** 'user' = ön kamera (selfie/yüz), 'environment' = arka (kahve). */
  capture?: 'user' | 'environment';
  /** Mobilde "Kameradan Çek" + "Galeriden Seç" seçimi sun. Varsayılan: true */
  offerGalleryChoice?: boolean;
  /** prepareImageForUpload opsiyonları (override). */
  prepareOptions?: PrepareImageOptions;
  /** Yüklemeden önce ham boyut sınırı (MB). Varsayılan: 25 */
  maxInputMB?: number;
  children?: React.ReactNode;   // tetikleyici (tıklanabilir alan)
  className?: string;
};

export default function PhotoCaptureInput({
  onPicked,
  onError,
  capture,
  offerGalleryChoice = true,
  prepareOptions,
  maxInputMB = 25,
  children,
  className
}: PhotoCaptureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('not_an_image');
      return;
    }

    if (file.size > maxInputMB * 1024 * 1024) {
      onError?.('too_large');
      return;
    }

    try {
      const result = await prepareImageForUpload(file, prepareOptions);
      onPicked(result);
    } catch (err: any) {
      if (err.message === 'not_an_image') {
        onError?.('not_an_image');
      } else {
        onError?.('unknown');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset value so same file can be picked again if needed
    e.target.value = '';
  };

  const handleClick = () => {
    // If we want to offer gallery choice and we are on mobile, 
    // we can't easily show a native picker with both options from just one <input>.
    // Usually browser shows "Camera / Files" automatically for <input type="file" accept="image/*">.
    // Specifying capture="user" FORCES camera on many Android devices, skipping gallery.
    
    if (offerGalleryChoice) {
      // Standard picker (Browser usually shows both Camera and Gallery)
      fileInputRef.current?.click();
    } else {
      // Direct camera picker
      captureInputRef.current?.click();
    }
  };

  return (
    <div onClick={handleClick} className={className} style={{ cursor: 'pointer' }}>
      {children}
      
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      {capture && (
        <input
          type="file"
          ref={captureInputRef}
          accept="image/*"
          capture={capture}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
