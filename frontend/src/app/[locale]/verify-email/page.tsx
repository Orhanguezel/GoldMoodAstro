'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useConfirmEmailVerificationMutation,
  useSendEmailVerificationMutation,
} from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const mode = searchParams.get('mode');
  const email = searchParams.get('email');
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_extra' as any, locale as any);

  // Return to the ?next=... page after signup, otherwise home.
  const nextRaw = searchParams.get('next') || '';
  const nextHref = nextRaw.startsWith('/') ? nextRaw : localizePath(locale, '/');
  const continueLabel = ui('ui_extra_b1_continue', 'Continue');

  const [confirm, { isLoading }] = useConfirmEmailVerificationMutation();
  const [sendVerification, sendState] = useSendEmailVerificationMutation();
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'no_token'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mode === 'pending' && !token) {
      setStatus('pending');
      setMessage('');
      return;
    }

    if (!token) {
      setStatus('no_token');
      return;
    }

    confirm({ token })
      .unwrap()
      .then((res) => {
        setStatus('success');
        setMessage(res.message || '');
      })
      .catch((err) => {
        setStatus('error');
        const msg =
          (err as any)?.data?.error ||
          (err as any)?.data?.message ||
          'Verification failed';
        setMessage(msg);
      });
  }, [token, confirm]);

  const titleText = ui('ui_extra_b1_verify_email_title', 'Verify Email');
  const resendLabel = ui('ui_extra_b1_resend_verification', 'Resend verification email');

  return (
    <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen">
      <div className="w-full max-w-[var(--gm-w-form)] mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) text-center">
        {mode === 'pending' && !token ? (
          <>
            <div className="w-16 h-16 bg-(--gm-gold)/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-(--gm-gold)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-(--gm-text) mb-3">{titleText}</h2>
            <p className="text-(--gm-text-dim) mb-2">
              {ui('ui_extra_b1_verification_email_sent', 'We sent you a verification email.')}
            </p>
            {email ? (
              <p className="text-sm font-medium text-(--gm-text) mb-6">{email}</p>
            ) : null}
            <div className="space-y-3">
              <button
                type="button"
                disabled={sendState.isLoading}
                onClick={async () => {
                  try {
                    const res = await sendVerification().unwrap();
                    setMessage(res.message || '');
                  } catch (err) {
                    const msg =
                      (err as any)?.data?.error?.message ||
                      (err as any)?.data?.message ||
                      'verification_email_send_failed';
                    setMessage(msg);
                  }
                }}
                className="btn-premium w-full py-3.5 text-xs"
              >
                {sendState.isLoading ? '...' : resendLabel}
              </button>
              <Link
                href={nextHref}
                className="btn-outline-premium w-full py-3.5 text-xs"
              >
                {continueLabel}
              </Link>
            </div>
            {message ? <p className="mt-4 text-xs italic text-(--gm-text-dim)">{message}</p> : null}
          </>
        ) : isLoading || status === 'pending' ? (
          <>
            <div className="w-12 h-12 border-4 border-(--gm-gold) border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-(--gm-text-dim)">
              {ui('ui_extra_b1_verifying_email', 'Email is being verified...')}
            </p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-16 h-16 bg-(--gm-success)/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-(--gm-success)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
              {ui('ui_extra_b1_email_verified_title', 'Email verified!')}
            </h2>
            <p className="text-(--gm-text-dim) mb-6">
              {ui('ui_extra_b1_email_verified_body', 'Your email address has been verified successfully.')}
            </p>
            <Link
              href={nextHref}
              className="btn-premium py-3 px-8 text-xs inline-block"
            >
              {continueLabel}
            </Link>
          </>
        ) : status === 'no_token' ? (
          <>
            <div className="w-16 h-16 bg-(--gm-warning)/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-(--gm-warning)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
              {ui('ui_extra_b1_invalid_link', 'Invalid Link')}
            </h2>
            <p className="text-(--gm-text-dim) mb-6">
              {ui('ui_extra_b1_no_verification_token', 'Verification token was not found.')}
            </p>
            <Link
              href={localizePath(locale, '/register')}
              className="btn-premium py-3 px-8 text-xs inline-block"
            >
              {ui('ui_extra_b1_back_to_register', 'Back to Register')}
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-(--gm-error)/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-(--gm-error)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
              {ui('ui_extra_b1_verification_failed_title', 'Verification Failed')}
            </h2>
            <p className="text-(--gm-text-dim) mb-6">
              {message ||
                ui('ui_extra_b1_verification_failed_body', 'The link is invalid or expired.')}
            </p>
            <Link
              href={localizePath(locale, '/profile')}
              className="btn-premium py-3 px-8 text-xs inline-block"
            >
              {ui('ui_extra_b1_go_to_profile', 'Go to Profile')}
            </Link>
          </>
        )}
      </div>
    </PageContainer>
  );
}
