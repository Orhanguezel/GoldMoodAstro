'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRequestPasswordResetMutation } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath, normalizeError } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function ForgotPasswordPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();

  const loginHref = localizePath(locale, '/login');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError(
        locale === 'de'
          ? 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
          : locale === 'tr'
            ? 'Lütfen e-posta adresinizi girin.'
            : 'Please enter your email address.',
      );
      return;
    }

    try {
      await requestReset({ email: email.trim().toLowerCase() }).unwrap();
      setSent(true);
    } catch (err) {
      setFormError(normalizeError(err as any).message || 'Error');
    }
  };

  if (sent) {
    return (
      <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen">
        <div className="w-full max-w-md mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) text-center">
          <div className="w-16 h-16 bg-(--gm-success)/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-(--gm-success)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
            {locale === 'de'
              ? 'E-Mail gesendet'
              : locale === 'tr'
                ? 'E-posta Gönderildi'
                : 'Email Sent'}
          </h2>
          <p className="text-(--gm-text-dim) mb-6">
            {locale === 'de'
              ? 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.'
              : locale === 'tr'
                ? 'Bu e-posta adresiyle bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.'
                : 'If an account with that email exists, we have sent a password reset link. Please check your email.'}
          </p>
          <Link
            href={loginHref}
            className="btn-premium inline-block py-3 px-8 text-xs"
          >
            {locale === 'de' ? 'Zurück zum Login' : locale === 'tr' ? 'Giriş Sayfasına Dön' : 'Back to Login'}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-(--gm-gold)/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-(--gm-surface-high)/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) relative z-10">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-serif text-(--gm-text) mb-3">
            {locale === 'de'
              ? 'Passwort vergessen'
              : locale === 'tr'
                ? 'Şifremi Unuttum'
                : 'Forgot Password'}
          </h3>
          <p className="text-(--gm-text-dim) leading-relaxed">
            {locale === 'de'
              ? 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.'
              : locale === 'tr'
                ? 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.'
                : 'Enter your email address and we will send you a reset link.'}
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="bg-(--gm-error)/5 border border-(--gm-error)/20 text-(--gm-error) px-4 py-3 rounded-md mb-6 text-sm flex items-start gap-2"
          >
            <span className="font-medium">{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reset-email" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-2 uppercase tracking-[0.2em]">
              {ui('login_email_label', 'Email')}
            </label>
            <input
              id="reset-email"
              type="email"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder={ui('login_email_placeholder', 'example@goldmoodastro.com')}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-premium w-full py-4 text-xs"
            disabled={isLoading}
          >
            {isLoading
              ? (locale === 'de' ? 'Wird gesendet...' : locale === 'tr' ? 'Gönderiliyor...' : 'Sending...')
              : (locale === 'de' ? 'Link senden' : locale === 'tr' ? 'Bağlantı Gönder' : 'Send Reset Link')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href={loginHref}
            className="text-xs font-bold uppercase tracking-[0.18em] text-(--gm-text-muted) hover:text-(--gm-gold) transition-all"
          >
            {locale === 'de' ? '← Zurück zum Login' : locale === 'tr' ? '← Giriş Sayfasına Dön' : '← Back to Login'}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
