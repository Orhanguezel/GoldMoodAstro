'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Trash2, Save, ChevronDown, ChevronRight, Sparkles, Zap, X, Rocket } from 'lucide-react';
import {
  type ConsultantSelfService,
  useListMySelfServicesQuery,
  useCreateMySelfServiceMutation,
  useUpdateMySelfServiceMutation,
  useDeleteMySelfServiceMutation,
  useReorderMySelfServicesMutation,
  useListMyServiceTemplatesQuery,
  useAdoptServiceTemplateMutation,
  useCreateServiceBoostCheckoutMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { extractApiError } from '@/integrations/shared';
import { useUiSection } from '@/i18n';

type ServiceMediaType = 'audio' | 'video';

interface ServiceForm {
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price: number;
  media_type: ServiceMediaType;
  is_free: boolean;
  is_active: boolean;
}

const MEDIA_SLUG_SUFFIX: Record<ServiceMediaType, string> = {
  audio: 'sesli',
  video: 'goruntulu',
};

// Keep media type in the slug so duplicate service names can coexist.
function mediaSlug(base: string, media: ServiceMediaType): string {
  const cleaned = base.replace(/-(sesli-goruntulu|sesli|goruntulu)$/i, '');
  return `${cleaned}-${MEDIA_SLUG_SUFFIX[media]}`;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  slug: '',
  description: '',
  duration_minutes: 45,
  price: 0,
  media_type: 'audio',
  is_free: false,
  is_active: true,
};

function MediaTypeRadio({
  value,
  onChange,
}: {
  value: ServiceMediaType;
  onChange: (v: ServiceMediaType) => void;
}) {
  const { ui } = useUiSection('ui_dashboard');
  const opts: Array<{ v: ServiceMediaType; label: string }> = [
    { v: 'audio', label: ui('ui_dashboard_service_media_audio_call', 'Audio call') },
    { v: 'video', label: ui('ui_dashboard_service_media_video_call', 'Video call') },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
              active
                ? 'border-(--gm-gold) bg-(--gm-gold)/15 text-(--gm-gold)'
                : 'border-(--gm-border-soft) bg-(--gm-bg-deep) text-(--gm-text-dim) hover:text-(--gm-text)'
            }`}
          >
            <span className="mr-1.5">{active ? '◉' : '◯'}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const SLUG_CHAR_MAP: Record<string, string> = {
  '\u0131': 'i',
  '\u011f': 'g',
  '\u00fc': 'u',
  '\u015f': 's',
  '\u00f6': 'o',
  '\u00e7': 'c',
};

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[\u0131\u011f\u00fc\u015f\u00f6\u00e7]/g, (c) => SLUG_CHAR_MAP[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ServicesPanel() {
  const { ui } = useUiSection('ui_dashboard');
  const { data: services = [], isLoading } = useListMySelfServicesQuery();
  const [createSvc, { isLoading: isCreating }] = useCreateMySelfServiceMutation();
  const [updateSvc, { isLoading: isUpdating }] = useUpdateMySelfServiceMutation();
  const [deleteSvc, { isLoading: isDeleting }] = useDeleteMySelfServiceMutation();
  const [reorderSvc, { isLoading: isReordering }] = useReorderMySelfServicesMutation();

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<ServiceForm>(EMPTY_FORM);
  const [newErrors, setNewErrors] = useState<{ name?: string; price?: string; duration?: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    const errs: typeof newErrors = {};
    if (!newForm.name.trim()) errs.name = ui('ui_dashboard_service_error_name_required', 'Name is required');
    if (newForm.price < 0 || newForm.price > 100000) errs.price = ui('ui_dashboard_service_error_price_range', 'Must be between 0 and 100,000');
    if (newForm.duration_minutes < 15 || newForm.duration_minutes > 480) errs.duration = ui('ui_dashboard_service_error_duration_range', 'Must be between 15 and 480 minutes');
    
    if (Object.keys(errs).length > 0) {
      setNewErrors(errs);
      return;
    }

    try {
      await createSvc({
        name: newForm.name.trim(),
        slug: mediaSlug(newForm.slug.trim() || slugify(newForm.name), newForm.media_type),
        description: newForm.description.trim() || null,
        duration_minutes: newForm.duration_minutes,
        price: newForm.is_free ? 0 : newForm.price,
        media_type: newForm.media_type,
        is_free: newForm.is_free ? 1 : 0,
        is_active: newForm.is_active ? 1 : 0,
      }).unwrap();
      toast.success(ui('ui_dashboard_service_created', 'Service added'));
      setShowNew(false);
      setNewForm(EMPTY_FORM);
      setNewErrors({});
    } catch (e: unknown) {
      toast.error(extractApiError(e, ui('ui_dashboard_service_create_failed', 'Could not add service')));
    }
  };

  const handlePatch = async (id: string, patch: Partial<ServiceForm>) => {
    if (patch.is_active === false && services.filter((service) => service.is_active === 1 && service.id !== id).length === 0) {
      toast.error(ui('ui_dashboard_service_error_one_active', 'At least one active service must remain'));
      return;
    }
    try {
      const body: Partial<{
        name: string;
        description: string | null;
        duration_minutes: number;
        price: number;
        slug: string;
        media_type: ServiceMediaType;
        is_free: number;
        is_active: number;
      }> = {};
      if (patch.name !== undefined) body.name = patch.name;
      if (patch.slug !== undefined || patch.media_type !== undefined) {
        body.slug = mediaSlug(patch.slug ?? slugify(patch.name ?? ''), patch.media_type ?? 'audio');
      }
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.duration_minutes !== undefined) body.duration_minutes = patch.duration_minutes;
      if (patch.price !== undefined) body.price = patch.is_free === true ? 0 : patch.price;
      if (patch.media_type !== undefined) body.media_type = patch.media_type;
      if (patch.is_free !== undefined) body.is_free = patch.is_free ? 1 : 0;
      if (patch.is_active !== undefined) body.is_active = patch.is_active ? 1 : 0;
      await updateSvc({ id, body }).unwrap();
      toast.success(ui('ui_dashboard_saved', 'Saved'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_save_failed', 'Could not save')));
    }
  };

  const handleDelete = async (id: string, name: string, isActive: boolean) => {
    if (isActive && services.filter((service) => service.is_active === 1 && service.id !== id).length === 0) {
      toast.error(ui('ui_dashboard_service_error_one_active', 'At least one active service must remain'));
      return;
    }
    if (!confirm(ui('ui_dashboard_service_delete_confirm', 'Delete "{name}"?').replace('{name}', name))) return;
    try {
      await deleteSvc(id).unwrap();
      toast.success(ui('ui_dashboard_deleted', 'Deleted'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_delete_failed', 'Could not delete')));
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
      toast.success(ui('ui_dashboard_service_order_updated', 'Order updated'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_service_order_failed', 'Could not update order')));
    }
  };

  const busy = isLoading || isCreating || isUpdating || isDeleting || isReordering;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--gm-text-dim)] font-serif italic">
          {ui('ui_dashboard_services_intro', 'Manage your service packages here. You can add a free intro call.')}
        </p>
        <button
          onClick={() => setShowNew((v) => !v)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          {ui('ui_dashboard_service_new', 'New Service')}
        </button>
      </div>

      {showNew && (
        <div className="p-5 rounded-2xl border border-[var(--gm-gold)]/40 bg-[var(--gm-gold)]/5 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold)]">{ui('ui_dashboard_service_new', 'New Service')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={newForm.name}
              maxLength={100}
              onChange={(e) => {
                const v = e.target.value;
                setNewForm({ ...newForm, name: v, slug: newForm.slug || mediaSlug(slugify(v), newForm.media_type) });
              }}
              placeholder={ui('ui_dashboard_service_name_placeholder', 'Service name, e.g. Personal Session')}
              className={`h-11 bg-[var(--gm-bg-deep)] border ${newErrors.name ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-4 text-sm text-[var(--gm-text)]`}
            />
            <input
              value={newForm.slug}
              onChange={(e) => setNewForm({ ...newForm, slug: slugify(e.target.value) })}
              placeholder={ui('ui_dashboard_service_slug_placeholder', 'slug, generated automatically')}
              className="h-11 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-4 text-sm font-mono text-[var(--gm-muted)]"
            />
            <input
              type="number"
              value={newForm.duration_minutes}
              onChange={(e) => setNewForm({ ...newForm, duration_minutes: Number(e.target.value) || 45 })}
              placeholder={ui('ui_dashboard_service_duration_placeholder', 'Duration (min)')}
              className={`h-11 bg-[var(--gm-bg-deep)] border ${newErrors.duration ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-4 text-sm text-[var(--gm-text)]`}
            />
            <input
              type="number"
              value={newForm.price}
              onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) || 0 })}
              placeholder={ui('ui_dashboard_service_price_placeholder', 'Price')}
              disabled={newForm.is_free}
              className={`h-11 bg-[var(--gm-bg-deep)] border ${newErrors.price ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-4 text-sm text-[var(--gm-text)] disabled:opacity-50`}
            />
          </div>
          <textarea
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder={ui('ui_dashboard_service_description_placeholder', 'Description, optional')}
            className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)]"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_media_type', 'Media Type')}</label>
              <MediaTypeRadio
                value={newForm.media_type}
                onChange={(media_type) => setNewForm({
                  ...newForm,
                  media_type,
                  slug: mediaSlug(newForm.slug || slugify(newForm.name), media_type),
                })}
              />
            </div>
          </div>
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
                {ui('ui_dashboard_service_free_intro', 'Free Intro Call')}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.is_active}
                onChange={(e) => setNewForm({ ...newForm, is_active: e.target.checked })}
                className="w-5 h-5 accent-[var(--gm-gold)]"
              />
              <span className="text-sm text-[var(--gm-text)]">{ui('ui_dashboard_status_active', 'Active')}</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }}
              className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest"
            >
              {ui('ui_dashboard_cancel', 'Cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={busy}
              className="px-6 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
            >
              <Save className="w-3.5 h-3.5 inline mr-1" />
              {ui('ui_dashboard_save', 'Save')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">{ui('ui_dashboard_loading', 'Loading...')}</div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-[var(--gm-muted)] font-serif italic">
          {ui('ui_dashboard_services_empty', 'You have not added any services yet.')}
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

      <ServiceTemplatesSection onAdoptSuccess={(id) => setExpandedId(id)} />
    </div>
  );
}

function ServiceTemplatesSection({
  onAdoptSuccess,
}: {
  onAdoptSuccess: (newServiceId: string) => void;
}) {
  const { ui } = useUiSection('ui_dashboard');
  const { data: templates = [], isLoading } = useListMyServiceTemplatesQuery();
  const [adopt, { isLoading: isAdopting }] = useAdoptServiceTemplateMutation();

  const handleAdopt = async (id: string, name: string) => {
    try {
      const result = await adopt(id).unwrap();
      toast.success(ui('ui_dashboard_service_template_added', '"{name}" was added to your services.').replace('{name}', name));
      if (result?.id) {
        onAdoptSuccess(result.id);
      }
    } catch (e) {
      toast.error(ui('ui_dashboard_service_template_add_failed', 'Could not add template.'));
    }
  };

  if (isLoading) return null;
  if (templates.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-[var(--gm-border-soft)] space-y-4">
      <div className="space-y-1">
        <h3 className="font-serif text-lg text-[var(--gm-text)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--gm-gold)]" />
          {ui('ui_dashboard_service_templates_title', 'Suggested Templates (draft)')}
        </h3>
        <p className="text-xs text-[var(--gm-text-dim)]">
          {ui('ui_dashboard_service_templates_desc', 'Use ready templates matched to your specialties to open services faster.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/20 flex flex-col justify-between gap-4 hover:border-[var(--gm-gold)]/30 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif text-sm text-[var(--gm-text)] font-semibold">{t.name}</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] text-[8px] font-bold uppercase tracking-widest">
                  {t.media_type === 'video' ? ui('ui_dashboard_service_media_video', 'Video') : ui('ui_dashboard_service_media_audio', 'Audio')}
                </span>
                {t.is_free === 1 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-success)]/15 text-[var(--gm-success)] text-[8px] font-bold uppercase tracking-widest">
                    {ui('ui_dashboard_free', 'Free')}
                  </span>
                )}
              </div>
              {t.description && (
                <p className="text-xs text-[var(--gm-text-dim)] line-clamp-2">{t.description}</p>
              )}
              <div className="text-[10px] text-[var(--gm-text-dim)] pt-1 flex items-center gap-2">
                <span>{t.duration_minutes} dk</span>
                <span>•</span>
                <span className="text-[var(--gm-gold)] font-bold">
                  {t.is_free === 1 ? ui('ui_dashboard_free', 'Free') : `₺${Math.round(Number(t.price))}`}
                </span>
              </div>
            </div>

            <div>
              {t.adopted ? (
                <button
                  disabled
                  className="w-full h-9 rounded-xl bg-[var(--gm-border-soft)] text-[var(--gm-muted)] text-[10px] font-bold uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {ui('ui_dashboard_service_template_added_badge', 'Added')}
                </button>
              ) : (
                <button
                  onClick={() => handleAdopt(t.id, t.name)}
                  disabled={isAdopting}
                  className="w-full h-9 rounded-xl bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {ui('ui_dashboard_service_template_use', 'Use / Edit')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
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
  const { ui } = useUiSection('ui_dashboard');
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [form, setForm] = useState<ServiceForm>({
    name: svc.name,
    slug: svc.slug,
    description: svc.description || '',
    duration_minutes: svc.duration_minutes,
    price: Number(svc.price) || 0,
    media_type: svc.media_type || 'audio',
    is_free: svc.is_free === 1,
    is_active: svc.is_active === 1,
  });
  const [errors, setErrors] = useState<{ name?: string; price?: string; duration?: string }>({});

  const isDirty =
    form.name !== svc.name ||
    form.description !== (svc.description || '') ||
    form.duration_minutes !== svc.duration_minutes ||
    form.price !== Number(svc.price) ||
    form.media_type !== (svc.media_type || 'audio') ||
    form.is_free !== (svc.is_free === 1) ||
    form.is_active !== (svc.is_active === 1);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error(ui('ui_dashboard_service_error_name_empty', 'Name cannot be empty'));
      return;
    }
    if (form.duration_minutes < 15 || form.duration_minutes > 480) {
      toast.error(ui('ui_dashboard_service_error_duration_range', 'Must be between 15 and 480 minutes'));
      return;
    }
    if (!form.is_free && (form.price < 0 || form.price > 100000)) {
      toast.error(ui('ui_dashboard_service_error_price_range', 'Must be between 0 and 100,000'));
      return;
    }
    onPatch(form);
  };

  const isBoostActive = svc.is_boosted === 1;
  const boostDaysLeft = svc.boost_ends_at
    ? Math.max(0, Math.ceil((new Date(svc.boost_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <>
    {showBoostModal && (
      <ServiceBoostModal
        serviceId={svc.id}
        serviceName={svc.name}
        onClose={() => setShowBoostModal(false)}
      />
    )}
    <div className={`rounded-2xl border transition-all ${expanded ? 'border-[var(--gm-gold)]/40 bg-[var(--gm-gold)]/5' : 'border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30'} overflow-hidden`}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggleExpand} className="text-[var(--gm-muted)]">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-base text-[var(--gm-text)] truncate">{svc.name}</span>
            {svc.is_free === 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-success)]/15 text-[var(--gm-success)] text-[9px] font-bold uppercase tracking-widest">
                {ui('ui_dashboard_free', 'Free')}
              </span>
            )}
            {svc.is_active === 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-muted)]/15 text-[var(--gm-muted)] text-[9px] font-bold uppercase tracking-widest">
                {ui('ui_dashboard_status_inactive', 'Inactive')}
              </span>
            )}
            {/* C3: Boost badge */}
            {isBoostActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--gm-warning)/20 text-(--gm-warning) text-[9px] font-bold uppercase tracking-widest">
                <Rocket className="w-2.5 h-2.5" />
                {ui('ui_dashboard_service_boost_active', 'Öne Çıkarıldı').replace('{days}', String(boostDaysLeft))}{' '}{boostDaysLeft}g kaldı
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] text-[9px] font-bold uppercase tracking-widest">
              {svc.media_type === 'video' ? ui('ui_dashboard_service_media_video', 'Video') : ui('ui_dashboard_service_media_audio', 'Audio')}
            </span>
          </div>
          <div className="text-[11px] text-[var(--gm-text-dim)] mt-1 flex items-center gap-3">
            <span>{svc.duration_minutes} dk</span>
            <span>•</span>
            <span className="text-[var(--gm-gold)] font-bold">
              {svc.is_free === 1 ? ui('ui_dashboard_free', 'Free') : `₺${Math.round(Number(svc.price))}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={busy || index === 0}
            className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-gold)] disabled:opacity-30"
            title={ui('ui_dashboard_move_up', 'Move up')}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={busy || index === total - 1}
            className="p-2 text-[var(--gm-muted)] hover:text-[var(--gm-gold)] disabled:opacity-30"
            title={ui('ui_dashboard_move_down', 'Move down')}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onPatch({ ...form, is_active: !form.is_active })}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[var(--gm-border-soft)] hover:border-[var(--gm-gold)]/40"
          disabled={busy}
        >
          {svc.is_active === 1 ? ui('ui_dashboard_deactivate', 'Deactivate') : ui('ui_dashboard_activate', 'Activate')}
        </button>
          <button onClick={onDelete} disabled={busy} className="p-2 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 rounded-full" title={ui('ui_dashboard_delete', 'Delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
          {/* C3: Öne Çıkart */}
          <button
            onClick={() => setShowBoostModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-(--gm-gold)/40 text-(--gm-gold) text-[9px] font-bold uppercase tracking-widest hover:bg-(--gm-gold)/10 transition-colors"
            title={ui('ui_dashboard_service_boost_title', 'Hizmetini öne çıkart')}
          >
            <Rocket className="w-3.5 h-3.5" />
            {ui('ui_dashboard_service_boost_btn', 'Öne Çıkart')}
          </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_name', 'Name')}</label>
              <input
                value={form.name}
                maxLength={100}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`w-full h-10 bg-[var(--gm-bg-deep)] border ${errors.name ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-3 text-sm text-[var(--gm-text)]`}
              />
              {errors.name && <p className="text-[9px] text-[var(--gm-error)] font-bold uppercase tracking-widest">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_slug_admin', 'Slug (admin only)')}</label>
              <input
                value={form.slug}
                disabled
                className="w-full h-10 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl px-3 text-sm text-[var(--gm-muted)] opacity-50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_description', 'Description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-xl p-3 text-sm text-[var(--gm-text)]"
              placeholder={ui('ui_dashboard_service_description', 'Description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_duration_minutes', 'Duration (Minutes)')}</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => {
                  setForm({ ...form, duration_minutes: Number(e.target.value) || 0 });
                  if (errors.duration) setErrors({ ...errors, duration: undefined });
                }}
                className={`h-10 w-full bg-[var(--gm-bg-deep)] border ${errors.duration ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-3 text-sm text-[var(--gm-text)]`}
              />
              {errors.duration && <p className="text-[9px] text-[var(--gm-error)] font-bold uppercase tracking-widest">{errors.duration}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_price', 'Price')}</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: Number(e.target.value) || 0 });
                  if (errors.price) setErrors({ ...errors, price: undefined });
                }}
                disabled={form.is_free}
                className={`h-10 w-full bg-[var(--gm-bg-deep)] border ${errors.price ? 'border-[var(--gm-error)]' : 'border-[var(--gm-border-soft)]'} rounded-xl px-3 text-sm text-[var(--gm-text)] disabled:opacity-50`}
              />
              {errors.price && <p className="text-[9px] text-[var(--gm-error)] font-bold uppercase tracking-widest">{errors.price}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">{ui('ui_dashboard_service_media_type', 'Media Type')}</label>
              <MediaTypeRadio
                value={form.media_type}
                onChange={(media_type) => setForm({
                  ...form,
                  media_type,
                  slug: mediaSlug(form.slug || slugify(form.name), media_type),
                })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => setForm({ ...form, is_free: e.target.checked, price: e.target.checked ? 0 : form.price })}
                className="w-5 h-5 accent-[var(--gm-success)]"
              />
              <span className="text-sm text-[var(--gm-text)]">{ui('ui_dashboard_service_free_intro', 'Free intro call')}</span>
            </label>
            <button
              onClick={handleSave}
              disabled={busy || !isDirty}
              className="px-6 py-2 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {ui('ui_dashboard_save_changes', 'Save Changes')}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ── C3: Service Boost Modal ── */
const DEFAULT_BOOST_PACKAGES = [
  { id: 'wk1', days: 7, price: 599, label: '1 Hafta' },
  { id: 'wk2', days: 14, price: 1099, label: '2 Hafta' },
  { id: 'wk4', days: 28, price: 1899, label: '4 Hafta' },
];

function ServiceBoostModal({
  serviceId,
  serviceName,
  onClose,
}: {
  serviceId: string;
  serviceName: string;
  onClose: () => void;
}) {
  const { ui } = useUiSection('ui_boost');
  const [selected, setSelected] = useState<string>('wk1');
  const [checkout, { isLoading }] = useCreateServiceBoostCheckoutMutation();

  const packages = DEFAULT_BOOST_PACKAGES;
  const chosen = packages.find((p) => p.id === selected) ?? packages[0];

  const handleBuy = async () => {
    try {
      const result = await checkout({ serviceId, package_id: chosen.id }).unwrap();
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        toast.error(ui('ui_boost_payment_error', 'Ödeme sayfası açılamadı. Lütfen tekrar deneyin.'));
      }
    } catch (error) {
      toast.error(extractApiError(error, ui('ui_boost_buy_failed', 'Boost satın alınamadı. Lütfen tekrar deneyin.')));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md bg-(--gm-surface) border border-(--gm-gold)/30 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-(--gm-gold)/15 via-(--gm-gold)/5 to-transparent">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--gm-gold)/10 blur-[60px] rounded-full -mr-10 -mt-10" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-5 h-5 text-(--gm-gold)" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-(--gm-gold)">{ui('ui_boost_title', 'Hizmetini Öne Çıkart')}</span>
              </div>
              <p className="text-sm text-(--gm-text) opacity-60 font-serif italic max-w-xs">
                &ldquo;{serviceName}&rdquo; {ui('ui_boost_desc', 'hizmetini listede üst sıralara taşı, daha fazla danışana ulaş.')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 text-(--gm-text) opacity-40 hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Packages */}
        <div className="p-6 space-y-3">
          {packages.map((pkg) => {
            const isActive = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-(--gm-gold) bg-(--gm-gold)/10'
                    : 'border-(--gm-border-soft) bg-(--gm-surface) hover:border-(--gm-gold)/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive ? 'border-(--gm-gold)' : 'border-(--gm-border-soft)'
                  }`}>
                    {isActive && <span className="w-2.5 h-2.5 rounded-full bg-(--gm-gold)" />}
                  </span>
                  <div className="text-left">
                    <div className="font-serif text-base text-(--gm-text)">{pkg.label}</div>
                    <div className="text-[11px] text-(--gm-text) opacity-40">{ui('ui_boost_days_label', '{days} gün boyunca üstte').replace('{days}', String(pkg.days))}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-(--gm-gold) text-lg">₺{pkg.price.toLocaleString('tr-TR')}</div>
                  <div className="text-[10px] text-(--gm-text) opacity-40">{ui('ui_boost_one_time', 'tek seferlik')}</div>
                </div>
              </button>
            );
          })}

          <p className="text-[10px] text-(--gm-text) opacity-40 italic text-center pt-2">
            {ui('ui_boost_note', 'Satın alma onaylandıktan sonra hizmetiniz anında öne çıkarılır.')}
          </p>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-full border border-(--gm-border-soft) text-[10px] font-bold uppercase tracking-widest text-(--gm-text) opacity-60 hover:opacity-100"
          >
            {ui('ui_boost_cancel', 'Vazgeç')}
          </button>
          <button
            onClick={handleBuy}
            disabled={isLoading}
            className="flex-1 h-12 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-shadow disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            ₺{chosen.price.toLocaleString('tr-TR')} — {ui('ui_boost_buy', 'Satın Al')}
          </button>
        </div>
      </div>
    </div>
  );
}
