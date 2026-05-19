'use client';

import * as React from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  RefreshCcw,
  AudioLines,
  Video,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useListServiceTemplatesAdminQuery,
  useCreateServiceTemplateAdminMutation,
  useUpdateServiceTemplateAdminMutation,
  useDeleteServiceTemplateAdminMutation,
  useListServiceCategoriesAdminQuery,
} from '@/integrations/hooks';

export default function ServiceTemplatesClient() {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>('all');

  const { data: templates = [], isLoading, isFetching, refetch } = useListServiceTemplatesAdminQuery(
    selectedCategoryFilter !== 'all' ? { category_slug: selectedCategoryFilter } : undefined
  );
  const { data: categories = [], isLoading: isCategoriesLoading } = useListServiceCategoriesAdminQuery();

  const [createTemplate, { isLoading: isCreating }] = useCreateServiceTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateServiceTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteServiceTemplateAdminMutation();

  const [isOpen, setIsOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<any | null>(null);

  // Form states
  const [categorySlug, setCategorySlug] = React.useState('');
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(45);
  const [price, setPrice] = React.useState<string | number>('0');
  const [currency, setCurrency] = React.useState('TRY');
  const [mediaType, setMediaType] = React.useState<'audio' | 'video'>('audio');
  const [isFree, setIsFree] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (editingTemplate) {
      setCategorySlug(editingTemplate.category_slug || '');
      setName(editingTemplate.name || '');
      setSlug(editingTemplate.slug || '');
      setDescription(editingTemplate.description || '');
      setDurationMinutes(editingTemplate.duration_minutes || 45);
      setPrice(editingTemplate.price ?? 0);
      setCurrency(editingTemplate.currency || 'TRY');
      setMediaType(editingTemplate.media_type || 'audio');
      setIsFree(editingTemplate.is_free ?? false);
      setSortOrder(editingTemplate.sort_order || 0);
      setIsActive(editingTemplate.is_active ?? true);
    } else {
      setCategorySlug(categories[0]?.slug || '');
      setName('');
      setSlug('');
      setDescription('');
      setDurationMinutes(45);
      setPrice('0');
      setCurrency('TRY');
      setMediaType('audio');
      setIsFree(false);
      setSortOrder(0);
      setIsActive(true);
    }
  }, [editingTemplate, isOpen, categories]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (template: any) => {
    setEditingTemplate(template);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorySlug) {
      toast.error('Lütfen bir kategori seçin.');
      return;
    }
    if (!name.trim() || !slug.trim()) {
      toast.error('Ad ve Slug alanları zorunludur.');
      return;
    }

    const priceNum = Number(price);
    if (!isFree && (Number.isNaN(priceNum) || priceNum <= 0)) {
      toast.error('Ücretli şablonlar için fiyat 0\'dan büyük olmalıdır.');
      return;
    }

    const payload = {
      category_slug: categorySlug,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      duration_minutes: Number(durationMinutes),
      price: isFree ? 0 : priceNum,
      currency: currency.trim() || 'TRY',
      media_type: mediaType,
      is_free: isFree ? 1 : 0,
      sort_order: Number(sortOrder),
      is_active: isActive ? 1 : 0,
    };

    try {
      if (editingTemplate) {
        await updateTemplate({ id: editingTemplate.id, patch: payload }).unwrap();
        toast.success('Şablon başarıyla güncellendi.');
      } else {
        await createTemplate(payload).unwrap();
        toast.success('Şablon başarıyla oluşturuldu.');
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string, tempName: string) => {
    const ok = window.confirm(`"${tempName}" şablonunu silmek istediğinize emin misiniz?`);
    if (!ok) return;

    try {
      await deleteTemplate({ id }).unwrap();
      toast.success('Şablon başarıyla silindi.');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Silme işlemi sırasında bir hata oluştu.');
    }
  };

  const busy = isLoading || isFetching || isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              Sistem & Ayarlar
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text text-foreground">Hizmet Şablonları</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            Kategori bazlı global hizmet şablonları tanımlayın. Danışmanlar bu şablonları kopyalayarak hizmet açabilir.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
            Yenile
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="rounded-full bg-gm-gold text-white px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:opacity-90 shadow-lg"
          >
            <Plus className="mr-2 size-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {/* Filter and Content */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Label className="text-sm font-bold uppercase tracking-widest text-gm-muted">Kategori Filtresi:</Label>
          <div className="w-64">
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep text-gm-text">
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Şablon Adı</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kategori</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Süre & Tip</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Fiyat</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Durum</TableHead>
                  <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-gm-border-soft">
                      <TableCell className="py-6 px-8"><Skeleton className="h-12 w-48 rounded-full bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-6 w-24 bg-gm-surface/20 rounded-full" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-20 bg-gm-surface/20 rounded-lg" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-16 bg-gm-surface/20 rounded-lg" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-8 w-24 bg-gm-surface/20 rounded-full" /></TableCell>
                      <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-30">
                        <Layers className="w-20 h-20 text-gm-gold/50" />
                        <span className="font-serif italic text-xl text-gm-muted">
                          Bu filtrede şablon bulunamadı.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((item) => {
                    const category = categories.find((c) => c.slug === item.category_slug);
                    return (
                      <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                        <TableCell className="py-6 px-8">
                          <div>
                            <div className="font-serif text-xl text-gm-text text-foreground">{item.name}</div>
                            <div className="text-[10px] text-gm-muted font-mono opacity-50 mt-1">{item.slug}</div>
                            {item.description && (
                              <div className="text-xs text-gm-muted max-w-sm truncate mt-1">{item.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <span className="px-3 py-1 rounded-full bg-gm-surface/40 border border-gm-border-soft text-xs text-gm-text text-foreground">
                            {category?.name || item.category_slug}
                          </span>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gm-text text-foreground font-bold">{item.duration_minutes} dk</span>
                            <div className="flex items-center gap-1 text-[10px] text-gm-muted uppercase">
                              {item.media_type === 'video' ? <Video className="size-3 text-gm-gold" /> : <AudioLines className="size-3 text-gm-gold" />}
                              {item.media_type === 'video' ? 'Görüntülü' : 'Sesli'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          {item.is_free ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gm-success/10 text-gm-success border border-gm-success/20">
                              <Gift className="size-3" /> Ücretsiz
                            </span>
                          ) : (
                            <span className="font-serif text-lg text-gm-gold font-bold">
                              {item.price} {item.currency}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-6">
                          <div className={cn(
                            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all',
                            item.is_active ? 'bg-gm-success/5 border-gm-success/20 text-gm-success' : 'bg-gm-error/5 border-gm-error/20 text-gm-error'
                          )}>
                            <div className={cn(
                              'w-1.5 h-1.5 rounded-full animate-pulse',
                              item.is_active ? 'bg-gm-success' : 'bg-gm-error'
                            )} />
                            {item.is_active ? 'Aktif' : 'Pasif'}
                          </div>
                        </TableCell>
                        <TableCell className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Edit2 className="size-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all"
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ekle/Düzenle Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-h-[86vh] max-w-xl overflow-y-auto border-gm-border-soft bg-gm-bg-deep text-gm-text text-foreground">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Ekle'}
            </DialogTitle>
            <DialogDescription className="text-gm-muted">
              Hizmet şablonu detaylarını doldurun.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Kategori</Label>
                  <Select value={categorySlug} onValueChange={setCategorySlug}>
                    <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep text-gm-text">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mediaType" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Görüşme Tipi</Label>
                  <Select value={mediaType} onValueChange={(val: any) => setMediaType(val)}>
                    <SelectTrigger className="border-gm-border-soft bg-gm-surface/40">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep text-gm-text">
                      <SelectItem value="audio">Sesli Görüşme</SelectItem>
                      <SelectItem value="video">Görüntülü Görüşme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempName" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Şablon Adı</Label>
                  <Input
                    id="tempName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ör: Astroloji Harita Analizi"
                    className="border-gm-border-soft bg-gm-surface/40"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempSlug" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Slug</Label>
                  <Input
                    id="tempSlug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="astroloji-harita-analizi"
                    className="border-gm-border-soft bg-gm-surface/40"
                    required
                    disabled={!!editingTemplate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempDesc" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Açıklama</Label>
                <Textarea
                  id="tempDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Şablon hakkında kısa açıklama..."
                  className="border-gm-border-soft bg-gm-surface/40"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Süre (Dk)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="border-gm-border-soft bg-gm-surface/40"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempPrice" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Önerilen Fiyat</Label>
                  <Input
                    id="tempPrice"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="border-gm-border-soft bg-gm-surface/40"
                    disabled={isFree}
                    required={!isFree}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempCurrency" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Para Birimi</Label>
                  <Input
                    id="tempCurrency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border-gm-border-soft bg-gm-surface/40"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gm-border-soft bg-gm-surface/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold uppercase tracking-widest text-gm-text text-foreground">Ücretsiz mi?</Label>
                    <p className="text-[10px] text-gm-muted">Tanışma veya ilk görüşme şablonları için.</p>
                  </div>
                  <Switch
                    checked={isFree}
                    onCheckedChange={(checked) => {
                      setIsFree(checked);
                      if (checked) setPrice('0');
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempSort" className="text-sm font-bold uppercase tracking-widest text-gm-muted">Sıralama</Label>
                  <Input
                    id="tempSort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    placeholder="0"
                    className="border-gm-border-soft bg-gm-surface/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-gm-border-soft bg-gm-surface/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold uppercase tracking-widest text-gm-text text-foreground">Şablon Aktif mi?</Label>
                  <p className="text-xs text-gm-muted">Aktif olmayan şablonlar danışmanlara öneri olarak çıkmaz.</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={busy} className="bg-gm-gold text-white px-6">
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
