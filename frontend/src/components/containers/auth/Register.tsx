// =============================================================
// FILE: src/components/containers/auth/Register.tsx
// FINAL – Auth Register
// =============================================================

'use client';

import React, { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  useSignupMutation,
} from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { useBrand } from '@/hooks/useBrand';
import { localizePath } from '@/integrations/shared';
import { trackEvent } from '@/integrations/telemetry';

import PageContainer from '@/components/common/PageContainer';

const Register: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocaleShort();
  const { brand } = useBrand();
  const { ui } = useUiSection('ui_auth', locale as any);

  // H4: signup sonrası `?next=/tr/booking?...` → kullanıcı geldiği sayfaya döner.
  // Yoksa ana sayfa. Sadece path başlayan değerler kabul edilir (open redirect koruması).
  const nextParam = useMemo(() => {
    const raw = searchParams.get('next') || '';
    return raw.startsWith('/') ? raw : '';
  }, [searchParams]);

  const loginHref = useMemo(() => {
    const base = localizePath(locale, '/login');
    return nextParam ? `${base}?next=${encodeURIComponent(nextParam)}` : base;
  }, [locale, nextParam]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [signup, signupState] = useSignupMutation();

  const isLoading = signupState.isLoading;

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
    if (!rulesAccepted) {
      setFormError(ui('register_error_rules_required', 'Kullanım koşullarını ve KVKK metnini kabul etmelisiniz.'));
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        rules_accepted: true,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        },
      } as const;

      const resp = await signup(payload).unwrap();
      if (resp.access_token) tokenStore.set(resp.access_token);
      trackEvent('signup_complete', { method: 'email' }).catch(() => {});
      const verifyUrl = new URL(
        `${localizePath(locale, '/verify-email')}?mode=pending&email=${encodeURIComponent(email.trim())}`,
        'http://x',
      );
      if (nextParam) verifyUrl.searchParams.set('next', nextParam);
      router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
    } catch {
      // Error handled by signupState
    }
  };

  const errorToShow = formError || apiErrorMessage;

  return (
    <PageContainer width="narrow" center className="bg-(--gm-bg) min-h-screen relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-(--gm-gold)/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-(--gm-surface-high)/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto bg-(--gm-surface) p-8 md:p-12 rounded-[24px] border border-(--gm-border-soft) shadow-(--gm-shadow-soft) relative z-10">
        
        <div className="text-center mb-8">
          <h3 className="text-3xl font-serif text-(--gm-text) mb-3">
            {ui('register_title', 'Kayıt Ol')}
          </h3>
          <p className="text-(--gm-text-dim) leading-relaxed">
            {ui('register_lead_has_account', 'Zaten hesabınız var mı?')}{' '}
            <Link
              href={loginHref}
              className="text-(--gm-gold) font-bold hover:text-(--gm-gold-light) transition-colors"
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
            className="bg-(--gm-error)/10 border border-(--gm-error)/20 text-(--gm-error) px-4 py-3 rounded-md mb-6 text-sm flex items-start gap-2"
          >
            <span className="mt-0.5">⚠️</span>
            <span className="font-medium">{errorToShow}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-fullname" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-1 uppercase tracking-[0.2em]">
              {ui('register_fullname_label', 'Ad Soyad')}
            </label>
            <input
              id="reg-fullname"
              type="text"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder={ui('register_fullname_placeholder', 'Adınız ve soyadınız')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-1 uppercase tracking-[0.2em]">
              {ui('register_phone_label', 'Telefon')}
            </label>
            <input
              id="reg-phone"
              type="tel"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder={ui('register_phone_placeholder', '+90 5xx xxx xx xx')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-1 uppercase tracking-[0.2em]">
              {ui('register_email_label', 'E-posta')}
            </label>
            <input
              id="reg-email"
              type="email"
              className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
              placeholder={ui('register_email_placeholder', `ornek@${brand.domain || 'goldmoodastro.com'}`)}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-password" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-1 uppercase tracking-[0.2em]">
                {ui('register_password_label', 'Şifre')}
              </label>
              <input
                id="reg-password"
                type="password"
                className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
                placeholder={ui('register_password_placeholder', 'Şifre')}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password-again" className="block text-[10px] font-bold text-(--gm-gold-dim) mb-1 uppercase tracking-[0.2em]">
                {ui('register_password_again_label', 'Tekrar')}
              </label>
              <input
                id="reg-password-again"
                type="password"
                className="w-full px-4 py-3 border border-(--gm-border-soft) rounded-xl focus:outline-none focus:border-(--gm-gold)/50 transition-all bg-(--gm-bg-deep) placeholder:text-(--gm-muted) text-(--gm-text)"
                placeholder={ui('register_password_again_placeholder', 'Şifreyi tekrar girin')}
                autoComplete="new-password"
                value={passwordAgain}
                onChange={(e) => setPasswordAgain(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              id="reg-rules"
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-(--gm-border-soft) text-(--gm-gold) focus:ring-(--gm-gold)/20 accent-(--gm-gold)"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              required
            />
            <label htmlFor="reg-rules" className="text-xs text-(--gm-text-muted) leading-snug">
              <Link href={localizePath(locale, '/terms')} target="_blank" className="text-(--gm-gold) font-bold hover:underline">Kullanım Koşullarını</Link> ve{' '}
              <Link href={localizePath(locale, '/kvkk')} target="_blank" className="text-(--gm-gold) font-bold hover:underline">KVKK Aydınlatma Metnini</Link> okudum, kabul ediyorum.
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="btn-premium w-full py-4 text-xs"
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
            <div className="w-full border-t border-(--gm-border-soft)" />
          </div>
          <div className="relative">
            <span className="px-3 bg-(--gm-surface) text-(--gm-text-muted) text-[10px] font-bold uppercase tracking-[0.2em]">
              {ui('register_or', 'veya')}
            </span>
          </div>
        </div>

        <SocialLoginButtons layout="row" />
      </div>
    </PageContainer>
  );
};

export default Register;
