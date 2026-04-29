'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronRight, Search, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useListMenuItemsAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  useListFooterSectionsAdminQuery,
  useCreateFooterSectionAdminMutation,
  useUpdateFooterSectionAdminMutation,
  useDeleteFooterSectionAdminMutation,
} from '@/integrations/hooks';

import type {
  AdminMenuItemDto,
  AdminMenuItemCreatePayload,
  FooterSectionDto,
  FooterSectionCreatePayload,
} from '@/integrations/shared';

const LOCALES: Array<{ value: string; label: string }> = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
];

// =============================================================
// Menu Item Form Dialog
// =============================================================

type MenuFormState = {
  title: string;
  url: string;
  location: 'header' | 'footer';
  parent_id: string;
  section_id: string;
  display_order: number;
  is_active: boolean;
  icon: string;
};

const emptyMenuForm: MenuFormState = {
  title: '',
  url: '',
  location: 'header',
  parent_id: '',
  section_id: '',
  display_order: 0,
  is_active: true,
  icon: '',
};

function MenuItemDialog({
  open,
  onOpenChange,
  editing,
  defaultLocation,
  defaultSectionId,
  defaultParentId,
  locale,
  parents,
  sections,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AdminMenuItemDto | null;
  defaultLocation: 'header' | 'footer';
  defaultSectionId?: string;
  defaultParentId?: string;
  locale: string;
  parents: AdminMenuItemDto[];
  sections: FooterSectionDto[];
}) {
  const [form, setForm] = React.useState<MenuFormState>(emptyMenuForm);
  const [create, { isLoading: creating }] = useCreateMenuItemAdminMutation();
  const [update, { isLoading: updating }] = useUpdateMenuItemAdminMutation();

  React.useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        url: editing.url || '',
        location: editing.location,
        parent_id: editing.parent_id || '',
        section_id: editing.section_id || '',
        display_order: editing.display_order || 0,
        is_active: !!editing.is_active,
        icon: editing.icon || '',
      });
    } else {
      setForm({
        ...emptyMenuForm,
        location: defaultLocation,
        parent_id: defaultParentId || '',
        section_id: defaultSectionId || '',
      });
    }
  }, [editing, defaultLocation, defaultSectionId, defaultParentId, open]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Başlık zorunlu');
      return;
    }
    const payload: AdminMenuItemCreatePayload = {
      title: form.title.trim(),
      url: form.url.trim() || null,
      type: 'custom',
      location: form.location,
      parent_id: form.parent_id || null,
      section_id: form.section_id || null,
      display_order: form.display_order,
      is_active: form.is_active,
      icon: form.icon.trim() || null,
      locale,
    };
    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Menü öğesi güncellendi');
      } else {
        await create(payload).unwrap();
        toast.success('Menü öğesi oluşturuldu');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Kayıt başarısız');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Menü Öğesi Düzenle' : 'Yeni Menü Öğesi'}</DialogTitle>
          <DialogDescription>
            Konum: {form.location === 'header' ? 'Üst Menü' : 'Footer'} · Dil:{' '}
            {LOCALES.find((l) => l.value === locale)?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Doğum Haritası"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="/birth-chart veya https://…"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Dropdown ana başlık ise boş bırak
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">İkon (opsiyonel)</Label>
              <Input
                id="icon"
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="lucide ikon adı"
              />
            </div>
          </div>

          {form.location === 'header' && (
            <div className="space-y-2">
              <Label htmlFor="parent">Üst Menü (Dropdown için)</Label>
              <Select
                value={form.parent_id || 'none'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, parent_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger id="parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Top-level (kök) —</SelectItem>
                  {parents
                    .filter((p) => !p.parent_id && p.id !== editing?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title || p.url || p.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.location === 'footer' && (
            <div className="space-y-2">
              <Label htmlFor="section">Footer Bölümü *</Label>
              <Select
                value={form.section_id || 'none'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, section_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Bölüm seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Bölümsüz —</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title || s.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Sıra</Label>
              <Input
                id="order"
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Aktif</Label>
              <Switch
                id="active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={creating || updating}>
            <Save className="mr-2 size-4" />
            {editing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================
// Footer Section Form Dialog
// =============================================================

type SectionFormState = {
  title: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

const emptySectionForm: SectionFormState = {
  title: '',
  slug: '',
  description: '',
  display_order: 0,
  is_active: true,
};

function SectionDialog({
  open,
  onOpenChange,
  editing,
  locale,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: FooterSectionDto | null;
  locale: string;
}) {
  const [form, setForm] = React.useState<SectionFormState>(emptySectionForm);
  const [create, { isLoading: creating }] = useCreateFooterSectionAdminMutation();
  const [update, { isLoading: updating }] = useUpdateFooterSectionAdminMutation();

  React.useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        slug: editing.slug || '',
        description: editing.description || '',
        display_order: editing.display_order || 0,
        is_active: editing.is_active,
      });
    } else {
      setForm(emptySectionForm);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Başlık ve slug zorunlu');
      return;
    }
    const payload: FooterSectionCreatePayload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
      locale,
    };
    try {
      if (editing) {
        await update({ id: editing.id, data: payload }).unwrap();
        toast.success('Bölüm güncellendi');
      } else {
        await create(payload).unwrap();
        toast.success('Bölüm oluşturuldu');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Kayıt başarısız');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Footer Bölümü Düzenle' : 'Yeni Footer Bölümü'}</DialogTitle>
          <DialogDescription>
            Dil: {LOCALES.find((l) => l.value === locale)?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="s_title">Başlık *</Label>
            <Input
              id="s_title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Astroloji"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s_slug">Slug * (yalnızca yeni kayıtta etkili)</Label>
            <Input
              id="s_slug"
              value={form.slug}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                }))
              }
              placeholder="astrology"
              disabled={!!editing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s_desc">Açıklama (opsiyonel)</Label>
            <Textarea
              id="s_desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="s_order">Sıra</Label>
              <Input
                id="s_order"
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="s_active">Aktif</Label>
              <Switch
                id="s_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={creating || updating}>
            <Save className="mr-2 size-4" />
            {editing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================
// Tabs
// =============================================================

function HeaderMenuTab({ locale }: { locale: string }) {
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState<AdminMenuItemDto | null>(null);
  const [defaultParent, setDefaultParent] = React.useState<string | undefined>();
  const [open, setOpen] = React.useState(false);

  const { data: result, isLoading } = useListMenuItemsAdminQuery({
    location: 'header',
    locale,
    nested: true,
    limit: 500,
  });
  const items = (result?.items ?? []) as AdminMenuItemDto[];
  const allFlat = React.useMemo<AdminMenuItemDto[]>(() => {
    const acc: AdminMenuItemDto[] = [];
    for (const it of items) {
      acc.push(it);
      const kids = (it as any).children as AdminMenuItemDto[] | undefined;
      if (kids) for (const k of kids) acc.push(k);
    }
    return acc;
  }, [items]);

  const [del] = useDeleteMenuItemAdminMutation();

  const handleDelete = async (item: AdminMenuItemDto) => {
    if (!confirm(`"${item.title}" silinsin mi? Alt menüler de silinir.`)) return;
    try {
      await del({ id: item.id }).unwrap();
      toast.success('Silindi');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Silinemedi');
    }
  };

  const filtered = items.filter((i) =>
    search ? (i.title || '').toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başlık ara…"
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDefaultParent(undefined);
            setOpen(true);
          }}
          className="ml-auto"
        >
          <Plus className="mr-2 size-4" />
          Yeni Top-Level
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Henüz menü öğesi yok. Üstten "Yeni" ile başla.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((parent) => {
            const kids = ((parent as any).children as AdminMenuItemDto[] | undefined) ?? [];
            return (
              <Card key={parent.id} className="border-gm-border-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-8">
                      #{parent.display_order}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">
                        {parent.title || <em className="text-muted-foreground">başlıksız</em>}
                        {!parent.is_active && (
                          <span className="ml-2 text-[10px] uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            pasif
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {parent.url || (
                          <em>dropdown kök ({kids.length} alt öğe)</em>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setDefaultParent(parent.id);
                        setOpen(true);
                      }}
                      title="Alt menü ekle"
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(parent);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(parent)}
                    >
                      <Trash2 className="size-4 text-rose-500" />
                    </Button>
                  </div>

                  {kids.length > 0 && (
                    <div className="mt-3 ml-8 space-y-1.5 border-l-2 border-gm-border-soft pl-4">
                      {kids.map((kid) => (
                        <div key={kid.id} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="size-3 text-muted-foreground" />
                          <span className="font-mono text-[10px] text-muted-foreground w-6">
                            #{kid.display_order}
                          </span>
                          <span className="flex-1">
                            {kid.title}
                            {!kid.is_active && (
                              <span className="ml-2 text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                pasif
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{kid.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(kid);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(kid)}
                          >
                            <Trash2 className="size-3 text-rose-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MenuItemDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        defaultLocation="header"
        defaultParentId={defaultParent}
        locale={locale}
        parents={allFlat}
        sections={[]}
      />
    </div>
  );
}

function FooterTab({ locale }: { locale: string }) {
  const [editingSection, setEditingSection] = React.useState<FooterSectionDto | null>(null);
  const [sectionOpen, setSectionOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<AdminMenuItemDto | null>(null);
  const [defaultSection, setDefaultSection] = React.useState<string | undefined>();
  const [itemOpen, setItemOpen] = React.useState(false);

  const { data: secResult, isLoading: secLoading } = useListFooterSectionsAdminQuery({
    locale,
    limit: 100,
  });
  const sections = (secResult?.items ?? []) as FooterSectionDto[];

  const { data: itemResult } = useListMenuItemsAdminQuery({
    location: 'footer',
    locale,
    limit: 500,
  });
  const items = (itemResult?.items ?? []) as AdminMenuItemDto[];

  const itemsBySection = React.useMemo(() => {
    const m = new Map<string, AdminMenuItemDto[]>();
    for (const it of items) {
      const sid = it.section_id || '__none__';
      const arr = m.get(sid) ?? [];
      arr.push(it);
      m.set(sid, arr);
    }
    for (const [, arr] of m) arr.sort((a, b) => a.display_order - b.display_order);
    return m;
  }, [items]);

  const [delSection] = useDeleteFooterSectionAdminMutation();
  const [delItem] = useDeleteMenuItemAdminMutation();

  const handleDeleteSection = async (s: FooterSectionDto) => {
    if (!confirm(`"${s.title}" bölümü silinsin mi? Bölüme bağlı linkler bölümsüz olur.`)) return;
    try {
      await delSection(s.id).unwrap();
      toast.success('Bölüm silindi');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Silinemedi');
    }
  };

  const handleDeleteItem = async (it: AdminMenuItemDto) => {
    if (!confirm(`"${it.title}" silinsin mi?`)) return;
    try {
      await delItem({ id: it.id }).unwrap();
      toast.success('Silindi');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            setEditingSection(null);
            setSectionOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Yeni Bölüm
        </Button>
      </div>

      {secLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Yükleniyor…</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Henüz bölüm yok. Üstten "Yeni Bölüm" ile başla.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec) => {
            const links = itemsBySection.get(sec.id) ?? [];
            return (
              <Card key={sec.id} className="border-gm-border-soft">
                <CardHeader className="pb-3 flex flex-row items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-8">
                    #{sec.display_order}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {sec.title || <em className="text-muted-foreground">başlıksız</em>}
                      {!sec.is_active && (
                        <span className="ml-2 text-[10px] uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          pasif
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">slug: {sec.slug}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(null);
                      setDefaultSection(sec.id);
                      setItemOpen(true);
                    }}
                    title="Link ekle"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSection(sec);
                      setSectionOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(sec)}
                  >
                    <Trash2 className="size-4 text-rose-500" />
                  </Button>
                </CardHeader>
                {links.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-1.5 border-l-2 border-gm-border-soft pl-4">
                      {links.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="size-3 text-muted-foreground" />
                          <span className="font-mono text-[10px] text-muted-foreground w-6">
                            #{link.display_order}
                          </span>
                          <span className="flex-1">
                            {link.title}
                            {!link.is_active && (
                              <span className="ml-2 text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                pasif
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{link.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(link);
                              setItemOpen(true);
                            }}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(link)}
                          >
                            <Trash2 className="size-3 text-rose-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {(itemsBySection.get('__none__') ?? []).length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Bölümsüz Linkler ({itemsBySection.get('__none__')!.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {(itemsBySection.get('__none__') ?? []).map((link) => (
                    <div key={link.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{link.title}</span>
                      <span className="text-xs text-muted-foreground">{link.url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(link);
                          setItemOpen(true);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(link)}
                      >
                        <Trash2 className="size-3 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <SectionDialog
        open={sectionOpen}
        onOpenChange={setSectionOpen}
        editing={editingSection}
        locale={locale}
      />
      <MenuItemDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        editing={editingItem}
        defaultLocation="footer"
        defaultSectionId={defaultSection}
        locale={locale}
        parents={[]}
        sections={sections}
      />
    </div>
  );
}

// =============================================================
// Page
// =============================================================

export default function NavigationAdminPage() {
  const [locale, setLocale] = React.useState<string>('tr');

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold italic text-gm-primary">
            Navigasyon Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Üst menü (header) ve footer linklerini buradan yönet. Dropdown desteği var.
          </p>
        </div>
        <div className="w-44">
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="header">
        <TabsList>
          <TabsTrigger value="header">Header Menü</TabsTrigger>
          <TabsTrigger value="footer">Footer Düzeni</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-6">
          <HeaderMenuTab locale={locale} />
        </TabsContent>
        <TabsContent value="footer" className="mt-6">
          <FooterTab locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
