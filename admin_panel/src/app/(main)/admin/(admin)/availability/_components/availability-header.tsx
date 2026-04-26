'use client';

// =============================================================
// FILE: availability/_components/availability-header.tsx
// Admin Availability Header (filters + summary)
// =============================================================

import * as React from 'react';
import Link from 'next/link';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  return (
    <Card>
      <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('availability.header.title')}</CardTitle>
              <CardDescription>{t('availability.header.description')}</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {t('availability.header.totalLabel')}{' '}
                <span className="font-medium text-foreground">{total}</span>
              </div>
              {loading ? (
                <Badge variant="secondary">{t('availability.list.loading')}</Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="avail-q">{t('availability.filters.searchLabel')}</Label>
              <Input
                id="avail-q"
                type="search"
                placeholder={t('availability.filters.searchPlaceholder')}
                value={filters.q}
                onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('availability.filters.typeLabel')}</Label>
              <Select
                value={filters.type || ALL}
                onValueChange={handleTypeChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('availability.filters.typeAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('availability.filters.typeAll')}</SelectItem>
                  {RESOURCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('availability.filters.statusLabel')}</Label>
              <Select
                value={filters.status === 'all' ? ALL : filters.status}
                onValueChange={handleStatusChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              {t('availability.filters.clear')}
            </Button>

            {onRefresh ? (
              <Button variant="outline" onClick={onRefresh} disabled={loading}>
                {t('availability.header.actions.refresh')}
              </Button>
            ) : null}

            <div className="ml-auto">
              <Button asChild>
                <Link href="/admin/availability/new">
                  {t('availability.header.actions.create')}
                </Link>
              </Button>
            </div>
          </div>
      </CardContent>
    </Card>
  );
};
