'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  RefreshCcw,
  Save,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ContactStatus } from '@/integrations/shared';
import {
  useGetContactAdminQuery,
  useUpdateContactAdminMutation,
} from '@/integrations/hooks';

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd MMM yyyy, HH:mm', { locale: tr });
}

function statusLabel(status: ContactStatus) {
  if (status === 'closed') return 'Kapalı';
  if (status === 'in_progress') return 'İşlemde';
  return 'Yeni';
}

function statusClass(status: ContactStatus) {
  if (status === 'closed') return 'bg-gm-muted/10 text-gm-muted';
  if (status === 'in_progress') return 'bg-gm-warning/10 text-gm-warning';
  return 'bg-gm-gold/10 text-gm-gold';
}

const statusOptions: Array<{ value: ContactStatus; label: string }> = [
  { value: 'new', label: 'Yeni' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'closed', label: 'Kapalı' },
];

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id || '');

  const { data: contact, isLoading } = useGetContactAdminQuery(id, { skip: !id });
  const [updateContact, updateState] = useUpdateContactAdminMutation();
  const [adminNote, setAdminNote] = React.useState('');

  React.useEffect(() => {
    setAdminNote(contact?.admin_note ?? '');
  }, [contact?.admin_note]);

  const updatePatch = async (patch: { status?: ContactStatus; is_resolved?: boolean; admin_note?: string | null }) => {
    if (!contact) return;
    try {
      await updateContact({ id: contact.id, patch }).unwrap();
      toast.success('İletişim mesajı güncellendi.');
    } catch {
      toast.error('İletişim mesajı güncellenemedi.');
    }
  };

  const handleStatus = (status: ContactStatus) => {
    updatePatch({
      status,
      is_resolved: status === 'closed' ? true : contact?.is_resolved,
    });
  };

  const handleSaveNote = () => {
    updatePatch({ admin_note: adminNote.trim() || null });
  };

  const handleToggleResolved = () => {
    if (!contact) return;
    const resolved = !(contact.is_resolved || contact.status === 'closed');
    updatePatch({
      is_resolved: resolved,
      status: resolved ? 'closed' : 'in_progress',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gm-gold" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-20 text-center font-serif italic text-muted-foreground opacity-50">
        İletişim mesajı bulunamadı.
      </div>
    );
  }

  const isClosed = contact.status === 'closed' || contact.is_resolved;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mt-1 rounded-full hover:bg-gm-gold/10"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Badge className={cn('rounded-full border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest', statusClass(contact.status))}>
                {statusLabel(contact.status)}
              </Badge>
              <span className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground opacity-50">
                ID: {contact.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="font-serif text-3xl leading-tight text-foreground">{contact.subject || 'Konu yok'}</h1>
          </div>
        </div>

        <div className="flex gap-3 md:ml-0">
          <Button
            variant="outline"
            onClick={handleToggleResolved}
            disabled={updateState.isLoading}
            className={cn(
              'h-11 rounded-full px-8 text-[10px] font-bold uppercase tracking-widest',
              isClosed ? 'border-gm-gold/30 text-gm-gold' : 'border-gm-success/30 text-gm-success',
            )}
          >
            {isClosed ? <RefreshCcw className="mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}
            {isClosed ? 'Yeniden Aç' : 'Kapat'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <Card className="overflow-hidden rounded-[32px] border-border/40 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/30 bg-muted/10 p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/50 bg-muted text-muted-foreground">
                  <User size={18} />
                </div>
                <div>
                  <div className="font-serif text-lg text-foreground">{contact.name || 'İsimsiz'}</div>
                  <div className="font-mono text-[10px] text-muted-foreground opacity-50">{formatDate(contact.created_at)}</div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-8 p-10">
              <div>
                <div className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
                  <MessageSquare className="size-4" />
                  Mesaj
                </div>
                <p className="whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-foreground/90">
                  {contact.message}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border-gm-gold/30 bg-card shadow-[0_20px_50px_rgba(201,169,97,0.05)]">
            <div className="flex items-center gap-3 border-b border-gm-gold/10 bg-gm-gold/5 p-6">
              <Save className="size-4 text-gm-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Admin Notu</span>
            </div>
            <CardContent className="p-8">
              <Textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Bu mesajla ilgili iç not ekleyin."
                className="min-h-[160px] border-none bg-transparent p-0 font-serif text-base italic leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0"
              />
            </CardContent>
            <div className="flex justify-end border-t border-border/30 bg-muted/10 p-6">
              <Button
                onClick={handleSaveNote}
                disabled={updateState.isLoading}
                className="h-11 rounded-full bg-gm-gold px-10 font-bold uppercase tracking-widest text-gm-bg hover:bg-gm-gold/90"
              >
                <Save className="mr-2 size-4" />
                Kaydet
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card className="space-y-8 overflow-hidden rounded-[32px] border-border/40 bg-card p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Mail size={14} />
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">E-posta</div>
                  <a href={`mailto:${contact.email}`} className="block max-w-[240px] truncate font-mono text-xs text-foreground hover:text-gm-gold">
                    {contact.email || '-'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Phone size={14} />
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Telefon</div>
                  <a href={contact.phone ? `tel:${contact.phone}` : undefined} className="font-mono text-xs text-foreground hover:text-gm-gold">
                    {contact.phone || '-'}
                  </a>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Durum</div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={contact.status === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatus(option.value)}
                      disabled={updateState.isLoading}
                      className="rounded-full px-4 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Calendar size={12} className="text-gm-gold" /> Oluşturma
                  </span>
                  <span className="font-mono text-xs">{formatDate(contact.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Clock size={12} className="text-gm-gold" /> Güncelleme
                  </span>
                  <span className="font-mono text-xs">{formatDate(contact.updated_at)}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3 rounded-[32px] border border-gm-gold/20 bg-gm-gold/5 p-8">
            <h4 className="font-serif text-lg italic text-gm-gold">Teknik Bilgi</h4>
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="flex gap-2">
                <Globe className="mt-0.5 size-4 shrink-0 text-gm-gold/70" />
                <span className="break-all">IP: {contact.ip || '-'}</span>
              </div>
              <div className="break-all">User-Agent: {contact.user_agent || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
