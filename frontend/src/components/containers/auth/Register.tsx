// =============================================================
// FILE: src/components/containers/auth/Register.tsx
// FINAL – Auth Register
// =============================================================

'use client';

import React, { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  useSignupMutation,
  useOauthStartMutation,
} from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const Register: React.FC = () => {
  const router = useRouter();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);

  const loginHref = useMemo(() => localizePath(locale, '/login'), [locale]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [signup, signupState] = useSignupMutation();
  const [googleStart, googleState] = useOauthStartMutation();

  const isLoading = signupState.isLoading || googleState.isLoading;

  const apiErrorMessage = useMemo(() => {
    if (!signupState.error) return null;
    return normalizeError(signupState.error).message;
  }, [signupState.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError(ui('register_error_required', 'E-posta ve şifre zorunludur.'));
      return;
    }
    if (password.length < 6) {
      setFormError(ui('register_error_password_length', 'Şifre en az 6 karakter olmalıdır.'));
      return;
    }
    if (password !== passwordAgain) {
      setFormError(ui('register_error_password_mismatch', 'Şifreler eşleşmiyor.'));
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        rules_accepted: true as const,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        },
      } as const;

      const resp = await signup(payload).unwrap();
      if (resp.access_token) tokenStore.set(resp.access_token);
      router.push(
        `${localizePath(locale, '/verify-email')}?mode=pending&email=${encodeURIComponent(
          email.trim(),
        )}`,
      );
    } catch {
      // Error handled by signupState
    }
  };

  const handleGoogleRegister = async () => {
    if (typeof window === 'undefined') return;
    setFormError(null);
    try {
      const currentUrl = window.location.origin || '';
      const resp = await googleStart({ redirectTo: currentUrl }).unwrap();
      if (resp.url) {
        window.location.href = resp.url;
      }
    } catch (err) {
      const n = normalizeError(err as any);
      setFormError(
        n.message ||
        ui('register_error_google_generic', 'Google ile kayıt başlatılırken bir hata oluştu.')
      );
    }
  };

  const errorToShow = formError || apiErrorMessage;

  return (
    <section className="bg-bg-primary py-20 min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-bg-card-hover/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto bg-bg-card p-8 md:p-12 rounded-lg shadow-soft">
          
          <div className="text-center mb-8">
            <h3 className="text-3xl font-serif font-light text-text-primary mb-3">
              {ui('register_title', 'Kayıt Ol')}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {ui('register_lead_has_account', 'Zaten hesabınız var mı?')}{' '}
              <Link
                href={loginHref}
                className="text-brand-primary font-bold hover:text-brand-hover transition-colors"
              >
                {ui('register_login_link', 'Giriş yap')}
              </Link>
              .
            </p>
          </div>

          {errorToShow && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-md mb-6 text-sm flex items-start gap-2"
            >
              <span className="mt-0.5">⚠️</span>
              <span className="font-medium">{errorToShow}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className="block text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
                {ui('register_fullname_label', 'Ad Soyad')}
              </label>
              <input
                id="reg-fullname"
                type="text"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('register_fullname_placeholder', 'Adınız ve soyadınız')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
                {ui('register_phone_label', 'Telefon')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('register_phone_placeholder', '+90 5xx xxx xx xx')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
                {ui('register_email_label', 'E-posta')}
              </label>
              <input
                id="reg-email"
                type="email"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('register_email_placeholder', 'ornek@goldmoodastro.com')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
                  {ui('register_password_label', 'Şifre')}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                  placeholder={ui('register_password_placeholder', 'Şifre')}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-password-again" className="block text-sm font-bold text-text-primary mb-1 uppercase tracking-wide">
                  {ui('register_password_again_label', 'Tekrar')}
                </label>
                <input
                  id="reg-password-again"
                  type="password"
                  className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                  placeholder={ui('register_password_again_placeholder', 'Şifreyi tekrar girin')}
                  autoComplete="new-password"
                  value={passwordAgain}
                  onChange={(e) => setPasswordAgain(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
                disabled={isLoading}
              >
                {signupState.isLoading
                  ? ui('register_loading', 'Hesap oluşturuluyor...')
                  : ui('register_submit', 'Kayıt Ol')}
              </button>
            </div>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative">
              <span className="px-3 bg-bg-card text-text-muted text-sm uppercase tracking-wider font-medium">
                {ui('register_or', 'veya')}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full border border-border-light bg-bg-card text-text-primary font-bold py-3 px-4 rounded-sm hover:bg-bg-card hover:border-border-medium transition-all flex justify-center items-center gap-3 group"
            onClick={handleGoogleRegister}
            disabled={isLoading}
          >
            {googleState.isLoading ? (
              <span className="text-sm">{ui('register_google_loading', 'Google ile yönlendiriliyor...')}</span>
            ) : (
              <>
                 <svg className="w-5 h-5 text-text-secondary group-hover:text-brand-primary transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                <span className="text-sm">
                  {ui('register_google_button', 'Google ile devam et')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Register;
