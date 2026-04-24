'use client';

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import HeaderOffcanvas from './HeaderOffcanvas';
import { SiteLogo } from '@/layout/SiteLogo';

import { useListMenuItemsQuery, useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import type { PublicMenuItemDto } from '@/integrations/shared';

import { localizePath } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTheme } from '@/components/system/ThemeProvider';
import { IconUser } from '@/components/ui/icons';

type SimpleBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

type Props = { brand?: SimpleBrand; locale?: string };

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

const HeaderClient: React.FC<Props> = ({ brand, locale: localeProp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const locale = useLocaleShort(localeProp);
  const { ui } = useUiSection('ui_header', locale);

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });

  const brandFromSettings = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const socials = (socialsSetting?.value ?? {}) as Record<string, string>;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const name = (brandVal?.name as string) || (contact?.companyName as string) || 'Energetische Massage';
    const website = (brandVal?.website as string) || (contact?.website as string) || '';
    const phones = Array.isArray(contact?.phones) ? contact.phones : [];
    const phone = (phones[0] as string | undefined) || (contact?.whatsappNumber as string | undefined) || (brandVal?.phone as string | undefined) || '';
    const email = (contact?.email as string) || (brandVal?.email as string) || '';
    const mergedSocials: Record<string, string> = { ...(brandVal?.socials as Record<string, string> | undefined), ...(socials ?? {}) };
    const logo = (brandVal?.logo || (Array.isArray(brandVal?.images) ? brandVal.images[0] : null) || {}) as { url?: string; width?: number; height?: number };
    return { name, website, phone, email, socials: mergedSocials, logo };
  }, [contactInfoSetting?.value, socialsSetting?.value, companyBrandSetting?.value]);

  const resolvedBrand = useMemo(() => ({
    ...brandFromSettings,
    ...(brand ?? {}),
    socials: { ...(brandFromSettings.socials ?? {}), ...(brand?.socials ?? {}) },
  }), [brandFromSettings, brand]);

  const { data: menuData, isLoading: isMenuLoading } = useListMenuItemsQuery({
    location: 'header', is_active: true, locale, nested: true,
  });

  const headerMenuItems: MenuItemWithChildren[] = useMemo(() => {
    const raw = menuData as any;
    const list: MenuItemWithChildren[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    const sortRecursive = (items: MenuItemWithChildren[]): MenuItemWithChildren[] =>
      items.slice().sort((a, b) => ((a as any)?.order_num ?? 0) - ((b as any)?.order_num ?? 0))
        .map((it) => ({ ...it, children: it.children ? sortRecursive(it.children as MenuItemWithChildren[]) : undefined }));
    return sortRecursive(list);
  }, [menuData]);

  // Scroll detection
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const homeHref = localizePath(locale, '/');
  const appointmentHref = localizePath(locale, '/appointment');

  const linkClass = `relative text-[0.82rem] font-normal tracking-[0.12em] uppercase text-text-secondary hover:text-brand-primary transition-colors
    after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-brand-primary after:transition-all after:duration-400 hover:after:w-full`;

  return (
    <Fragment>
      <HeaderOffcanvas open={open} onClose={() => setOpen(false)} brand={resolvedBrand} locale={locale} />

      <header>
        <nav
          id="header-sticky"
          className={`fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between transition-all duration-500
            ${scrolled
              ? 'py-3 bg-bg-primary/92 backdrop-blur-[20px] backdrop-saturate-[1.4] border-b border-border-light'
              : 'py-5 bg-transparent'
            }`}
          style={{ paddingLeft: '4%', paddingRight: '4%' }}
        >
          {/* Brand */}
          <Link href={homeHref} className="flex items-center gap-3 no-underline">
            <SiteLogo
              variant="light"
              alt={resolvedBrand.name}
              wrapperClassName="w-10! h-10! max-w-10!"
              className="w-10! h-10! max-w-10! rounded-full object-cover border border-brand-primary/60 transition-transform duration-300 hover:scale-[1.08]"
            />
            <span className="font-serif text-[0.7rem] sm:text-[1.1rem] lg:text-[1.35rem] font-normal tracking-[0.1em] sm:tracking-[0.15em] text-brand-primary uppercase">
              {resolvedBrand.name}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden lg:flex gap-10 list-none m-0 p-0 items-center">
            {headerMenuItems.map((item) => {
              const rawUrl = (item.url || (item as any).href || '#') as string;
              const label = (item.title || rawUrl) as string;
              const external = isExternalHref(rawUrl);
              const href = external ? rawUrl : localizePath(locale, rawUrl);

              return (
                <li key={String(item.id ?? rawUrl)}>
                  {external ? (
                    <a href={href} target={/^https?:\/\//i.test(rawUrl) ? '_blank' : undefined}
                       rel={/^https?:\/\//i.test(rawUrl) ? 'noopener noreferrer' : undefined}
                       className={linkClass}>
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className={linkClass}>
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}

            {/* CTA Button */}
            <li>
              <Link
                href={appointmentHref}
                className="py-2.5 px-7 bg-transparent border border-brand-primary text-brand-primary text-[0.75rem] tracking-[0.15em] uppercase transition-all duration-400 hover:bg-brand-primary hover:text-bg-primary no-underline"
              >
                {ui('ui_header_cta', 'Termin Buchen')}
              </Link>
            </li>

            {/* Theme Toggle */}
            {mounted && (
              <li>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border-light text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </li>
            )}
          </ul>

          {/* Right: Profile + Hamburger */}
          <div className="flex items-center gap-4">
            {mounted && isAuthenticated && (
              <Link
                href={localizePath(locale, '/profile')}
                aria-label="Profile"
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-brand-light transition-colors"
              >
                <IconUser className="w-5 h-5 text-text-secondary" />
              </Link>
            )}

            {/* Desktop hamburger (offcanvas) */}
            <button
              type="button"
              className="hidden lg:flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1"
              aria-label={ui('ui_header_open_menu', 'Open Menu')}
              onClick={() => setOpen(true)}
            >
              <span className="w-[26px] h-[1.5px] bg-brand-primary transition-all" />
              <span className="w-[18px] ml-auto h-[1.5px] bg-brand-primary transition-all" />
              <span className="w-[26px] h-[1.5px] bg-brand-primary transition-all" />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              className={`lg:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1 transition-all ${mobileOpen ? 'rotate-90' : ''}`}
              aria-label={ui('ui_header_open_sidebar', 'Open Sidebar')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className={`w-[26px] h-[1.5px] bg-brand-primary transition-all ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
              <span className={`w-[26px] h-[1.5px] bg-brand-primary transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`w-[26px] h-[1.5px] bg-brand-primary transition-all ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        <div
          className={`fixed top-0 left-0 right-0 z-[999] bg-bg-primary/97 backdrop-blur-[20px] border-b border-border-light transition-all duration-300 lg:hidden
            ${mobileOpen ? 'translate-y-[72px] opacity-100 visible' : '-translate-y-full opacity-0 invisible'}`}
        >
          <div className="flex flex-col gap-3 p-6">
            {headerMenuItems.map((item) => {
              const rawUrl = (item.url || (item as any).href || '#') as string;
              const label = (item.title || rawUrl) as string;
              const external = isExternalHref(rawUrl);
              const href = external ? rawUrl : localizePath(locale, rawUrl);

              return external ? (
                <a key={String(item.id ?? rawUrl)} href={href}
                   className="text-text-secondary hover:text-brand-primary text-sm uppercase tracking-[0.12em] py-2 transition-colors"
                   onClick={() => setMobileOpen(false)}>
                  {label}
                </a>
              ) : (
                <Link key={String(item.id ?? rawUrl)} href={href}
                      className="text-text-secondary hover:text-brand-primary text-sm uppercase tracking-[0.12em] py-2 transition-colors"
                      onClick={() => setMobileOpen(false)}>
                  {label}
                </Link>
              );
            })}
            <Link
              href={appointmentHref}
              className="mt-2 py-3 text-center bg-brand-primary text-bg-primary text-sm uppercase tracking-[0.15em] font-medium transition-colors hover:bg-brand-hover"
              onClick={() => setMobileOpen(false)}
            >
              {ui('ui_header_cta', 'Termin Buchen')}
            </Link>
            {mounted && (
              <button type="button" onClick={toggleTheme}
                className="mt-1 py-2 text-text-muted text-sm flex items-center justify-center gap-2">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            )}
          </div>
        </div>
      </header>
    </Fragment>
  );
};

export default HeaderClient;
