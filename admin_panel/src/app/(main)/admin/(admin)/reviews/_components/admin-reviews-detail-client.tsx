'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  XCircle,
  Save, 
  Trash2, 
  Loader2, 
  Star, 
  User, 
  MessageSquare, 
  ShieldCheck, 
  Calendar, 
  Type,
  Activity,
  History,
  Layout
} from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AdminLocaleSelect,
  type AdminLocaleOption,
} from '@/app/(main)/admin/_components/common/AdminLocaleSelect';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import type { AdminReviewCreatePayload } from '@/integrations/shared';
import {
  useGetReviewAdminQuery,
  useCreateReviewAdminMutation,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} from '@/integrations/hooks';

type FormData = {
  target_type: string;
  target_id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  title: string;
  role: string;
  company: string;
  avatar_url: string;
  logo_url: string;
  profile_href: string;
  admin_reply: string;
  is_active: boolean;
  is_approved: boolean;
  display_order: number;
  locale: string;
};

function getErrMsg(e: unknown, fallback: string): string {
  const anyErr = e as any;
  return anyErr?.data?.error?.message || anyErr?.data?.message || anyErr?.message || fallback;
}

function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const rating = Math.max(0, Math.min(5, Math.round(value || 0)));

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          disabled={disabled}
          className="transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={cn(
              'size-8 transition-all duration-300',
              i < rating ? 'fill-gm-gold text-gm-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-110' : 'text-gm-muted opacity-20',
            )}
          />
        </button>
      ))}
      <span className="ml-4 text-sm font-mono text-gm-gold font-bold tracking-widest bg-gm-gold/10 px-4 py-1.5 rounded-full border border-gm-gold/20 animate-in zoom-in duration-500">
        {rating} / 5
      </span>
    </div>
  );
}

