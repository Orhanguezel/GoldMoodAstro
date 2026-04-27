'use client';

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import HeaderOffcanvas from './HeaderOffcanvas';
import { useListMenuItemsQuery, useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { PublicMenuItemDto } from '@/integrations/shared';
import { localizePath } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import { IconUser } from '@/components/ui/icons';
import ThemeToggle from '@/components/system/ThemeToggle';

// Menu API boş gelirse gösterilecek varsayılan linkler.
// API'den gelen menü her zaman önceliklidir.
const FALLBACK_MENU: Array<{ id: string; url: string; label: Record<string, string> }> = [
  { id: 'fallback-home',        url: '/',            label: { tr: 'Ana Sayfa',   en: 'Home',         de: 'Startseite' } },
  { id: 'fallback-consultants', url: '/consultants', label: { tr: 'Danışmanlar', en: 'Consultants',  de: 'Berater' } },
  { id: 'fallback-daily',       url: '/daily',       label: { tr: 'Günlük Yorum',en: 'Daily',        de: 'Täglich' } },
  { id: 'fallback-birth-chart', url: '/birth-chart', label: { tr: 'Doğum Haritası', en: 'Birth Chart', de: 'Geburtschart' } },
  { id: 'fallback-blog',        url: '/blog',        label: { tr: 'Blog',        en: 'Blog',         de: 'Blog' } },
  { id: 'fallback-about',       url: '/about',       label: { tr: 'Hakkımızda',  en: 'About',        de: 'Über uns' } },
  { id: 'fallback-contact',     url: '/contact',     label: { tr: 'İletişim',    en: 'Contact',      de: 'Kontakt' } },
];

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

type HeaderClientBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

const HeaderClient: React.FC<{ brand?: HeaderClientBrand; locale?: string }> = ({ brand, locale: localeProp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const locale = useLocaleShort(localeProp);
  const { ui } = useUiSection('ui_header', locale);

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });

  const resolvedBrand = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const name = brand?.name || (brandVal?.name as string) || (contact?.companyName as string) || 'GoldMoodAstro';
    return { name };
  }, [brand?.name, contactInfoSetting?.value, companyBrandSetting?.value]);

  const { data: menuData } = useListMenuItemsQuery({
    location: 'header', is_active: true, locale, nested: true,
  });

  const headerMenuItems: MenuItemWithChildren[] = useMemo(() => {
    const raw = menuData as any;
    const list: MenuItemWithChildren[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    if (list.length > 0) {
      return list.slice().sort((a, b) => ((a as any)?.order_num ?? 0) - ((b as any)?.order_num ?? 0));
    }
    // API'de menü tanımlı değilse — varsayılan linkleri locale'e göre üret
    return FALLBACK_MENU.map((m) => ({
      id: m.id,
      url: m.url,
      title: m.label[locale] || m.label.tr,
    } as MenuItemWithChildren));
  }, [menuData, locale]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const homeHref = localizePath(locale, '/');
  const consultantsHref = localizePath(locale, '/consultants');

  return (
    <Fragment>
      <HeaderOffcanvas open={open} onClose={() => setOpen(false)} brand={resolvedBrand} locale={locale} />

      <header className="relative z-[1000]">
        <nav
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 px-6 lg:px-12
            ${scrolled
              ? 'py-4 bg-[var(--gm-bg)]/92 backdrop-blur-[12px] border-b border-[var(--gm-border-soft)] shadow-sm'
              : 'py-6 lg:py-8 bg-transparent'
            }`}
        >
          {/* Brand Logo (Branded Text) */}
          <Link href={homeHref} className="flex flex-col items-center no-underline group">
            <span className="font-display font-semibold text-[16px] lg:text-[18px] tracking-[0.18em] text-[var(--gm-gold)] transition-colors group-hover:text-[var(--gm-gold-light)]">
              GOLD MOOD
            </span>
            <span className="font-display text-[9px] lg:text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] mt-0.5">
              ASTROLOGY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-12">
            <ul className="flex gap-10 list-none m-0 p-0 items-center">
              {headerMenuItems.map((item) => {
                const rawUrl = (item.url || '#') as string;
                const label = item.title || 'Link';
                const href = isExternalHref(rawUrl) ? rawUrl : localizePath(locale, rawUrl);

                return (
                  <li key={item.id}>
                    <Link href={href} className="font-serif text-[13px] font-normal tracking-[0.05em] text-[var(--gm-text)] hover:text-[var(--gm-gold-deep)] transition-colors relative group">
                      {label}
                      <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[var(--gm-gold)] transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              {isAuthenticated && (
                <Link
                  href={localizePath(locale, '/dashboard')}
                  className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.18em] uppercase text-[var(--gm-text)] hover:text-[var(--gm-gold-deep)] transition-colors"
                  title={locale === 'tr' ? 'Panelim' : 'Dashboard'}
                >
                  <IconUser className="w-4 h-4" />
                  {locale === 'tr' ? 'Panel' : 'Dashboard'}
                </Link>
              )}
              <Link href={consultantsHref} className="btn-premium py-2.5 px-6 text-[12px]">
                {ui('ui_header_cta', 'DANIŞMAN BUL')}
              </Link>

              {/* Hamburger Toggle */}
              <button
                type="button"
                className="flex flex-col gap-1.5 cursor-pointer group"
                onClick={() => setOpen(true)}
              >
                <span className="w-6 h-[1px] bg-[var(--gm-gold)] transition-all group-hover:w-8" />
                <span className="w-8 h-[1px] bg-[var(--gm-gold)]" />
                <span className="w-6 h-[1px] bg-[var(--gm-gold)] ml-auto transition-all group-hover:w-8" />
              </button>
            </div>
          </div>

          {/* Mobile Right */}
          <div className="flex lg:hidden items-center gap-3">
            <ThemeToggle />
            {isAuthenticated && (
              <Link href={localizePath(locale, '/profile')} className="p-2 text-[var(--gm-text)]">
                <IconUser className="w-5 h-5" />
              </Link>
            )}
            <button
              type="button"
              className="flex flex-col gap-1.5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className={`w-6 h-[1px] bg-[var(--gm-gold)] transition-all ${mobileOpen ? 'rotate-45 translate-y-[7.5px]' : ''}`} />
              <span className={`w-6 h-[1px] bg-[var(--gm-gold)] ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`w-6 h-[1px] bg-[var(--gm-gold)] transition-all ${mobileOpen ? '-rotate-45 -translate-y-[7.5px]' : ''}`} />
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        <div
          className={`fixed inset-0 z-[40] bg-[var(--gm-bg)]/98 backdrop-blur-xl transition-all duration-500 lg:hidden flex flex-col justify-center items-center px-12 text-center
            ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        >
          <ul className="flex flex-col gap-8 list-none m-0 p-0 mb-12">
            {headerMenuItems.map((item) => (
              <li key={item.id}>
                <Link 
                  href={isExternalHref(item.url!) ? item.url! : localizePath(locale, item.url!)}
                  className="font-display text-2xl tracking-widest text-[var(--gm-gold)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={consultantsHref} className="btn-premium w-full max-w-xs text-center" onClick={() => setMobileOpen(false)}>
            {ui('ui_header_cta', 'DANIŞMAN BUL')}
          </Link>
        </div>
      </header>
    </Fragment>
  );
};

export default HeaderClient;
