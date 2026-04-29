'use client';

// =============================================================
// FAZ 19 / T19-3 — Admin Astrology KB (POLISHED)
// List + filter + create/edit dialog + bulk import + bulk moderate
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BookOpen, Plus, RefreshCcw, Search, Trash2, Pencil, Upload,
  CheckCircle2, XCircle, AlertTriangle, Filter, MoreHorizontal,
  ChevronRight, Calendar, User, Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  useListAstrologyKbQuery,
  useCreateAstrologyKbMutation,
  useUpdateAstrologyKbMutation,
  useApproveAstrologyKbMutation,
  useRejectAstrologyKbMutation,
  useDeleteAstrologyKbMutation,
  useBulkImportAstrologyKbMutation,
} from '@/integrations/hooks';
import type {
  AstrologyKbDto,
  AstrologyKbKind,
  AstrologyKbTone,
  AstrologyKbCreatePayload,
} from '@/integrations/shared';

const KIND_OPTIONS: AstrologyKbKind[] = [
  'planet_sign', 'planet_house', 'sign_house',
  'aspect', 'sign', 'house', 'planet',
  'transit', 'synastry', 'misc',
];

const TONE_OPTIONS: AstrologyKbTone[] = ['neutral', 'warm', 'professional', 'poetic', 'direct'];
const LOCALES = ['tr', 'en', 'de'] as const;

const EMPTY_FORM: AstrologyKbCreatePayload = {
  kind: 'planet_sign',
  key1: '',
  key2: null,
  key3: null,
  locale: 'tr',
  title: '',
  content: '',
  short_summary: null,
  tone: 'warm',
  source: null,
  author: null,
  is_active: true,
};

