'use client';

import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLoginMutation,
  useSignupMutation,
  useRequestPasswordResetMutation,
  useLazyStatusQuery,
} from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError, localizePath } from '@/integrations/shared';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useLocaleShort, useUiSection } from '@/i18n';
import { trackEvent } from '@/integrations/telemetry';
import { gaEvent } from '@/lib/ga';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register' | 'forgot';
}

export function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const router = useRouter();
  const locale = useLocaleShort();
  const searchParams = useSearchParams();
  const { ui } = useUiSection('ui_auth', locale as any);
  const { ui: uiX } = useUiSection('ui_extra' as any);

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);

  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRules, setRegRules] = useState(false);

  // Forgot States
  const [forgotEmail, setForgotEmail] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const [login, loginState] = useLoginMutation();
  const [signup, signupState] = useSignupMutation();
  const [resetReq, resetState] = useRequestPasswordResetMutation();
  const [fetchStatus] = useLazyStatusQuery();

  const nextHref = useMemo(() => {
    const raw = searchParams.get('next') || '';
    if (raw && raw.startsWith('/')) return raw;
    return localizePath(locale, '/dashboard');
  }, [searchParams, locale]);

  const hasExplicitNext = useMemo(() => {
    const raw = searchParams.get('next') || '';
    return raw.startsWith('/');
  }, [searchParams]);

  const apiErrorMessage = formError || (
    activeTab === 'login' && loginState.error ? normalizeError(loginState.error).message :
    activeTab === 'register' && signupState.error ? normalizeError(signupState.error).message :
    activeTab === 'forgot' && resetState.error ? normalizeError(resetState.error).message : null
  );

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setFormError(ui('login_error_required', 'Email and password are required.'));
      return;
    }

    try {
      const resp = await login({ email: loginEmail.trim().toLowerCase(), password: loginPassword }).unwrap();
      if (resp.access_token) tokenStore.set(resp.access_token);
      if (typeof window !== 'undefined' && resp.user) {
        window.localStorage.setItem('user', JSON.stringify(resp.user));
      }

      const adminBase = trimSlash(String(process.env.NEXT_PUBLIC_ADMIN_URL || '').trim());
      if (typeof window !== 'undefined' && adminBase && !hasExplicitNext) {
        try {
          const status = await fetchStatus(undefined).unwrap();
          if (status?.authenticated === true && status?.is_admin === true) {
            window.location.assign(`${adminBase}/admin`);
            return;
          }
        } catch {}
      }

      onOpenChange(false);
      router.push(nextHref);
    } catch {}
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!regEmail.trim() || !regPassword) {
      setFormError(ui('register_error_required', 'Email and password are required.'));
      return;
    }
    if (regPassword.length < 6) {
      setFormError(ui('register_error_password_length', 'Password must be at least 6 characters.'));
      return;
    }
    if (!regRules) {
      setFormError(ui('register_error_rules_required', 'You must accept the terms and KVKK notice.'));
      return;
    }

    try {
      const payload = {
        email: regEmail.trim(),
        password: regPassword,
        full_name: regFullName.trim() || undefined,
        rules_accepted: true as const,
      };

      const resp = await signup(payload).unwrap();
      if (resp.access_token) tokenStore.set(resp.access_token);
      trackEvent('signup_complete', { method: 'email' }).catch(() => {});
      gaEvent('sign_up', { method: 'email' });

      onOpenChange(false);
      // Wait for 1 second before redirect to avoid abrupt changes
      setTimeout(() => {
        router.push(hasExplicitNext ? nextHref : localizePath(locale, '/'));
      }, 500);
    } catch {}
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!forgotEmail.trim()) {
      setFormError(uiX('ui_extra_b2_authmodal_email_required', 'Email is required.'));
      return;
    }
    try {
      await resetReq({ email: forgotEmail.trim() }).unwrap();
      setFormError(uiX('ui_extra_b2_authmodal_reset_sent', 'Password reset email sent. Please check your inbox.'));
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 border-gm-border-soft bg-gm-surface shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-serif text-center mb-4">
            {uiX('ui_extra_b2_authmodal_welcome', 'Welcome')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setFormError(null); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gm-bg border border-gm-border-soft rounded-xl p-1 h-12">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-gm-surface data-[state=active]:shadow-sm data-[state=active]:text-gm-gold">
                {uiX('ui_extra_b2_authmodal_tab_login', 'Sign In')}
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-gm-surface data-[state=active]:shadow-sm data-[state=active]:text-gm-gold">
                {uiX('ui_extra_b2_authmodal_tab_register', 'Sign Up')}
              </TabsTrigger>
            </TabsList>

            {apiErrorMessage && (
              <div className="bg-gm-error/10 border border-gm-error/20 text-gm-error px-4 py-3 rounded-xl mb-4 text-[13px] flex items-start gap-2">
                <span>⚠️</span>
                <span className="font-medium">{apiErrorMessage}</span>
              </div>
            )}

            <TabsContent value="login" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_email_placeholder', 'Your email address')}
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_password_placeholder', 'Your password')}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-xs font-bold uppercase tracking-widest text-gm-gold hover:text-gm-gold-light transition-all"
                  >
                    {uiX('ui_extra_b2_authmodal_forgot_link', 'Forgot Password?')}
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn-premium w-full py-4 text-xs font-bold"
                  disabled={loginState.isLoading}
                >
                  {loginState.isLoading ? uiX('ui_extra_b2_authmodal_login_loading', 'Signing in...') : uiX('ui_extra_b2_authmodal_login_submit', 'SIGN IN')}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_fullname_placeholder', 'Full name (optional)')}
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_email_placeholder_req', 'Your email address *')}
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_password_placeholder_req', 'Choose a password *')}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-start gap-3 py-1">
                  <input
                    id="modal-reg-rules"
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gm-border-soft text-gm-gold focus:ring-gm-gold/20 accent-gm-gold"
                    checked={regRules}
                    onChange={e => setRegRules(e.target.checked)}
                    required
                  />
                  <label htmlFor="modal-reg-rules" className="text-xs text-gm-text-muted leading-relaxed">
                    <Link href={localizePath(locale, '/terms')} target="_blank" className="text-gm-gold hover:underline">{uiX('ui_extra_b2_authmodal_terms_link', 'Terms of Use')}</Link> {uiX('ui_extra_b2_authmodal_terms_and', 'and')}{' '}
                    <Link href={localizePath(locale, '/kvkk')} target="_blank" className="text-gm-gold hover:underline">{uiX('ui_extra_b2_authmodal_kvkk_link', 'KVKK')}</Link> {uiX('ui_extra_b2_authmodal_terms_accept', 'I accept.')}
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn-premium w-full py-4 text-xs font-bold"
                  disabled={signupState.isLoading}
                >
                  {signupState.isLoading ? uiX('ui_extra_b2_authmodal_register_loading', 'Creating account...') : uiX('ui_extra_b2_authmodal_register_submit', 'SIGN UP')}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="forgot" className="mt-0 focus-visible:outline-none">
              <div className="mb-4 text-sm text-gm-text-dim text-center">
                {uiX('ui_extra_b2_authmodal_forgot_desc', 'Enter your email address and we will send a password reset link.')}
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <input
                    type="email"
                    className="w-full px-4 py-3.5 border border-gm-border-soft rounded-xl focus:outline-none focus:border-gm-gold/50 bg-gm-bg-deep placeholder:text-gm-muted text-gm-text transition-all"
                    placeholder={uiX('ui_extra_b2_authmodal_email_placeholder', 'Your email address')}
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-premium w-full py-4 text-xs font-bold"
                  disabled={resetState.isLoading}
                >
                  {resetState.isLoading ? uiX('ui_extra_b2_authmodal_forgot_loading', 'Sending...') : uiX('ui_extra_b2_authmodal_forgot_submit', 'SEND LINK')}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs font-bold uppercase tracking-widest text-gm-text-muted hover:text-gm-text transition-all"
                  >
                    {uiX('ui_extra_b2_authmodal_back', 'Go Back')}
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* Social Logins - Only show on Login and Register */}
            {activeTab !== 'forgot' && (
              <div className="mt-8">
                <div className="relative mb-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gm-border-soft" />
                  </div>
                  <div className="relative">
                    <span className="px-3 bg-gm-surface text-gm-text-muted text-[10px] uppercase tracking-[0.2em] font-bold">
                      {uiX('ui_extra_b2_authmodal_or', 'or')}
                    </span>
                  </div>
                </div>
                <SocialLoginButtons nextHref={nextHref} layout="row" />
              </div>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
