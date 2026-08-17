'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import SocialLinks from '@/components/common/public/SocialLinks';
import { ShieldCheck, Lock } from 'lucide-react';
import {
  useGetSiteSettingByKeyQuery,
  useListFooterSectionsQuery,
  useListMenuItemsQuery,
} from '@/integrations/rtk/hooks';

import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';

export type FooterProps = {
  locale?: string;
  /** Footer sections fetched on SSR to prevent RTK Query loading flicker. */
  initialFooterSections?: FooterSectionDto[];
  /** Footer menu items fetched on SSR (location='footer'). */
  initialFooterMenuItems?: PublicMenuItemDto[];
};
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { useAuthStore } from '@/features/auth/auth.store';
import { trackEvent } from '@/integrations/telemetry';

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

const cleanHashLink = (href: string) => {
  if (!href) return href;
  if (href === '/') return href;
  if (href.startsWith('#')) return `/${href.substring(1)}`;
  if (href.startsWith('/#')) return `/${href.substring(2)}`;
  if (href.includes('#')) return `/${href.split('#')[1]}`;
  return href;
};

// Footer links come only from DB (footer_sections + menu_items location='footer').
// There is no hardcoded link fallback; while data loads, the link area stays empty.

type FooterRenderSection = {
  id: string;
  title: string;
  items: Array<{ id: string; url: string; title: string }>;
};

// Ödeme rozetleri — gerçek marka renkleriyle, beyaz kart üzerinde.
// Renkler markaların resmi değerleri: Visa #1A1F71, Mastercard #EB001B/#F79E1B,  theme-lint-ignore
// PayPal #002991/#009CDE, Stripe #635BFF.  theme-lint-ignore
// Gömülü SVG zorunlu: sitenin CSP'si dış kaynaktan görsel çekmeye izin vermiyor,
// yani CDN'den logo çekilse hiç görünmezdi.
// Rozet zemini kasıtlı beyaz: kart şemalarının marka rehberi logoyu açık zemin
// üzerinde ister, tema koyu/açık fark etmez. theme-lint-ignore
const BADGE_CLASS =
  'inline-flex h-9 w-14 items-center justify-center rounded-lg bg-white px-2 shadow-sm ring-1 ring-black/10'; // theme-lint-ignore

function PaymentBadge({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span title={label} className={BADGE_CLASS}>
      <svg role="img" aria-label={label} viewBox="0 0 24 24" className="h-5 w-auto">
        <title>{label}</title>
        {children}
      </svg>
    </span>
  );
}

const VISA_PATH =
  'M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z';

const PAYPAL_PATH =
  'M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z';

const STRIPE_PATH =
  'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z';

