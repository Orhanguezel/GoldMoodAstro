'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/bookings-header.tsx
// Admin Bookings Header (Filters + Summary)
// =============================================================

import * as React from 'react';
import { RefreshCcw, Search } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type BookingStatusFilter =
  | 'all'
  | 'pending_payment'
  | 'booked'
  | 'new'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export type BookingReadFilter = 'all' | 'unread' | 'read';

export type BookingsFilters = {
  q: string;
  status: BookingStatusFilter;
  is_read: BookingReadFilter;
  appointment_date: string; // YYYY-MM-DD
  resource_id: string;
};

export type BookingsHeaderProps = {
  filters: BookingsFilters;
  total: number;
  loading: boolean;
  onFiltersChange: (next: BookingsFilters) => void;
  onRefresh?: () => void;
};

export const BookingsHeader: React.FC<BookingsHeaderProps> = ({
  filters,
  total,
  loading,
  onFiltersChange,
  onRefresh,
}) => {
  const t = useAdminT('admin.bookings');

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{t('header.title')}</CardTitle>
            <CardDescription>{t('header.description')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {t('summary.total', { total })}
            </div>

            {loading ? (
              <Badge variant="secondary" className="ml-2">
                {t('states.loadingInline')}
              </Badge>
            ) : null}

            {onRefresh ? (
              <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCcw className="mr-2 size-4" />
                {t('admin.common.refresh')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 md:col-span-2">
          <Label>{t('filters.searchLabel')}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
              placeholder={t('filters.searchPlaceholder')}
              className="pl-9"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.statusLabel')}</Label>
          <Select
            value={filters.status}
            onValueChange={(v) => onFiltersChange({ ...filters, status: v as BookingStatusFilter })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.statusOptions.all')}</SelectItem>
              <SelectItem value="pending_payment">{t('filters.statusOptions.pending_payment')}</SelectItem>
              <SelectItem value="booked">{t('filters.statusOptions.booked')}</SelectItem>
              <SelectItem value="new">{t('filters.statusOptions.new')}</SelectItem>
              <SelectItem value="confirmed">{t('filters.statusOptions.confirmed')}</SelectItem>
              <SelectItem value="rejected">{t('filters.statusOptions.rejected')}</SelectItem>
              <SelectItem value="completed">{t('filters.statusOptions.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('filters.statusOptions.cancelled')}</SelectItem>
              <SelectItem value="no_show">{t('filters.statusOptions.no_show')}</SelectItem>
              <SelectItem value="expired">{t('filters.statusOptions.expired')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.readLabel')}</Label>
          <Select
            value={filters.is_read}
            onValueChange={(v) => onFiltersChange({ ...filters, is_read: v as BookingReadFilter })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.readOptions.all')}</SelectItem>
              <SelectItem value="unread">{t('filters.readOptions.unread')}</SelectItem>
              <SelectItem value="read">{t('filters.readOptions.read')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('filters.dateLabel')}</Label>
          <Input
            type="date"
            value={filters.appointment_date}
            onChange={(e) => onFiltersChange({ ...filters, appointment_date: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('filters.resourceIdLabel')}</Label>
          <Input
            value={filters.resource_id}
            onChange={(e) => onFiltersChange({ ...filters, resource_id: e.target.value })}
            placeholder={t('filters.resourceIdPlaceholder')}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
