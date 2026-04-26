'use client';

import * as React from 'react';
import { 
  Megaphone, Plus, RefreshCcw, 
  Trash2, Pencil, ToggleLeft, ToggleRight, 
  Users, User, Star 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListAnnouncementsAdminQuery,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
} from '@/integrations/hooks';
import Link from 'next/link';

export default function AdminAnnouncementsClient() {
  const query = useListAnnouncementsAdminQuery();
  const [update] = useUpdateAnnouncementAdminMutation();
  const [remove] = useDeleteAnnouncementAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, patch: { is_active: !current } }).unwrap();
      toast.success('Status updated.');
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Announcement deleted.');
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage app-wide announcements for your users and consultants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild className="bg-amethyst hover:bg-amethyst/90">
            <Link href="/admin/announcements/new">
              <Plus className="mr-2 size-4" />
              New Announcement
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Active</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Starts At</TableHead>
                <TableHead>Ends At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">Loading...</TableCell>
                </TableRow>
              ) : query.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No announcements found.</TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-1.5 capitalize">
                        {item.audience === 'all' && <Users className="size-3" />}
                        {item.audience === 'users' && <User className="size-3" />}
                        {item.audience === 'consultants' && <Star className="size-3" />}
                        {item.audience}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{item.body}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.starts_at ? format(new Date(item.starts_at), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.ends_at ? format(new Date(item.ends_at), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="icon" variant="ghost">
                          <Link href={`/admin/announcements/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