const Footer: React.FC<FooterProps> = ({ locale: localeProp, initialFooterSections, initialFooterMenuItems }) => {
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale;
  const { ui } = useUiSection('ui_footer', locale);
  const { isAuthenticated } = useAuthStore();

  // Skip RTK Query when SSR initial data is present to avoid flicker.
  const hasInitialSections = Array.isArray(initialFooterSections) && initialFooterSections.length > 0;
  const hasInitialMenuItems = Array.isArray(initialFooterMenuItems) && initialFooterMenuItems.length > 0;

  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale });

  const socials = useMemo(() => {
    const socialsVal = (socialsSetting?.value ?? {}) as Record<string, string>;
    return { ...socialsVal };
  }, [socialsSetting?.value]);

  const { data: footerSections } = useListFooterSectionsQuery(
    { is_active: true, order: 'display_order.asc', locale },
    { skip: hasInitialSections },
  );
  const sections: FooterSectionDto[] = useMemo(() => {
    const source = hasInitialSections ? initialFooterSections! : (footerSections ?? []);
    return source.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as FooterSectionDto[];
  }, [footerSections, hasInitialSections, initialFooterSections]);

  const { data: footerMenuData } = useListMenuItemsQuery(
    { location: 'footer', is_active: true, locale },
    { skip: hasInitialMenuItems },
  );
  const footerMenuItems: PublicMenuItemDto[] = useMemo(() => {
    if (hasInitialMenuItems) return initialFooterMenuItems!;
    return footerMenuData?.items ?? [];
  }, [footerMenuData, hasInitialMenuItems, initialFooterMenuItems]);

  const itemsBySectionId = useMemo(() => {
    const m = new Map<string, PublicMenuItemDto[]>();
    for (const item of footerMenuItems) {
      const sid = ((item as any).section_id ?? (item as any).sectionId) as string | undefined;
      if (!sid) continue;
      const arr = m.get(sid) ?? [];
      arr.push(item);
      m.set(sid, arr);
    }
    return m;
  }, [footerMenuItems]);

  // Render footer links only from DB data.
  const renderSections: FooterRenderSection[] = useMemo(() => {
    return sections
      .map<FooterRenderSection>((sec) => ({
        id: sec.id,
        title: sec.title || '',
        items: (itemsBySectionId.get(sec.id) ?? []).map((item) => ({
          id: item.id,
          url: item.url || '',
          title: item.title || '',
        })),
      }))
      .filter((sec) => sec.title && sec.items.length > 0);
  }, [sections, itemsBySectionId]);

  const homeHref = localizePath(locale, '/');

  return (
    <footer className="py-24 lg:py-32 bg-[var(--gm-bg)] border-t border-[var(--gm-border-soft)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Info */}
          <div className="flex flex-col items-start text-center md:text-left">
            <Link href={homeHref} className="flex flex-col items-start no-underline mb-8 group">
              <span className="font-display font-semibold text-2xl tracking-[0.18em] text-[var(--gm-gold)] group-hover:text-[var(--gm-gold-light)] transition-colors">
                GOLD MOOD
              </span>
              <span className="font-display text-[10px] tracking-[0.32em] text-[var(--gm-gold-deep)] mt-1">
                ASTROLOGY
              </span>
            </Link>
            <p className="text-[var(--gm-text-dim)] font-light text-[15px] leading-relaxed mb-8 max-w-[260px]">
              {ui('ui_footer_tagline', 'Personal guidance and a modern astrology experience powered by your birth chart.')}
            </p>
            <div className="mb-8">
              <SocialLinks socials={socials} size="sm" />
            </div>

            {/* Quick access / auth CTA */}
            <div className="mb-8 flex flex-col gap-3">
              <span className="font-display text-[9px] tracking-[0.3em] text-[var(--gm-gold-deep)] uppercase mb-1">
                {ui('ui_footer_account_label', 'Your Account')}
              </span>
              {!isAuthenticated ? (
                <Link 
                  href={localizePath(locale, '/register')} 
                  className="inline-flex items-center gap-2 text-[var(--gm-text)] hover:text-[var(--gm-gold)] transition-colors text-[13px] font-bold tracking-wider uppercase border border-[var(--gm-border-soft)] rounded-full px-5 py-2 w-fit bg-[var(--gm-surface)]/20 hover:border-[var(--gm-gold)]/40"
                  onClick={() => trackEvent('signup_start').catch(() => {})}
                >
                  {ui('ui_footer_create_account', 'Create Account')}
                </Link>
              ) : (
                <Link 
                  href={localizePath(locale, '/dashboard')} 
                  className="inline-flex items-center gap-2 text-[var(--gm-text)] hover:text-[var(--gm-gold)] transition-colors text-[13px] font-bold tracking-wider uppercase border border-[var(--gm-border-soft)] rounded-full px-5 py-2 w-fit bg-[var(--gm-surface)]/20 hover:border-[var(--gm-gold)]/40"
                >
                  {ui('ui_footer_go_dashboard', 'Go to Dashboard')}
                </Link>
              )}
            </div>
          </div>

          {/* Columns */}
          {renderSections.map((sec) => (
            <div key={sec.id}>
              <div className="font-display text-[11px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-8">
                {sec.title}
              </div>
              <ul className="list-none p-0 m-0 space-y-4">
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={isExternalHref(item.url) ? item.url : localizePath(locale, cleanHashLink(item.url))}
                      className="text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)] transition-colors font-serif italic text-[16px]"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Security Section */}
        <div className="pt-12 mb-12 border-t border-[var(--gm-border-soft)] flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-60">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[var(--gm-gold)]" />
              <span className="font-display text-[10px] tracking-[0.2em] text-[var(--gm-text-dim)] uppercase">
                {ui('ui_footer_ssl_security', '256-bit SSL Security')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-[var(--gm-gold)]" />
              <span className="font-display text-[10px] tracking-[0.2em] text-[var(--gm-text-dim)] uppercase">
                {ui('ui_footer_secure_payment', 'Secure Payment Gateway')}
              </span>
            </div>
          </div>
          
          {/* Kabul edilen ödeme yöntemleri — aktif sağlayıcı Stripe.
              PayPal /de ve /en ziyaretçisinin € ödeme sayfasında çıkar. */}
          <div className="flex flex-wrap items-center gap-3">
            <PaymentBadge label="Visa">
              <path d={VISA_PATH} fill="#1A1F71" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
            </PaymentBadge>

            <PaymentBadge label="Mastercard">
              {/* Gerçek işaret: iki iç içe geçmiş daire. Kesişim, sağdaki dairenin
                  soldakine kırpılmasıyla çiziliyor — elle çizilen "lens" şekli
                  yaklaşık kalırdı, bu tam oturur. */}
              <defs>
                <clipPath id="gm-mc-overlap">
                  <circle cx="9" cy="12" r="7" />
                </clipPath>
              </defs>
              <circle cx="9" cy="12" r="7" fill="#EB001B" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
              <circle cx="15" cy="12" r="7" fill="#F79E1B" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
              <circle cx="15" cy="12" r="7" fill="#FF5F00" clipPath="url(#gm-mc-overlap)" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
            </PaymentBadge>

            <PaymentBadge label="PayPal">
              <path d={PAYPAL_PATH} fill="#002991" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
            </PaymentBadge>

            <PaymentBadge label="Stripe">
              <path d={STRIPE_PATH} fill="#635BFF" /> {/* theme-lint-ignore: marka rengi, temaya göre değişmez */}
            </PaymentBadge>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--gm-border-soft)] flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] tracking-[0.1em] text-[var(--gm-muted)] uppercase">
          <p>
            &copy; {new Date().getFullYear()} GOLD MOOD ASTROLOGY. {ui('ui_footer_rights', 'ALL RIGHTS RESERVED.')}
          </p>
          <div className="flex gap-6">
            <Link href={localizePath(locale, '/editorial-policy')} className="hover:text-[var(--gm-gold)] transition-colors">
              {ui('ui_footer_editorial_policy', 'EDITORIAL POLICY')}
            </Link>
            <a href="https://guezelwebdesign.com" target="_blank" rel="noopener" className="hover:text-[var(--gm-gold)] transition-colors">
              DESIGNED BY GUEZELEWEB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
