'use client';

import React, { Fragment, useMemo, useEffect, lazy, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '../layout/header/Header';
import FooterTwo from '../layout/footer/Footer';
import ScrollProgress from '../layout/ScrollProgress';

import AnalyticsScripts from '../features/analytics/AnalyticsScripts';
import GAViewPages from '../features/analytics/GAViewPages';
import CookieConsentBanner from '../layout/banner/CookieConsentBanner';
import PwaRegistration from '../components/system/PwaRegistration';
import DevPaymentCardBanner from '../components/dev/DevPaymentCardBanner';
import { resetLayoutSeo } from '../seo';

const SitePopups = lazy(() => import('../layout/banner/SitePopups'));
const SupportBotWidget = lazy(() => import('../components/containers/chat/SupportBotWidget'));


export default function ClientLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  // Keep layout light: Header already fetches dynamic brand/settings on its own.
  const brand = useMemo(() => ({ name: 'GoldMoodAstro' }), []);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
     // Reset SEO store on route change
     resetLayoutSeo();
  }, [pathname, searchParams]);

  // Sync <html lang="..."> with current locale
  useEffect(() => {
    if (locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Global scroll reveal observer.
  // Hydration-safe: Önce body'ye `scroll-reveal-ready` class eklenir
  // (CSS `.reveal` opacity/transform geçişini bu noktadan sonra aktive eder).
  // Sonra observer kurulur ve `.visible` class eklenmesi başlar — hydration
  // çoktan tamamlanmış olduğu için SSR/CSR class mismatch oluşmaz.
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let raf1 = 0;
    let raf2 = 0;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      // 1) Reveal CSS'i aktive et (hydration tamamlandı)
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

    // Çift rAF: hydration commit + ilk paint sonrasına garantili erteleme
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
      <AnalyticsScripts />
      <GAViewPages />
      
      <Header brand={brand} locale={locale} />
      <main className="min-h-screen bg-bg-primary">
        {children}
      </main>

      <FooterTwo locale={locale} />
      <ScrollProgress />

      <CookieConsentBanner />
      <Suspense fallback={null}>
        <SitePopups />
      </Suspense>
      <Suspense fallback={null}>
        <SupportBotWidget />
      </Suspense>
      <DevPaymentCardBanner />
    </Fragment>
  );
}
