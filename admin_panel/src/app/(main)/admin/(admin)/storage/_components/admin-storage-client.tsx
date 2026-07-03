'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/storage/_components/admin-storage-client.tsx
// FINAL — Admin Storage List (App Router + shadcn)
// - Modern UI with shadcn/ui components
// - File management system
// - Image previews
// - Bucket & folder filters
// - Bulk operations
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Pencil,
  Loader2,
  Image as ImageIcon,
  File,
  Folder,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

import type { StorageAsset, StorageListQuery } from '@/integrations/shared';
import {
  useListAssetsAdminQuery,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

type Filters = {
  search: string;
  bucket: string;
  folder: string;
  mime: string;
};

const ROOT_FOLDER_VALUE = '__root__';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function fmtDate(val: string | null | undefined) {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

function truncate(text: string | null | undefined, max = 40) {
  const t = text || '';
  if (t.length <= max) return t || '-';
  return t.slice(0, max - 1) + '…';
}

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  return File;
}

function getMimeColor(mime: string): string {
  if (mime.startsWith('image/')) return 'text-blue-500';
  if (mime.startsWith('video/')) return 'text-purple-500';
  if (mime.startsWith('audio/')) return 'text-green-500';
  if (mime.includes('pdf')) return 'text-rose-500';
  return 'text-gm-muted';
}

function isImageMime(mime: string | null | undefined) {
  return String(mime ?? '').startsWith('image/');
}

function StoragePreview({
  item,
  size = 'sm',
}: {
  item: StorageAsset;
  size?: 'sm' | 'lg';
}) {
  const [failed, setFailed] = React.useState(false);
  const Icon = getMimeIcon(item.mime);
  const colorClass = getMimeColor(item.mime);
  const className =
    size === 'lg'
      ? 'size-20 rounded-xl object-cover border border-gm-border-soft shadow'
      : 'size-11 rounded-xl object-cover border border-gm-border-soft/60 bg-gm-bg-deep/50 shadow-md';
  const fallbackClassName =
    size === 'lg'
      ? 'flex size-20 items-center justify-center rounded-xl bg-gm-bg-deep border border-gm-border-soft shadow-inner'
      : 'flex size-11 items-center justify-center rounded-xl bg-gm-bg-deep/50 border border-gm-border-soft/60 shadow-inner';

  if (item.url && isImageMime(item.mime) && !failed) {
    return (
      <img
        src={item.url}
        alt={item.name}
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName} title={failed ? item.url || item.path : undefined}>
      <Icon className={cn(size === 'lg' ? 'size-8' : 'size-5', colorClass)} />
    </div>
  );
}

export default function AdminStorageClient() {
  const router = useRouter();
  const t = useAdminT('admin.storage');

  function getErrMsg(e: unknown): string {
    const anyErr = e as any;
    return (
      anyErr?.data?.error?.message ||
      anyErr?.data?.message ||
      anyErr?.message ||
      t('errorFallback')
    );
  }

  const [filters, setFilters] = React.useState<Filters>({
    search: '',
    bucket: 'all',
    folder: 'all',
    mime: 'all',
  });

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Build query params
  const queryParams = React.useMemo((): StorageListQuery => {
    return {
      q: filters.search || undefined,
      bucket: filters.bucket !== 'all' ? filters.bucket : undefined,
      folder:
        filters.folder === 'all'
          ? undefined
          : filters.folder === ROOT_FOLDER_VALUE
            ? ''
            : filters.folder,
      mime: filters.mime !== 'all' ? filters.mime : undefined,
      sort: 'created_at',
      order: 'desc',
      limit: 100,
    };
  }, [filters]);

  // RTK Query
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useListAssetsAdminQuery(queryParams);

  const { data: folders = [] } = useListFoldersAdminQuery();

  const [deleteAsset] = useDeleteAssetAdminMutation();
  const [bulkDeleteAssets] = useBulkDeleteAssetsAdminMutation();

  const items = result?.items || [];
  const total = result?.total || 0;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<StorageAsset | null>(null);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleBucketChange = (value: string) => {
    setFilters((prev) => ({ ...prev, bucket: value }));
  };

  const handleFolderChange = (value: string) => {
    setFilters((prev) => ({ ...prev, folder: value }));
  };

  const handleMimeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, mime: value }));
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error(t('list.selectFileError'));
      return;
    }

    try {
      await bulkDeleteAssets({ ids: Array.from(selectedIds) }).unwrap();
      toast.success(t('list.filesDeleted', { count: selectedIds.size }));
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const handleEdit = (item: StorageAsset) => {
    router.push(`/admin/storage/${item.id}`);
  };

  const handleDeleteClick = (item: StorageAsset) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteAsset({ id: itemToDelete.id }).unwrap();
      toast.success(t('list.fileDeleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  const busy = isLoading;
  const hasSelection = selectedIds.size > 0;

  // Unique buckets from items
  const buckets = React.useMemo(() => {
    const set = new Set(items.map((item) => item.bucket).filter(Boolean));
    return Array.from(set);
  }, [items]);

  return (
    <>
      <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Outside Page Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gm-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">BULUT DEPOLAMA</span>
            </div>
            <h1 className="font-serif text-4xl text-gm-text">{t('list.title')}</h1>
            <p className="text-sm italic text-gm-muted">{t('list.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasSelection && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={busy}
                className="h-12 rounded-full px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/10 border-transparent gap-2"
              >
                <Trash2 className="size-4" />
                {t('list.deleteSelected', { count: selectedIds.size })}
              </Button>
            )}
            <Button
              onClick={() => router.push('/admin/storage/new')}
              disabled={busy}
              className="h-12 rounded-full px-8 text-xs font-bold uppercase tracking-widest bg-gm-gold text-gm-bg hover:bg-gm-gold/80 shadow-lg shadow-gm-gold/10 border-transparent gap-2"
            >
              <Plus className="size-4" />
              {t('list.uploadButton')}
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="search" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">
                  {t('list.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted" />
                  <Input
                    id="search"
                    placeholder={t('list.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={busy}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 pl-11 pr-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Bucket */}
              <div className="space-y-2">
                <Label htmlFor="bucket" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {t('list.bucketLabel')}
                </Label>
                <Select
                  value={filters.bucket}
                  onValueChange={handleBucketChange}
                  disabled={busy}
                >
                  <SelectTrigger id="bucket" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface text-gm-text border-gm-border-soft">
                    <SelectItem value="all">{t('list.allOption')}</SelectItem>
                    {buckets.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label htmlFor="folder" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  <div className="flex items-center gap-1.5">
                    <Folder className="size-3.5" />
                    {t('list.folderLabel')}
                  </div>
                </Label>
                <Select
                  value={filters.folder}
                  onValueChange={handleFolderChange}
                  disabled={busy}
                >
                  <SelectTrigger id="folder" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface text-gm-text border-gm-border-soft">
                    <SelectItem value="all">{t('list.allOption')}</SelectItem>
                    <SelectItem value={ROOT_FOLDER_VALUE}>{t('list.rootFolder')}</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f || t('list.rootFolder')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              {/* MIME Filter */}
              <div className="space-y-2 w-full max-w-xs">
                <Label htmlFor="mime" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {t('list.fileTypeLabel')}
                </Label>
                <Select
                  value={filters.mime}
                  onValueChange={handleMimeChange}
                  disabled={busy}
                >
                  <SelectTrigger id="mime" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface text-gm-text border-gm-border-soft">
                    <SelectItem value="all">{t('list.allOption')}</SelectItem>
                    <SelectItem value="image/">{t('list.imageType')}</SelectItem>
                    <SelectItem value="video/">{t('list.videoType')}</SelectItem>
                    <SelectItem value="audio/">{t('list.audioType')}</SelectItem>
                    <SelectItem value="application/pdf">{t('list.pdfType')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end w-full">
                {/* Info Text */}
                <div className="text-xs text-gm-muted flex flex-col items-start gap-1">
                  <span>
                    {t('list.totalFiles', { total })}
                    {hasSelection && ` • ${t('list.selectedCount', { count: selectedIds.size })}`}
                  </span>
                  {isFetching && (
                    <div className="flex items-center gap-2 text-gm-gold">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="font-semibold">{t('list.loading')}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={busy}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80 gap-2"
                >
                  <RefreshCcw
                    className={cn('size-4 text-gm-gold', isFetching && 'animate-spin')}
                  />
                  {t('list.refreshButton')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table (Desktop) */}
        <Card className="hidden xl:block overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gm-surface/40">
                  <TableRow className="border-gm-border-soft hover:bg-transparent">
                    <TableHead className="w-16 px-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSelectAll}
                        disabled={busy}
                        className="h-9 w-9 rounded-full text-gm-muted hover:bg-gm-surface/20"
                      >
                        {selectedIds.size === items.length && items.length > 0 ? (
                          <CheckSquare className="size-4 text-gm-gold" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-20 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.previewColumn')}</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.fileColumn')}</TableHead>
                    <TableHead className="w-36 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.bucketColumn')}</TableHead>
                    <TableHead className="w-36 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.folderColumn')}</TableHead>
                    <TableHead className="w-32 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.typeColumn')}</TableHead>
                    <TableHead className="w-28 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.sizeColumn')}</TableHead>
                    <TableHead className="w-48 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.dateColumn')}</TableHead>
                    <TableHead className="w-48 px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.actionsColumn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className="border-gm-border-soft">
                      <TableCell colSpan={9} className="py-24 text-center">
                        <div className="flex items-center justify-center gap-3 text-gm-gold font-serif italic text-lg">
                          <Loader2 className="size-6 animate-spin" />
                          <span>{t('list.loading')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow className="border-gm-border-soft">
                      <TableCell colSpan={9} className="py-24 text-center font-serif italic text-gm-muted">
                        {t('list.noFiles')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const isSelected = selectedIds.has(item.id);

                      return (
                        <TableRow key={item.id} className={cn('border-gm-border-soft hover:bg-gm-surface/40 transition-colors', isSelected && 'bg-gm-gold/5')}>
                          <TableCell className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSelectItem(item.id)}
                              disabled={busy}
                              className="h-9 w-9 rounded-full text-gm-muted hover:bg-gm-surface/20"
                            >
                              {isSelected ? (
                                <CheckSquare className="size-4 text-gm-gold" />
                              ) : (
                                <Square className="size-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="py-4">
                            <StoragePreview item={item} />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1 pr-4">
                              <div className="font-bold text-gm-text text-sm break-all">{truncate(item.name, 35)}</div>
                              {item.path && (
                                <div className="text-[11px] font-mono text-gm-muted break-all">
                                  {truncate(item.path, 50)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 border-gm-border-soft/80 text-[10px] text-gm-text bg-gm-surface/30 font-medium">
                              {item.bucket}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            {item.folder ? (
                              <div className="flex items-center gap-1.5 text-xs text-gm-text font-medium">
                                <Folder className="size-3.5 text-gm-gold" />
                                {item.folder}
                              </div>
                            ) : (
                              <span className="text-gm-muted/65 italic text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-xs font-mono text-gm-muted bg-gm-bg-deep/40 px-2 py-0.5 rounded border border-gm-border-soft/40">
                              {item.mime.split('/')[1] || item.mime}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right font-semibold text-gm-text text-xs">
                            {formatBytes(item.size)}
                          </TableCell>
                          <TableCell className="py-4 text-xs text-gm-muted">
                            <div>{fmtDate(item.created_at)}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  title={t('list.downloadTitle')}
                                  className="h-9 w-9 rounded-full hover:bg-gm-surface/20 text-gm-muted"
                                >
                                  <a href={item.url} download target="_blank" rel="noopener noreferrer">
                                    <Download className="size-4 text-gm-gold" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                                disabled={busy}
                                className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(item)}
                                disabled={busy}
                                className="h-9 w-9 rounded-full text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Cards (Mobile) */}
        <div className="space-y-4 xl:hidden">
          {isLoading ? (
            <Card className="rounded-[24px] border-gm-border-soft bg-gm-surface/20 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2 text-gm-gold">
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('list.loading')}</span>
                </div>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="rounded-[24px] border-gm-border-soft bg-gm-surface/20 backdrop-blur-sm">
              <CardContent className="py-16 text-center text-gm-muted italic font-serif">
                {t('list.noFiles')}
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <Card key={item.id} className={cn('overflow-hidden rounded-[24px] border-gm-border-soft bg-gm-surface/20 shadow-lg backdrop-blur-sm transition-all', isSelected && 'ring-2 ring-gm-gold')}>
                  <CardContent className="space-y-4 pt-6">
                    {/* Preview & Selection */}
                    <div className="flex items-start gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSelectItem(item.id)}
                        disabled={busy}
                        className="h-9 w-9 rounded-full text-gm-muted hover:bg-gm-surface/20"
                      >
                        {isSelected ? (
                          <CheckSquare className="size-4 text-gm-gold" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </Button>

                      <StoragePreview item={item} size="lg" />

                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-gm-text text-sm">{item.name}</h3>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge variant="outline" className="rounded-full px-2 py-0 border-gm-border-soft/60 text-[9px] text-gm-text bg-gm-surface/30">
                            {item.bucket}
                          </Badge>
                          {item.folder && (
                            <Badge variant="secondary" className="rounded-full px-2 py-0 border-transparent text-[9px] bg-gm-gold/10 text-gm-gold">
                              <Folder className="size-2.5 mr-1 inline" />
                              {item.folder}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-gm-muted">
                          {item.mime.split('/')[1]} • {formatBytes(item.size)}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-[11px] text-gm-muted/80 pl-2">
                      {fmtDate(item.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 h-10 rounded-full border-gm-border-soft bg-gm-surface/50 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80 gap-2"
                        >
                          <a href={item.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="size-3.5 text-gm-gold" />
                            {t('list.downloadTitle')}
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={busy}
                        className="flex-1 h-10 rounded-full border-gm-border-soft bg-gm-surface/50 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80 gap-2"
                      >
                        <Pencil className="size-3.5 text-gm-primary" />
                        {t('list.editButton')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                        disabled={busy}
                        className="h-10 w-10 rounded-full border-gm-border-soft bg-gm-surface/50 text-gm-error hover:bg-gm-error/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-gm-border-soft bg-gm-surface shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-gm-text">{t('list.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gm-muted/80">
              {t('list.deleteConfirmDescription', { name: itemToDelete?.name || t('list.defaultFileName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 text-gm-text hover:bg-gm-surface">{t('list.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-11 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold">{t('list.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
