'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { localizePath } from '@/integrations/shared';
import { normalizeError } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCancelAccountDeletionMutation,
  useExportMyDataMutation,
  useGetAccountDeletionStatusQuery,
  useRequestAccountDeletionMutation,
} from '@/integrations/rtk/hooks';

function formatDate(v: string | undefined, locale: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

import PageContainer from '@/components/common/PageContainer';

export default function ProfilePrivacyPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_account');
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [reason, setReason] = useState('');

  const [getExportData, exportState] = useExportMyDataMutation();
  const [requestDeletion, requestState] = useRequestAccountDeletionMutation();
  const [cancelDeletion, cancelState] = useCancelAccountDeletionMutation();

  const {
    data: deletionStatus,
    isLoading: statusLoading,
    refetch,
  } = useGetAccountDeletionStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const pending = deletionStatus?.status === 'pending';
  const pendingDate = formatDate(deletionStatus?.scheduled_for, locale);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(localizePath(locale, '/login'));
    }
  }, [isAuthenticated, locale, router]);

  async function onExportData() {
    try {
      const payload = await getExportData().unwrap();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const fileName = `goldmoodastro-export-${Date.now()}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(ui('ui_account_export_success', 'Your data file has been downloaded.'));
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_account_export_error', 'Data export failed.'));
    }
  }

  async function onRequestDelete(e: React.FormEvent) {
    e.preventDefault();

    if (pending) {
      toast.error(ui('ui_account_delete_already_pending', 'You already have an active account deletion request.'));
      return;
    }

    try {
      await requestDeletion({ reason: reason.trim() || undefined }).unwrap();
      toast.success(ui('ui_account_delete_request_success', 'Your account deletion request has been created. You can cancel it within 7 days.'));
      setReason('');
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_account_delete_request_error', 'The account deletion request could not be received.'));
    }
  }

  async function onCancelDelete() {
    try {
      await cancelDeletion().unwrap();
      toast.success(ui('ui_account_delete_cancel_success', 'Your account deletion request has been cancelled.'));
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_account_delete_cancel_error', 'The request could not be cancelled.'));
    }
  }

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      <div className="mx-auto max-w-[var(--gm-w-narrow)]">
        <h1 className="text-3xl text-(--gm-text) font-serif mb-2">{ui('ui_account_privacy_title', 'Privacy and Account')}</h1>
        <p className="mb-8 text-(--gm-text-dim)">
          {ui('ui_account_privacy_subtitle', 'Actions for your personal data and account security.')}
        </p>

        <section className="rounded-xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 md:p-8 shadow-(--gm-shadow-soft) space-y-4">
          <h2 className="text-xl font-serif text-(--gm-text)">{ui('ui_account_export_heading', 'Download My Data')}</h2>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            {ui('ui_account_export_desc', 'You can prepare and download all data related to your account as JSON.')}
          </p>
          <button
            onClick={onExportData}
            disabled={exportState.isLoading}
            className="rounded-full bg-(--gm-gold) px-6 py-2.5 text-sm font-bold tracking-widest uppercase text-(--gm-bg-deep) hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {exportState.isLoading ? ui('ui_account_export_preparing', 'Preparing...') : ui('ui_account_export_button', 'Download My Data')}
          </button>
        </section>

        <section className="mt-8 rounded-xl border border-(--gm-error)/30 bg-(--gm-error)/5 p-5 md:p-8 shadow-(--gm-shadow-soft) space-y-4">
          <h2 className="text-xl font-serif text-(--gm-text)">{ui('ui_account_delete_heading', 'Delete My Account')}</h2>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            {ui('ui_account_delete_desc', 'When you confirm an account deletion request, permanent deletion will take place within 7 days. You can cancel your request at any time during this period.')}
          </p>

          {statusLoading ? (
            <p className="text-sm text-(--gm-text-dim)">{ui('ui_account_status_checking', 'Checking status...')}</p>
          ) : pending ? (
            <div className="rounded-xl bg-(--gm-surface) border border-(--gm-error)/30 p-6 space-y-4">
              <p className="text-sm text-(--gm-error) font-bold">
                {ui('ui_account_delete_pending_found', 'Active account deletion request found.')}
              </p>
              <p className="text-sm text-(--gm-text-dim)">
                {ui('ui_account_delete_date_label', 'Deletion date:')} <span className="text-(--gm-text) font-medium">{pendingDate}</span>
              </p>
              {deletionStatus?.cooling_off_days ? (
                <p className="text-sm text-(--gm-text-dim)">
                  {ui('ui_account_cooling_off_label', 'Cooling-off period:')} <strong>{deletionStatus?.cooling_off_days} {ui('ui_account_days_suffix', 'days')}</strong>
                </p>
              ) : null}
              <button
                onClick={onCancelDelete}
                disabled={cancelState.isLoading}
                className="rounded-full bg-(--gm-bg-deep) text-xs px-6 py-2.5 font-bold uppercase tracking-widest text-(--gm-text) border border-(--gm-border-soft) hover:bg-(--gm-surface-high) transition-all disabled:opacity-50"
              >
                {cancelState.isLoading ? ui('ui_account_delete_cancelling', 'Cancelling...') : ui('ui_account_delete_cancel_button', 'Cancel Account Deletion Request')}
              </button>
            </div>
          ) : (
            <form onSubmit={onRequestDelete} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-(--gm-text)">{ui('ui_account_delete_reason_label', 'Deletion reason (optional)')}</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text) focus:border-(--gm-error)/50 outline-none transition-colors font-serif italic"
                  placeholder={ui('ui_account_delete_reason_placeholder', 'Example: I was not satisfied with the service and want to close my account...')}
                  maxLength={500}
                />
              </label>
              <div className="text-[10px] font-bold text-(--gm-muted) tracking-widest uppercase">{ui('ui_account_max_500_chars', 'Maximum 500 characters.')}</div>

              <button
                type="submit"
                disabled={requestState.isLoading}
                className="rounded-full bg-(--gm-error) px-8 py-3 text-sm font-bold tracking-widest uppercase text-(--gm-text) hover:shadow-(--gm-shadow-soft) transition-all disabled:opacity-50"
              >
                {requestState.isLoading ? ui('ui_account_delete_processing', 'Processing...') : ui('ui_account_delete_request_button', 'Create Account Deletion Request')}
              </button>
            </form>
          )}
        </section>

        <div className="mt-12 flex justify-center">
          <Link href={localizePath(locale, '/dashboard')} className="text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim) hover:text-(--gm-gold) transition-colors">
            {ui('ui_account_back_to_dashboard', 'Back to Dashboard')}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
