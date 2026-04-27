'use client';

import * as React from 'react';
import { RefreshCcw, Search, Calendar, Filter } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Sistem Kayıtları</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Randevular</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Tüm seansları, durumlarını ve ödeme detaylarını buradan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Toplam</p>
            <p className="font-serif text-2xl text-[#C9A961]">{total}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={loading}
            className="rounded-full border-border/40 px-6"
          >
            <RefreshCcw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-end">
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1">Arama</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                placeholder="Randevu no, danışan veya danışman..."
                className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12 focus:border-[#C9A961]/50 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Durum</label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFiltersChange({ ...filters, status: v as BookingStatusFilter })}
              disabled={loading}
            >
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0 focus:border-[#C9A961]/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending_payment">Ödeme Bekliyor</SelectItem>
                <SelectItem value="booked">Rezerve</SelectItem>
                <SelectItem value="new">Yeni</SelectItem>
                <SelectItem value="confirmed">Onaylı</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Tarih</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={filters.appointment_date}
                onChange={(e) => onFiltersChange({ ...filters, appointment_date: e.target.value })}
                className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12 focus:border-[#C9A961]/50 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Okunma</label>
            <Select
              value={filters.is_read}
              onValueChange={(v) => onFiltersChange({ ...filters, is_read: v as BookingReadFilter })}
              disabled={loading}
            >
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0 focus:border-[#C9A961]/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Hepsi</SelectItem>
                <SelectItem value="unread">Okunmamış</SelectItem>
                <SelectItem value="read">Okunmuş</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
