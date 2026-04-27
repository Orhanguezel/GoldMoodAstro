'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

import { useSocialLoginMutation } from '@/integrations/rtk/public/auth.endpoints';
import { tokenStore } from '@/integrations/rtk/token';
import { normalizeError } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';

// ─── Facebook SDK type minimal ───────────────────────────────
type FBAuthResponse = { accessToken: string };
type FBLoginResponse = { authResponse?: FBAuthResponse };
type FBUserInfo = { email?: string; id?: string; name?: string };
type FBSDK = {
  init: (cfg: { appId?: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (
    cb: (resp: FBLoginResponse) => void,
    opts: { scope: string },
  ) => void;
  api: (path: string, params: { fields: string }, cb: (info: FBUserInfo) => void) => void;
};
declare global {
  interface Window {
    FB?: FBSDK;
  }
}

type Props = {
  /** Login sonrası gidilecek URL (yoksa dashboard) */
  nextHref?: string;
  /** Sıralama: row (yan yana) | column (alt alta) */
  layout?: 'row' | 'column';
  className?: string;
};

// ─── Inner ───────────────────────────────────────────────────
function SocialButtonsInner({
  onGoogleClick,
  canUseGoogle,
  canUseFacebook,
  layout = 'row',
  className,
  isLoading,
}: {
  onGoogleClick?: () => void;
  canUseGoogle: boolean;
  canUseFacebook: boolean;
  layout?: 'row' | 'column';
  className?: string;
  isLoading: boolean;
}) {
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  const handleFacebook = useCallback(() => {
    if (!canUseFacebook) return;

    const init = () => {
      const FB = window.FB;
      if (!FB) return;
      FB.init({ appId: facebookAppId, cookie: true, xfbml: false, version: 'v19.0' });
      FB.login(
        (resp) => {
          if (!resp.authResponse) return;
          const accessToken = resp.authResponse.accessToken;
          FB.api('/me', { fields: 'email,name,id' }, (info) => {
            // Mutation parent'tan injection — but actually we need to call socialLogin inside the wrapper
            // → Dispatch via custom event to parent (closure)
            const evt = new CustomEvent('gm:fb-token', {
              detail: { accessToken, email: info.email },
            });
            window.dispatchEvent(evt);
          });
        },
        { scope: 'email,public_profile' },
      );
    };

    const exists = document.getElementById('facebook-jssdk');
    if (exists) {
      init();
    } else {
      const s = document.createElement('script');
      s.id = 'facebook-jssdk';
      s.src = 'https://connect.facebook.net/tr_TR/sdk.js';
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, [canUseFacebook, facebookAppId]);

  if (!canUseGoogle && !canUseFacebook) return null;

  const containerCls =
    layout === 'row' ? 'grid gap-3 sm:grid-cols-2' : 'flex flex-col gap-3';

  return (
    <div className={['space-y-4', className].filter(Boolean).join(' ')}>
      <div className={containerCls}>
        {canUseGoogle && (
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-sm border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3 text-sm font-medium text-(--gm-text) transition-all hover:border-(--gm-gold)/40 hover:bg-(--gm-surface) hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img src="/icons/google.png" alt="" width={18} height={18} />
            <span>Google ile devam et</span>
          </button>
        )}
        {canUseFacebook && (
          <button
            type="button"
            onClick={handleFacebook}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-3 rounded-sm border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3 text-sm font-medium text-(--gm-text) transition-all hover:border-(--gm-gold)/40 hover:bg-(--gm-surface) hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img src="/icons/facebook.png" alt="" width={18} height={18} />
            <span>Facebook ile devam et</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Google + listener wrapper ───────────────────────────────
function WithGoogle({ nextHref, layout, className }: Props) {
  const router = useRouter();
  const locale = useLocaleShort();
  const [socialLogin, { isLoading }] = useSocialLoginMutation();

  const finish = useCallback(
    async (payload: {
      type: 'google' | 'facebook';
      access_token?: string;
      id_token?: string;
      email?: string;
    }) => {
      try {
        const resp = await socialLogin(payload).unwrap();
        if ((resp as any).access_token) tokenStore.set((resp as any).access_token);
        if (typeof window !== 'undefined' && (resp as any).user) {
          window.localStorage.setItem('user', JSON.stringify((resp as any).user));
        }
        toast.success('Giriş başarılı');
        router.push(nextHref || localizePath(locale, '/dashboard'));
      } catch (err) {
        toast.error(normalizeError(err).message || 'Sosyal giriş başarısız.');
      }
    },
    [socialLogin, router, nextHref, locale],
  );

  // Facebook custom event listener
  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ accessToken: string; email?: string }>;
      finish({
        type: 'facebook',
        access_token: ce.detail.accessToken,
        email: ce.detail.email,
      });
    };
    window.addEventListener('gm:fb-token', handler as EventListener);
    return () => window.removeEventListener('gm:fb-token', handler as EventListener);
  }, [finish]);

  const triggerGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (!tokenResponse.access_token) return;
      finish({ type: 'google', access_token: tokenResponse.access_token });
    },
    onError: () => toast.error('Google ile giriş iptal edildi.'),
    scope: 'email profile',
  });

  return (
    <SocialButtonsInner
      canUseGoogle
      canUseFacebook={Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)}
      layout={layout}
      className={className}
      isLoading={isLoading}
      onGoogleClick={() => triggerGoogle()}
    />
  );
}

// ─── Public component ────────────────────────────────────────
export default function SocialLoginButtons(props: Props) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  if (!googleClientId && !facebookAppId) return null;

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <WithGoogle {...props} />
      </GoogleOAuthProvider>
    );
  }

  // Sadece Facebook varsa, Google provider'a sarmadan render et
  return (
    <FacebookOnly {...props} />
  );
}

function FacebookOnly({ nextHref, layout, className }: Props) {
  const router = useRouter();
  const locale = useLocaleShort();
  const [socialLogin, { isLoading }] = useSocialLoginMutation();

  React.useEffect(() => {
    const handler = async (e: Event) => {
      const ce = e as CustomEvent<{ accessToken: string; email?: string }>;
      try {
        const resp = await socialLogin({
          type: 'facebook',
          access_token: ce.detail.accessToken,
          email: ce.detail.email,
        }).unwrap();
        if ((resp as any).access_token) tokenStore.set((resp as any).access_token);
        toast.success('Giriş başarılı');
        router.push(nextHref || localizePath(locale, '/dashboard'));
      } catch (err) {
        toast.error(normalizeError(err).message || 'Sosyal giriş başarısız.');
      }
    };
    window.addEventListener('gm:fb-token', handler as EventListener);
    return () => window.removeEventListener('gm:fb-token', handler as EventListener);
  }, [socialLogin, router, nextHref, locale]);

  return (
    <SocialButtonsInner
      canUseGoogle={false}
      canUseFacebook
      layout={layout}
      className={className}
      isLoading={isLoading}
    />
  );
}
