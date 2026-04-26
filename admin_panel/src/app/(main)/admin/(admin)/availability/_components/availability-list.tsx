// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/AvailabilityList.tsx
// guezelwebdesign – Admin Availability List (resources)
// FINAL — shadcn/ui layout + responsive cards/table
// =============================================================

import React, { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ResourceAdminListItemDto } from '@/integrations/shared';
import { resourceTypeLabel, toActiveBool } from '@/integrations/shared';
import { useDeleteResourceAdminMutation } from '@/integrations/hooks';

export type AvailabilityListProps = {
  items?: ResourceAdminListItemDto[];
  loading: boolean;
};

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return safeText(value);
  return d.toLocaleString();
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

  const renderEmptyOrLoading = () => {
    if (loading) return <div className="text-sm text-muted-foreground">{t('availability.list.loading')}</div>;
    return <div className="text-sm text-muted-foreground">{t('availability.list.empty')}</div>;
  };

  const statusBadge = (r: ResourceAdminListItemDto) => {
    const active = toActiveBool((r as any).is_active);
    return active ? (
      <Badge className="bg-emerald-100 text-emerald-700">{t('availability.filters.statusActive')}</Badge>
    ) : (
      <Badge variant="secondary">{t('availability.filters.statusInactive')}</Badge>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('availability.list.title')}</CardTitle>
        <div className="flex items-center gap-2">
          {busy ? (
            <Badge variant="secondary" className="text-xs">
              {t('availability.list.loading')}
            </Badge>
          ) : null}
          <Badge variant="outline">{t('availability.list.total').replace('{count}', String(rows.length))}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="rounded-md border border-muted bg-muted/40 px-3 py-2">
            {renderEmptyOrLoading()}
          </div>
        ) : null}

        {/* Mobile cards */}
        {hasData ? (
          <div className="space-y-3 md:hidden">
            {normalized.map((r, idx) => (
              <div key={r.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">#{idx + 1}</div>
                    <div className="text-sm font-semibold truncate" title={safeText(r.title)}>
                      {r.title || <span className="text-muted-foreground">{t('availability.common.noName')}</span>}
                    </div>

                    {r._refFull ? (
                      <div className="text-xs text-muted-foreground truncate" title={r._refFull}>
                        {t('availability.list.columns.ref')}: <code>{r._refShort}</code>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{t('availability.common.noRef')}</div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{r._typeLabel}</Badge>
                      {statusBadge(r)}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      <div>{t('availability.list.columns.updated')}: {r._updated}</div>
                      <div>{t('availability.list.columns.created')}: {r._created}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/availability/${encodeURIComponent(r.id)}`}>{t('availability.list.actions.manage')}</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                    >
                      {t('availability.list.actions.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Desktop table */}
        {hasData ? (
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[56px]">#</TableHead>
                    <TableHead>{t('availability.list.columns.name')}</TableHead>
                    <TableHead>{t('availability.list.columns.type')}</TableHead>
                    <TableHead>{t('availability.list.columns.status')}</TableHead>
                    <TableHead>{t('availability.list.columns.updated')}</TableHead>
                    <TableHead className="text-right">{t('availability.list.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalized.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="text-sm font-semibold truncate" title={safeText(r.title)}>
                          {r.title || <span className="text-muted-foreground">{t('availability.common.noName')}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r._typeLabel}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(r)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div title={r._updated}>{r._updated}</div>
                        <div title={r._created}>{t('availability.list.columns.created')}: {r._created}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/availability/${encodeURIComponent(r.id)}`}>{t('availability.list.actions.manage')}</Link>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleDelete(r)}
                          >
                            {t('availability.list.actions.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
