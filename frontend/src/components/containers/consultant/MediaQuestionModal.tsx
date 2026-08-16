'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Upload, Video, X } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateMediaMessageMutation, type MediaKind } from '@/integrations/rtk/public/media_messages.endpoints';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { useUiSection } from '@/i18n';

type Props = {
  open: boolean;
  locale: string;
  consultantId: string;
  kind: MediaKind;
  price: number;
  currency?: string;
  onClose: () => void;
  onInsufficientCredits: () => void;
};

export default function MediaQuestionModal({
  open,
  locale,
  consultantId,
  kind,
  price,
  currency = 'TRY',
  onClose,
  onInsufficientCredits,
}: Props) {
  const { ui } = useUiSection('ui_consultant', locale);
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStartedAt, setRecordStartedAt] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [uploadToBucket, uploadState] = useUploadToBucketMutation();
  const [createMediaMessage, createState] = useCreateMediaMessageMutation();

  const maxSeconds = kind === 'video' ? 180 : 300;
  const busy = uploadState.isLoading || createState.isLoading;
  const title = kind === 'video'
    ? ui('ui_consultant_media_video_title', 'Video Question')
    : ui('ui_consultant_media_audio_title', 'Voice Question');

  const recorderSupported = useMemo(
    () => typeof window !== 'undefined' && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined',
    [],
  );

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) stopRecording();
    return () => stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function startRecording() {
    if (!recorderSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'video' ? { audio: true, video: { facingMode: 'user' } } : { audio: true },
      );
      streamRef.current = stream;
      chunksRef.current = [];
      const preferred = kind === 'video' ? 'video/webm' : 'audio/webm';
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(preferred) ? { mimeType: preferred } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || preferred;
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = kind === 'video' ? 'webm' : 'webm';
        setFile(new File([blob], `${kind}-question-${Date.now()}.${ext}`, { type: mime }));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        setRecordStartedAt(null);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordStartedAt(Date.now());
      window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, maxSeconds * 1000);
    } catch {
      toast.error(ui('ui_consultant_media_record_failed', 'Recording could not be started'));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
    setRecordStartedAt(null);
  }

  async function submit() {
    if (!file) {
      toast.error(ui('ui_consultant_media_file_required', 'Please record or upload a file first'));
      return;
    }
    try {
      const duration = recordStartedAt ? Math.max(1, Math.round((Date.now() - recordStartedAt) / 1000)) : undefined;
      const upload = await uploadToBucket({
        bucket: 'media_messages',
        path: `${consultantId}/${Date.now()}`,
        files: file,
      }).unwrap();
      const storagePath = upload.items?.[0]?.path;
      if (!storagePath) throw new Error('upload_failed');
      await createMediaMessage({
        consultant_id: consultantId,
        kind,
        storage_path: storagePath,
        duration_seconds: duration,
        note: note.trim() || null,
      }).unwrap();
      toast.success(ui('ui_consultant_media_sent', 'Your question has been sent'));
      setFile(null);
      setNote('');
      onClose();
    } catch (error: any) {
      const message = error?.data?.error?.message;
      if (message === 'insufficient_credits') {
        toast.error(ui('ui_consultant_media_insufficient_credits', 'Insufficient credits'));
        onInsufficientCredits();
        return;
      }
      toast.error(ui('ui_consultant_media_send_failed', 'Question could not be sent'));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--gm-gold)">{currency} {price}</p>
            <h3 className="font-serif text-2xl text-(--gm-text)">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-(--gm-text-dim) hover:bg-(--gm-bg-deep)">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {previewUrl ? (
            kind === 'video' ? (
              <video src={previewUrl} controls className="aspect-video w-full rounded-2xl bg-black object-cover" />
            ) : (
              <audio src={previewUrl} controls className="w-full" />
            )
          ) : (
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-(--gm-border-soft) bg-(--gm-bg-deep)">
              {kind === 'video' ? <Video className="h-8 w-8 text-(--gm-gold)" /> : <Mic className="h-8 w-8 text-(--gm-gold)" />}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {recorderSupported && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className="btn-premium inline-flex items-center gap-2 px-5 py-3 text-[10px]"
              >
                {isRecording ? <Square className="h-4 w-4" /> : kind === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? ui('ui_consultant_media_stop_recording', 'Stop') : ui('ui_consultant_media_start_recording', 'Record')}
              </button>
            )}
            <label className="btn-outline-premium inline-flex cursor-pointer items-center gap-2 px-5 py-3 text-[10px]">
              <Upload className="h-4 w-4" />
              {ui('ui_consultant_media_upload_file', 'Upload file')}
              <input
                type="file"
                accept={kind === 'video' ? 'video/webm,video/mp4' : 'audio/webm,audio/mp4,audio/mpeg'}
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)"
            placeholder={ui('ui_consultant_media_note_placeholder', 'Add a short note...')}
          />

          <button
            type="button"
            disabled={busy || isRecording}
            onClick={submit}
            className="btn-premium w-full py-3.5 text-[11px] disabled:opacity-60"
          >
            {busy ? ui('ui_consultant_media_sending', 'Sending...') : ui('ui_consultant_media_send_paid', 'Send Question')}
          </button>
        </div>
      </div>
    </div>
  );
}

