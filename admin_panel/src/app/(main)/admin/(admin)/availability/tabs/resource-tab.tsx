// =============================================================
// FILE: src/components/admin/availability/tabs/ResourceTab.tsx
// FINAL — Resource editor tab
// =============================================================

'use client';

import React from 'react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AvailabilityResourceValues, ResourceType } from '@/integrations/shared';
import { RESOURCE_TYPE_OPTIONS } from '@/integrations/shared';

export type ResourceTabProps = {
  mode: 'create' | 'edit';
  values: AvailabilityResourceValues;
  disabled: boolean;
  hasResourceId: boolean;
  onChange: (patch: Partial<AvailabilityResourceValues>) => void;
  onSubmit: () => void | Promise<void>;
};

export const ResourceTab: React.FC<ResourceTabProps> = ({
  mode,
  values,
  disabled,
  hasResourceId,
  onChange,
  onSubmit,
}) => {
  const t = useAdminT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const title = values.title.trim();
    if (!title) {
      toast.error(t('availability.form.resource.titleLabel') + ' !');
      return;
    }
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('availability.form.resource.titleLabel')}</Label>
          <Input
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
            placeholder={t('availability.form.resource.titlePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('availability.form.resource.typeLabel')}</Label>
          <Select
            value={values.type}
            onValueChange={(v) => onChange({ type: v as ResourceType })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('availability.form.resource.capacityLabel')}</Label>
          <Input
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => onChange({ capacity: Number(e.target.value) })}
            disabled={disabled}
          />
          <div className="text-xs text-muted-foreground">
            {t('availability.form.resource.capacityHelp')}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('availability.form.resource.refLabel')}</Label>
          <Input
            type="text"
            value={values.external_ref_id ?? ''}
            onChange={(e) => onChange({ external_ref_id: e.target.value || null })}
            disabled={disabled}
            placeholder={t('availability.form.resource.refPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('availability.form.resource.statusLabel')}</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={values.is_active}
              onCheckedChange={(v) => onChange({ is_active: v })}
              disabled={disabled}
            />
            <span className="text-sm">
              {values.is_active ? t('availability.form.resource.active') : t('availability.form.resource.inactive')}
            </span>
          </div>
        </div>
      </div>

      {!hasResourceId && mode === 'create' ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {t('availability.form.tabs.weekly')} & {t('availability.form.tabs.daily')}
        </div>
      ) : null}
    </form>
  );
};
