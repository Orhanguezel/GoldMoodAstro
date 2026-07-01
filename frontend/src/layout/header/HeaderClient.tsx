'use client';

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import HeaderOffcanvas from './HeaderOffcanvas';
import MegaMenuPanel from './MegaMenuPanel';
import { useGetSiteSettingByKeyQuery } from '@/integrations/rtk/hooks';
import { useGetMyConsultantStatsQuery } from '@/integrations/rtk/private/consultant_self.endpoints';
import type { PublicMenuItemDto, User } from '@/integrations/shared';
import { localizePath } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import { IconUser } from '@/components/ui/icons';
import ThemeToggle from '@/components/system/ThemeToggle';
import { trackEvent } from '@/integrations/telemetry';

// Menu comes only from DB (menu_items). There is no hardcoded fallback, so the
// client does not flicker from a correct menu to a stale local menu. If SSR fetch
// fails, the menu area stays empty while brand and right-side CTAs remain visible.

type MenuItemWithChildren = PublicMenuItemDto & {
  children?: MenuItemWithChildren[];
};

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

const cleanHashLink = (href: string) => {
  if (!href) return href;
  // Convert #about or /#about to /about
  if (href.startsWith('#')) return `/${href.substring(1)}`;
  if (href.startsWith('/#')) return `/${href.substring(2)}`;
  // Handle case like referanslar#about -> /about (assuming it's a home page section)
  if (href.includes('#')) return `/${href.split('#')[1]}`;
  return href;
};

type HeaderMegaMenuKind = 'astrology' | 'tarot';

function normalizeMenuToken(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveHeaderMegaMenuKind(item: MenuItemWithChildren, children: MenuItemWithChildren[]): HeaderMegaMenuKind | undefined {
  const parentToken = normalizeMenuToken(`${item.id ?? ''} ${item.title ?? ''} ${item.url ?? ''}`);

  if (
    parentToken.includes('mi-h-astrology') ||
    parentToken.includes('fb-astrology') ||
    parentToken.includes('astroloji') ||
    parentToken.includes('astrology') ||
    parentToken.includes('astrologie')
  ) {
    return 'astrology';
  }

  if (
    parentToken.includes('mi-h-fal') ||
    parentToken.includes('fb-fal') ||
    parentToken.includes('fal') ||
    parentToken.includes('tarot') ||
    parentToken.includes('divination') ||
    parentToken.includes('wahrsagung')
  ) {
    return 'tarot';
  }

  const childToken = normalizeMenuToken(
    children.map((child) => `${child.id ?? ''} ${child.title ?? ''} ${child.url ?? ''}`).join(' '),
  );

  if (
    childToken.includes('astro-birth') ||
    childToken.includes('birth-chart') ||
    childToken.includes('sinastri') ||
    childToken.includes('synastry') ||
    childToken.includes('yildiz') ||
    childToken.includes('yukselen') ||
    childToken.includes('rising-sign')
  ) {
    return 'astrology';
  }

  if (
    childToken.includes('fal-tarot') ||
    childToken.includes('tarot') ||
    childToken.includes('kahve-fali') ||
    childToken.includes('coffee') ||
    childToken.includes('ruya-tabiri') ||
    childToken.includes('dream')
  ) {
    return 'tarot';
  }

  return undefined;
}

type HeaderClientBrand = {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: Record<string, string>;
};

function getSettingString(value: unknown, key: string) {
  if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === 'string' && raw.trim() ? raw : undefined;
}

function roleToString(role: unknown): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (typeof role !== 'object' || role === null) return '';
  const raw = (role as { name?: unknown; role?: unknown }).name ?? (role as { role?: unknown }).role;
  return typeof raw === 'string' ? raw.toLowerCase() : '';
}

function hasUserRole(user: User | null, roleName: string) {
  const target = roleName.toLowerCase();
  if (roleToString(user?.role) === target) return true;
  return Array.isArray(user?.roles) && user.roles.some((role) => roleToString(role) === target);
}

type HeaderClientProps = {
  brand?: HeaderClientBrand;
  locale?: string;
  /** Menu items fetched on SSR to prevent RTK Query hydration mismatch. */
  initialMenuItems?: PublicMenuItemDto[];
};

