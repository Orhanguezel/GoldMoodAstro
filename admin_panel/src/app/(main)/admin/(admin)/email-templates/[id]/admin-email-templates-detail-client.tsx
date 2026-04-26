'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/email-templates/[id]/admin-email-templates-detail-client.tsx
// FINAL — Admin Email Template Create/Edit Form (App Router + shadcn)
// - Modern UI with shadcn/ui components
// - Tailwind CSS with dark mode support
// - RTK Query hooks
// - HTML content editor (Textarea)
// - Variables input (comma-separated or JSON)
// =============================================================

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft, Code2, Eye, EyeOff, Loader2, Mail, Save, SendHorizonal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLocaleSelect } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
  useGetEmailTemplateAdminQuery,
  useUpdateEmailTemplateAdminMutation,
  useSendTestEmailAdminMutation,
} from '@/integrations/hooks';
import type {
  EmailTemplateAdminCreatePayload,
  EmailTemplateAdminTranslationDto,
} from '@/integrations/shared';

import { localeShortClient, localeShortClientOr } from '@/i18n/localeShortClient';

type FormData = {
  template_key: string;
  template_name: string;
  subject: string;
  content: string;
  variables: string; // comma-separated or JSON string
  is_active: boolean;
  locale: string;
};

function getErrMsg(e: unknown, fallback: string): string {
  const err = e as {
    data?: { error?: { message?: unknown }; message?: unknown };
    message?: unknown;
  };

  const candidates = [err?.data?.error?.message, err?.data?.message, err?.message];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item;
  }
  return fallback;
}

function parseVariables(input: string): string[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try JSON first
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => typeof v === 'string' && v.trim());
      }
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated
  return trimmed
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function stringifyVariables(vars: string[] | null | undefined): string {
  if (!vars || vars.length === 0) return '';
  return vars.join(', ');
}

function findTranslationByLocale(
  translations: EmailTemplateAdminTranslationDto[] | undefined,
  locale: string | null | undefined,
): EmailTemplateAdminTranslationDto | null {
  if (!translations?.length) return null;

  const normalizedLocale = localeShortClient(locale || '');
  if (normalizedLocale) {
    const exact = translations.find((item) => localeShortClient(item.locale) === normalizedLocale);
    if (exact) return exact;
  }

  return translations[0] ?? null;
}

