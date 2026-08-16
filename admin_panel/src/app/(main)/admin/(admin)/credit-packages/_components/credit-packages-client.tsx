'use client';

import * as React from 'react';
import { Coins, Edit3, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CreditPackageAdmin, CreditPackageAdminInput } from '@/integrations/shared';
import {
  useCreateCreditPackageAdminMutation,
  useDeleteCreditPackageAdminMutation,
  useListCreditPackagesAdminQuery,
  useUpdateCreditPackageAdminMutation,
} from '@/integrations/hooks';

const EMPTY_FORM: CreditPackageAdminInput = {
  code: '',
  name_tr: '',
  name_en: '',
  description_tr: '',
  description_en: '',
  price_minor: 0,
  currency: 'TRY',
  credits: 0,
  bonus_credits: 0,
  is_active: 1,
  is_featured: 0,
  display_order: 0,
};

function fromPackage(pkg: CreditPackageAdmin): CreditPackageAdminInput {
  return {
    code: pkg.code,
    name_tr: pkg.name_tr,
    name_en: pkg.name_en,
    description_tr: pkg.description_tr ?? '',
    description_en: pkg.description_en ?? '',
    price_minor: Number(pkg.price_minor ?? 0),
    currency: pkg.currency || 'TRY',
    credits: Number(pkg.credits ?? 0),
    bonus_credits: Number(pkg.bonus_credits ?? 0),
    is_active: Number(pkg.is_active) ? 1 : 0,
    is_featured: Number(pkg.is_featured) ? 1 : 0,
    display_order: Number(pkg.display_order ?? 0),
  };
}

function priceLabel(pkg: CreditPackageAdmin) {
  const amount = Number(pkg.price_minor ?? 0) / 100;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: pkg.currency || 'TRY' }).format(amount);
}

export default function CreditPackagesClient() {
  const query = useListCreditPackagesAdminQuery();
  const [createPackage, createState] = useCreateCreditPackageAdminMutation();
  const [updatePackage, updateState] = useUpdateCreditPackageAdminMutation();
  const [deletePackage, deleteState] = useDeleteCreditPackageAdminMutation();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CreditPackageAdminInput>(EMPTY_FORM);

  const busy = createState.isLoading || updateState.isLoading || deleteState.isLoading;

  function setField<K extends keyof CreditPackageAdminInput>(key: K, value: CreditPackageAdminInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function edit(pkg: CreditPackageAdmin) {
    setEditingId(pkg.id);
    setForm(fromPackage(pkg));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit() {
    const payload: CreditPackageAdminInput = {
      ...form,
      code: form.code.trim(),
      name_tr: form.name_tr.trim(),
      name_en: form.name_en.trim(),
      description_tr: form.description_tr?.trim() || null,
      description_en: form.description_en?.trim() || null,
      currency: form.currency.trim().toUpperCase() || 'TRY',
      price_minor: Number(form.price_minor),
      credits: Number(form.credits),
      bonus_credits: Number(form.bonus_credits),
      display_order: Number(form.display_order),
      is_active: Number(form.is_active) ? 1 : 0,
      is_featured: Number(form.is_featured) ? 1 : 0,
    };
    try {
      if (editingId) {
        await updatePackage({ id: editingId, patch: payload }).unwrap();
        toast.success('Kredi paketi güncellendi');
      } else {
        await createPackage(payload).unwrap();
        toast.success('Kredi paketi oluşturuldu');
      }
      resetForm();
    } catch {
      toast.error('Kredi paketi kaydedilemedi');
    }
  }

  async function remove(pkg: CreditPackageAdmin) {
    if (!confirm(`${pkg.code} kredi paketi silinsin mi?`)) return;
    try {
      await deletePackage({ id: pkg.id }).unwrap();
      toast.success('Kredi paketi silindi');
      if (editingId === pkg.id) resetForm();
    } catch {
      toast.error('Kredi paketi silinemedi');
    }
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Mağaza</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Kredi Paketleri</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase"
        >
          <RefreshCcw className={cn('mr-2 size-4', query.isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Paket</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kredi</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Fiyat</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Durum</TableHead>
                  <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index} className="border-gm-border-soft">
                      <TableCell className="py-6 px-8"><Skeleton className="h-12 w-56 bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-5 w-24 bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-5 w-20 bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6"><Skeleton className="h-7 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                      <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20" /></TableCell>
                    </TableRow>
                  ))
                ) : (query.data ?? []).map((pkg) => (
                  <TableRow key={pkg.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="size-11 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center">
                          <Coins className="size-5 text-gm-gold" />
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text">{pkg.name_tr}</div>
                          <div className="text-[10px] font-mono text-gm-muted">{pkg.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-sm text-gm-text">{Number(pkg.credits) + Number(pkg.bonus_credits)} kredi</TableCell>
                    <TableCell className="py-6 text-sm text-gm-muted font-mono">{priceLabel(pkg)}</TableCell>
                    <TableCell className="py-6">
                      <div className="flex gap-2">
                        <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-[10px]', Number(pkg.is_active) ? 'border-gm-success/30 text-gm-success' : 'border-gm-muted/30 text-gm-muted')}>
                          {Number(pkg.is_active) ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {Number(pkg.is_featured) ? <Badge className="rounded-full bg-gm-gold text-gm-ink text-[10px]">Öne çıkan</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => edit(pkg)}>
                          <Edit3 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-gm-error" onClick={() => remove(pkg)} disabled={busy}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-gm-text">{editingId ? 'Paketi Düzenle' : 'Yeni Paket'}</h2>
              {editingId ? (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={resetForm}>
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Kod</Label>
                <Input value={form.code} onChange={(event) => setField('code', event.target.value)} placeholder="starter" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TR Ad</Label>
                  <Input value={form.name_tr} onChange={(event) => setField('name_tr', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>EN Ad</Label>
                  <Input value={form.name_en} onChange={(event) => setField('name_en', event.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TR Açıklama</Label>
                  <Textarea value={form.description_tr ?? ''} onChange={(event) => setField('description_tr', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>EN Açıklama</Label>
                  <Textarea value={form.description_en ?? ''} onChange={(event) => setField('description_en', event.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fiyat Kuruş</Label>
                  <Input type="number" value={form.price_minor} onChange={(event) => setField('price_minor', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Kredi</Label>
                  <Input type="number" value={form.credits} onChange={(event) => setField('credits', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Bonus</Label>
                  <Input type="number" value={form.bonus_credits} onChange={(event) => setField('bonus_credits', Number(event.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Input value={form.currency} onChange={(event) => setField('currency', event.target.value)} maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label>Sıra</Label>
                  <Input type="number" value={form.display_order} onChange={(event) => setField('display_order', Number(event.target.value))} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-4">
                <Label>Aktif</Label>
                <Switch checked={Boolean(Number(form.is_active))} onCheckedChange={(value) => setField('is_active', value ? 1 : 0)} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-surface/20 p-4">
                <Label>Öne çıkan</Label>
                <Switch checked={Boolean(Number(form.is_featured))} onCheckedChange={(value) => setField('is_featured', value ? 1 : 0)} />
              </div>
            </div>

            <Button onClick={submit} disabled={busy} className="w-full rounded-full h-12 bg-gm-gold text-gm-ink hover:bg-gm-gold/90 font-bold">
              {editingId ? <Save className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
              {editingId ? 'Güncelle' : 'Oluştur'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
