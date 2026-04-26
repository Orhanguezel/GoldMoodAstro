'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListSupportTicketsAdminQuery,
  useToggleSupportTicketAdminMutation,
} from '@/integrations/hooks';
import Link from 'next/link';

export default function AdminSupportClient() {
  const [search, setSearch] = React.useState('');
  const query = useListSupportTicketsAdminQuery();
  const [toggleStatus] = useToggleSupportTicketAdminMutation();

  const tickets = React.useMemo(() => {
    if (!query.data) return [];
    if (!search) return query.data;
    const s = search.toLowerCase();
    return query.data.filter(t => 
      t.subject.toLowerCase().includes(s) || 
      t.message.toLowerCase().includes(s)
    );
  }, [query.data, search]);

  const handleToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'closed' ? 'reopen' : 'close';
    try {
      await toggleStatus({ id, action }).unwrap();
      toast.success(`Ticket ${action === 'close' ? 'closed' : 'reopened'}.`);
    } catch {
      toast.error('Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage user support requests and technical issues.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCcw className={`mr-2 size-4${query.isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ticket Queue</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">Loading tickets...</TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No tickets found.</TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Badge variant={ticket.status === 'closed' ? 'outline' : ticket.status === 'waiting_response' ? 'secondary' : 'default'}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
                          <AlertCircle className="size-4 text-destructive" />
                        ) : ticket.priority === 'medium' ? (
                          <Clock className="size-4 text-blue-500" />
                        ) : (
                          <div className="size-4" />
                        )}
                        <span className="capitalize">{ticket.priority}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate font-medium">{ticket.subject}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">{ticket.message}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/support/${ticket.id}`}>
                            <MessageSquare className="mr-2 size-4" />
                            Reply
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleToggle(ticket.id, ticket.status)}
                        >
                          {ticket.status === 'closed' ? (
                            <RefreshCcw className="mr-2 size-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 size-4 text-green-600" />
                          )}
                          {ticket.status === 'closed' ? 'Reopen' : 'Close'}
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