export default function AstrologyKbClient() {
  const [filters, setFilters] = React.useState({
    search: '',
    kind: 'all' as AstrologyKbKind | 'all',
    locale: 'all' as string,
    review_status: 'all' as 'all' | 'pending' | 'approved' | 'rejected',
    is_active: 'all' as 'all' | 'active' | 'inactive',
  });

  // Selection state
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const queryParams = React.useMemo(() => ({
    search: filters.search || undefined,
    kind: filters.kind === 'all' ? undefined : filters.kind,
    locale: filters.locale === 'all' ? undefined : filters.locale,
    review_status: filters.review_status === 'all' ? undefined : filters.review_status,
    is_active: filters.is_active === 'active' ? true : filters.is_active === 'inactive' ? false : undefined,
    orderBy: 'updated_at' as const,
    order: 'desc' as const,
  }), [filters]);

  const query = useListAstrologyKbQuery(queryParams);
  const [createKb, { isLoading: isCreating }] = useCreateAstrologyKbMutation();
  const [updateKb, { isLoading: isUpdating }] = useUpdateAstrologyKbMutation();
  const [approveKb, { isLoading: isApproving }] = useApproveAstrologyKbMutation();
  const [rejectKb, { isLoading: isRejecting }] = useRejectAstrologyKbMutation();
  const [deleteKb, { isLoading: isDeleting }] = useDeleteAstrologyKbMutation();
  const [bulkImport, { isLoading: isImporting }] = useBulkImportAstrologyKbMutation();

  const [editDialog, setEditDialog] = React.useState<{
    open: boolean;
    mode: 'create' | 'edit';
    item: AstrologyKbDto | null;
  }>({ open: false, mode: 'create', item: null });

  const [form, setForm] = React.useState<AstrologyKbCreatePayload>(EMPTY_FORM);
  const [importDialog, setImportDialog] = React.useState(false);
  const [importJson, setImportJson] = React.useState('');
  const [importResult, setImportResult] = React.useState<string>('');

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditDialog({ open: true, mode: 'create', item: null });
  };

  const openEdit = (item: AstrologyKbDto) => {
    setForm({
      kind: item.kind,
      key1: item.key1,
      key2: item.key2,
      key3: item.key3,
      locale: item.locale,
      title: item.title,
      content: item.content,
      short_summary: item.short_summary,
      tone: item.tone,
      source: item.source,
      author: item.author,
      is_active: item.is_active,
    });
    setEditDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.key1 || !form.title || !form.content) {
      toast.error('Kind, key1, başlık ve içerik zorunlu');
      return;
    }
    try {
      if (editDialog.mode === 'edit' && editDialog.item) {
        await updateKb({ id: editDialog.item.id, body: form }).unwrap();
        toast.success('Güncellendi');
      } else {
        await createKb(form).unwrap();
        toast.success('Oluşturuldu');
      }
      setEditDialog({ open: false, mode: 'create', item: null });
      query.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Kayıt başarısız');
    }
  };

  const handleDelete = async (item: AstrologyKbDto) => {
    if (!confirm(`"${item.title}" silinsin mi?`)) return;
    try {
      await deleteKb(item.id).unwrap();
      toast.success('Silindi');
      query.refetch();
    } catch {
      toast.error('Silme başarısız');
    }
  };

  const handleToggleActive = async (item: AstrologyKbDto) => {
    try {
      await updateKb({ id: item.id, body: { is_active: !item.is_active } }).unwrap();
      query.refetch();
    } catch {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveKb(id).unwrap();
      query.refetch();
    } catch {
      toast.error('Onay işlemi başarısız');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectKb(id).unwrap();
      query.refetch();
    } catch {
      toast.error('Red işlemi başarısız');
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = () => {
    if (items.every(i => selected.has(i.id))) {
      setSelected(prev => {
        const next = new Set(prev);
        items.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        items.forEach(i => next.add(i.id));
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    let successCount = 0;
    for (const id of selected) {
      try {
        await approveKb(id).unwrap();
        successCount++;
      } catch { /* skip */ }
    }
    toast.success(`${successCount} kayıt onaylandı`);
    setSelected(new Set());
    query.refetch();
  };

  const handleBulkReject = async () => {
    if (selected.size === 0) return;
    let successCount = 0;
    for (const id of selected) {
      try {
        await rejectKb(id).unwrap();
        successCount++;
      } catch { /* skip */ }
    }
    toast.success(`${successCount} kayıt reddedildi`);
    setSelected(new Set());
    query.refetch();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} kayıt silinsin mi?`)) return;
    let successCount = 0;
    for (const id of selected) {
      try {
        await deleteKb(id).unwrap();
        successCount++;
      } catch { /* skip */ }
    }
    toast.success(`${successCount} kayıt silindi`);
    setSelected(new Set());
    query.refetch();
  };

  const handleBulkImport = async () => {
    setImportResult('');
    let parsed: any;
    try {
      parsed = JSON.parse(importJson);
    } catch (e: any) {
      setImportResult(`JSON parse hatası: ${e?.message ?? e}`);
      return;
    }
    const importItems = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(importItems)) {
      setImportResult('JSON kök bir array veya { items: [...] } olmalı');
      return;
    }
    try {
      const res = await bulkImport({ items: importItems, upsert: true }).unwrap();
      setImportResult(
        `✓ Eklenen: ${res.inserted} · Güncellenen: ${res.updated} · Başarısız: ${res.failed}`,
      );
      toast.success(`${res.inserted + res.updated} kayıt işlendi`);
      query.refetch();
    } catch (err: any) {
      setImportResult(`Hata: ${err?.data?.error?.message || err?.message || 'bilinmiyor'}`);
    }
  };

  const busy = query.isLoading || query.isFetching || isCreating || isUpdating || isApproving || isRejecting || isDeleting;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Bilgi Merkezi</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Astroloji Bilgi Tabanı</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic max-w-2xl">
            LLM prompt'larında kullanılan astrolog onaylı altın metinler. Gezegen, burç, ev ve açı yorumlarını buradan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={busy}
            className="rounded-full border-gm-border-soft px-6 h-11 transition-all hover:bg-gm-primary/5"
          >
            <RefreshCcw className={`mr-2 size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialog(true)}
            disabled={busy}
            className="rounded-full border-gm-border-soft px-6 h-11 transition-all hover:bg-gm-primary/5"
          >
            <Upload className="mr-2 size-4" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            disabled={busy}
            className="bg-gm-primary text-white hover:bg-gm-primary-dark rounded-full px-8 h-11 font-bold tracking-widest uppercase shadow-lg shadow-gm-primary/20"
          >
            <Plus className="mr-2 size-4" />
            YENİ KAYIT
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-surface/30 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm">
        <CardContent className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-3 md:col-span-2">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Kayıtlarda Ara</Label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted group-focus-within:text-gm-primary transition-colors" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Başlık, içerik, anahtar kelime..."
                className="pl-12 bg-gm-surface border-gm-border-soft rounded-2xl h-12 focus:border-gm-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">Kategori (Kind)</Label>
            <Select value={filters.kind} onValueChange={(v) => setFilters((p) => ({ ...p, kind: v as any }))}>
              <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border">
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {KIND_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k} className="capitalize">{k.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">Dil (Locale)</Label>
            <Select value={filters.locale} onValueChange={(v) => setFilters((p) => ({ ...p, locale: v }))}>
              <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border">
                <SelectItem value="all">Tüm Diller</SelectItem>
                {LOCALES.map((l) => (
                  <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">Moderasyon</Label>
            <Select value={filters.review_status} onValueChange={(v) => setFilters((p) => ({ ...p, review_status: v as any }))}>
              <SelectTrigger className="bg-gm-surface border-gm-border-soft rounded-2xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-surface border-gm-border">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekleyenler</SelectItem>
                <SelectItem value="approved">Onaylılar</SelectItem>
                <SelectItem value="rejected">Reddedilenler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selected.size > 0 && (
        <Card className="bg-gm-primary/5 border-gm-primary/20 rounded-[24px] overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-gm-primary text-white flex items-center justify-center font-bold text-sm">
                {selected.size}
              </div>
              <span className="font-serif italic text-gm-text-dim">
                kayıt seçildi. Toplu işlem yapabilirsiniz.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gm-border h-9"
                onClick={() => setSelected(new Set())}
              >
                Seçimi Temizle
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-gm-error/30 text-gm-error hover:bg-gm-error/10 h-9"
                onClick={handleBulkDelete}
              >
                <Trash2 className="size-4 mr-2" />
                Sil
              </Button>
              <Button
                size="sm"
                className="bg-gm-error text-white hover:bg-gm-error/90 rounded-full h-9 px-5"
                onClick={handleBulkReject}
              >
                <XCircle className="size-4 mr-2" />
                Reddet
              </Button>
              <Button
                size="sm"
                className="bg-gm-success text-white hover:bg-gm-success/90 rounded-full h-9 px-5"
                onClick={handleBulkApprove}
              >
                <CheckCircle2 className="size-4 mr-2" />
                Onayla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="w-12 text-center py-6">
                  <Checkbox
                    checked={items.length > 0 && items.every(i => selected.has(i.id))}
                    onCheckedChange={togglePageSelection}
                  />
                </TableHead>
                <TableHead className="w-16 text-center py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Aktif</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kategori / Anahtar</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">İçerik Başlığı</TableHead>
                <TableHead className="w-20 text-center py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Dil</TableHead>
                <TableHead className="w-28 text-center py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Onay</TableHead>
                <TableHead className="w-36 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Güncelleme</TableHead>
                <TableHead className="w-32 py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCcw className="size-8 text-gm-primary animate-spin opacity-20" />
                      <span className="font-serif italic text-gm-muted">Veriler yükleniyor...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-32 text-center font-serif italic text-gm-muted opacity-50">
                    Kriterlere uygun kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={busy}
                        className="data-[state=checked]:bg-gm-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase border-gm-primary/20 bg-gm-primary/5 text-gm-primary tracking-widest px-2 py-0.5">
                          {item.kind.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-gm-text-dim">
                          <span className="px-1.5 py-0.5 bg-gm-surface border border-gm-border-soft rounded text-gm-gold">{item.key1}</span>
                          {item.key2 && (
                            <>
                              <ChevronRight className="size-3 opacity-30" />
                              <span className="px-1.5 py-0.5 bg-gm-surface border border-gm-border-soft rounded">{item.key2}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col max-w-[320px]">
                        <span className="font-serif text-lg text-foreground group-hover:text-gm-primary transition-colors line-clamp-1">{item.title}</span>
                        {item.short_summary && (
                          <span className="text-xs text-gm-muted italic line-clamp-1 mt-0.5">{item.short_summary}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gm-surface border border-gm-border-soft text-[10px] font-bold w-10 h-6 flex items-center justify-center">
                        {item.locale.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          item.review_status === 'approved'
                            ? 'border-gm-success/30 bg-gm-success/10 text-gm-success font-bold text-[9px] tracking-widest'
                            : item.review_status === 'rejected'
                              ? 'border-gm-error/30 bg-gm-error/10 text-gm-error font-bold text-[9px] tracking-widest'
                              : 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning font-bold text-[9px] tracking-widest animate-pulse'
                        }
                      >
                        {item.review_status === 'approved' ? 'ONAYLI' : item.review_status === 'rejected' ? 'RED' : 'BEKLEYEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px] text-gm-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3 text-gm-gold/50" />
                          {format(new Date(item.updated_at), 'dd MMM yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="size-3 text-gm-gold/50" />
                          {item.author || 'Sistem'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-8 rounded-full">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gm-surface border-gm-border rounded-xl w-40">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-gm-muted">İşlemler</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gm-border-soft" />
                            <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer gap-2">
                              <Pencil className="size-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleApprove(item.id)} className="cursor-pointer gap-2 text-gm-success">
                              <CheckCircle2 className="size-4" /> Onayla
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(item.id)} className="cursor-pointer gap-2 text-gm-warning">
                              <XCircle className="size-4" /> Reddet
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gm-border-soft" />
                            <DropdownMenuItem onClick={() => handleDelete(item)} className="cursor-pointer gap-2 text-gm-error focus:bg-gm-error/10 focus:text-gm-error">
                              <Trash2 className="size-4" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-6 bg-gm-surface/20 border-t border-gm-border-soft flex items-center justify-between">
            <span className="text-xs text-gm-muted font-serif italic">
              Toplam <strong className="text-foreground">{total}</strong> kayıt listeleniyor.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="bg-gm-surface border-gm-border-soft rounded-[24px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-gm-primary/10 flex items-center justify-center text-gm-primary">
                <BookOpen className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl">{editDialog.mode === 'edit' ? 'Kayıt Düzenle' : 'Yeni Bilgi Girişi'}</DialogTitle>
                <DialogDescription className="font-serif italic text-sm">
                  Astrolog onaylı altın metin oluşturun.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-8 py-6">
            {/* Meta Group */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Kategori</Label>
                <Select value={form.kind} onValueChange={(v) => setForm(p => ({ ...p, kind: v as AstrologyKbKind }))}>
                  <SelectTrigger className="bg-gm-surface border-gm-border-soft h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface border-gm-border">
                    {KIND_OPTIONS.map(k => <SelectItem key={k} value={k} className="capitalize">{k.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Dil</Label>
                <Select value={form.locale} onValueChange={(v) => setForm(p => ({ ...p, locale: v }))}>
                  <SelectTrigger className="bg-gm-surface border-gm-border-soft h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface border-gm-border">
                    {LOCALES.map(l => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Tonlama</Label>
                <Select value={form.tone} onValueChange={(v) => setForm(p => ({ ...p, tone: v as AstrologyKbTone }))}>
                  <SelectTrigger className="bg-gm-surface border-gm-border-soft h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-surface border-gm-border">
                    {TONE_OPTIONS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keys Group */}
            <div className="p-6 bg-gm-primary/[0.03] rounded-2xl border border-gm-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3 mb-2 flex items-center gap-2">
                <Info className="size-4 text-gm-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gm-primary">İlişkisel Anahtarlar</span>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-gm-text-dim ml-1">Key 1 (Gezegen/Burç)</Label>
                <Input
                  value={form.key1}
                  onChange={(e) => setForm(p => ({ ...p, key1: e.target.value }))}
                  placeholder="örn: sun, mars, aries..."
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11 font-mono text-sm focus:border-gm-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-gm-text-dim ml-1">Key 2 (Ev/Açı/Gezegen)</Label>
                <Input
                  value={form.key2 ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, key2: e.target.value || null }))}
                  placeholder="örn: 8, leo, saturn, square..."
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11 font-mono text-sm focus:border-gm-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-gm-text-dim ml-1">Key 3 (Açı Tipi/Ek)</Label>
                <Input
                  value={form.key3 ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, key3: e.target.value || null }))}
                  placeholder="örn: trine, conjunction..."
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11 font-mono text-sm focus:border-gm-primary/50"
                />
              </div>
            </div>

            {/* Content Group */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Başlık</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Güneş Koç Burcunda: Liderlik ve Başlangıçlar"
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-12 text-lg font-serif"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Kısa Özet (Tooltip)</Label>
                <Input
                  value={form.short_summary ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, short_summary: e.target.value || null }))}
                  placeholder="Öne çıkan 1-2 cümlelik karakter özeti."
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11 italic text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Ana Metin (Markdown)</Label>
                <Textarea
                  rows={12}
                  value={form.content}
                  onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Astrolog metnini buraya girin..."
                  className="bg-gm-surface border-gm-border-soft rounded-2xl font-serif text-base leading-relaxed p-4 focus:border-gm-primary/50"
                />
              </div>
            </div>

            {/* Attribution Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gm-border-soft rounded-2xl">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Kaynak / Atıf</Label>
                <Input
                  value={form.source ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, source: e.target.value || null }))}
                  placeholder="Örn: Alan Leo, Astrological Textbooks"
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted ml-1">Yazar / Astrolog</Label>
                <Input
                  value={form.author ?? ''}
                  onChange={(e) => setForm(p => ({ ...p, author: e.target.value || null }))}
                  placeholder="Metni hazırlayan astrolog"
                  className="bg-gm-surface border-gm-border-soft rounded-xl h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gm-primary/5 rounded-2xl border border-gm-primary/10">
              <Switch
                id="is_active_dialog"
                checked={form.is_active}
                onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))}
                className="data-[state=checked]:bg-gm-primary"
              />
              <div className="flex flex-col">
                <Label htmlFor="is_active_dialog" className="font-bold">Aktif Kullanım</Label>
                <span className="text-xs text-gm-muted">LLM (AI) yanıtlarında bu metnin kullanılmasına izin ver.</span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gm-border-soft pt-6 mt-2">
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, mode: 'create', item: null })}
              className="rounded-full px-8 border-gm-border"
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="bg-gm-primary text-white hover:bg-gm-primary-dark rounded-full px-12 font-bold tracking-widest uppercase shadow-lg shadow-gm-primary/20"
            >
              {(isCreating || isUpdating) ? 'KAYDEDİLİYOR...' : 'KAYDI TAMAMLA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="bg-gm-surface border-gm-border-soft rounded-[32px] max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-gm-gold/10 flex items-center justify-center text-gm-gold">
                <Upload className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl">Bulk Import (JSON)</DialogTitle>
                <DialogDescription className="font-serif italic text-sm">
                  Birden fazla kaydı JSON formatında sisteme yükleyin.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted mb-2 px-1">JSON Verisi</div>
            <Textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={12}
              placeholder={`[
  {
    "kind": "planet_sign",
    "key1": "venus",
    "key2": "leo",
    "locale": "tr",
    "title": "Venüs Aslan'da",
    "content": "Sevgini gösterirken görkemli bir tavır sergilersin...",
    "tone": "warm"
  }
]`}
              className="bg-gm-surface border-gm-border-soft rounded-2xl font-mono text-xs leading-relaxed p-4"
            />

            {importResult && (
              <div className={`rounded-2xl p-4 text-sm flex gap-3 animate-in zoom-in-95 ${importResult.startsWith('✓')
                ? 'border border-gm-success/30 bg-gm-success/10 text-gm-success'
                : 'border border-gm-error/30 bg-gm-error/10 text-gm-error'
              }`}>
                {importResult.startsWith('✓') ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
                <span className="font-serif italic">{importResult}</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => { setImportDialog(false); setImportResult(''); setImportJson(''); }}
              className="rounded-full px-8 border-gm-border"
            >
              Kapat
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={isImporting || !importJson.trim()}
              className="bg-gm-gold text-black hover:bg-gm-gold/90 rounded-full px-10 font-bold tracking-widest uppercase"
            >
              {isImporting ? 'YÜKLENİYOR...' : 'İMPORT ET'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