const HeaderClient: React.FC<HeaderClientProps> = ({ brand, locale: localeProp, initialMenuItems }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nextQuery, setNextQuery] = useState('');
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const isConsultant = hasUserRole(user, 'consultant');

  // T29-4: pending instant request count for consultant badge in the header.
  const { data: consultantStats } = useGetMyConsultantStatsQuery(undefined, {
    skip: !isAuthenticated || !isConsultant,
    pollingInterval: 30_000,
  });
  const pendingRequestNow = consultantStats?.requested_now_count ?? 0;

  const locale = useLocaleShort(localeProp);
  const { ui } = useUiSection('ui_header', locale);

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });

  const resolvedBrand = useMemo(() => {
    const name =
      brand?.name ||
      getSettingString(companyBrandSetting?.value, 'name') ||
      getSettingString(contactInfoSetting?.value, 'companyName') ||
      'GoldMoodAstro';
    return { name };
  }, [brand?.name, contactInfoSetting?.value, companyBrandSetting?.value]);

  // Hydration strategy: Header.tsx prefetches on SSR and the client consumes
  // initialMenuItems. There is no RTK Query call here, which removes server/client
  // drift and avoids stale hardcoded menu flicker.
  const headerMenuItems: MenuItemWithChildren[] = useMemo(() => {
    if (initialMenuItems && initialMenuItems.length > 0) {
      return initialMenuItems.slice().sort((a, b) => ((a as any)?.order_num ?? 0) - ((b as any)?.order_num ?? 0)) as MenuItemWithChildren[];
    }
    return [];
  }, [initialMenuItems]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) setNextQuery(`?next=${encodeURIComponent(next)}`);
    }
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Detect dark hero/banner pages so the transparent header keeps enough contrast.
  const isHome = !pathname || pathname === '/' || /^\/(tr|en|de)\/?$/.test(pathname);
  const hasHeroOverlay = !scrolled && (
    isHome ||
    pathname?.includes('/become-consultant')
  );

  const homeHref = localizePath(locale, '/');
  const consultantsHref = localizePath(locale, '/consultants');
  const consultantPanelHref = localizePath(locale, '/me/consultant');
  const authNextQuery = nextQuery || (pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '');

  return (
    <Fragment>
      <HeaderOffcanvas open={open} onClose={() => setOpen(false)} brand={resolvedBrand} locale={locale} />

      <header data-test-marker="antigravity-fix-v1" className="relative z-[1000]">
        <nav
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-500 px-6 lg:px-12
            ${scrolled
              ? 'py-4 bg-[var(--gm-bg)]/92 backdrop-blur-[12px] border-b border-[var(--gm-border-soft)] shadow-sm'
              : 'py-6 lg:py-8 bg-transparent'
            }`}
        >
          {/* Brand Logo (Branded Text) */}
          <Link href={homeHref} className="flex flex-col items-center no-underline group">
            <span className="font-display font-semibold text-[16px] lg:text-[18px] tracking-[0.18em] text-[var(--gm-gold-deep)] transition-colors group-hover:text-[var(--gm-gold)]">
              GOLD MOOD
            </span>
            <span className={`font-display text-[9px] lg:text-[10px] tracking-[0.32em] mt-0.5 transition-colors ${
              hasHeroOverlay ? 'text-white/50' : 'text-[var(--gm-text-dim)]'
            }`}>
              ASTROLOGY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-12">
            <ul className="flex gap-8 list-none m-0 p-0 items-center">
              {headerMenuItems.map((item) => {
                const rawUrl = (item.url || '') as string;
                const label = item.title || 'Link';
                const children = item.children ?? [];
                const hasChildren = children.length > 0;
                const href = rawUrl
                  ? (isExternalHref(rawUrl) ? rawUrl : localizePath(locale, cleanHashLink(rawUrl)))
                  : '#';

                if (hasChildren) {
                  let expertiseFilter: string | undefined;
                  let panelEyebrow: string | undefined;
                  const consultantsHeading = ui('ui_header_mega_consultants_heading', 'Featured Consultants');
                  let allConsultantsExpertise: string | undefined;
                  const megaMenuKind = resolveHeaderMegaMenuKind(item, children);

                  if (megaMenuKind === 'astrology') {
                    expertiseFilter = 'astrology';
                    allConsultantsExpertise = 'astrology';
                    panelEyebrow = label;
                  } else if (megaMenuKind === 'tarot') {
                    expertiseFilter = 'tarot';
                    allConsultantsExpertise = 'tarot';
                    panelEyebrow = label;
                  }

                  return (
                    // key'e pathname ekli: navigasyon sonrası li remount olur → yeni
                    // element :hover almaz (imleç hareket edene dek) → CSS-hover mega
                    // menü paneli otomatik kapanır. (Mobil zaten pathname ile kapanır.)
                    <li key={`${item.id}-${pathname}`} className="static group/dd">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 py-3 font-serif text-[13px] font-normal tracking-[0.05em] transition-colors cursor-default ${
                          hasHeroOverlay
                            ? 'text-white/90 hover:text-amber-300'
                            : 'text-[var(--gm-text)] hover:text-[var(--gm-primary)]'
                        }`}
                      >
                        {label}
                        <ChevronDown className="w-3 h-3 transition-transform group-hover/dd:rotate-180" />
                      </button>
                      <div className="absolute left-0 right-0 top-full -mt-6 pt-6 opacity-0 invisible group-hover/dd:opacity-100 group-hover/dd:visible transition-all duration-200 delay-200 group-hover/dd:delay-0 z-50 pointer-events-none group-hover/dd:pointer-events-auto">
                        <div className="mx-auto w-fit px-6 lg:px-12 drop-shadow-2xl pt-2">
                          <MegaMenuPanel
                            links={children.map((c) => ({ id: c.id, url: (c as any).url, title: c.title }))}
                            expertise={expertiseFilter}
                            locale={locale}
                            consultantsHeading={consultantsHeading}
                            allConsultantsLabel={ui('ui_header_mega_see_all', 'See All')}
                            allConsultantsExpertise={allConsultantsExpertise}
                            panelEyebrow={panelEyebrow || label}
                            limit={expertiseFilter ? 4 : 0}
                          />
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className={`font-serif text-[13px] font-normal tracking-[0.05em] transition-colors relative group ${
                        hasHeroOverlay
                          ? 'text-white/90 hover:text-amber-300'
                          : 'text-[var(--gm-text)] hover:text-[var(--gm-gold-deep)]'
                      }`}
                    >
                      {label}
                      <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[var(--gm-gold)] transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              {/* Consultants see their own panel; regular authenticated users see dashboard. */}
              {isAuthenticated && !isConsultant && (
                <Link
                  href={localizePath(locale, '/dashboard')}
                  className={`inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.18em] uppercase transition-colors ${
                    hasHeroOverlay
                      ? 'text-white hover:text-amber-200 drop-shadow-md'
                      : 'text-[var(--gm-gold-deep)] hover:text-[var(--gm-gold)]'
                  }`}
                  title={ui('ui_header_dashboard_title', 'Dashboard')}
                >
                  <IconUser className="w-4 h-4" />
                  {ui('ui_header_dashboard', 'Dashboard')}
                </Link>
              )}
              {isConsultant && (
                <Link
                  href={consultantPanelHref}
                  className={`relative inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.18em] uppercase transition-colors ${
                    hasHeroOverlay
                      ? 'text-amber-300 hover:text-white drop-shadow-md'
                      : 'text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)]'
                  }`}
                  title={ui('ui_header_consultant_panel', 'Consultant Panel')}
                >
                  {ui('ui_header_consultant_panel', 'Consultant Panel')}
                  {pendingRequestNow > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--gm-error)] text-[var(--gm-text)] text-[10px] font-bold animate-pulse">
                      ⚡{pendingRequestNow}
                    </span>
                  )}
                </Link>
              )}
              {/* Auth links */}
              {!isAuthenticated && (
                <div className="flex items-center gap-3">
                  <Link 
                    href={`${localizePath(locale, '/login')}${authNextQuery}`}
                    className={`text-[11px] font-bold tracking-[0.15em] uppercase transition-colors px-4 py-2 border rounded-full ${
                      hasHeroOverlay
                        ? 'border-white/45 text-white hover:border-amber-300 hover:text-amber-200'
                        : 'border-[var(--gm-gold)]/40 text-[var(--gm-gold)] hover:border-[var(--gm-gold)] hover:text-[var(--gm-gold-light)]'
                    }`}
                  >
                    {ui('ui_header_login', 'Login')}
                  </Link>
                  <Link 
                    href={`${localizePath(locale, '/register')}${authNextQuery}`}
                    onClick={() => trackEvent('signup_start').catch(() => {})}
                    className="text-[11px] font-bold tracking-[0.15em] uppercase text-white bg-[var(--gm-primary)] hover:bg-[var(--gm-primary-light)] transition-colors px-4 py-2 rounded-full shadow-[var(--gm-glow-primary)] hover:shadow-lg"
                  >
                    {ui('ui_header_signup', 'Sign Up')}
                  </Link>
                </div>
              )}

              {/* Consultant CTA */}
              {!isConsultant && (
                <Link
                  href={localizePath(locale, '/become-consultant')}
                  className={`text-[10px] uppercase tracking-[0.15em] transition-colors underline underline-offset-4 ${
                    hasHeroOverlay
                      ? 'text-white/80 hover:text-white decoration-white/30 hover:decoration-white drop-shadow-md'
                      : 'text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] decoration-[var(--gm-border-soft)] hover:decoration-[var(--gm-gold)]'
                  }`}
                >
                  {ui('ui_header_join_consultant', 'Join as Consultant')}
                </Link>
              )}

              {/* Public consultant list CTA; hidden for consultant accounts. */}
              {!isConsultant && (
                <Link href={consultantsHref} className="btn-premium py-2.5 px-6 text-[12px]">
                  {ui('ui_header_cta', 'Find a Consultant')}
                </Link>
              )}

              {/* Hamburger Toggle */}
              <button
                type="button"
                aria-label={ui('ui_header_open_menu', 'Open menu')}
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
            {isAuthenticated ? (
              <Link href={localizePath(locale, '/profile')} className="p-2 text-[var(--gm-text)]">
                <IconUser className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                href={`${localizePath(locale, '/login')}${authNextQuery}`}
                className="p-2 text-[var(--gm-gold)]"
              >
                <IconUser className="w-5 h-5" />
              </Link>
            )}
            <button
              type="button"
              aria-label={
                mobileOpen
                  ? ui('ui_header_close_mobile_menu', 'Close mobile menu')
                  : ui('ui_header_open_mobile_menu', 'Open mobile menu')
              }
              aria-expanded={mobileOpen}
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
          className={`fixed inset-0 z-[40] bg-[var(--gm-bg)]/98 backdrop-blur-xl transition-all duration-500 lg:hidden flex flex-col items-center overflow-y-auto px-6 pb-10 pt-28 text-center
            ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        >
          <ul className="flex w-full max-w-sm flex-col gap-3 list-none m-0 p-0 mb-8">
            {headerMenuItems.map((item) => {
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              const itemUrl = item.url || '';
              return (
                <li key={item.id} className="w-full text-center">
                  {hasChildren ? (
                    <details className="group/m rounded-2xl border border-transparent open:border-[var(--gm-border-soft)] open:bg-[var(--gm-surface)]/55 open:px-3 open:py-3 open:shadow-[var(--gm-shadow-soft)] transition-all">
                      <summary className="flex min-h-12 items-center justify-center gap-2 cursor-pointer font-display text-[1.35rem] tracking-[0.16em] text-[var(--gm-gold)] list-none [&::-webkit-details-marker]:hidden">
                        {item.title}
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open/m:rotate-180" />
                      </summary>
                      <ul className="mt-2 flex flex-col gap-1 list-none rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg)]/45 p-2">
                        {children.map((c) => {
                          const cu = c.url || '#';
                          return (
                            <li key={c.id}>
                              <Link
                                href={isExternalHref(cu) ? cu : localizePath(locale, cleanHashLink(cu))}
                                className="block rounded-lg px-4 py-2.5 font-serif text-base italic text-[var(--gm-text-dim)] transition-colors hover:bg-[var(--gm-primary)]/10 hover:text-[var(--gm-gold)]"
                                onClick={() => setMobileOpen(false)}
                              >
                                {c.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ) : (
                    <Link
                      href={itemUrl ? (isExternalHref(itemUrl) ? itemUrl : localizePath(locale, cleanHashLink(itemUrl))) : '#'}
                      className="flex min-h-12 items-center justify-center rounded-2xl px-3 font-display text-[1.35rem] tracking-[0.16em] text-[var(--gm-gold)] transition-colors hover:bg-[var(--gm-surface)]/55"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          {!isConsultant && (
            <Link href={consultantsHref} className="btn-premium w-full max-w-xs text-center mb-4" onClick={() => setMobileOpen(false)}>
              {ui('ui_header_cta', 'Find a Consultant')}
            </Link>
          )}

          {!isAuthenticated && (
            <div className="flex flex-col w-full max-w-xs gap-3">
              <Link 
                href={`${localizePath(locale, '/register')}${authNextQuery}`}
                onClick={() => {
                  setMobileOpen(false);
                  trackEvent('signup_start').catch(() => {});
                }}
                className="w-full flex items-center justify-center rounded-full bg-[var(--gm-primary)] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[var(--gm-primary-light)]"
              >
                {ui('ui_header_signup', 'Sign Up')}
              </Link>
              <Link 
                href={`${localizePath(locale, '/login')}${authNextQuery}`}
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center rounded-full border border-[var(--gm-gold)]/40 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--gm-gold)] transition-colors hover:border-[var(--gm-gold)]"
              >
                {ui('ui_header_login', 'Login')}
              </Link>
            </div>
          )}

          {!isConsultant && (
            <Link 
              href={localizePath(locale, '/become-consultant')} 
              className="mt-6 text-[11px] uppercase tracking-[0.15em] text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors underline decoration-[var(--gm-border-soft)] underline-offset-4"
              onClick={() => setMobileOpen(false)}
            >
              {ui('ui_header_join_consultant_long', 'Join as Consultant')}
            </Link>
          )}
          {isConsultant && (
            <Link
              href={consultantPanelHref}
              className="mt-4 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-[var(--gm-gold)]/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gm-gold)]"
              onClick={() => setMobileOpen(false)}
            >
              {ui('ui_header_consultant_panel', 'Consultant Panel')}
              {pendingRequestNow > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--gm-error)] text-[var(--gm-text)] text-[10px] font-bold animate-pulse">
                  ⚡{pendingRequestNow}
                </span>
              )}
            </Link>
          )}
        </div>
      </header>
    </Fragment>
  );
};

export default HeaderClient;
