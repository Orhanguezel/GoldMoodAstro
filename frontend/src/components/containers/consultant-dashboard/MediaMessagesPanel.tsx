'use client';

import React, { useEffect, useState } from 'react';
import { Mic, Save, Square, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useUiSection } from '@/i18n';
import {
  useGetConsultantMediaSettingsQuery,
  useListMyConsultantMediaMessagesQuery,
  useReplyMediaMessageMutation,
  useUpdateMyConsultantMediaSettingsMutation,
  type MediaKind,
} from '@/integrations/rtk/public/media_messages.endpoints';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { BASE_URL } from '@/integrations/rtk/constants';

type Props = {
  locale: string;
  consultantId: string;
};

export default function MediaMessagesPanel({ locale, consultantId }: Props) {
  const { ui } = useUiSection('ui_dashboard', locale as any);
  const { data: settings } = useGetConsultantMediaSettingsQuery(consultantId, { skip: !consultantId });
  const { data: messages = [], isLoading } = useListMyConsultantMediaMessagesQuery();
  const [updateSettings, updateState] = useUpdateMyConsultantMediaSettingsMutation();
  const [replyMediaMessage, replyState] = useReplyMediaMessageMutation();
  const [uploadToBucket, uploadState] = useUploadToBucketMutation();
  const [form, setForm] = useState({
    audio_enabled: false,
    audio_price: 0,
    video_enabled: false,
    video_price: 0,
    reply_sla_hours: 72,
  });
  const [replyFiles, setReplyFiles] = useState<Record<string, File | null>>({});
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const recorderSupported = typeof window !== 'undefined' && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

  useEffect(() => {
    if (!settings) return;
    setForm({
      audio_enabled: settings.audio_enabled,
      audio_price: settings.audio_price,
      video_enabled: settings.video_enabled,
      video_price: settings.video_price,
      reply_sla_hours: settings.reply_sla_hours,
    });
  }, [settings]);

  async function saveSettings() {
    try {
      await updateSettings(form).unwrap();
      toast.success(ui('ui_dashboard_media_settings_saved', 'Media message settings saved'));
    } catch {
      toast.error(ui('ui_dashboard_media_settings_failed', 'Settings could not be saved'));
    }
  }

  async function sendReply(id: string, kind: MediaKind) {
    const file = replyFiles[id];
    if (!file) {
      toast.error(ui('ui_dashboard_media_reply_file_required', 'Please select a reply file'));
      return;
    }
    try {
      const upload = await uploadToBucket({
        bucket: 'media_messages',
        path: `${consultantId}/replies/${Date.now()}`,
        files: file,
      }).unwrap();
      const storagePath = upload.items?.[0]?.path;
      if (!storagePath) throw new Error('upload_failed');
      await replyMediaMessage({
        id,
        kind,
        storage_path: storagePath,
        note: replyNotes[id]?.trim() || null,
      }).unwrap();
      toast.success(ui('ui_dashboard_media_reply_sent', 'Reply sent'));
      setReplyFiles((prev) => ({ ...prev, [id]: null }));
      setReplyNotes((prev) => ({ ...prev, [id]: '' }));
    } catch {
      toast.error(ui('ui_dashboard_media_reply_failed', 'Reply could not be sent'));
    }
  }

  async function startReplyRecording(id: string, kind: MediaKind) {
    if (!recorderSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'video' ? { audio: true, video: { facingMode: 'user' } } : { audio: true });
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
        setReplyFiles((prev) => ({ ...prev, [id]: new File([blob], `${kind}-reply-${Date.now()}.webm`, { type: mime }) }));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecordingId(null);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecordingId(id);
    } catch {
      toast.error(ui('ui_dashboard_media_record_failed', 'Recording could not be started'));
    }
  }

  function stopReplyRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecordingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/40 p-6">
        <div className="mb-5 flex items-center gap-3">
          <Mic className="h-5 w-5 text-[var(--gm-gold)]" />
          <h3 className="font-serif text-2xl text-[var(--gm-text)]">{ui('ui_dashboard_media_settings_title', 'Recorded Message Settings')}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-[var(--gm-border-soft)] p-4">
            <input type="checkbox" checked={form.audio_enabled} onChange={(e) => setForm((f) => ({ ...f, audio_enabled: e.target.checked }))} />
            <span className="text-sm text-[var(--gm-text)]">{ui('ui_dashboard_media_audio_enabled', 'Voice questions')}</span>
          </label>
          {/* 2026-07-20 (musteri notlari M9): bu uc sayi alaninin HIC etiketi yoktu.
              Ekranda yalnizca iki "0" ve basibos bir "72" goruluyordu; ne oldugu
              anlasilmiyordu. Etiket + birim eklendi. */}
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {ui('ui_dashboard_media_audio_price', 'Voice question price')}
            </span>
            <input className="input-premium w-full" type="number" min="0" value={form.audio_price} onChange={(e) => setForm((f) => ({ ...f, audio_price: Number(e.target.value) }))} />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[var(--gm-border-soft)] p-4">
            <input type="checkbox" checked={form.video_enabled} onChange={(e) => setForm((f) => ({ ...f, video_enabled: e.target.checked }))} />
            <span className="text-sm text-[var(--gm-text)]">{ui('ui_dashboard_media_video_enabled', 'Video questions')}</span>
          </label>
          <label className="block">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {ui('ui_dashboard_media_video_price', 'Video question price')}
            </span>
            <input className="input-premium w-full" type="number" min="0" value={form.video_price} onChange={(e) => setForm((f) => ({ ...f, video_price: Number(e.target.value) }))} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block font-display text-[10px] uppercase tracking-[0.2em] text-[var(--gm-primary)]">
              {ui('ui_dashboard_media_sla_hours', 'Reply time (hours)')}
            </span>
            <input className="input-premium w-full" type="number" min="1" max="336" value={form.reply_sla_hours} onChange={(e) => setForm((f) => ({ ...f, reply_sla_hours: Number(e.target.value) }))} />
            <span className="mt-1 block text-[11px] text-[var(--gm-text-dim)]">
              {ui('ui_dashboard_media_sla_hint', 'How many hours you commit to reply within. Example: 72 = 3 days.')}
            </span>
          </label>
        </div>
        <button type="button" disabled={updateState.isLoading} onClick={saveSettings} className="btn-premium mt-5 inline-flex items-center gap-2 px-6 py-3 text-[10px] disabled:opacity-60">
          <Save className="h-4 w-4" />
          {ui('ui_dashboard_save_changes', 'Save Changes')}
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="h-32 rounded-2xl bg-[var(--gm-surface)] animate-pulse" />
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--gm-border-soft)] p-10 text-center text-sm text-[var(--gm-text-dim)]">
            {ui('ui_dashboard_media_empty', 'No media questions yet.')}
          </div>
        ) : messages.map((message) => {
          const questionFileUrl = `${BASE_URL}/me/media-messages/${encodeURIComponent(message.id)}/file`;
          return (
            <div key={message.id} className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/40 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold)]">{message.kind}</span>
                  <h4 className="font-serif text-xl text-[var(--gm-text)]">{message.customer_name || ui('ui_dashboard_client', 'Client')}</h4>
                  {message.note && <p className="mt-2 text-sm text-[var(--gm-text-dim)]">{message.note}</p>}
                </div>
                <span className="rounded-full bg-[var(--gm-bg-deep)] px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--gm-text-dim)]">{message.status}</span>
              </div>

              {message.kind === 'video' ? (
                <video src={questionFileUrl} controls crossOrigin="use-credentials" className="aspect-video w-full rounded-2xl bg-black object-cover" />
              ) : (
                <audio src={questionFileUrl} controls crossOrigin="use-credentials" className="w-full" />
              )}

              {message.status === 'sent' && (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    type="file"
                    accept={message.kind === 'video' ? 'video/webm,video/mp4' : 'audio/webm,audio/mp4,audio/mpeg'}
                    onChange={(e) => setReplyFiles((prev) => ({ ...prev, [message.id]: e.target.files?.[0] ?? null }))}
                    className="input-premium"
                  />
                  {recorderSupported && (
                    <button
                      type="button"
                      onClick={() => recordingId === message.id ? stopReplyRecording() : startReplyRecording(message.id, message.kind)}
                      className="btn-outline-premium inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px]"
                    >
                      {recordingId === message.id ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {recordingId === message.id ? ui('ui_dashboard_media_stop_recording', 'Stop') : ui('ui_dashboard_media_record_reply', 'Record Reply')}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={uploadState.isLoading || replyState.isLoading}
                    onClick={() => sendReply(message.id, message.kind)}
                    className="btn-premium inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {ui('ui_dashboard_media_send_reply', 'Send Reply')}
                  </button>
                  <textarea
                    rows={2}
                    value={replyNotes[message.id] || ''}
                    onChange={(e) => setReplyNotes((prev) => ({ ...prev, [message.id]: e.target.value }))}
                    placeholder={ui('ui_dashboard_media_reply_note', 'Optional reply note...')}
                    className="input-premium md:col-span-2"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
