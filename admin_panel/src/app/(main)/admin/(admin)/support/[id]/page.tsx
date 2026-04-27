'use client';

import * as React from 'react';
import { ArrowLeft, Send, User, Shield, AlertCircle, Calendar, MessageSquare, Clock, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  useGetSupportTicketAdminQuery, 
  useListTicketRepliesAdminQuery, 
  useCreateTicketReplyAdminMutation,
  useToggleSupportTicketAdminMutation
} from '@/integrations/hooks';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
      toast.success('Yanıt gönderildi.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  const handleToggle = async () => {
    const action = ticket?.status === 'closed' ? 'reopen' : 'close';
    try {
      await toggleStatus({ id, action }).unwrap();
      toast.success(`Talep ${action === 'close' ? 'kapatıldı' : 'yeniden açıldı'}.`);
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  if (ticketLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A961]"></div>
    </div>
  );
  
  if (!ticket) return (
    <div className="p-20 text-center font-serif italic text-muted-foreground opacity-50">
      Destek talebi bulunamadı.
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-[#C9A961]/10 mt-1">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                ticket.status === 'closed' ? 'bg-muted text-muted-foreground' : 'bg-[#C9A961]/10 text-[#C9A961]'
              }`}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter">ID: {ticket.id.slice(0, 8)}</span>
            </div>
            <h1 className="font-serif text-3xl text-foreground leading-tight">{ticket.subject}</h1>
          </div>
        </div>

        <div className="flex gap-3 ml-auto md:ml-0">
          <Button 
            variant="outline" 
            onClick={handleToggle}
            className={cn(
              "rounded-full px-8 h-11 font-bold tracking-widest uppercase text-[10px]",
              ticket.status === 'closed' ? "border-[#C9A961]/30 text-[#C9A961]" : "border-muted text-muted-foreground"
            )}
          >
            {ticket.status === 'closed' ? 'TALEBİ YENİDEN AÇ' : 'TALEBİ KAPAT'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Messages Feed */}
        <div className="xl:col-span-8 space-y-8">
          {/* Initial Ticket Message */}
          <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-border/30 bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-muted border border-border/50 flex items-center justify-center text-muted-foreground">
                  <User size={18} />
                </div>
                <div>
                  <div className="font-serif text-lg text-foreground">Talep Mesajı</div>
                  <div className="text-[10px] text-muted-foreground font-mono opacity-50">{format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}</div>
                </div>
              </div>
            </div>
            <CardContent className="p-10">
              <p className="font-serif text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap italic">
                "{ticket.message}"
              </p>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-6">
              <MessageSquare className="text-[#C9A961]" size={16} />
              <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Konuşma Geçmişi</span>
            </div>

            {replies.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border/20 rounded-[32px] font-serif italic text-muted-foreground opacity-30">
                Henüz yanıt verilmemiş.
              </div>
            ) : (
              replies.map((reply) => (
                <Card 
                  key={reply.id} 
                  className={cn(
                    "rounded-[32px] overflow-hidden transition-all duration-500",
                    reply.is_admin 
                      ? "bg-[#C9A961]/5 border-[#C9A961]/20 ml-12" 
                      : "bg-card border-border/40 mr-12 shadow-sm"
                  )}
                >
                  <div className="p-6 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        reply.is_admin ? "bg-[#C9A961] text-[#1A1715]" : "bg-muted text-muted-foreground"
                      )}>
                        {reply.is_admin ? <Shield size={14} /> : <User size={14} />}
                      </div>
                      <div className="font-serif text-base font-bold text-foreground">
                        {reply.is_admin ? 'Destek Ekibi' : 'Kullanıcı'}
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono opacity-50">
                      {format(new Date(reply.created_at), 'dd MMM, HH:mm', { locale: tr })}
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {reply.message}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card className="bg-card border-[#C9A961]/30 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(201,169,97,0.05)]">
              <div className="p-6 border-b border-[#C9A961]/10 bg-[#C9A961]/5 flex items-center gap-3">
                <ShieldCheck className="text-[#C9A961]" size={16} />
                <span className="text-[10px] font-bold text-[#C9A961] tracking-[0.2em] uppercase">Resmi Yanıt Oluştur</span>
              </div>
              <CardContent className="p-8">
                <Textarea 
                  placeholder="Kullanıcıya iletilecek yanıtı buraya yazın..." 
                  className="min-h-[160px] bg-transparent border-none p-0 focus-visible:ring-0 text-base font-serif italic leading-relaxed placeholder:text-muted-foreground/30"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </CardContent>
              <div className="p-6 bg-muted/10 border-t border-border/30 flex justify-end">
                <Button 
                  onClick={handleSend} 
                  disabled={isSending || !message.trim()} 
                  className="bg-[#C9A961] text-[#1A1715] hover:bg-[#C9A961]/90 rounded-full px-10 h-11 font-bold tracking-widest uppercase shadow-[0_10px_20px_rgba(201,169,97,0.2)]"
                >
                  <Send className="mr-2 size-4" />
                  YANITI GÖNDER
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User size={14} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">Kullanıcı</div>
                  <div className="font-serif text-lg text-foreground truncate max-w-[200px]">{ticket.user_display_name || 'İsimsiz'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Mail size={14} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-0.5">E-posta</div>
                  <div className="text-xs font-mono text-foreground truncate max-w-[200px]">{ticket.user_email || '-'}</div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                    <AlertCircle size={12} className="text-[#C9A961]" /> Öncelik
                  </span>
                  <Badge variant="outline" className={cn(
                    "rounded-full px-4 border-none font-bold text-[9px] tracking-widest uppercase",
                    ticket.priority === 'urgent' ? "bg-[#E55B4D]/10 text-[#E55B4D]" :
                    ticket.priority === 'high' ? "bg-[#F0A030]/10 text-[#F0A030]" :
                    "bg-[#C9A961]/10 text-[#C9A961]"
                  )}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                    <Calendar size={12} className="text-[#C9A961]" /> Oluşturulma
                  </span>
                  <span className="font-mono text-xs">{format(new Date(ticket.created_at), 'dd.MM.yyyy')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                    <Clock size={12} className="text-[#C9A961]" /> Son Güncelleme
                  </span>
                  <span className="font-mono text-xs">{format(new Date(ticket.updated_at), 'dd.MM.yyyy')}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-8 rounded-[32px] bg-[#C9A961]/5 border border-[#C9A961]/20">
            <h4 className="font-serif text-lg mb-2 italic text-[#C9A961]">Moderatör Notu</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu talep üzerinden yapılan tüm yazışmalar kullanıcıya anlık bildirim olarak gönderilmektedir. Lütfen yanıtlarınızda GoldMoodAstro marka dilini koruyun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
