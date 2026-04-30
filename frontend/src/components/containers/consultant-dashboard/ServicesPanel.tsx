'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Trash2, Save, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import {
  type ConsultantSelfService,
  useListMySelfServicesQuery,
  useCreateMySelfServiceMutation,
  useUpdateMySelfServiceMutation,
  useDeleteMySelfServiceMutation,
  useReorderMySelfServicesMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';

interface ServiceForm {
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  is_active: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  slug: '',
  description: '',
  duration_minutes: 45,
  price: 0,
  is_free: false,
  is_active: true,
};

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[ığüşöç]/g, (c) => ({ ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null) return fallback;
  const data = 'data' in error ? (error as { data?: unknown }).data : undefined;
  if (typeof data !== 'object' || data === null) return fallback;
  const apiError = 'error' in data ? (data as { error?: unknown }).error : undefined;
  if (typeof apiError === 'object' && apiError !== null && 'message' in apiError) {
    const message = (apiError as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export default function ServicesPanel() {
  const { data: services = [], isLoading } = useListMySelfServicesQuery();
  const [createSvc, { isLoading: isCreating }] = useCreateMySelfServiceMutation();
  const [updateSvc, { isLoading: isUpdating }] = useUpdateMySelfServiceMutation();
  const [deleteSvc, { isLoading: isDeleting }] = useDeleteMySelfServiceMutation();
  const [reorderSvc, { isLoading: isReordering }] = useReorderMySelfServicesMutation();

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<ServiceForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newForm.name.trim()) {
      toast.error('Hizmet adı zorunlu');
      return;
    }
    try {
      await createSvc({
        name: newForm.name.trim(),
        slug: newForm.slug.trim() || slugify(newForm.name),
        description: newForm.description.trim() || null,
        duration_minutes: newForm.duration_minutes,
        price: newForm.is_free ? 0 : newForm.price,
        is_free: newForm.is_free ? 1 : 0,
        is_active: newForm.is_active ? 1 : 0,
      }).unwrap();
      toast.success('Hizmet eklendi');
      setShowNew(false);
      setNewForm(EMPTY_FORM);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Eklenemedi'));
    }
  };

  const handlePatch = async (id: string, patch: Partial<ServiceForm>) => {
    if (patch.is_active === false && services.filter((service) => service.is_active === 1 && service.id !== id).length === 0) {
      toast.error('En az bir aktif hizmet kalmalı');
      return;
    }
    try {
      const body: Partial<{
        name: string;
        description: string | null;
        duration_minutes: number;
        price: number;
        is_free: number;
        is_active: number;
      }> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.duration_minutes !== undefined) body.duration_minutes = patch.duration_minutes;
      if (patch.price !== undefined) body.price = patch.is_free === true ? 0 : patch.price;
      if (patch.is_free !== undefined) body.is_free = patch.is_free ? 1 : 0;
      if (patch.is_active !== undefined) body.is_active = patch.is_active ? 1 : 0;
      await updateSvc({ id, body }).unwrap();
      toast.success('Kaydedildi');
    } catch {
      toast.error('Kaydedilemedi');
    }
  };

  const handleDelete = async (id: string, name: string, isActive: boolean) => {
    if (isActive && services.filter((service) => service.is_active === 1 && service.id !== id).length === 0) {
      toast.error('En az bir aktif hizmet kalmalı');
      return;
    }
    if (!confirm(`"${name}" silinsin mi?`)) return;
    try {
      await deleteSvc(id).unwrap();
      toast.success('Silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleMove = async (id: string, direction: -1 | 1) => {
    const index = services.findIndex((service) => service.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= services.length) return;

    const next = [...services];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    try {
      await reorderSvc(next.map((service, sort_order) => ({ id: service.id, sort_order }))).unwrap();
      toast.success('Sıra güncellendi');
    } catch {
      toast.error('Sıra güncellenemedi');
    }
  };

  const busy = isLoading || isCreating || isUpdating || isDeleting || isReordering;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--gm-text-dim)] font-serif italic">
          Sunduğunuz hizmet paketlerini buradan yönetin. Ücretsiz tanışma görüşmesi ekleyebilirsiniz.
        </p>
        <button
          onClick={() => setShowNew((v) => !v)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          Yeni Hizmet
        </button>
      </div>

      {showNew && (
        <div className="p-5 rounded-2xl border border-[var(--gm-gold)]/40 bg-[var(--gm-gold)]/5 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold)]">Yeni Hizmet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={newForm.name}
              onChange={(e) => {
                const v = e.target.value;
                setNewForm({ ...newForm, name: v, slug: newForm.slug || slugify(v) });
              }}
              placeholder="Hizmet adı (ör. Bireysel Seans)"
              className="h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm text-[var(--gm-text)]"
            />
            <input
              value={newForm.slug}
              onChange={(e) => setNewForm({ ...newForm, slug: slugify(e.target.value) })}
              placeholder="slug (otomatik oluşur)"
              className="h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm font-mono text-[var(--gm-muted)]"
            />
            <input
              type="number"
              value={newForm.duration_minutes}
              onChange={(e) => setNewForm({ ...newForm, duration_minutes: Number(e.target.value) || 45 })}
              placeholder="Süre (dk)"
              className="h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm text-[var(--gm-text)]"
            />
            <input
              type="number"
              value={newForm.price}
              onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) || 0 })}
              placeholder="Fiyat (₺)"
              disabled={newForm.is_free}
              className="h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm text-[var(--gm-text)] disabled:opacity-50"
            />
          </div>
          <textarea
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            rows={3}
            placeholder="Açıklama (opsiyonel)"
            className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)]"
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.is_free}
                onChange={(e) => setNewForm({ ...newForm, is_free: e.target.checked, price: 0 })}
                className="w-5 h-5 accent-[var(--gm-success)]"
              />
              <span className="text-sm text-[var(--gm-text)] inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gm-success)]" />
                Ücretsiz Ön Görüşme
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.is_active}
                onChange={(e) => setNewForm({ ...newForm, is_active: e.target.checked })}
                className="w-5 h-5 accent-[var(--gm-gold)]"
              />
              <span className="text-sm text-[var(--gm-text)]">Aktif</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }}
              className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest"
            >
              İptal
            </button>
            <button
              onClick={handleCreate}
              disabled={busy}
              className="px-6 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
            >
              <Save className="w-3.5 h-3.5 inline mr-1" />
              Kaydet
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">Yükleniyor...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-[var(--gm-muted)] font-serif italic">
          Henüz hiç hizmet eklemediniz.
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s, index) => (
            <ServiceRow
              key={s.id}
              svc={s}
              index={index}
              total={services.length}
              expanded={expandedId === s.id}
              onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
              onPatch={(p) => handlePatch(s.id, p)}
              onDelete={() => handleDelete(s.id, s.name, s.is_active === 1)}
              onMove={(direction) => handleMove(s.id, direction)}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  svc,
  index,
  total,
  expanded,
  onToggleExpand,
  onPatch,
  onDelete,
  onMove,
  busy,
}: {
  svc: ConsultantSelfService;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (p: Partial<ServiceForm>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggleExpand} className="text-[var(--gm-muted)]">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-base text-[var(--gm-text)] truncate">{svc.name}</span>
            {svc.is_free === 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-success)]/15 text-[var(--gm-success)] text-[9px] font-bold uppercase tracking-widest">
                Ücretsiz
              </span>
            )}
            {svc.is_active === 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-muted)]/15 text-[var(--gm-muted)] text-[9px] font-bold uppercase tracking-widest">
                Pasif
              </span>
            )}
          </div>
          <div className="text-[11px] text-[var(--gm-text-dim)] mt-1 flex items-center gap-3">
            <span>{svc.duration_minutes} dk</span>
            <span>•</span>
            <span className="text-[var(--gm-gold)] font-bold">
              {svc.is_free === 1 ? 'Ücretsiz' : `₺${Math.round(Number(svc.price))}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={busy || index === 0}
            className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-gold)] disabled:opacity-30"
            title="Yukarı taşı"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={busy || index === total - 1}
            className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-gold)] disabled:opacity-30"
            title="Aşağı taşı"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onPatch({ is_active: svc.is_active === 0 })}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[var(--gm-border-soft)] hover:border-[var(--gm-gold)]/40"
          disabled={busy}
        >
          {svc.is_active === 1 ? 'Pasifleştir' : 'Aktifleştir'}
        </button>
        <button onClick={onDelete} disabled={busy} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full" title="Sil">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/30 space-y-3">
          <input
            defaultValue={svc.name}
            onBlur={(e) => e.target.value !== svc.name && onPatch({ name: e.target.value })}
            className="w-full h-10 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-3 text-sm text-[var(--gm-text)]"
          />
          <textarea
            defaultValue={svc.description || ''}
            onBlur={(e) => e.target.value !== (svc.description || '') && onPatch({ description: e.target.value })}
            rows={3}
            className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)]"
            placeholder="Açıklama"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              defaultValue={svc.duration_minutes}
              onBlur={(e) => Number(e.target.value) !== svc.duration_minutes && onPatch({ duration_minutes: Number(e.target.value) })}
              className="h-10 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-3 text-sm text-[var(--gm-text)]"
            />
            <input
              type="number"
              defaultValue={Number(svc.price)}
              onBlur={(e) => Number(e.target.value) !== Number(svc.price) && onPatch({ price: Number(e.target.value) })}
              disabled={svc.is_free === 1}
              className="h-10 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-3 text-sm text-[var(--gm-text)] disabled:opacity-50"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={svc.is_free === 1}
              onChange={(e) => onPatch({ is_free: e.target.checked, price: e.target.checked ? 0 : Number(svc.price) })}
              className="w-5 h-5 accent-[var(--gm-success)]"
            />
            <span className="text-sm text-[var(--gm-text)]">Ücretsiz ön görüşme</span>
          </label>
        </div>
      )}
    </div>
  );
}
