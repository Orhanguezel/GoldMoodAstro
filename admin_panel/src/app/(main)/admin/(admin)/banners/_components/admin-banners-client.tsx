'use client';

import * as React from 'react';
import { 
  Layout, Plus, RefreshCcw, 
  Trash2, Pencil, Image as ImageIcon,
  ExternalLink, Eye, MousePointerClick
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListBannersAdminQuery,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
} from '@/integrations/hooks';

export default function AdminBannersClient() {
  const query = useListBannersAdminQuery();
  const [update] = useUpdateBannerAdminMutation();
  const [remove] = useDeleteBannerAdminMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, body: { is_active: !current } }).unwrap();
      toast.success('Status updated.');
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Banner deleted.');
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold italic font-display text-gm-primary">Banners</h1>
          <p className="text-sm text-muted-foreground">Manage advertising and promotional banners across web and mobile.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild className="bg-gm-primary hover:bg-gm-primary-dark">
            <Link href="/admin/banners/new">
              <Plus className="mr-2 size-4" />
              New Banner
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-gm-border-soft bg-gm-surface/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface-high/50">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="w-12">Active</TableHead>
                <TableHead>Banner</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Schedule</TableHead>
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
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No banners found.</TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface-high/30 transition-colors">
                    <TableCell>
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-20 overflow-hidden rounded-md border border-gm-border-soft bg-gm-bg-deep">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.code} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="size-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gm-text">{item.title_tr || item.code}</div>
                          <div className="text-xs text-gm-muted flex items-center gap-1">
                            <code>{item.code}</code>
                            {item.locale !== '*' && <Badge variant="outline" className="text-[10px] py-0 px-1">{item.locale}</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gm-surface-high text-gm-primary border-gm-primary/20 capitalize font-medium">
                        {item.placement.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gm-text-dim">
                          <Eye className="size-3 text-gm-info" />
                          <span>{item.view_count.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gm-text-dim">
                          <MousePointerClick className="size-3 text-gm-success" />
                          <span>{item.click_count.toLocaleString()} clicks</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gm-text-dim">
                      {item.starts_at ? (
                        <div>
                          <div className="text-gm-success">S: {format(new Date(item.starts_at), 'dd MMM yy')}</div>
                          {item.ends_at && <div className="text-gm-error">E: {format(new Date(item.ends_at), 'dd MMM yy')}</div>}
                        </div>
                      ) : (
                        <span className="italic">No schedule</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {item.link_url && (
                          <Button asChild size="icon" variant="ghost" className="hover:bg-gm-primary/10 hover:text-gm-primary">
                            <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        )}
                        <Button asChild size="icon" variant="ghost" className="hover:bg-gm-primary/10 hover:text-gm-primary">
                          <Link href={`/admin/banners/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                          onClick={() => handleDelete(item.id)}
                        >
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
