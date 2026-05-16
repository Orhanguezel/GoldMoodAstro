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
  AlertCircle,
  Mic,
  Plus,
  Save,
  Trash2,
  Video
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
  useCreateConsultantServiceAdminMutation,
  useDeleteConsultantServiceAdminMutation,
  useGetConsultantAdminQuery,
  useListConsultantServicesAdminQuery,
  useRejectConsultantAdminMutation,
  useUpdateConsultantServiceAdminMutation,
} from '@/integrations/hooks';

type ServiceForm = {
  name: string;
  slug: string;
  duration_minutes: number;
  price: number;
  media_type: 'audio' | 'video';
  is_free: boolean;
  is_active: boolean;
};

const EMPTY_SERVICE_FORM: ServiceForm = {
  name: '',
  slug: '',
  duration_minutes: 45,
  price: 0,
  media_type: 'audio',
  is_free: false,
  is_active: true,
};

const MEDIA_SUFFIX: Record<ServiceForm['media_type'], string> = {
  audio: 'sesli',
  video: 'goruntulu',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ığüşöç]/g, (c) => ({ ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mediaSlug(base: string, media: ServiceForm['media_type']): string {
  const cleaned = slugify(base).replace(/-(sesli|goruntulu)$/i, '');
  return `${cleaned}-${MEDIA_SUFFIX[media]}`;
}

export default function ConsultantDetailClient({ id }: { id: string }) {
  const t = useAdminT('admin.consultants');
  const query = useGetConsultantAdminQuery(id);
  const servicesQuery = useListConsultantServicesAdminQuery(id);
  const [approve, approveState] = useApproveConsultantAdminMutation();
  const [reject, rejectState] = useRejectConsultantAdminMutation();
  const [createService, createServiceState] = useCreateConsultantServiceAdminMutation();
  const [updateService, updateServiceState] = useUpdateConsultantServiceAdminMutation();
  const [deleteService, deleteServiceState] = useDeleteConsultantServiceAdminMutation();
  const [serviceForm, setServiceForm] = React.useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const item = query.data;
  const services = servicesQuery.data ?? [];

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

  async function createServiceCurrent() {
    const name = serviceForm.name.trim();
    if (!name) {
      toast.error('Hizmet adı zorunlu');
      return;
    }
    if (!serviceForm.is_free && serviceForm.price <= 0) {
      toast.error('Ücretli hizmette fiyat 0’dan büyük olmalı');
      return;
    }
    try {
      await createService({
        consultantId: id,
        body: {
          name,
          slug: mediaSlug(serviceForm.slug || name, serviceForm.media_type),
          duration_minutes: serviceForm.duration_minutes,
          price: serviceForm.is_free ? 0 : serviceForm.price,
          currency: item?.currency ?? 'TRY',
          media_type: serviceForm.media_type,
          is_free: serviceForm.is_free ? 1 : 0,
          is_active: serviceForm.is_active ? 1 : 0,
          sort_order: services.length,
        },
      }).unwrap();
      toast.success('Hizmet eklendi');
      setServiceForm(EMPTY_SERVICE_FORM);
    } catch {
      toast.error('Hizmet eklenemedi');
    }
  }

  async function updateServiceCurrent(serviceId: string, body: { media_type?: 'audio' | 'video'; is_active?: number }) {
    try {
      await updateService({ consultantId: id, id: serviceId, body }).unwrap();
      toast.success('Hizmet güncellendi');
    } catch {
      toast.error('Hizmet güncellenemedi');
    }
  }

  async function deleteServiceCurrent(serviceId: string) {
    if (!window.confirm('Hizmet silinsin mi?')) return;
    try {
      await deleteService({ consultantId: id, id: serviceId }).unwrap();
      toast.success('Hizmet silindi');
    } catch {
      toast.error('Hizmet silinemedi');
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

          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gm-gold" /> Hizmet Paketleri
              </CardTitle>
              <CardDescription>Danışmanın sesli/görüntülü hizmet paketlerini yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr]">
                <input
                  value={serviceForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setServiceForm((prev) => ({ ...prev, name, slug: prev.slug || mediaSlug(name, prev.media_type) }));
                  }}
                  placeholder="Hizmet adı"
                  className="h-11 rounded-xl border border-gm-border-soft bg-gm-bg-deep px-4 text-sm text-gm-text"
                />
                <input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, duration_minutes: Number(e.target.value) || 45 }))}
                  placeholder="Süre"
                  className="h-11 rounded-xl border border-gm-border-soft bg-gm-bg-deep px-4 text-sm text-gm-text"
                />
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  disabled={serviceForm.is_free}
                  placeholder="Fiyat"
                  className="h-11 rounded-xl border border-gm-border-soft bg-gm-bg-deep px-4 text-sm text-gm-text disabled:opacity-50"
                />
                <select
                  value={serviceForm.media_type}
                  onChange={(e) => {
                    const media_type = e.target.value as ServiceForm['media_type'];
                    setServiceForm((prev) => ({ ...prev, media_type, slug: mediaSlug(prev.slug || prev.name, media_type) }));
                  }}
                  className="h-11 rounded-xl border border-gm-border-soft bg-gm-bg-deep px-4 text-sm text-gm-text"
                >
                  <option value="audio">Sesli</option>
                  <option value="video">Görüntülü</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-5">
                  <label className="inline-flex items-center gap-2 text-sm text-gm-muted">
                    <input
                      type="checkbox"
                      checked={serviceForm.is_free}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, is_free: e.target.checked, price: e.target.checked ? 0 : prev.price }))}
                      className="accent-gm-success"
                    />
                    Ücretsiz
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gm-muted">
                    <input
                      type="checkbox"
                      checked={serviceForm.is_active}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="accent-gm-gold"
                    />
                    Aktif
                  </label>
                </div>
                <Button
                  onClick={createServiceCurrent}
                  disabled={createServiceState.isLoading}
                  className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim px-6 h-11 font-bold tracking-widest uppercase text-[10px]"
                >
                  <Plus className="mr-2 size-4" />
                  Hizmet Ekle
                </Button>
              </div>

              <Separator className="bg-gm-border-soft" />

              {servicesQuery.isLoading ? (
                <Skeleton className="h-24 w-full rounded-2xl bg-gm-surface/20" />
              ) : services.length === 0 ? (
                <p className="text-sm text-gm-muted italic">Henüz hizmet paketi yok.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-serif text-lg text-gm-text">{service.name}</p>
                          <Badge variant="outline" className="rounded-full border-gm-border-soft text-[10px] uppercase tracking-widest">
                            {service.media_type === 'video' ? <Video className="mr-1 size-3" /> : <Mic className="mr-1 size-3" />}
                            {service.media_type === 'video' ? 'Görüntülü' : 'Sesli'}
                          </Badge>
                          {service.is_free === 1 && <Badge className="rounded-full bg-gm-success/10 text-gm-success">Ücretsiz</Badge>}
                          {service.is_active !== 1 && <Badge className="rounded-full bg-gm-muted/10 text-gm-muted">Pasif</Badge>}
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-gm-muted">
                          {service.slug} · {service.duration_minutes} dk · {service.is_free === 1 ? 'Ücretsiz' : `${service.price} ${service.currency}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={service.media_type}
                          onChange={(e) => updateServiceCurrent(service.id, { media_type: e.target.value as 'audio' | 'video' })}
                          disabled={updateServiceState.isLoading}
                          className="h-10 rounded-xl border border-gm-border-soft bg-gm-bg-deep px-3 text-xs text-gm-text"
                        >
                          <option value="audio">Sesli</option>
                          <option value="video">Görüntülü</option>
                        </select>
                        <Button
                          variant="outline"
                          onClick={() => updateServiceCurrent(service.id, { is_active: service.is_active === 1 ? 0 : 1 })}
                          disabled={updateServiceState.isLoading}
                          className="h-10 rounded-full border-gm-border-soft text-[10px] uppercase tracking-widest"
                        >
                          <Save className="mr-2 size-3" />
                          {service.is_active === 1 ? 'Pasifleştir' : 'Aktifleştir'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => deleteServiceCurrent(service.id)}
                          disabled={deleteServiceState.isLoading}
                          className="h-10 rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
