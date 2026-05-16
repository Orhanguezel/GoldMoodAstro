'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/_components/admin-storage-detail-client.tsx
// FINAL — Admin Storage Upload/Edit (App Router + shadcn)
// - File upload (multipart FormData)
// - Edit metadata
// - Preview
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2, Upload, Image as ImageIcon, File, Globe, FolderOpen, Database } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { StorageUpdateInput } from '@/integrations/shared';
import {
  useGetAssetAdminQuery,
  useCreateAssetAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type FormData = {
  name: string;
  bucket: string;
  folder: string;
  metadataText: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function isImageMime(mime: string | null | undefined) {
  return String(mime ?? '').startsWith('image/');
}

type PreviewPreset = 'original' | 'thumb' | 'card' | 'hero';

function toCloudinaryPreview(url: string, preset: PreviewPreset): string {
  const raw = String(url || '').trim();
  if (!raw.includes('res.cloudinary.com') || !raw.includes('/upload/')) return raw;

  const transforms =
    preset === 'thumb'
      ? 'f_auto,q_auto:eco,w_240,h_240,c_fill'
      : preset === 'card'
        ? 'f_auto,q_auto:eco,w_640,h_420,c_fill'
        : preset === 'hero'
          ? 'f_auto,q_auto:good,w_1440,h_900,c_fit'
          : '';

  if (!transforms) return raw.replace(/\/upload\/[^/]+\/(.*)$/i, '/upload/$1');
  return raw.replace('/upload/', `/upload/${transforms}/`);
}

export default function AdminStorageDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT('admin.storage');
  const isNew = id === 'new';

  function getErrMsg(e: unknown): string {
    const anyErr = e as any;
    return (
      anyErr?.data?.error?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      t('errorFallback')
    );
  }

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetAssetAdminQuery(
    { id },
    { skip: isNew }
  );

  const [createAsset, { isLoading: isCreating }] = useCreateAssetAdminMutation();
  const [patchAsset, { isLoading: isUpdating }] = usePatchAssetAdminMutation();
  const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetAdminMutation();

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    bucket: 'public',
    folder: '',
    metadataText: '{}',
  });

  // File state (only for upload)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = React.useState<PreviewPreset>('card');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      setFormData({
        name: existingItem.name || '',
        bucket: existingItem.bucket || 'public',
        folder: existingItem.folder || '',
        metadataText: JSON.stringify(existingItem.metadata ?? {}, null, 2),
      });

      if (existingItem.url && isImageMime(existingItem.mime)) {
        setPreviewUrl(existingItem.url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [existingItem, isNew]);

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-fill name from filename
    if (!formData.name) {
      setFormData((prev) => ({ ...prev, name: file.name }));
    }

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const busy = isCreating || isUpdating || isDeleting || loadingItem;
  const currentPreviewBase = previewUrl || existingItem?.url || '';
  const currentPreviewSrc = React.useMemo(
    () => toCloudinaryPreview(currentPreviewBase, previewPreset),
    [currentPreviewBase, previewPreset],
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isNew) {
        // Upload mode
        if (!selectedFile) {
          toast.error(t('detail.selectFileError'));
          return;
        }

        if (!formData.bucket.trim()) {
          toast.error(t('detail.bucketRequiredError'));
          return;
        }

        await createAsset({
          file: selectedFile,
          bucket: formData.bucket.trim(),
          folder: formData.folder.trim() || undefined,
        }).unwrap();

        toast.success(t('detail.fileUploaded'));
        router.push('/admin/storage');
      } else {
        // Edit mode
        let metadata: Record<string, string> | null | undefined = undefined;
        const raw = formData.metadataText.trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
              toast.error('Metadata JSON object olmalı.');
              return;
            }
            metadata = Object.fromEntries(
              Object.entries(parsed).map(([k, v]) => [String(k), String(v ?? '')]),
            );
          } catch {
            toast.error('Metadata JSON geçersiz.');
            return;
          }
        } else {
          metadata = null;
        }

        const updateData: StorageUpdateInput = {
          name: formData.name.trim() || undefined,
          folder: formData.folder.trim() || null,
          metadata,
        };

        await patchAsset({
          id,
          body: updateData,
        }).unwrap();

        toast.success(t('detail.recordUpdated'));
      }
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew) return;

    try {
      await deleteAsset({ id }).unwrap();
      toast.success(t('list.fileDeleted'));
      router.push('/admin/storage');
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="text-gm-error font-serif text-lg">
              {t('detail.loadError', { error: getErrMsg(loadError) })}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/storage')}
              className="mt-6 h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-xs font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface gap-2"
            >
              <ArrowLeft className="size-4 text-gm-gold" />
              {t('detail.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && loadingItem) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-gm-gold font-serif italic text-lg">
              <Loader2 className="size-6 animate-spin" />
              <span>{t('list.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Outside Page Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gm-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">BULUT DEPOLAMA</span>
            </div>
            <h1 className="font-serif text-4xl text-gm-text">
              {isNew ? t('detail.uploadTitle') : t('detail.editTitle')}
            </h1>
            <p className="text-sm italic text-gm-muted">
              {isNew ? t('detail.uploadDescription') : t('detail.editDescription')}
            </p>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/storage')}
              disabled={busy}
              className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80 gap-2"
            >
              <ArrowLeft className="size-4 text-gm-gold" />
              {t('detail.backButton')}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Left Column: Visual Preview & Cloudinary Config */}
          <div className="lg:col-span-1 space-y-8">
            {(previewUrl || existingItem?.url) ? (
              <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
                <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
                  <CardTitle className="font-serif text-lg text-gm-text">{t('detail.previewTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-center rounded-2xl border border-gm-border-soft/50 bg-gm-bg-deep/40 p-4 shadow-inner">
                    {((previewUrl || existingItem?.url) &&
                      (isNew ? isImageMime(selectedFile?.type) : isImageMime(existingItem?.mime))) ? (
                      <img
                        src={currentPreviewSrc}
                        alt="Preview"
                        className="max-h-80 rounded-xl object-contain shadow-lg"
                      />
                    ) : (
                      <div className="flex size-32 items-center justify-center">
                        <File className="size-16 text-gm-muted" />
                      </div>
                    )}
                  </div>

                  {/* Cloudinary Preset Controls & Info */}
                  {existingItem && (
                    <div className="space-y-4 pt-2">
                      {existingItem.url && isImageMime(existingItem.mime) ? (
                        <div className="space-y-2 border-b border-gm-border-soft/50 pb-4">
                          <Label htmlFor="preview_preset" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">
                            Resim Optimizasyonu (CDN)
                          </Label>
                          <Select
                            value={previewPreset}
                            onValueChange={(value) => setPreviewPreset(value as PreviewPreset)}
                          >
                            <SelectTrigger id="preview_preset" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-gm-text focus:border-gm-gold/50 focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gm-surface text-gm-text border-gm-border-soft">
                              <SelectItem value="original">Orijinal Boyut (Original)</SelectItem>
                              <SelectItem value="thumb">Küçük Resim (Thumbnail 240x240)</SelectItem>
                              <SelectItem value="card">Kart Görünümü (Card 640x420)</SelectItem>
                              <SelectItem value="hero">Geniş Banner (Hero 1440x900)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-gm-border-soft/30 pb-2">
                          <span className="text-gm-muted">{t('detail.mimeLabel')}</span>
                          <Badge variant="secondary" className="rounded-full text-[10px] px-2.5 py-0.5">{existingItem.mime}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b border-gm-border-soft/30 pb-2">
                          <span className="text-gm-muted">{t('detail.sizeLabel')}</span>
                          <span className="font-semibold text-gm-text">{formatBytes(existingItem.size)}</span>
                        </div>
                        {existingItem.width && existingItem.height && (
                          <div className="flex items-center justify-between border-b border-gm-border-soft/30 pb-2">
                            <span className="text-gm-muted">{t('detail.dimensionsLabel')}</span>
                            <span className="font-semibold text-gm-text">{existingItem.width} × {existingItem.height} px</span>
                          </div>
                        )}
                        {existingItem.url && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-gm-muted">{t('detail.urlLabel')}</span>
                            <a
                              href={existingItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gm-gold hover:underline font-bold flex items-center gap-1"
                            >
                              <Globe className="size-3.5" />
                              {t('detail.openLink')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
                <CardContent className="p-8 text-center text-gm-muted italic font-serif py-16">
                  Resim veya dosya yüklenmedi.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Metadata Form Fields */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upload/Edit Fields Card */}
            <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
                <CardTitle className="font-serif text-lg text-gm-text">
                  {isNew ? t('detail.selectFileTitle') : t('detail.fileInfoTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {isNew ? (
                  // Upload Mode Fields
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="file" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">
                        {t('detail.fileLabel')} <span className="text-red-500 font-bold">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileSelect}
                          disabled={busy}
                          required
                          className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/10 px-4 text-sm text-gm-text file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-gm-gold file:text-gm-bg file:hover:bg-gm-gold/80 cursor-pointer pt-2"
                        />
                      </div>
                      {selectedFile && (
                        <p className="text-[11px] text-gm-muted pl-1 italic">
                          {t('detail.selectedFile', { name: selectedFile.name, size: formatBytes(selectedFile.size) })}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bucket" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                          {t('detail.bucketLabel')} <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <div className="relative">
                          <Database className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted" />
                          <Input
                            id="bucket"
                            value={formData.bucket}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, bucket: e.target.value }))
                            }
                            placeholder={t('detail.bucketPlaceholder')}
                            disabled={busy}
                            required
                            className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 pl-11 pr-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folder" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                          {t('detail.folderLabel')}
                        </Label>
                        <div className="relative">
                          <FolderOpen className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted" />
                          <Input
                            id="folder"
                            value={formData.folder}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, folder: e.target.value }))
                            }
                            placeholder={t('detail.folderPlaceholder')}
                            disabled={busy}
                            className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 pl-11 pr-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50"
                          />
                        </div>
                        <p className="text-[10px] text-gm-muted/80 pl-2 italic">
                          {t('detail.folderHelp')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode Fields
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">
                        {t('detail.fileNameLabel')}
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder={t('detail.fileNamePlaceholder')}
                        disabled={busy}
                        className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bucket_readonly" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                          {t('detail.bucketLabel')}
                        </Label>
                        <Input
                          id="bucket_readonly"
                          value={formData.bucket}
                          disabled
                          className="h-11 rounded-full border-gm-border-soft bg-gm-surface/5 opacity-70 px-5 text-sm text-gm-muted cursor-not-allowed"
                        />
                        <p className="text-[10px] text-gm-muted/80 pl-2 italic">
                          {t('detail.bucketReadonlyHelp')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folder_edit" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                          {t('detail.folderLabel')}
                        </Label>
                        <Input
                          id="folder_edit"
                          value={formData.folder}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, folder: e.target.value }))
                          }
                          placeholder={t('detail.folderPlaceholder')}
                          disabled={busy}
                          className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metadata_edit" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                        Metadata Tanımı (JSON)
                      </Label>
                      <textarea
                        id="metadata_edit"
                        value={formData.metadataText}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, metadataText: e.target.value }))
                        }
                        placeholder='{"alt":"Görsel tanımı","title":"Başlık"}'
                        disabled={busy}
                        className="min-h-[160px] w-full rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 text-sm font-mono text-gm-text focus:border-gm-gold/50 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
              <CardContent className="p-8 flex flex-col gap-4 sm:flex-row sm:justify-between items-center">
                <div>
                  {!isNew && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteClick}
                      disabled={busy}
                      className="h-12 rounded-full px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/10 border-transparent gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('detail.deleting')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="size-4" />
                          {t('detail.deleteButton')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/storage')}
                    disabled={busy}
                    className="flex-1 sm:flex-none h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-xs font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
                  >
                    {t('detail.cancelButton')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={busy} 
                    className="flex-1 sm:flex-none h-12 rounded-full px-8 text-xs font-bold uppercase tracking-widest bg-gm-gold text-gm-bg hover:bg-gm-gold/80 shadow-lg shadow-gm-gold/10 border-transparent gap-2"
                  >
                    {isCreating || isUpdating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {isNew ? t('detail.uploading') : t('detail.saving')}
                      </>
                    ) : (
                      <>
                        {isNew ? <Upload className="size-4" /> : <Save className="size-4" />}
                        {isNew ? t('detail.uploadButton') : t('detail.saveButton')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-gm-border-soft bg-gm-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-gm-text">{t('list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gm-muted/80">
              {t('list.deleteConfirmDescription', { name: formData.name || t('list.defaultFileName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 text-gm-text hover:bg-gm-surface">{t('detail.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-11 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold">{t('detail.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
