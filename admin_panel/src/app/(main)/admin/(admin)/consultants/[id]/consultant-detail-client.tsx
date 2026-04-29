'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Check, 
  X, 
  ShieldCheck, 
  Star, 
  Mail, 
  Globe, 
  BookOpen, 
  Activity, 
  Clock, 
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useApproveConsultantAdminMutation,
  useGetConsultantAdminQuery,
  useRejectConsultantAdminMutation,
} from '@/integrations/hooks';

export default function ConsultantDetailClient({ id }: { id: string }) {
  const t = useAdminT('admin.consultants');
  const query = useGetConsultantAdminQuery(id);
  const [approve, approveState] = useApproveConsultantAdminMutation();
  const [reject, rejectState] = useRejectConsultantAdminMutation();
  const item = query.data;

  async function approveCurrent() {
    try {
      await approve(id).unwrap();
      toast.success(t('actions.approve_success'));
      query.refetch();
    } catch {
      toast.error(t('actions.approve_failed'));
    }
  }

  async function rejectCurrent() {
    const reason = window.prompt(t('actions.rejection_reason_prompt'));
    if (!reason?.trim()) return;
    try {
      await reject({ id, rejection_reason: reason.trim() }).unwrap();
      toast.success(t('actions.reject_success'));
      query.refetch();
    } catch {
      toast.error(t('actions.reject_failed'));
    }
  }

  if (query.isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <Skeleton className="h-20 w-full rounded-[24px] bg-gm-surface/20" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[500px] rounded-[32px] bg-gm-surface/20" />
          <Skeleton className="h-[500px] rounded-[32px] bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  if (query.isError || !item) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" asChild className="rounded-full hover:bg-gm-surface transition-all">
          <Link href="/admin/consultants">
            <ArrowLeft className="mr-2 size-4" />
            {t('header.title')}
          </Link>
        </Button>
        <Card className="bg-gm-error/5 border-gm-error/20 rounded-[32px] p-12 text-center">
          <AlertCircle className="size-12 text-gm-error mx-auto mb-4 opacity-50" />
          <h2 className="font-serif text-2xl text-gm-error mb-2">{t('table.empty')}</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
            >
              <Link href="/admin/consultants">
                <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </Button>
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('detail.title')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-4xl text-gm-text">
              {item.full_name}
            </h1>
            <Badge className={cn(
              "rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase border",
              item.approval_status === 'approved' ? "bg-gm-success/10 text-gm-success border-gm-success/20" : 
              item.approval_status === 'rejected' ? "bg-gm-error/10 text-gm-error border-gm-error/20" :
              "bg-gm-gold/10 text-gm-gold border-gm-gold/20"
            )}>
              {t(`status.${item.approval_status || 'pending'}`)}
            </Badge>
          </div>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {item.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={rejectCurrent}
            disabled={rejectState.isLoading || item.approval_status === 'rejected'}
            className="rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white px-8 h-12 font-bold tracking-widest uppercase text-[10px] transition-all"
          >
            <X className="mr-2 size-4" />
            {t('actions.reject')}
          </Button>
          <Button 
            onClick={approveCurrent} 
            disabled={approveState.isLoading || item.approval_status === 'approved'}
            className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim px-10 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            <Check className="mr-2 size-4" />
            {approveState.isLoading ? t('admin.common.saving') : t('actions.approve')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Profile Card */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gm-gold" /> {t('detail.profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.bio')}</Label>
                <div className="p-6 bg-gm-surface/40 rounded-2xl border border-gm-border-soft font-serif text-lg leading-relaxed italic text-gm-text/80">
                  {item.bio || '-'}
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.expertise')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {item.expertise?.map(e => (
                      <Badge key={e} variant="outline" className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-gm-surface/40 border-gm-border-soft text-gm-gold uppercase tracking-widest">
                        {t(`expertise.${e}`, null, e)}
                      </Badge>
                    ))}
                    {!item.expertise?.length && <span className="text-sm text-gm-muted italic">-</span>}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.languages')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {item.languages?.map(l => (
                      <Badge key={l} variant="outline" className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-gm-surface/40 border-gm-border-soft text-gm-muted uppercase tracking-widest">
                        <Globe className="size-3 mr-2 opacity-50" />
                        {t(`languages.${l}`, null, l)}
                      </Badge>
                    ))}
                    {!item.languages?.length && <span className="text-sm text-gm-muted italic">-</span>}
                  </div>
                </div>
              </div>

              <Separator className="bg-gm-border-soft" />

              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.session')}</Label>
                  <div className="flex items-center gap-3 font-serif text-xl text-gm-text">
                    <Clock className="size-4 text-gm-gold opacity-60" />
                    {t('detail.pricePerSession', {
                      price: item.session_price ?? '',
                      currency: item.currency ?? '',
                      duration: item.session_duration ?? '',
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason if any */}
          {item.approval_status === 'rejected' && item.rejection_reason && (
            <Card className="bg-gm-error/5 border-gm-error/20 rounded-[32px] overflow-hidden backdrop-blur-sm">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="font-serif text-xl flex items-center gap-3 text-gm-error">
                  <AlertCircle className="h-5 w-5" /> {t('detail.rejectionReason')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="font-serif italic text-gm-error/70">{item.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          {/* Stats Card */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <Activity className="h-5 w-5 text-gm-gold" /> {t('detail.stats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('detail.totalSessions')}</p>
                  <p className="font-serif text-3xl text-gm-text font-bold">{item.total_sessions || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gm-primary/10 flex items-center justify-center text-gm-primary">
                  <BookOpen size={20} />
                </div>
              </div>

              <Separator className="bg-gm-border-soft" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('detail.rating')}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-3xl text-gm-gold font-bold">{Number(item.rating_avg || 0).toFixed(1)}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={cn(
                            i < Math.round(Number(item.rating_avg || 0)) ? "fill-gm-gold text-gm-gold" : "text-gm-muted/30"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gm-muted italic">({item.rating_count || 0} reviews)</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gm-gold/10 flex items-center justify-center text-gm-gold">
                  <Star size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings / Quick Actions */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <History className="h-5 w-5 text-gm-gold" /> {t('admin.common.history', null, 'Geçmiş')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gm-border-soft">
                <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('admin.common.createdAt', null, 'Kayıt')}</span>
                <span className="font-mono text-[11px] text-gm-muted opacity-70">24.04.2024</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('admin.common.updatedAt', null, 'Güncelleme')}</span>
                <span className="font-mono text-[11px] text-gm-muted opacity-70">Aralık 2024</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
