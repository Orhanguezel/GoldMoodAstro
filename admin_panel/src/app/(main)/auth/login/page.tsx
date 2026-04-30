// src/app/(main)/auth/login/page.tsx
'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';

import { LoginForm } from '../_components/login-form';
import { useLocaleContext } from '@/i18n';

function LoginFormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
    </div>
  );
}

export default function Login() {
  const { t } = useLocaleContext();
  return (
    <div className="flex min-h-dvh bg-[var(--brand-cream)]">
      {/* Sol panel: Mystical Image */}
      <div className="relative hidden lg:block lg:w-3/5 xl:w-2/3 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-110"
          style={{ backgroundImage: 'url("/img/admin_login_bg.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--brand-cream)]" />
        
        {/* Floating Brand Info */}
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="backdrop-blur-md bg-[var(--brand-ink)]/20 p-8 rounded-2xl border border-white/10 max-w-xl">
            <h2 className="font-serif text-white text-4xl mb-4 leading-tight">
              {t('admin.auth.login.welcomeBack')}
            </h2>
            <p className="text-white/70 text-lg font-light tracking-wide italic">
              "Astroloji, ruhun evrenle olan dansının alfabesidir."
            </p>
          </div>
        </div>
      </div>

      {/* Sağ panel: Premium Login Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-2/5 xl:w-1/3">
        <div className="w-full max-w-md space-y-12 reveal">
          <div className="space-y-6 text-center">
            {/* Logo placeholder / Icon */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--brand-gold)]/10 border border-[var(--brand-gold-border)] shadow-glow-primary mb-8">
              <ShieldCheck className="size-10 text-[var(--brand-gold)]" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h1 className="font-serif text-[var(--brand-ink)] text-3xl tracking-tight">
                {t('admin.auth.login.title')}
              </h1>
              <p className="text-muted-foreground text-sm font-light">
                {t('admin.auth.login.description')}
              </p>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-xl space-y-6">
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>

            <div className="pt-4 border-t border-[var(--brand-gold-border)]">
              <p className="text-center text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
                {t('admin.auth.login.noAccess')}{' '}
                <Link
                  prefetch={false}
                  href="#"
                  className="text-[var(--brand-gold)] font-bold hover:opacity-80 transition-opacity"
                >
                  {t('admin.auth.login.contactAdmin')}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Copyright */}
          <p className="text-center text-[var(--brand-gold-strong)]/40 text-[10px] font-mono">
            &copy; {new Date().getFullYear()} GOLDMOODASTRO ADMIN
          </p>
        </div>
      </div>
    </div>
  );
}
