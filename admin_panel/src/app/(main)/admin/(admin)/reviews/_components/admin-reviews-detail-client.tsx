'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/reviews/[id]/admin-reviews-detail-client.tsx
// FINAL — Admin Review Create/Edit Form (App Router + shadcn)
// ✅ FULLY FIXED - All type safety issues resolved
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Loader2, Star } from 'lucide-react';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { resolveAdminApiLocale } from '@/i18n/adminLocale';
import { localeShortClientOr } from '@/i18n/localeShortClient';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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

import type { AdminReviewCreatePayload } from '@/integrations/shared';
import {
  useGetReviewAdminQuery,
  useCreateReviewAdminMutation,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} from '@/integrations/hooks';

type FormData = {
  // Required
  target_type: string;
  target_id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;

  // Optional
  title: string;
  role: string;
  company: string;
  avatar_url: string;
  logo_url: string;
  profile_href: string;
  admin_reply: string;

  // Metadata
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
          className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={cn(
              'size-6',
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  );
}

export default function AdminReviewsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'new';
  const t = useAdminT('admin.reviews');

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  // ✅ FIX: Ensure localeOptions has correct type
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetReviewAdminQuery({ id }, { skip: isNew });

  const [createReview, { isLoading: isCreating }] = useCreateReviewAdminMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewAdminMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewAdminMutation();

  // ✅ FIX: Initial locale with proper fallback
  const initialLocale = React.useMemo(() => {
    return (
      defaultLocaleFromDb ||
      localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de') ||
      'de'
    );
  }, [defaultLocaleFromDb]);

  // Form state
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
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

  // Update default locale if needed
  React.useEffect(() => {
    if (isNew && defaultLocaleFromDb && !formData.locale) {
      setFormData((prev) => ({ ...prev, locale: defaultLocaleFromDb }));
    }
  }, [isNew, defaultLocaleFromDb, formData.locale]);

  const busy = isCreating || isUpdating || isDeleting || loadingItem;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.target_type.trim()) {
      toast.error(t('form.validation.targetTypeRequired'));
      return;
    }

    if (!formData.target_id.trim()) {
      toast.error(t('form.validation.targetIdRequired'));
      return;
    }

    if (!formData.name.trim()) {
      toast.error(t('form.validation.nameRequired'));
      return;
    }

    if (!formData.email.trim()) {
      toast.error(t('form.validation.emailRequired'));
      return;
    }

    if (!formData.comment.trim()) {
      toast.error(t('form.validation.commentRequired'));
      return;
    }

    if (formData.rating < 0 || formData.rating > 5) {
      toast.error(t('form.validation.ratingRange'));
      return;
    }

    // ✅ FIXED: Correct usage of resolveAdminApiLocale
    const apiLocale =
      formData.locale || resolveAdminApiLocale(localeOptions, defaultLocaleFromDb, 'de');

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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

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
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              {t('messages.loadError')}: {getErrMsg(loadError, t('messages.genericError'))}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/reviews')}
              className="mt-4 gap-2"
            >
              <ArrowLeft className="size-4" />
              {t('actions.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && loadingItem) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>{t('admin.common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle>{isNew ? t('form.titles.create') : t('form.titles.edit')}</CardTitle>
                <CardDescription>
                  {isNew ? t('form.descriptions.create') : t('form.descriptions.edit')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/reviews')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('admin.common.back')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Section 1: Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.meta')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {/* Locale - ✅ FIXED: Using safeLocaleOptions */}
              <div>
                <AdminLocaleSelect
                  value={formData.locale}
                  onChange={handleLocaleChange}
                  options={safeLocaleOptions}
                  loading={localesLoading}
                  disabled={busy}
                  label={t('form.fields.locale')}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-sm">
                  {t('form.fields.displayOrder')}
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={busy}
                  min={0}
                />
              </div>

              {/* Approved */}
              <div className="space-y-2">
                <Label htmlFor="is_approved" className="text-sm">
                  {t('form.fields.approved')}
                </Label>
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="is_approved"
                    checked={formData.is_approved}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_approved: checked }))
                    }
                    disabled={busy}
                  />
                  <Label htmlFor="is_approved" className="cursor-pointer text-sm">
                    {formData.is_approved ? (
                      <Badge variant="default">{t('labels.approved')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('labels.unapproved')}</Badge>
                    )}
                  </Label>
                </div>
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm">
                  {t('form.fields.active')}
                </Label>
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                    disabled={busy}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer text-sm">
                    {formData.is_active ? (
                      <Badge variant="default">{t('labels.active')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('labels.inactive')}</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.customer')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Target Type */}
              <div className="space-y-2">
                <Label htmlFor="target_type" className="text-sm">
                  {t('form.fields.targetType')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target_type"
                  value={formData.target_type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, target_type: e.target.value }))
                  }
                  placeholder={t('form.placeholders.targetType')}
                  disabled={busy}
                  required
                />
              </div>

              {/* Target ID */}
              <div className="space-y-2">
                <Label htmlFor="target_id" className="text-sm">
                  {t('form.fields.targetId')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target_id"
                  value={formData.target_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, target_id: e.target.value }))}
                  placeholder={t('form.placeholders.targetId')}
                  disabled={busy}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  {t('form.fields.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('form.placeholders.name')}
                  disabled={busy}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  {t('form.fields.email')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t('form.placeholders.email')}
                  disabled={busy}
                  required
                />
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label htmlFor="rating" className="text-sm">
                {t('form.fields.rating')} <span className="text-destructive">*</span>
              </Label>
              <RatingInput
                value={formData.rating}
                onChange={(value) => setFormData((prev) => ({ ...prev, rating: value }))}
                disabled={busy}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Review Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.content')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                {t('form.fields.title')}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('form.placeholders.title')}
                disabled={busy}
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm">
                {t('form.fields.comment')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder={t('form.placeholders.comment')}
                disabled={busy}
                rows={5}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Testimonial Extras */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('form.sections.extras')}</CardTitle>
            <CardDescription>{t('form.sections.extrasDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm">
                  {t('form.fields.role')}
                </Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder={t('form.placeholders.role')}
                  disabled={busy}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm">
                  {t('form.fields.company')}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder={t('form.placeholders.company')}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="text-sm">
                  {t('form.fields.avatarUrl')}
                </Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="/assets/imgs/avatar.png"
                  disabled={busy}
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo_url" className="text-sm">
                  {t('form.fields.logoUrl')}
                </Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="/assets/imgs/logo.png"
                  disabled={busy}
                />
              </div>
            </div>

            {/* Profile Href */}
            <div className="space-y-2">
              <Label htmlFor="profile_href" className="text-sm">
                {t('form.fields.profileHref')}
              </Label>
              <Input
                id="profile_href"
                value={formData.profile_href}
                onChange={(e) => setFormData((prev) => ({ ...prev, profile_href: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                disabled={busy}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Admin Reply */}
        {!isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('form.sections.adminReply')}</CardTitle>
              <CardDescription>{t('form.sections.adminReplyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin_reply" className="text-sm">
                  {t('form.fields.adminReply')}
                </Label>
                <Textarea
                  id="admin_reply"
                  value={formData.admin_reply}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, admin_reply: e.target.value }))
                  }
                  placeholder={t('form.placeholders.adminReply')}
                  disabled={busy}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
            <div>
              {!isNew && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={busy}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t('actions.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      {t('admin.common.delete')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/reviews')}
                disabled={busy}
              >
                {t('admin.common.cancel')}
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('admin.common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t('admin.common.save')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {
                name: formData.name || t('deleteDialog.fallbackName'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
