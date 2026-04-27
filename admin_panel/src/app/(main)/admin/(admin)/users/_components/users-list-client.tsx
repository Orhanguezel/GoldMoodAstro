'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RefreshCcw, ChevronLeft, ChevronRight, User, ShieldCheck, Mail, Phone, MoreHorizontal, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import type { UserRoleName, AdminUserView, AdminUsersListParams } from '@/integrations/shared';
import { useListUsersAdminQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

function boolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.trim();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return undefined;
}

function safeInt(v: string | null, fb: number): number {
  const n = Number(v ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fb;
}

function pickQuery(sp: URLSearchParams): AdminUsersListParams {
  const q = sp.get('q') ?? undefined;
  const role = (sp.get('role') ?? undefined) as UserRoleName | undefined;
  const is_active = boolParam(sp.get('is_active'));
  const limit = safeInt(sp.get('limit'), 20) || 20;
  const offset = safeInt(sp.get('offset'), 0);
  const sort = (sp.get('sort') ?? undefined) as AdminUsersListParams['sort'] | undefined;
  const order = (sp.get('order') ?? undefined) as AdminUsersListParams['order'] | undefined;

  return {
    ...(q ? { q } : {}),
    ...(role ? { role } : {}),
    ...(typeof is_active === 'boolean' ? { is_active } : {}),
    limit,
    offset,
    ...(sort ? { sort } : {}),
    ...(order ? { order } : {}),
  };
}

function toSearchParams(p: AdminUsersListParams): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.role) sp.set('role', p.role);
  if (typeof p.is_active === 'boolean') sp.set('is_active', p.is_active ? '1' : '0');
  if (p.limit != null) sp.set('limit', String(p.limit));
  if (p.offset != null) sp.set('offset', String(p.offset));
  if (p.sort) sp.set('sort', p.sort);
  if (p.order) sp.set('order', p.order);
  return sp.toString();
}

export default function UsersListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.users');

  const params = React.useMemo(() => pickQuery(sp), [sp]);
  const usersQ = useListUsersAdminQuery(params);

  const [q, setQ] = React.useState(params.q ?? '');

  function apply(next: Partial<AdminUsersListParams>) {
    const merged: AdminUsersListParams = { ...params, ...next, offset: next.offset != null ? next.offset : 0 };
    if (!merged.q) delete (merged as any).q;
    if (!merged.role) delete (merged as any).role;
    if (typeof merged.is_active !== 'boolean') delete (merged as any).is_active;
    const qs = toSearchParams(merged);
    router.push(qs ? `/admin/users?${qs}` : `/admin/users`);
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const canPrev = offset > 0;
  const canNext = (usersQ.data?.length ?? 0) >= limit;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Üyelik Sistemi</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Kullanıcılar</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Tüm danışan, danışman ve admin hesaplarını buradan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => usersQ.refetch()} 
            disabled={usersQ.isFetching}
            className="rounded-full border-border/40 px-6 h-11"
          >
            <RefreshCcw className={`mr-2 size-4 ${usersQ.isFetching ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1">Hesap Ara</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply({ q: q.trim() || undefined })}
                placeholder="İsim, e-posta veya telefon..."
                className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Rol</label>
            <Select
              value={params.role || 'all'}
              onValueChange={(v) => apply({ role: v === 'all' ? undefined : (v as UserRoleName) })}
            >
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0">
                <SelectValue placeholder="Rol Seçin" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Tüm Roller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="consultant">Danışman</SelectItem>
                <SelectItem value="user">Kullanıcı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center gap-4 h-12 px-6 bg-muted/10 rounded-2xl border border-border/30">
            <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Sadece Aktif</label>
            <Switch
              checked={params.is_active === true}
              onCheckedChange={(v) => apply({ is_active: v ? true : undefined })}
              className="data-[state=checked]:bg-[#C9A961]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest">Kullanıcı</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">İletişim</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">E-posta</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Rol</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQ.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center font-serif italic text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : (usersQ.data ?? []).map((u) => (
                <TableRow key={u.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted border border-border/50 flex items-center justify-center text-[#C9A961] font-serif">
                        {u.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-serif text-lg text-foreground flex items-center gap-2">
                          {u.full_name || 'İsimsiz Kullanıcı'}
                          {u.roles.includes('admin') && <ShieldCheck className="w-4 h-4 text-[#C9A961]" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter">ID: {u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail size={12} className="text-[#C9A961]" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone size={12} className="text-[#C9A961]" />
                        {u.phone || 'Telefon Yok'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      u.is_active ? 'bg-[#4CAF6E]/10 text-[#4CAF6E]' : 'bg-[#E55B4D]/10 text-[#E55B4D]'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${u.is_active ? 'bg-[#4CAF6E]' : 'bg-[#E55B4D]'}`} />
                      {u.is_active ? 'AKTİF' : 'PASİF'}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    <Badge variant={u.email_verified ? 'outline' : 'secondary'} className={u.email_verified ? 'border-[#C9A961] text-[#C9A961] text-[9px]' : 'text-muted-foreground text-[9px] opacity-40'}>
                      {u.email_verified ? 'DOĞRULANDI' : 'BEKLİYOR'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    <span className={`text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded border ${
                      u.roles.includes('admin') ? 'border-[#C9A961]/30 text-[#C9A961]' :
                      u.roles.includes('consultant') ? 'border-[#7B5EA7]/30 text-[#7B5EA7]' :
                      'border-border/50 text-muted-foreground'
                    }`}>
                      {u.roles[0] === 'admin' ? 'ADMİN' : u.roles[0] === 'consultant' ? 'DANIŞMAN' : 'KULLANICI'}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]">
                      <Link prefetch={false} href={`/admin/users/${encodeURIComponent(u.id)}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between px-8">
        <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          Sayfa Başı: {limit} • Toplam {usersQ.data?.length ?? 0} Kayıt
        </div>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canPrev || usersQ.isFetching}
            onClick={() => apply({ offset: Math.max(0, offset - limit) })}
            className="rounded-full px-6 hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
          >
            <ChevronLeft className="mr-2 size-4" />
            Önceki
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canNext || usersQ.isFetching}
            onClick={() => apply({ offset: offset + limit })}
            className="rounded-full px-6 hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
          >
            Sonraki
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
