'use client';

import React, { Fragment, useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '../layout/header/Header';
import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';
import FooterTwo from '../layout/footer/Footer';
import ScrollProgress from '../layout/ScrollProgress';

import CookieConsentBanner from '../layout/banner/CookieConsentBanner';
import PwaRegistration from '../components/system/PwaRegistration';
import DevPaymentCardBanner from '../components/dev/DevPaymentCardBanner';
import { resetLayoutSeo } from '../seo';
import { trackEvent } from '../integrations/telemetry';

const SitePopups = dynamic(() => import('../layout/banner/SitePopups'), {
  ssr: false,
  loading: () => null,
});
const SupportBotWidget = dynamic(() => import('../components/containers/chat/SupportBotWidget'), {
  ssr: false,
  loading: () => null,
});
const AnalyticsScripts = dynamic(() => import('../features/analytics/AnalyticsScripts'), {
  ssr: false,
  loading: () => null,
});
const GAViewPages = dynamic(() => import('../features/analytics/GAViewPages'), {
  ssr: false,
  loading: () => null,
});


import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';

export default function ClientLayout({
  children,
  locale,
  initialMenuItems,
  initialFooterSections,
  initialFooterMenuItems,
}: {
  children: React.ReactNode;
  locale?: string;
  initialMenuItems?: PublicMenuItemDto[];
  initialFooterSections?: FooterSectionDto[];
  initialFooterMenuItems?: PublicMenuItemDto[];
}) {
  const { brand } = useBrand();
  const { ui } = useUiSection('ui_extra' as any);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deferWidgets, setDeferWidgets] = useState(false);

  useEffect(() => {
     // Reset SEO store on route change
     resetLayoutSeo();
     // Track page view
     trackEvent('page_view').catch(() => {});
  }, [pathname, searchParams]);

  // ChunkLoadError global handler: after a deploy, stale cached HTML may point to
  // old chunk hashes. Catch it once and hard reload to fetch fresh HTML.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const KEY = 'gm_chunk_reload_at';
    const isChunkError = (msg: string) =>
      /ChunkLoadError|Loading chunk|chunks\/.*\.js.*(failed|404)|Failed to fetch dynamically imported module/i.test(msg);
    const reloadOnce = () => {
      try {
        const last = Number(sessionStorage.getItem(KEY) || 0);
        if (Date.now() - last < 10_000) return;
        sessionStorage.setItem(KEY, String(Date.now()));
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.set('_r', String(Date.now()));
      window.location.replace(url.toString());
    };
    const onError = (e: ErrorEvent) => {
      if (isChunkError(`${e.message} ${e.filename}`)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e.reason;
      const msg = `${reason?.name || ''} ${reason?.message || ''} ${reason?.request || ''}`;
      if (isChunkError(msg)) reloadOnce();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let done = false;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const loadDeferred = () => {
      if (done) return;
      done = true;
      setDeferWidgets(true);
      removeInteractionListeners();
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) {
        globalThis.clearTimeout(timerId);
      }
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    function removeInteractionListeners() {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, loadDeferred);
      });
    }

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, loadDeferred, { once: true, passive: true });
    });

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadDeferred, { timeout: 3500 });
    } else {
      timerId = globalThis.setTimeout(loadDeferred, 3500);
    }

    return () => {
      done = true;
      removeInteractionListeners();
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) {
        globalThis.clearTimeout(timerId);
      }
    };
  }, []);

  // Sync <html lang="..."> with current locale
  useEffect(() => {
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Global scroll reveal observer.
  // Hydration-safe: add `scroll-reveal-ready` after hydration, then observe and
  // apply `.visible` without SSR/CSR class mismatch.
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let raf1 = 0;
    let raf2 = 0;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      // Activate reveal CSS after hydration.
      document.body.classList.add('scroll-reveal-ready');

      // 2) Observer kur
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -20px 0px' },
      );

      const scan = () => {
        document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io!.observe(el));
      };

      scan();
      mo = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scan, 100);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    };

    // Double rAF defers until after hydration commit and first paint.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(init);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      io?.disconnect();
      mo?.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [pathname]);

  return (
    <Fragment>
      <PwaRegistration />
      {deferWidgets && (
        <>
          <AnalyticsScripts />
          <GAViewPages />
        </>
      )}
      <a href="#main-content" className="skip-link">
        {ui('ui_extra_b0_skip_to_main', 'Skip to main content')}
      </a>
      
      <Header brand={brand} locale={locale} initialMenuItems={initialMenuItems} />
      <main id="main-content" className="min-h-screen bg-(--gm-bg)" tabIndex={-1}>
        {children}
      </main>

      <FooterTwo
        locale={locale}
        initialFooterSections={initialFooterSections}
        initialFooterMenuItems={initialFooterMenuItems}
      />
      <ScrollProgress />

      <CookieConsentBanner />
      {deferWidgets && (
        <>
          <SitePopups />
          <SupportBotWidget />
        </>
      )}
      <DevPaymentCardBanner />
    </Fragment>
  );
}
