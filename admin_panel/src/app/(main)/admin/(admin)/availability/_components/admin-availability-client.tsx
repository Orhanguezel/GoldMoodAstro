'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/admin-availability-client.tsx
// guezelwebdesign — Admin Availability Client (Resources)
// FINAL — shadcn/ui + RTK resources admin endpoints
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import { AvailabilityHeader, type AvailabilityFilters } from './availability-header';
import { AvailabilityList } from './availability-list';
import { getApiErrorMessage } from './availability-utils';

import type {
  ResourceAdminListItemDto,
  ResourcesAdminListQueryParams,
} from '@/integrations/shared';
import { useListResourcesAdminQuery } from '@/integrations/hooks';

const DEFAULT_FILTERS: AvailabilityFilters = {
  q: '',
  type: '',
  status: 'all',
};

function parseSearch(input: string): { q?: string; external_ref_id?: string } {
  const raw = String(input ?? '').trim();
  if (!raw) return {};
  const low = raw.toLowerCase();
  if (low.startsWith('ref:') || low.startsWith('ref=')) {
    const v = raw.slice(4).trim();
    return v ? { external_ref_id: v } : {};
  }
  return { q: raw };
}

export default function AdminAvailabilityClient() {
  const [filters, setFilters] = React.useState<AvailabilityFilters>(DEFAULT_FILTERS);

  const queryArgs: ResourcesAdminListQueryParams = React.useMemo(() => {
    const search = parseSearch(filters.q);

    return {
      q: search.q,
      external_ref_id: search.external_ref_id,
      type: filters.type || undefined,
      is_active: filters.status === 'all' ? undefined : filters.status === 'active' ? true : false,
      limit: 200,
      offset: 0,
      sort: 'updated_at',
      order: 'desc',
    };
  }, [filters]);

  const listQ = useListResourcesAdminQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const loading = listQ.isLoading || listQ.isFetching;
  const rows: ResourceAdminListItemDto[] = listQ.data ?? [];
  const total = rows.length;

  React.useEffect(() => {
    if (listQ.isError) toast.error(getApiErrorMessage(listQ.error));
  }, [listQ.isError, listQ.error]);

  return (
    <div className="space-y-6">
      <AvailabilityHeader
        filters={filters}
        total={total}
        loading={loading}
        onFiltersChange={setFilters}
        onRefresh={() => listQ.refetch()}
      />

      <AvailabilityList items={rows} loading={loading} />
    </div>
  );
}
