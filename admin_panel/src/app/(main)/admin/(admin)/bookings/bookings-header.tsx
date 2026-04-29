'use client';

import * as React from 'react';
import { RefreshCcw, Search, Calendar, Filter } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

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
import { cn } from '@/lib/utils';

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
  appointment_date: string;
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">{t('list.badge', null, 'Randevu Yönetimi')}</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic max-w-xl">
            {t('header.description')}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-gm-surface/20 px-8 py-4 rounded-[24px] border border-gm-border-soft backdrop-blur-sm">
          <div className="text-center sm:text-right min-w-[80px]">
            <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase mb-1">{t('summary.total_label', null, 'Toplam')}</p>
            <p className="font-serif text-3xl text-gm-gold">{total}</p>
          </div>
          <Button 
            onClick={onRefresh} 
            disabled={loading}
            variant="outline"
            className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            <RefreshCcw className={cn("mr-2 size-4", loading && "animate-spin")} />
            {t('states.refresh', null, 'Yenile')}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-end">
          <div className="space-y-3 md:col-span-2">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('filters.searchLabel')}</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
              <Input
                value={filters.q}
                onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                placeholder={t('filters.searchPlaceholder')}
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('filters.statusLabel')}</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFiltersChange({ ...filters, status: v as BookingStatusFilter })}
              disabled={loading}
            >
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                <SelectItem value="all">{t('filters.statusOptions.all')}</SelectItem>
                <SelectItem value="pending_payment">{t('filters.statusOptions.pending_payment')}</SelectItem>
                <SelectItem value="booked">{t('filters.statusOptions.booked')}</SelectItem>
                <SelectItem value="new">{t('filters.statusOptions.new')}</SelectItem>
                <SelectItem value="confirmed">{t('filters.statusOptions.confirmed')}</SelectItem>
                <SelectItem value="completed">{t('filters.statusOptions.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('filters.statusOptions.cancelled')}</SelectItem>
                <SelectItem value="rejected">{t('filters.statusOptions.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('filters.dateLabel')}</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
              <Input
                type="date"
                value={filters.appointment_date}
                onChange={(e) => onFiltersChange({ ...filters, appointment_date: e.target.value })}
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('filters.readLabel')}</Label>
            <Select
              value={filters.is_read}
              onValueChange={(v) => onFiltersChange({ ...filters, is_read: v as BookingReadFilter })}
              disabled={loading}
            >
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                <SelectItem value="all">{t('filters.readOptions.all')}</SelectItem>
                <SelectItem value="unread">{t('filters.readOptions.unread')}</SelectItem>
                <SelectItem value="read">{t('filters.readOptions.read')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
