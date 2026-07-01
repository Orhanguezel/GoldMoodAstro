'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, RefreshCcw, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';

import {
  useListHomeSectionsAdminQuery,
  useUpdateHomeSectionAdminMutation,
  useReorderHomeSectionsAdminMutation,
  useDeleteHomeSectionAdminMutation,
  useCreateHomeSectionAdminMutation,
  type AdminHomeSectionDto,
} from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdminT } from '../../../_components/common/useAdminT';

const COMPONENT_OPTIONS = [
  'HeroNew',
  'BannerSlot',
  'PromisesSection',
  'FeaturesNew',
  'HybridModelSection',
  'TransparencySection',
  'TrustSection',
  'WaitlistSection',
  'ZodiacGridSection',
  'ConsultantsSection',
];

interface RowProps {
  section: AdminHomeSectionDto;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (patch: Partial<AdminHomeSectionDto>) => void;
  onDelete: () => void;
  saving: boolean;
}

function SortableRow({ section, expanded, onToggleExpand, onPatch, onDelete, saving }: RowProps) {
  const t = useAdminT('admin.common');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const [configText, setConfigText] = React.useState(() => JSON.stringify(section.config ?? {}, null, 2));
  const [configError, setConfigError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setConfigText(JSON.stringify(section.config ?? {}, null, 2));
  }, [section.config]);

  const handleConfigSave = () => {
    try {
      const parsed = configText.trim() ? JSON.parse(configText) : null;
      setConfigError(null);
      onPatch({ config: parsed });
    } catch {
      setConfigError(t('jsonEditor.invalidJson'));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gm-border-soft rounded-2xl bg-gm-surface/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Row header */}
      <div className="flex items-center gap-4 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gm-muted hover:text-gm-gold transition-colors p-1"
          aria-label={t('dnd.drag')}
        >
          <GripVertical className="size-5" />
        </button>

        <button
          onClick={onToggleExpand}
          className="text-gm-muted hover:text-gm-text transition-colors"
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gm-text font-medium truncate">{section.label}</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-gm-border-soft text-gm-muted">
              {section.component_key}
            </Badge>
            <code className="text-[10px] text-gm-muted/70 font-mono">{section.slug}</code>
          </div>
          <div className="text-[11px] text-gm-muted mt-1">{t('homeLayout.order')}: {section.order_index}</div>
        </div>

        <Switch
          checked={!!section.is_active}
          onCheckedChange={(checked) => onPatch({ is_active: checked ? 1 : 0 })}
          disabled={saving}
          className="data-[state=checked]:bg-gm-gold"
        />
        <span className="text-[10px] uppercase tracking-widest text-gm-muted w-10">
          {section.is_active ? t('active') : t('inactive')}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={saving}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-gm-border-soft size-8 p-0"
          title={t('delete')}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Expanded edit panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gm-border-soft space-y-4 bg-gm-bg-deep/30">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.labelAdmin')}</Label>
              <Input
                defaultValue={section.label}
                onBlur={(e) => e.target.value !== section.label && onPatch({ label: e.target.value })}
                disabled={saving}
                className="h-9 bg-gm-bg-deep border-gm-border-soft"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.component')}</Label>
              <select
                defaultValue={section.component_key}
                onBlur={(e) => e.target.value !== section.component_key && onPatch({ component_key: e.target.value })}
                disabled={saving}
                className="h-9 w-full rounded-md bg-gm-bg-deep border border-gm-border-soft text-gm-text px-3 text-sm"
              >
                {COMPONENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.configJson')}</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConfigSave}
                disabled={saving}
                className="h-7 text-[10px] uppercase tracking-widest border-gm-border-soft"
              >
                {t('homeLayout.saveConfig')}
              </Button>
            </div>
            <Textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={5}
              className="font-mono text-xs bg-gm-bg-deep border-gm-border-soft"
              disabled={saving}
            />
            {configError && <p className="text-[11px] text-rose-400">{configError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeLayoutAdminClient() {
  const t = useAdminT('admin.common');
  const { data, isLoading, isFetching, refetch } = useListHomeSectionsAdminQuery();
  const [updateSection, { isLoading: isUpdating }] = useUpdateHomeSectionAdminMutation();
  const [reorderSections, { isLoading: isReordering }] = useReorderHomeSectionsAdminMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteHomeSectionAdminMutation();
  const [createSection, { isLoading: isCreating }] = useCreateHomeSectionAdminMutation();

  const [items, setItems] = React.useState<AdminHomeSectionDto[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showNew, setShowNew] = React.useState(false);
  const [newRow, setNewRow] = React.useState({ slug: '', label: '', component_key: 'PromisesSection' });

  React.useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((s) => s.id === active.id);
    const newIdx = items.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx).map((s, i) => ({ ...s, order_index: (i + 1) * 10 }));
    setItems(reordered);

    try {
      await reorderSections({ items: reordered.map((s) => ({ id: s.id, order_index: s.order_index })) }).unwrap();
      toast.success(t('homeLayout.reorderSuccess'));
    } catch {
      toast.error(t('homeLayout.reorderFailed'));
      refetch();
    }
  };

  const patchRow = async (id: string, patch: Partial<AdminHomeSectionDto>) => {
    try {
      await updateSection({ id, data: patch as any }).unwrap();
      toast.success(t('homeLayout.saved'));
    } catch {
      toast.error(t('homeLayout.saveFailed'));
    }
  };

  const deleteRow = async (id: string, label: string) => {
    if (!confirm(t('deleteConfirm', { item: label }))) return;
    try {
      await deleteSection(id).unwrap();
      toast.success(t('deleted', { item: label }));
    } catch {
      toast.error(t('homeLayout.deleteFailed'));
    }
  };

  const handleCreate = async () => {
    if (!newRow.slug || !newRow.label) {
      toast.error(t('homeLayout.slugLabelRequired'));
      return;
    }
    try {
      const maxOrder = Math.max(0, ...items.map((s) => s.order_index));
      await createSection({
        slug: newRow.slug,
        label: newRow.label,
        component_key: newRow.component_key,
        order_index: maxOrder + 10,
        is_active: 1,
        config: null,
      }).unwrap();
      toast.success(t('homeLayout.added'));
      setShowNew(false);
      setNewRow({ slug: '', label: '', component_key: 'PromisesSection' });
    } catch (e: any) {
      toast.error(e?.data?.error?.message || t('homeLayout.addFailed'));
    }
  };

  const busy = isLoading || isFetching || isUpdating || isReordering || isDeleting || isCreating;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">{t('homeLayout.themeDesign')}</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('homeLayout.title')}</h1>
          <p className="text-sm italic text-gm-muted">{t('homeLayout.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest"
          >
            <RefreshCcw className={cn("mr-2 size-4", (isLoading || isFetching) && "animate-spin")} />
            {t('refresh')}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNew((v) => !v)}
            disabled={busy}
            className="h-12 rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light px-8 text-[10px] font-bold uppercase tracking-widest"
          >
            <Plus className="mr-2 size-4" />
            {t('homeLayout.newSection')}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        {showNew && (
          <div className="p-6 border-b border-gm-border-soft bg-gm-bg-deep/40 grid gap-3 md:grid-cols-4">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.slug')}</Label>
              <Input
                value={newRow.slug}
                onChange={(e) => setNewRow({ ...newRow, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="my_new_section"
                className="h-9 bg-gm-bg-deep border-gm-border-soft mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.label')}</Label>
              <Input
                value={newRow.label}
                onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
                placeholder={t('homeLayout.newSection')}
                className="h-9 bg-gm-bg-deep border-gm-border-soft mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-gm-muted">{t('homeLayout.component')}</Label>
              <select
                value={newRow.component_key}
                onChange={(e) => setNewRow({ ...newRow, component_key: e.target.value })}
                className="h-9 mt-1 w-full rounded-md bg-gm-bg-deep border border-gm-border-soft text-gm-text px-3 text-sm"
              >
                {COMPONENT_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={busy}
                className="bg-gm-gold text-gm-bg hover:bg-gm-gold-light w-full h-9"
              >
                <Save className="size-3.5 mr-2" />
                {t('add')}
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gm-muted">{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gm-muted">{t('homeLayout.noSections')}</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((s) => (
                    <SortableRow
                      key={s.id}
                      section={s}
                      expanded={expandedId === s.id}
                      onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      onPatch={(patch) => patchRow(s.id, patch)}
                      onDelete={() => deleteRow(s.id, s.label)}
                      saving={busy}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
