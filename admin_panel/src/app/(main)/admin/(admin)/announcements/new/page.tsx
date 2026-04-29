'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  Megaphone, 
  Users, 
  User, 
  Star, 
  Calendar, 
  Loader2,
  XCircle,
  Layout,
  History
} from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  useCreateAnnouncementAdminMutation, 
  useGetAnnouncementAdminQuery, 
  useUpdateAnnouncementAdminMutation 
} from '@/integrations/hooks';

export default function AnnouncementFormPage() {
  const t = useAdminT('admin.announcements');
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching, error: loadError } = useGetAnnouncementAdminQuery(id, { skip: !isEdit });
  const [create, { isLoading: isCreating }] = useCreateAnnouncementAdminMutation();
  const [update, { isLoading: isUpdating }] = useUpdateAnnouncementAdminMutation();

  const [formData, setFormData] = React.useState({
    title: '',
    body: '',
    audience: 'all' as 'all' | 'users' | 'consultants',
    is_active: true,
    starts_at: '',
    ends_at: '',
  });

  React.useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        body: existing.body,
        audience: existing.audience,
        is_active: existing.is_active,
        starts_at: existing.starts_at ? existing.starts_at.slice(0, 10) : '',
        ends_at: existing.ends_at ? existing.ends_at.slice(0, 10) : '',
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error(t('messages.error'));
      return;
    }

    try {
      if (isEdit) {
        await update({ id, patch: formData }).unwrap();
        toast.success(t('messages.statusUpdated'));
      } else {
        await create(formData).unwrap();
        toast.success(t('messages.statusUpdated'));
      }
      router.push('/admin/announcements');
    } catch {
      toast.error(t('messages.error'));
    }
  };

  const busy = isCreating || isUpdating || isFetching;

  if (loadError) {
    return (
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="py-24 text-center">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="size-20 rounded-full bg-gm-error/10 flex items-center justify-center text-gm-error border border-gm-error/20 shadow-inner">
              <Megaphone size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-gm-text">{t('messages.error')}</h2>
              <p className="text-gm-muted font-serif italic text-lg">Duyuru verisi yüklenemedi.</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/announcements')} className="rounded-full px-10 h-12 border-gm-border-soft hover:bg-gm-surface font-bold tracking-widest uppercase text-[10px]">
              <ArrowLeft className="mr-2 size-4" /> {t('admin.common.back', null, 'Geri')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFetching && isEdit) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <Skeleton className="h-24 w-full rounded-[24px] bg-gm-surface/20" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[500px] rounded-[32px] bg-gm-surface/20" />
          <Skeleton className="h-[500px] rounded-[32px] bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/admin/announcements')}
              className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">
            {isEdit ? t('form.editTitle') : t('form.createTitle')}
          </h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('form.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/announcements')}
            disabled={busy}
            className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all text-[10px] font-bold tracking-widest uppercase"
          >
            <XCircle className="mr-2 size-4" /> {t('admin.common.cancel', null, 'İptal')}
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="bg-gm-gold text-gm-bg hover:bg-gm-gold-dim rounded-full px-12 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {isEdit ? t('form.updateAction') : t('form.createAction')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
              <CardTitle className="font-serif text-2xl flex items-center gap-3 text-gm-text">
                <Megaphone className="size-6 text-gm-gold" /> {t('form.details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.title')}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder={t('form.titlePlaceholder')}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                  disabled={busy}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.messageBody')}</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData(p => ({ ...p, body: e.target.value }))}
                  placeholder={t('form.messagePlaceholder')}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-3xl min-h-[240px] p-6 focus:ring-gm-gold/50 font-serif italic text-xl leading-relaxed text-gm-text/90 shadow-inner"
                  disabled={busy}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings (Right) */}
        <div className="space-y-8">
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl sticky top-24">
            <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
              <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
                <Layout className="size-5 text-gm-gold" /> {t('admin.common.settings', null, 'Ayarlar')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Audience & Active Toggles */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.targetAudience')}</Label>
                  <Select 
                    value={formData.audience} 
                    onValueChange={(v) => setFormData(p => ({ ...p, audience: v as any }))}
                    disabled={busy}
                  >
                    <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl shadow-2xl">
                      <SelectItem value="all" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                        <div className="flex items-center gap-2">
                          <Users className="size-4" /> {t('audience.all')}
                        </div>
                      </SelectItem>
                      <SelectItem value="users" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                        <div className="flex items-center gap-2">
                          <User className="size-4" /> {t('audience.users')}
                        </div>
                      </SelectItem>
                      <SelectItem value="consultants" className="rounded-xl focus:bg-gm-gold/10 focus:text-gm-gold">
                        <div className="flex items-center gap-2">
                          <Star className="size-4" /> {t('audience.consultants')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold tracking-widest uppercase text-gm-text">{t('form.active')}</Label>
                    <p className="text-[10px] text-gm-muted uppercase tracking-[0.15em] font-bold opacity-60">Sistem üzerinde göster</p>
                  </div>
                  <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                    className="data-[state=checked]:bg-gm-gold"
                    disabled={busy}
                  />
                </div>
              </div>

              <Separator className="bg-gm-border-soft" />

              {/* Date Ranges */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.startsAt')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-gold opacity-50" />
                    <Input 
                      type="date" 
                      value={formData.starts_at} 
                      onChange={(e) => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.endsAt')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-error opacity-50" />
                    <Input 
                      type="date" 
                      value={formData.ends_at} 
                      onChange={(e) => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                      disabled={busy}
                    />
                  </div>
                </div>
              </div>

              {/* Audit/History Placeholder */}
              {isEdit && (
                <>
                  <Separator className="bg-gm-border-soft" />
                  <div className="pt-2">
                    <div className="flex items-center gap-3 text-gm-muted opacity-40 mb-4">
                      <History className="size-4" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">{t('admin.common.history', null, 'Geçmiş')}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-gm-muted/60">
                        <span>Oluşturulma</span>
                        <span className="font-mono">24.04.2024</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gm-muted/60">
                        <span>Son Güncelleme</span>
                        <span className="font-mono">Bugün</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
