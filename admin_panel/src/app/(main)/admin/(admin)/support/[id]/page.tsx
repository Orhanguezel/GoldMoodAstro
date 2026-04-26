'use client';

import * as React from 'react';
import { ArrowLeft, Send, User, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  useGetSupportTicketAdminQuery, 
  useListTicketRepliesAdminQuery, 
  useCreateTicketReplyAdminMutation,
  useToggleSupportTicketAdminMutation
} from '@/integrations/hooks';
import { useParams, useRouter } from 'next/navigation';

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: ticket, isLoading: ticketLoading } = useGetSupportTicketAdminQuery(id);
  const { data: replies = [], isLoading: repliesLoading } = useListTicketRepliesAdminQuery(id);
  const [createReply, { isLoading: isSending }] = useCreateTicketReplyAdminMutation();
  const [toggleStatus] = useToggleSupportTicketAdminMutation();

  const [message, setMessage] = React.useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await createReply({ ticket_id: id, message: message.trim() }).unwrap();
      setMessage('');
      toast.success('Reply sent.');
    } catch {
      toast.error('Could not send reply.');
    }
  };

  const handleToggle = async () => {
    const action = ticket?.status === 'closed' ? 'reopen' : 'close';
    try {
      await toggleStatus({ id, action }).unwrap();
      toast.success(`Ticket ${action === 'close' ? 'closed' : 'reopened'}.`);
    } catch {
      toast.error('Operation failed.');
    }
  };

  if (ticketLoading) return <div className="p-8 text-center">Loading ticket...</div>;
  if (!ticket) return <div className="p-8 text-center">Ticket not found.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <Badge variant={ticket.status === 'closed' ? 'outline' : ticket.status === 'waiting_response' ? 'secondary' : 'default'}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Ticket ID: {ticket.id}</p>
        </div>
        <Button variant="outline" onClick={handleToggle}>
          {ticket.status === 'closed' ? 'Reopen Ticket' : 'Close Ticket'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Message */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">User Message</CardTitle>
                <CardDescription>{format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.message}</p>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id} className={reply.is_admin ? 'border-l-4 border-l-amethyst/50' : ''}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    reply.is_admin ? "bg-amethyst/10 text-amethyst" : "bg-muted"
                  )}>
                    {reply.is_admin ? <Shield className="size-4" /> : <User className="size-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {reply.is_admin ? 'Administrator' : 'User'}
                      </CardTitle>
                      <CardDescription>{format(new Date(reply.created_at), 'dd MMM yyyy, HH:mm')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Post a Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Type your response here..." 
                  className="min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </CardContent>
              <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSend} disabled={isSending || !message.trim()} className="bg-amethyst hover:bg-amethyst/90">
                  <Send className="mr-2 size-4" />
                  Send Reply
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Priority</span>
                <div className="flex items-center gap-2">
                  {(ticket.priority === 'urgent' || ticket.priority === 'high') && <AlertCircle className="size-4 text-destructive" />}
                  <span className="font-medium capitalize">{ticket.priority}</span>
                </div>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">{format(new Date(ticket.created_at), 'dd.MM.yyyy')}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Update</span>
                <span className="font-medium">{format(new Date(ticket.updated_at), 'dd.MM.yyyy')}</span>
              </div>
              {ticket.user_email && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">User</span>
                  <span className="max-w-[12rem] truncate font-medium">{ticket.user_display_name || ticket.user_email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
