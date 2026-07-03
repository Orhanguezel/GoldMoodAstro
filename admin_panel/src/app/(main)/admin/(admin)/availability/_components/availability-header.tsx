'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarClock, ListFilter, Plus, RefreshCcw, Search, Sparkles, ToggleLeft } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ResourceType } from '@/integrations/shared';
import { RESOURCE_TYPE_OPTIONS } from '@/integrations/shared';
import { cn } from '@/lib/utils';

export type AvailabilityFilters = {
  q: string;
  type: ResourceType | '';
  status: 'all' | 'active' | 'inactive';
};

export type AvailabilityHeaderProps = {
  filters: AvailabilityFilters;
  total: number;
  loading?: boolean;
  onFiltersChange: (next: AvailabilityFilters) => void;
  onRefresh?: () => void;
};

const ALL = '__all__' as const;

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  const t = useAdminT();

  const handleTypeChange = (v: string) => {
    onFiltersChange({ ...filters, type: v === ALL ? '' : (v as ResourceType) });
  };

  const handleStatusChange = (v: string) => {
    onFiltersChange({
      ...filters,
      status: v === ALL ? 'all' : (v as 'active' | 'inactive'),
    });
  };

  const handleReset = () => {
    onFiltersChange({ q: '', type: '', status: 'all' });
  };

  const activeFilterCount = [filters.q, filters.type, filters.status !== 'all' ? filters.status : '']
    .filter(Boolean)
    .length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              {t('availability.header.badge', undefined, 'Planlama')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">
            {t('availability.header.title')}
          </h1>
          <p className="max-w-2xl font-serif text-sm italic text-gm-muted opacity-70">
            {t('availability.header.description')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onRefresh ? (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="h-12 rounded-full border-gm-border-soft px-7 text-[10px] font-bold uppercase tracking-widest hover:bg-gm-surface"
            >
              <RefreshCcw className={cn('mr-2 size-4', loading && 'animate-spin')} />
              {t('availability.header.actions.refresh')}
            </Button>
          ) : null}

          <Button asChild className="h-12 rounded-full px-7 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/admin/availability/new">
              <Plus className="mr-2 size-4" />
              {t('availability.header.actions.create')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('availability.header.totalLabel')}
              </p>
              <p className="mt-2 font-serif text-3xl text-gm-text">{total}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10 text-gm-gold">
              <CalendarClock size={20} />
            </span>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('availability.filters.statusLabel')}
              </p>
              <p className="mt-2 font-serif text-2xl text-gm-text">
                {filters.status === 'all'
                  ? t('availability.filters.statusOptions.all')
                  : filters.status === 'active'
                    ? t('availability.filters.statusOptions.active')
                    : t('availability.filters.statusOptions.inactive')}
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              <ToggleLeft size={20} />
            </span>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
                {t('availability.filters.activeFilters', undefined, 'Aktif Filtre')}
              </p>
              <p className="mt-2 font-serif text-3xl text-gm-text">{activeFilterCount}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-600">
              <ListFilter size={20} />
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl backdrop-blur-md">
        <CardContent className="grid gap-6 p-8 md:grid-cols-3">
          <div className="space-y-3">
            <Label htmlFor="avail-q" className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              {t('availability.filters.searchLabel')}
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/50" />
              <Input
                id="avail-q"
                type="search"
                placeholder={t('availability.filters.searchPlaceholder')}
                value={filters.q}
                onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                disabled={loading}
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              {t('availability.filters.typeLabel')}
            </Label>
            <Select
              value={filters.type || ALL}
              onValueChange={handleTypeChange}
              disabled={loading}
            >
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40">
                <SelectValue placeholder={t('availability.filters.typeAll')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                <SelectItem value={ALL}>{t('availability.filters.typeAll')}</SelectItem>
                {RESOURCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              {t('availability.filters.statusLabel')}
            </Label>
            <Select
              value={filters.status === 'all' ? ALL : filters.status}
              onValueChange={handleStatusChange}
              disabled={loading}
            >
              <SelectTrigger className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gm-border-soft bg-gm-bg-deep">
                <SelectItem value={ALL}>{t('availability.filters.statusOptions.all')}</SelectItem>
                <SelectItem value="active">
                  {t('availability.filters.statusOptions.active')}
                </SelectItem>
                <SelectItem value="inactive">
                  {t('availability.filters.statusOptions.inactive')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:col-span-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="rounded-full border-gm-border-soft px-6"
            >
              {t('availability.filters.clear')}
            </Button>
            {loading ? (
              <Badge variant="outline" className="rounded-full border-gm-border-soft px-4 py-2 text-gm-muted">
                <Sparkles className="mr-2 size-3 animate-pulse text-gm-gold" />
                {t('availability.list.loading')}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
