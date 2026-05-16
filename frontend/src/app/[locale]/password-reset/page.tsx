'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useConfirmPasswordResetMutation } from '@/integrations/rtk/hooks';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath, normalizeError } from '@/integrations/shared';

import PageContainer from '@/components/common/PageContainer';

export default function PasswordResetPage() {
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();

  const loginHref = localizePath(locale, '/login');

  if (!token) {
    return (
      <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen">
        <div className="w-full max-w-md mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) text-center">
          <div className="w-16 h-16 bg-(--gm-warning)/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-(--gm-warning)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
            {locale === 'de' ? 'Ungültiger Link' : locale === 'tr' ? 'Geçersiz Bağlantı' : 'Invalid Link'}
          </h2>
          <p className="text-(--gm-text-dim) mb-6">
            {locale === 'de'
              ? 'Kein Zurücksetzungs-Token gefunden. Bitte fordern Sie einen neuen Link an.'
              : locale === 'tr'
                ? 'Sıfırlama tokeni bulunamadı. Lütfen yeni bir bağlantı talep edin.'
                : 'No reset token found. Please request a new link.'}
          </p>
          <Link
            href={localizePath(locale, '/forgot-password')}
            className="btn-premium inline-block py-3 px-8 text-xs"
          >
            {locale === 'de' ? 'Neuen Link anfordern' : locale === 'tr' ? 'Yeni Bağlantı Talep Et' : 'Request New Link'}
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen">
        <div className="w-full max-w-md mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) text-center">
          <div className="w-16 h-16 bg-(--gm-success)/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-(--gm-success)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-(--gm-text) mb-3">
            {locale === 'de'
              ? 'Passwort aktualisiert!'
              : locale === 'tr'
                ? 'Şifre Güncellendi!'
                : 'Password Updated!'}
          </h2>
          <p className="text-(--gm-text-dim) mb-6">
            {locale === 'de'
              ? 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.'
              : locale === 'tr'
                ? 'Şifreniz başarıyla sıfırlandı. Şimdi giriş yapabilirsiniz.'
                : 'Your password has been successfully reset. You can now sign in.'}
          </p>
          <Link
            href={loginHref}
            className="btn-premium inline-block py-3 px-8 text-xs"
          >
            {locale === 'de' ? 'Zum Login' : locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
          </Link>
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError(
        locale === 'de'
          ? 'Das Passwort muss mindestens 6 Zeichen lang sein.'
          : locale === 'tr'
            ? 'Şifre en az 6 karakter olmalıdır.'
            : 'Password must be at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPwd) {
      setFormError(
        locale === 'de'
          ? 'Die Passwörter stimmen nicht überein.'
          : locale === 'tr'
            ? 'Şifreler eşleşmiyor.'
            : 'Passwords do not match.',
      );
      return;
    }

    try {
      await confirmReset({ token, password }).unwrap();
      setSuccess(true);
    } catch (err) {
      const msg = normalizeError(err as any).message;
      setFormError(
        msg ||
        (locale === 'de'
          ? 'Fehler beim Zurücksetzen. Der Link ist möglicherweise abgelaufen.'
          : locale === 'tr'
            ? 'Sıfırlama başarısız. Bağlantının süresi dolmuş olabilir.'
            : 'Reset failed. The link may have expired.'),
      );
    }
  };

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
              ? 'Neues Passwort festlegen'
              : locale === 'tr'
                ? 'Yeni Şifre Belirle'
                : 'Set New Password'}
          </h3>
          <p className="text-(--gm-text-dim) leading-relaxed">
            {locale === 'de'
              ? 'Geben Sie Ihr neues Passwort ein.'
              : locale === 'tr'
                ? 'Yeni şifrenizi girin.'
                : 'Enter your new password.'}
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
            <label htmlFor="new-password" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-2 uppercase tracking-[0.2em]">
              {locale === 'de' ? 'Neues Passwort' : locale === 'tr' ? 'Yeni Şifre' : 'New Password'}
            </label>
            <input
              id="new-password"
              type="password"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-2 uppercase tracking-[0.2em]">
              {locale === 'de' ? 'Passwort bestätigen' : locale === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
            </label>
            <input
              id="confirm-password"
              type="password"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-premium w-full py-4 text-xs"
            disabled={isLoading}
          >
            {isLoading
              ? (locale === 'de' ? 'Wird gespeichert...' : locale === 'tr' ? 'Kaydediliyor...' : 'Saving...')
              : (locale === 'de' ? 'Passwort speichern' : locale === 'tr' ? 'Şifreyi Kaydet' : 'Save Password')}
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
