'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { PhotoCaptureInput, type PrepareImageResult } from './image-capture';
import { useUiSection } from '@/i18n';

type UiFn = (key: string, fallback?: string) => string;

type Props = {
  src?: string | null;
  initials: string;
  onUploaded: (url: string) => void;
  size?: number;
  bucket?: string;
  folder?: string;
};

function readUploadError(err: unknown, ui: UiFn): string {
  const data = (err as { data?: unknown })?.data;
  const status = (err as { status?: unknown })?.status;
  const payload = typeof data === 'object' && data !== null ? data as Record<string, any> : {};
  const error = typeof payload.error === 'object' && payload.error !== null ? payload.error as Record<string, any> : payload;
  const code = String(error.code || error.message || payload.message || '');

  if (status === 401 || status === 403) {
    return ui('ui_misc_upload_err_unauthorized', 'Session could not be verified. Please sign in again and retry.');
  }
  if (code === 'avatar_too_small' || code === 'avatar_min_400x400') {
    return ui('ui_misc_upload_err_too_small', 'The profile picture must be at least 400x400 pixels.');
  }
  if (code === 'avatar_too_large' || code === 'avatar_max_5mb') {
    return ui('ui_misc_upload_err_too_large', 'The profile picture must be under 5 MB.');
  }
  if (code === 'invalid_avatar_mime' || code === 'avatar_must_be_image') {
    return ui('ui_misc_upload_err_invalid_format', 'Please upload an image in JPG, PNG or WebP format.');
  }
  if (code === 'storage_not_configured') {
    return ui('ui_misc_upload_err_not_configured', 'The file upload service is not configured at the moment. Please contact support.');
  }
  if (code === 'multipart_parse_error' || code === 'invalid_multipart_body') {
    return ui('ui_misc_upload_err_unreadable', 'The image file could not be read. Please try again with a different file.');
  }
  return ui('ui_misc_upload_err_generic', 'The image could not be uploaded. Check the file size and format, then try again.');
}

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
  const { ui } = useUiSection('ui_misc' as any);

  async function handlePicked(result: PrepareImageResult) {
    const { file: processedFile } = result;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(processedFile.type)) {
      toast.error(ui('ui_misc_avatar_unsupported_format', 'Only JPG, PNG and WebP formats are supported. If you use an iPhone (HEIC), change the format and try again.'));
      return;
    }

    if (processedFile.size > 5 * 1024 * 1024) {
      toast.error(ui('ui_misc_avatar_too_large_after_compress', 'The file size must be under 5 MB after compression. Please try a different photo.'));
      return;
    }

    const localUrl = URL.createObjectURL(processedFile);
    setPreview(localUrl);

    try {
      const res = await upload({ bucket, files: processedFile, path: folder, upsert: true }).unwrap();
      const item = res.items?.[0];
      const url = item?.url || (item?.path ? `/uploads/${item.path}` : '');
      if (!url) throw new Error('upload_url_missing');
      onUploaded(url);
      toast.success(ui('ui_misc_avatar_updated', 'Profile picture updated'));
    } catch (err) {
      console.error('[AvatarUpload] upload failed', err);
      toast.error(readUploadError(err, ui));
      setPreview(null);
    }
  }

  const handlePickerError = (code: string) => {
    if (code === 'not_an_image') {
      toast.error(ui('ui_misc_avatar_select_image', 'Please select an image file.'));
    } else if (code === 'too_large') {
      toast.error(ui('ui_misc_avatar_max_25mb', 'The image must be under 25 MB.'));
    } else {
      toast.error(ui('ui_misc_avatar_prepare_failed', 'The image could not be prepared. Please try a different JPG, PNG or WebP file.'));
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
          aria-label={ui('ui_misc_change_avatar', 'Change profile picture')}
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
