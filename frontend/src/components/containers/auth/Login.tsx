// =============================================================
// FILE: src/components/containers/auth/Login.tsx
// FINAL – Auth Login
// - Tailwind v4 Semantic Tokens
// - Standard list of inputs
// =============================================================

'use client';

import React, { useState, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  useLoginMutation,
  useOauthStartMutation,
  useLazyStatusQuery,
} from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';

// i18n
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

const Login: React.FC = () => {
  const router = useRouter();
  const locale = useLocaleShort();
  const { ui } = useUiSection('ui_auth', locale as any);

  const registerHref = useMemo(() => localizePath(locale, '/register'), [locale]);
  const forgotPasswordHref = useMemo(() => localizePath(locale, '/forgot-password'), [locale]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [login, loginState] = useLoginMutation();
  const [googleStart, googleState] = useOauthStartMutation();
  const [fetchStatus] = useLazyStatusQuery();

  const isLoading = loginState.isLoading || googleState.isLoading;

  const apiErrorMessage = useMemo(() => {
    if (!loginState.error) return null;
    return normalizeError(loginState.error).message;
  }, [loginState.error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError(
        ui('login_error_required', 'Email and password are required.'),
      );
      return;
    }

    try {
      const resp = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      if (resp.access_token) {
        tokenStore.set(resp.access_token);
      }

      if (typeof window !== 'undefined' && resp.user) {
        window.localStorage.setItem('user', JSON.stringify(resp.user));
      }

      const adminBase = trimSlash(String(process.env.NEXT_PUBLIC_ADMIN_URL || '').trim());
      if (typeof window !== 'undefined' && adminBase) {
        try {
          const status = await fetchStatus(undefined).unwrap();
          if (status?.authenticated === true && status?.is_admin === true) {
            window.location.assign(`${adminBase}/admin`);
            return;
          }
        } catch {
          // status check failed -> normal user flow
        }
      }

      router.push(localizePath(locale, '/'));
    } catch {
      // Error is handled via loginState.error
    }
  };

  const handleGoogleLogin = async () => {
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
      const defMsg = ui('login_error_google_generic', 'An error occurred while starting Google login.');
      setFormError(n.message || defMsg);
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
              {ui('login_title', 'Sign In')}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {ui('login_lead', 'Sign in to your account or create a new one.')}{' '}
              <Link
                href={registerHref}
                className="text-brand-primary font-bold hover:text-brand-hover transition-colors"
              >
                {ui('login_register_link', 'Create an account')}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {ui('login_email_label', 'Email')}
              </label>
              <input
                id="login-email"
                type="email"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('login_email_placeholder', 'example@konigsmassage.com')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                {ui('login_password_label', 'Password')}
              </label>
              <input
                id="login-password"
                type="password"
                className="w-full px-4 py-3 border border-border-light rounded-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all bg-bg-card placeholder:text-text-muted text-text-primary"
                placeholder={ui('login_password_placeholder', 'Your password')}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border-medium rounded cursor-pointer accent-brand-primary"
                  disabled={isLoading}
                />
                <label
                  className="ml-2 block text-sm text-text-secondary cursor-pointer select-none"
                  htmlFor="remember-me"
                >
                  {ui('login_remember_me', 'Remember me')}
                </label>
              </div>
              <Link
                href={forgotPasswordHref}
                className="text-sm text-brand-primary hover:text-brand-hover hover:underline transition-all"
              >
                {ui('login_forgot_password', 'Forgot password?')}
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-sm hover:bg-brand-hover transition-all duration-300 shadow-soft hover:shadow-medium disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-sm"
              disabled={isLoading}
            >
              {loginState.isLoading
                ? ui('login_loading', 'Signing in...')
                : ui('login_submit', 'Sign In')}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative">
              <span className="px-3 bg-bg-card text-text-muted text-sm uppercase tracking-wider font-medium">
                {ui('login_or', 'or')}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full border border-border-light bg-bg-card text-text-primary font-bold py-3 px-4 rounded-sm hover:bg-bg-card hover:border-border-medium transition-all flex justify-center items-center gap-3 group"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {googleState.isLoading ? (
              <span className="text-sm">{ui('login_google_loading', 'Redirecting to Google...')}</span>
            ) : (
              <>
                <svg className="w-5 h-5 text-text-secondary group-hover:text-brand-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span className="text-sm">
                  {ui('login_google_button', 'Continue with Google')}
                </span>
              </>
            )}
          </button>

          <div className="mt-8 text-center">
             <p className="text-sm text-text-secondary">
               {ui('login_no_account', "Don't have an account?")}{' '}
               <Link
                 href={registerHref}
                 className="text-brand-primary font-bold hover:text-brand-hover hover:underline transition-all"
               >
                 {ui('login_register_cta', 'Sign up here')}
               </Link>
             </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