export default function AdminReviewsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'new';
  const t = useAdminT('admin.reviews');

  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetReviewAdminQuery({ id }, { skip: isNew });

  const [createReview, { isLoading: isCreating }] = useCreateReviewAdminMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewAdminMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewAdminMutation();

  const initialLocale = React.useMemo(() => {
    return (
      defaultLocaleFromDb ||
      localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'tr') ||
      'tr'
    );
  }, [defaultLocaleFromDb]);

  const [formData, setFormData] = React.useState<FormData>({
    target_type: 'testimonial',
    target_id: '11111111-1111-1111-1111-111111111111',
    name: '',
    email: '',
    rating: 5,
    comment: '',
    title: '',
    role: '',
    company: '',
    avatar_url: '',
    logo_url: '',
    profile_href: '',
    admin_reply: '',
    is_active: true,
    is_approved: true,
    display_order: 0,
    locale: initialLocale,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isNew && existingItem) {
      setFormData({
        target_type: existingItem.target_type || 'testimonial',
        target_id: existingItem.target_id || '11111111-1111-1111-1111-111111111111',
        name: existingItem.name || '',
        email: existingItem.email || '',
        rating: existingItem.rating || 5,
        comment: existingItem.comment || '',
        title: (existingItem as any).title || '',
        role: (existingItem as any).role || '',
        company: (existingItem as any).company || '',
        avatar_url: (existingItem as any).avatar_url || '',
        logo_url: (existingItem as any).logo_url || '',
        profile_href: (existingItem as any).profile_href || '',
        admin_reply: (existingItem as any).admin_reply || '',
        is_active: existingItem.is_active,
        is_approved: existingItem.is_approved,
        display_order: existingItem.display_order || 0,
        locale: existingItem.locale_resolved || existingItem.submitted_locale || initialLocale,
      });
    }
  }, [existingItem, isNew, initialLocale]);

  React.useEffect(() => {
    if (isNew && defaultLocaleFromDb && !formData.locale) {
      setFormData((prev) => ({ ...prev, locale: defaultLocaleFromDb }));
    }
  }, [isNew, defaultLocaleFromDb, formData.locale]);

  const busy = isCreating || isUpdating || isDeleting || loadingItem;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) { toast.error(t('messages.error')); return; }
    if (!formData.comment.trim()) { toast.error(t('messages.error')); return; }

    const apiLocale = formData.locale || resolveAdminApiLocale(localeOptions, defaultLocaleFromDb, 'tr');

    try {
      if (isNew) {
        const payload: AdminReviewCreatePayload = {
          target_type: formData.target_type.trim(),
          target_id: formData.target_id.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          rating: formData.rating,
          comment: formData.comment.trim(),
          title: formData.title.trim() || undefined,
          role: formData.role.trim() || undefined,
          company: formData.company.trim() || undefined,
          avatar_url: formData.avatar_url.trim() || undefined,
          logo_url: formData.logo_url.trim() || undefined,
          profile_href: formData.profile_href.trim() || undefined,
          is_active: formData.is_active,
          is_approved: formData.is_approved,
          display_order: formData.display_order,
          locale: apiLocale,
        };

        await createReview(payload).unwrap();
        toast.success(t('messages.created'));
        router.push('/admin/reviews');
      } else {
        await updateReview({
          id,
          patch: {
            target_type: formData.target_type.trim(),
            target_id: formData.target_id.trim(),
            name: formData.name.trim(),
            email: formData.email.trim(),
            rating: formData.rating,
            comment: formData.comment.trim(),
            title: formData.title.trim() || undefined,
            role: formData.role.trim() || undefined,
            company: formData.company.trim() || undefined,
            avatar_url: formData.avatar_url.trim() || undefined,
            logo_url: formData.logo_url.trim() || undefined,
            profile_href: formData.profile_href.trim() || undefined,
            admin_reply: formData.admin_reply.trim() || undefined,
            is_active: formData.is_active,
            is_approved: formData.is_approved,
            display_order: formData.display_order,
            locale: apiLocale,
          },
        }).unwrap();
        toast.success(t('messages.updated'));
      }
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.genericError')));
    }
  };

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleDeleteConfirm = async () => {
    if (isNew) return;
    try {
      await deleteReview({ id }).unwrap();
      toast.success(t('messages.deleted'));
      router.push('/admin/reviews');
    } catch (err) {
      toast.error(getErrMsg(err, t('messages.genericError')));
    }
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFormData((prev) => ({ ...prev, locale: coerced }));
  };

  if (loadError) {
    return (
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="py-24 text-center">
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="size-20 rounded-full bg-gm-error/10 flex items-center justify-center text-gm-error border border-gm-error/20 shadow-inner">
              <Activity size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-gm-text">{t('messages.error')}</h2>
              <p className="text-gm-muted font-serif italic text-lg">{getErrMsg(loadError, "Veri yüklenemedi")}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/reviews')} className="rounded-full px-10 h-12 border-gm-border-soft hover:bg-gm-surface font-bold tracking-widest uppercase text-[10px]">
              <ArrowLeft className="mr-2 size-4" /> {t('actions.backToList')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingItem && !isNew) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <Skeleton className="h-24 w-full rounded-[24px] bg-gm-surface/20" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[600px] rounded-[32px] bg-gm-surface/20" />
          <Skeleton className="h-[600px] rounded-[32px] bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
              >
                <Link href="/admin/reviews">
                  <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
              <span className="w-8 h-px bg-gm-gold" />
              <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
                {t('header.badge')}
              </span>
            </div>
            <h1 className="font-serif text-4xl text-gm-text">
              {isNew ? t('form.createTitle') : t('form.editTitle')}
            </h1>
            <p className="text-gm-muted text-sm font-serif italic opacity-70">
              {isNew ? t('form.createDescription') : t('form.editDescription')}
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/reviews')}
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
              {t('admin.common.save', null, 'Kaydet')}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Info */}
            <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
                <CardTitle className="font-serif text-2xl flex items-center gap-3 text-gm-text">
                  <User className="size-6 text-gm-gold" /> {t('form.userInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.userName')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ad Soyad"
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.email')}</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                      disabled={busy}
                    />
                  </div>
                </div>

                <Separator className="bg-gm-border-soft" />

                <div className="space-y-6 pt-2">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.rating')}</Label>
                  <RatingInput
                    value={formData.rating}
                    onChange={(val) => setFormData(p => ({ ...p, rating: val }))}
                    disabled={busy}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Comment Section */}
            <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
                <CardTitle className="font-serif text-2xl flex items-center gap-3 text-gm-text">
                  <MessageSquare className="size-6 text-gm-gold" /> {t('form.commentContent')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.commentTitle')}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Kısa bir özet..."
                    className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
                    disabled={busy}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.commentText')}</Label>
                  <Textarea
                    value={formData.comment}
                    onChange={(e) => setFormData(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Danışan neler yazdı?"
                    className="bg-gm-surface/40 border-gm-border-soft rounded-3xl min-h-[200px] p-6 focus:ring-gm-gold/50 font-serif italic text-xl leading-relaxed text-gm-text/90 shadow-inner"
                    disabled={busy}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Reply */}
            {!isNew && (
              <Card className="bg-gm-bg-deep/30 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl border-l-4 border-l-gm-gold">
                <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
                  <CardTitle className="font-serif text-2xl flex items-center gap-3 text-gm-text">
                    <ShieldCheck className="size-6 text-gm-gold" /> {t('form.adminReply')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <Textarea
                    value={formData.admin_reply}
                    onChange={(e) => setFormData(p => ({ ...p, admin_reply: e.target.value }))}
                    placeholder="Danışana yanıt verin..."
                    className="bg-gm-surface/40 border-gm-border-soft rounded-3xl min-h-[140px] p-6 focus:ring-gm-gold/50 font-serif italic text-lg text-gm-text/80 shadow-inner"
                    disabled={busy}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Settings (Right) */}
          <div className="space-y-8">
            <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl sticky top-24">
              <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
                <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
                  <Layout className="size-5 text-gm-gold" /> {t('form.settings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                {/* Status Toggles */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold tracking-widest uppercase text-gm-text">{t('form.activeStatus')}</Label>
                      <p className="text-[10px] text-gm-muted uppercase tracking-[0.15em] font-bold opacity-60">{t('form.activeStatusDesc')}</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                      className="data-[state=checked]:bg-gm-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold tracking-widest uppercase text-gm-text">{t('form.approvedStatus')}</Label>
                      <p className="text-[10px] text-gm-muted uppercase tracking-[0.15em] font-bold opacity-60">{t('form.approvedStatusDesc')}</p>
                    </div>
                    <Switch
                      checked={formData.is_approved}
                      onCheckedChange={(v) => setFormData(p => ({ ...p, is_approved: v }))}
                      className="data-[state=checked]:bg-gm-success"
                    />
                  </div>
                </div>

                <Separator className="bg-gm-border-soft" />

                {/* Meta Fields */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.localeLabel')}</Label>
                    <AdminLocaleSelect
                      value={formData.locale}
                      onChange={handleLocaleChange}
                      options={safeLocaleOptions}
                      loading={localesLoading}
                      disabled={busy}
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-sm focus:ring-gm-gold/50 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">{t('form.displayOrder')}</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(p => ({ ...p, display_order: Number(e.target.value) }))}
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 text-center font-mono focus:ring-gm-gold/50"
                      disabled={busy}
                    />
                  </div>
                </div>

                <Separator className="bg-gm-border-soft" />

                {/* Target Meta */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 flex items-center gap-2">
                      <Type size={12} className="text-gm-gold opacity-50" /> {t('form.targetType')}
                    </Label>
                    <Input
                      value={formData.target_type}
                      onChange={(e) => setFormData(p => ({ ...p, target_type: e.target.value }))}
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-10 text-[10px] font-mono tracking-widest uppercase px-4"
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 flex items-center gap-2">
                      <Calendar size={12} className="text-gm-gold opacity-50" /> {t('form.targetId')}
                    </Label>
                    <Input
                      value={formData.target_id}
                      onChange={(e) => setFormData(p => ({ ...p, target_id: e.target.value }))}
                      className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-10 text-[10px] font-mono tracking-tighter px-4 truncate"
                      disabled={busy}
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                {!isNew && (
                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDeleteClick}
                      disabled={busy}
                      className="w-full rounded-2xl h-12 text-gm-error hover:bg-gm-error/10 hover:text-gm-error transition-all font-bold tracking-widest uppercase text-[10px] border border-gm-error/20"
                    >
                      {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                      {t('form.deleteRecord')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Log Card */}
            {!isNew && (
              <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
                  <CardTitle className="font-serif text-xl flex items-center gap-3 text-gm-text opacity-70">
                    <History className="size-5 text-gm-gold" /> {t('admin.common.history', null, 'Geçmiş')}
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
            )}
          </div>
        </div>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gm-bg-deep border-gm-border-soft rounded-[40px] p-12 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-3xl text-gm-text">{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription className="font-serif italic text-lg pt-6 text-gm-muted leading-relaxed">
              {t('dialogs.delete.description', { name: formData.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-6 mt-12">
            <AlertDialogCancel className="rounded-full px-12 h-14 border-gm-border-soft text-[10px] font-bold tracking-widest uppercase hover:bg-gm-surface transition-all">
              {t('dialogs.delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-gm-error text-white hover:bg-gm-error/90 rounded-full px-14 h-14 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-error/20 transition-all active:scale-95"
            >
              {t('dialogs.delete.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