export default function AdminEmailTemplatesDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT();
  const normalizedId = String(id || '').trim();
  const isInvalidId = !normalizedId || normalizedId === 'undefined' || normalizedId === 'null';
  const isNew = normalizedId === 'new';

  // Locale management
  const {
    localeOptions,
    defaultLocaleFromDb,
    coerceLocale,
    loading: localesLoading,
  } = useAdminLocales();

  // RTK Query - only fetch if editing
  const {
    data: existingItem,
    isLoading: loadingItem,
    error: loadError,
  } = useGetEmailTemplateAdminQuery({ id: normalizedId }, { skip: isNew || isInvalidId });

  React.useEffect(() => {
    if (!isInvalidId) return;
    router.replace('/admin/email-templates');
  }, [isInvalidId, router]);

  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();
  const [sendTestEmail, { isLoading: isSendingTest }] = useSendTestEmailAdminMutation();

  // Preview & test send state
  const [showPreview, setShowPreview] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState('');
  const [showTestSend, setShowTestSend] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    template_key: '',
    template_name: '',
    subject: '',
    content: '',
    variables: '',
    is_active: true,
    locale:
      defaultLocaleFromDb ||
      localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de', 'de') ||
      '',
  });

  React.useEffect(() => {
    if (localesLoading) return;
    setFormData((prev) => {
      const nextLocale = coerceLocale(prev.locale, defaultLocaleFromDb);
      if (nextLocale === prev.locale) return prev;
      return { ...prev, locale: nextLocale };
    });
  }, [coerceLocale, defaultLocaleFromDb, localesLoading]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Load existing data
  React.useEffect(() => {
    if (!isNew && existingItem) {
      const preferredLocale =
        defaultLocaleFromDb ||
        localeShortClientOr(typeof window !== 'undefined' ? navigator.language : 'de', 'de') ||
        '';
      const initialTranslation = findTranslationByLocale(
        existingItem.translations,
        preferredLocale,
      );
      const initialLocale = initialTranslation?.locale || preferredLocale;

      setFormData({
        template_key: existingItem.template_key || '',
        template_name: initialTranslation?.template_name || '',
        subject: initialTranslation?.subject || '',
        content: initialTranslation?.content || '',
        variables: stringifyVariables(existingItem.variables),
        is_active: existingItem.is_active,
        locale: initialLocale,
      });
    }
  }, [existingItem, isNew, defaultLocaleFromDb]);

  // Keep translation fields synced when locale changes in edit mode.
  React.useEffect(() => {
    if (isNew || !existingItem) return;

    const translation = findTranslationByLocale(existingItem.translations, formData.locale);
    if (!translation) {
      setFormData((prev) => {
        if (!prev.template_name && !prev.subject && !prev.content) return prev;
        return { ...prev, template_name: '', subject: '', content: '' };
      });
      return;
    }

    setFormData((prev) => {
      if (
        prev.template_name === translation.template_name &&
        prev.subject === translation.subject &&
        prev.content === translation.content
      ) {
        return prev;
      }
      return {
        ...prev,
        template_name: translation.template_name || '',
        subject: translation.subject || '',
        content: translation.content || '',
      };
    });
  }, [isNew, existingItem, formData.locale]);

  const activeTranslation = React.useMemo(
    () => findTranslationByLocale(existingItem?.translations, formData.locale),
    [existingItem?.translations, formData.locale],
  );

  const busy = isCreating || isUpdating || isDeleting || loadingItem || isSendingTest;

  const handleSendTest = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      toast.error(t('admin.emailTemplates.detail.testSend.invalidEmail'));
      return;
    }
    try {
      await sendTestEmail({
        id: normalizedId,
        to: testEmail.trim(),
        locale: formData.locale,
      }).unwrap();
      toast.success(t('admin.emailTemplates.detail.testSend.sent'));
    } catch (err) {
      toast.error(getErrMsg(err, t('admin.emailTemplates.detail.testSend.failed')));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.template_key.trim()) {
      toast.error(t('admin.emailTemplates.detail.validation.templateKeyRequired'));
      return;
    }

    if (!formData.template_name.trim()) {
      toast.error(t('admin.emailTemplates.detail.validation.templateNameRequired'));
      return;
    }

    if (!formData.subject.trim()) {
      toast.error(t('admin.emailTemplates.detail.validation.subjectRequired'));
      return;
    }

    if (!formData.content.trim()) {
      toast.error(t('admin.emailTemplates.detail.validation.contentRequired'));
      return;
    }

    // ✅ Sadece locale normalize et
    const apiLocale = localeShortClient(formData.locale);
    const parsedVariables = parseVariables(formData.variables);

    try {
      if (isNew) {
        const payload: EmailTemplateAdminCreatePayload = {
          template_key: formData.template_key.trim(),
          template_name: formData.template_name.trim(),
          subject: formData.subject.trim(),
          content: formData.content.trim(),
          variables: parsedVariables,
          is_active: formData.is_active,
          locale: apiLocale,
        };

        await createTemplate(payload).unwrap();
        toast.success(t('admin.emailTemplates.detail.toast.created'));
        router.push('/admin/email-templates');
      } else {
        await updateTemplate({
          id: normalizedId,
          body: {
            template_key: formData.template_key.trim(),
            template_name: formData.template_name.trim(),
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            variables: parsedVariables,
            is_active: formData.is_active,
            locale: apiLocale,
          },
        }).unwrap();
        toast.success(t('admin.emailTemplates.detail.toast.updated'));
      }
    } catch (err) {
      toast.error(getErrMsg(err, t('admin.emailTemplates.common.operationFailed')));
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isNew) return;

    try {
      await deleteTemplate({ id: normalizedId }).unwrap();
      toast.success(t('admin.emailTemplates.detail.toast.deleted'));
      router.push('/admin/email-templates');
    } catch (err) {
      toast.error(getErrMsg(err, t('admin.emailTemplates.common.operationFailed')));
    }
  };

  const handleLocaleChange = (locale: string) => {
    const coerced = coerceLocale(locale, defaultLocaleFromDb);
    setFormData((prev) => ({ ...prev, locale: coerced }));
  };

  if (isInvalidId) {
    return null;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-destructive">
              {t('admin.emailTemplates.detail.loadError')}:{' '}
              {getErrMsg(loadError, t('admin.emailTemplates.common.operationFailed'))}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/email-templates')}
              className="mt-4 gap-2"
            >
              <ArrowLeft className="size-4" />
              {t('admin.emailTemplates.detail.backToList')}
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
              <span>{t('admin.emailTemplates.common.loading')}</span>
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
                <CardTitle>
                  {isNew
                    ? t('admin.emailTemplates.detail.titleCreate')
                    : t('admin.emailTemplates.detail.titleEdit')}
                </CardTitle>
                <CardDescription>
                  {isNew
                    ? t('admin.emailTemplates.detail.descriptionCreate')
                    : t('admin.emailTemplates.detail.descriptionEdit')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/email-templates')}
                disabled={busy}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                {t('admin.emailTemplates.detail.actions.back')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Section 1: Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.emailTemplates.detail.sections.generalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Locale */}
              <div>
                <AdminLocaleSelect
                  value={formData.locale}
                  onChange={handleLocaleChange}
                  options={localeOptions}
                  loading={localesLoading}
                  disabled={busy}
                />
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label htmlFor="is_active" className="text-sm">
                  {t('admin.emailTemplates.detail.fields.statusLabel')}
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
                      <Badge variant="default">{t('admin.emailTemplates.common.active')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('admin.emailTemplates.common.inactive')}</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Template Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.emailTemplates.detail.sections.templateInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Key */}
            <div className="space-y-2">
              <Label htmlFor="template_key" className="text-sm">
                <div className="flex items-center gap-2">
                  <Code2 className="size-4" />
                  {t('admin.emailTemplates.detail.fields.templateKeyLabel')}{' '}
                  <span className="text-destructive">*</span>
                </div>
              </Label>
              <Input
                id="template_key"
                value={formData.template_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, template_key: e.target.value }))}
                placeholder={t('admin.emailTemplates.detail.fields.templateKeyPlaceholder')}
                disabled={busy || !isNew} // Key cannot be changed after creation
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.emailTemplates.detail.fields.templateKeyHelp')}
              </p>
            </div>

            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template_name" className="text-sm">
                {t('admin.emailTemplates.detail.fields.templateNameLabel')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, template_name: e.target.value }))
                }
                placeholder={t('admin.emailTemplates.detail.fields.templateNamePlaceholder')}
                disabled={busy}
                required
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {t('admin.emailTemplates.detail.fields.subjectLabel')}{' '}
                  <span className="text-destructive">*</span>
                </div>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder={t('admin.emailTemplates.detail.fields.subjectPlaceholder')}
                disabled={busy}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.emailTemplates.detail.fields.subjectHelp')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-base">
                  {t('admin.emailTemplates.detail.sections.content')}
                </CardTitle>
                <CardDescription>
                  {t('admin.emailTemplates.detail.sections.contentDescription')}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((p) => !p)}
                className="gap-2 shrink-0"
              >
                {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showPreview
                  ? t('admin.emailTemplates.detail.preview.hideButton')
                  : t('admin.emailTemplates.detail.preview.showButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content editor + preview */}
            <div className={showPreview ? 'grid gap-4 lg:grid-cols-2' : ''}>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm">
                  {t('admin.emailTemplates.detail.fields.contentLabel')}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={t('admin.emailTemplates.detail.fields.contentPlaceholder')}
                  disabled={busy}
                  rows={showPreview ? 20 : 12}
                  required
                  className="font-mono text-xs"
                />
              </div>

              {showPreview && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    {t('admin.emailTemplates.detail.preview.title')}
                  </Label>
                  <div className="rounded-md border bg-white">
                    <iframe
                      title="Email Preview"
                      srcDoc={formData.content || '<p style="color:#999;padding:20px;">No content</p>'}
                      className="w-full border-0"
                      style={{ minHeight: showPreview ? 420 : 300 }}
                      sandbox=""
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Test Send */}
            {!isNew && (
              <div className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t('admin.emailTemplates.detail.testSend.title')}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTestSend((p) => !p)}
                  >
                    {showTestSend
                      ? t('admin.emailTemplates.detail.testSend.hideButton')
                      : t('admin.emailTemplates.detail.testSend.showButton')}
                  </Button>
                </div>
                {showTestSend && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="test-email" className="text-xs text-muted-foreground">
                        {t('admin.emailTemplates.detail.testSend.emailLabel')}
                      </Label>
                      <Input
                        id="test-email"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder={t('admin.emailTemplates.detail.testSend.emailPlaceholder')}
                        disabled={isSendingTest}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSendTest}
                      disabled={isSendingTest || !testEmail.trim()}
                      className="gap-2"
                    >
                      {isSendingTest ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <SendHorizonal className="size-4" />
                      )}
                      {t('admin.emailTemplates.detail.testSend.sendButton')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.emailTemplates.detail.sections.variables')}
            </CardTitle>
            <CardDescription>
              {t('admin.emailTemplates.detail.sections.variablesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variables */}
            <div className="space-y-2">
              <Label htmlFor="variables" className="text-sm">
                {t('admin.emailTemplates.detail.fields.variablesLabel')}
              </Label>
              <Textarea
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData((prev) => ({ ...prev, variables: e.target.value }))}
                placeholder={t('admin.emailTemplates.detail.fields.variablesPlaceholder')}
                disabled={busy}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.emailTemplates.detail.fields.variablesHelp')}
              </p>
            </div>

            {/* Show detected variables if editing */}
            {!isNew && (activeTranslation?.detected_variables ?? []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">
                  {t('admin.emailTemplates.detail.fields.detectedVariablesLabel')}
                </Label>
                <div className="flex flex-wrap gap-1">
                  {(activeTranslation?.detected_variables ?? []).map((v) => (
                    <Badge key={v} variant="secondary">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                      {t('admin.emailTemplates.detail.actions.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      {t('admin.emailTemplates.detail.actions.delete')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/email-templates')}
                disabled={busy}
              >
                {t('admin.emailTemplates.detail.actions.cancel')}
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('admin.emailTemplates.detail.actions.saving')}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {t('admin.emailTemplates.detail.actions.save')}
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
            <AlertDialogTitle>{t('admin.emailTemplates.detail.dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.emailTemplates.detail.dialog.description', {
                template:
                  formData.template_key || t('admin.emailTemplates.detail.dialog.templateFallback'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.emailTemplates.detail.dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t('admin.emailTemplates.detail.dialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
