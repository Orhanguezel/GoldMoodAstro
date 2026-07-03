import React, { useMemo } from 'react';
import Link from 'next/link';
import { CalendarDays, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteResourceAdminMutation } from '@/integrations/hooks';
import type { ResourceAdminListItemDto } from '@/integrations/shared';
import { resourceTypeLabel, toActiveBool } from '@/integrations/shared';
import { cn } from '@/lib/utils';

export type AvailabilityListProps = {
  items?: ResourceAdminListItemDto[];
  loading: boolean;
};

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);
  return d.toLocaleString('tr-TR');
};

const shortRef = (v: string, head = 8, tail = 4) => {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
};

export const AvailabilityList: React.FC<AvailabilityListProps> = ({ items, loading }) => {
  const t = useAdminT();
  const rows = useMemo(() => items ?? [], [items]);
  const hasData = rows.length > 0;

  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceAdminMutation();
  const busy = loading || isDeleting;

  const handleDelete = async (r: ResourceAdminListItemDto) => {
    const msg = t('availability.list.deleteConfirm.description')
      .replace('{name}', r.title ?? t('availability.common.noName'))
      .replace('{type}', resourceTypeLabel(r.type as any))
      .replace('{ref}', r.external_ref_id ? String(r.external_ref_id) : '-');
    const ok = window.confirm(msg);
    if (!ok) return;

    try {
      await deleteResource(r.id).unwrap();
      toast.success(t('availability.form.messages.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('availability.list.loading'));
    }
  };

  const statusBadge = (r: ResourceAdminListItemDto) => {
    const active = toActiveBool((r as any).is_active);
    return (
      <Badge
        variant="outline"
        className={cn(
          'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
          active
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
            : 'border-slate-500/30 bg-slate-500/10 text-slate-500',
        )}
      >
        {active ? t('availability.filters.statusActive') : t('availability.filters.statusInactive')}
      </Badge>
    );
  };

  const normalized = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        _created: formatDate(r.created_at as any),
        _updated: formatDate(r.updated_at as any),
        _typeLabel: resourceTypeLabel(r.type as any),
        _refFull: r.external_ref_id ? String(r.external_ref_id) : '',
        _refShort: r.external_ref_id ? shortRef(String(r.external_ref_id)) : '',
      })),
    [rows],
  );

  return (
    <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-2 border-b border-gm-border-soft bg-gm-surface/30 px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-gm-text">{t('availability.list.title')}</h2>
          <p className="mt-1 text-sm text-gm-muted">
            {t('availability.list.total').replace('{count}', String(rows.length))}
          </p>
        </div>
        {busy ? (
          <Badge variant="outline" className="w-fit rounded-full border-gm-border-soft px-4 py-2 text-gm-muted">
            <Loader2 className="mr-2 size-3 animate-spin text-gm-gold" />
            {t('availability.list.loading')}
          </Badge>
        ) : null}
      </div>

      <CardContent className="p-0">
        {!hasData ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            {loading ? (
              <Loader2 className="size-9 animate-spin text-gm-gold" />
            ) : (
              <CalendarDays className="size-12 text-gm-gold/40" />
            )}
            <p className="font-serif text-lg italic text-gm-muted">
              {loading ? t('availability.list.loading') : t('availability.list.empty')}
            </p>
          </div>
        ) : null}

        {hasData ? (
          <div className="space-y-4 p-4 md:hidden">
            {normalized.map((r, idx) => (
              <div key={r.id} className="rounded-[24px] border border-gm-border-soft bg-gm-bg-deep/35 p-5 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10 font-serif text-sm text-gm-gold">
                        {idx + 1}
                      </span>
                      {statusBadge(r)}
                    </div>
                    <div className="truncate font-semibold text-gm-text" title={safeText(r.title)}>
                      {r.title || <span className="text-gm-muted">{t('availability.common.noName')}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-gm-border-soft px-3 py-1 text-gm-muted">
                        {r._typeLabel}
                      </Badge>
                      {r._refFull ? (
                        <Badge variant="outline" className="rounded-full border-gm-border-soft px-3 py-1 font-mono text-[10px] text-gm-muted" title={r._refFull}>
                          {t('availability.list.columns.ref')}: {r._refShort}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-gm-muted">
                      <div>{t('availability.list.columns.updated')}: {r._updated}</div>
                      <div>{t('availability.list.columns.created')}: {r._created}</div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft">
                      <Link href={`/admin/availability/${encodeURIComponent(r.id)}`}>
                        <Pencil className="mr-2 size-4" />
                        {t('availability.list.actions.manage')}
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                      className="rounded-full border-red-500/30 text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('availability.list.actions.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {hasData ? (
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="w-[72px] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">#</TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('availability.list.columns.name')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('availability.list.columns.type')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('availability.list.columns.status')}
                  </TableHead>
                  <TableHead className="py-5 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('availability.list.columns.updated')}
                  </TableHead>
                  <TableHead className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    {t('availability.list.columns.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalized.map((r, idx) => (
                  <TableRow key={r.id} className="border-gm-border-soft transition-colors hover:bg-gm-primary/[0.03]">
                    <TableCell className="px-8 py-5">
                      <span className="flex size-9 items-center justify-center rounded-full border border-gm-gold/20 bg-gm-gold/10 font-serif text-sm text-gm-gold">
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[260px] py-5">
                      <div className="truncate font-semibold text-gm-text" title={safeText(r.title)}>
                        {r.title || <span className="text-gm-muted">{t('availability.common.noName')}</span>}
                      </div>
                      {r._refFull ? (
                        <div className="mt-1 truncate font-mono text-[11px] text-gm-muted" title={r._refFull}>
                          {t('availability.list.columns.ref')}: {r._refShort}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-gm-muted">{t('availability.common.noRef')}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="rounded-full border-gm-border-soft px-3 py-1 text-gm-muted">
                        {r._typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">{statusBadge(r)}</TableCell>
                    <TableCell className="py-5 text-xs text-gm-muted">
                      <div title={r._updated}>{r._updated}</div>
                      <div title={r._created}>{t('availability.list.columns.created')}: {r._created}</div>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="inline-flex gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full border-gm-border-soft">
                          <Link href={`/admin/availability/${encodeURIComponent(r.id)}`}>
                            <Pencil className="mr-2 size-4" />
                            {t('availability.list.actions.manage')}
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(r)}
                          className="rounded-full border-red-500/30 text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="mr-2 size-4" />
                          {t('availability.list.actions.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
