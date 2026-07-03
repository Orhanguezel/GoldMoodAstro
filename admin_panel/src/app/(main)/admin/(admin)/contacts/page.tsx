'use client';

import * as React from 'react';
import ContactHeader from '@/components/admin/contact/ContactHeader';
import ContactList from '@/components/admin/contact/ContactList';
import { useListContactsAdminQuery } from '@/integrations/hooks';

export default function AdminContactsPage() {
  const [search, setSearch] = React.useState('');
  const query = useListContactsAdminQuery({
    search: search.trim() || undefined,
    orderBy: 'created_at',
    order: 'desc',
    limit: 200,
  });

  return (
    <div className="animate-in space-y-10 pb-12 duration-700 fade-in slide-in-from-bottom-4">
      <ContactHeader
        search={search}
        onSearchChange={setSearch}
        onRefresh={() => query.refetch()}
        isRefreshing={query.isFetching}
      />
      <ContactList
        contacts={query.data ?? []}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
      />
    </div>
  );
}
