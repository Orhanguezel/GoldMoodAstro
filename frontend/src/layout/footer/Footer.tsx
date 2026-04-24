'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import { SiteLogo } from '@/layout/SiteLogo';
import SocialLinks from '@/components/common/public/SocialLinks';

import {
  useGetSiteSettingByKeyQuery,
  useListFooterSectionsQuery,
  useListMenuItemsQuery,
} from '@/integrations/rtk/hooks';

import type { FooterSectionDto, PublicMenuItemDto } from '@/integrations/shared';
import { useLocaleShort, useUiSection } from '@/i18n';
import { localizePath } from '@/integrations/shared';

const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href) || /^#/i.test(href);

type FooterProps = { locale?: string };

const Footer: React.FC<FooterProps> = ({ locale: localeProp }) => {
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale;
  const { ui } = useUiSection('ui_footer', locale);

  const { data: contactInfoSetting } = useGetSiteSettingByKeyQuery({ key: 'contact_info', locale });
  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale });

  const { brandName, phone, email, addrLines, socials } = useMemo(() => {
    const contact = (contactInfoSetting?.value ?? {}) as any;
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const socialsVal = (socialsSetting?.value ?? {}) as Record<string, string>;
    const name = (brandVal.name as string) || (contact.companyName as string) || 'Energetische Massage';
    const phoneVal = (brandVal.phone as string | undefined) || (Array.isArray(contact.phones) ? (contact.phones[0] as string | undefined) : undefined) || '';
    const emailVal = (brandVal.email as string | undefined) || (contact.email as string | undefined) || '';
    const mergedSocials: Record<string, string> = { ...(brandVal.socials as Record<string, string> | undefined), ...socialsVal };
    const addrLinesComputed: string[] = [];
    if (contact.address) addrLinesComputed.push(String(contact.address));
    if (contact.addressSecondary) addrLinesComputed.push(String(contact.addressSecondary));
    return { brandName: name, phone: (phoneVal || '').trim(), email: (emailVal || '').trim(), addrLines: addrLinesComputed, socials: mergedSocials };
  }, [contactInfoSetting?.value, companyBrandSetting?.value, socialsSetting?.value]);

  const { data: footerSections } = useListFooterSectionsQuery({ is_active: true, order: 'display_order.asc', locale });
  const sections: FooterSectionDto[] = useMemo(() => {
    return (footerSections ?? []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as FooterSectionDto[];
  }, [footerSections]);

  const { data: footerMenuData } = useListMenuItemsQuery({ location: 'footer', is_active: true, locale });
  const footerMenuItems: PublicMenuItemDto[] = useMemo(() => footerMenuData?.items ?? [], [footerMenuData]);

  const itemsBySectionId = useMemo(() => {
    const m = new Map<string, PublicMenuItemDto[]>();
    for (const item of footerMenuItems) {
      const sid = ((item as any).section_id ?? (item as any).sectionId) as string | undefined;
      if (!sid) continue;
      const arr = m.get(sid) ?? [];
      arr.push(item);
      m.set(sid, arr);
    }
    for (const [sid, arr] of m) {
      arr.sort((a: any, b: any) => (a.order_num ?? 0) - (b.order_num ?? 0));
      m.set(sid, arr);
    }
    return m;
  }, [footerMenuItems]);

  const homeHref = localizePath(locale, '/');

  const renderSectionColumn = (sec: FooterSectionDto | undefined) => {
    if (!sec) return null;
    const items = itemsBySectionId.get(sec.id) ?? [];
    return (
      <div>
        <h3 className="text-[0.72rem] tracking-[0.15em] uppercase text-brand-primary mb-4">
          {sec.title || sec.slug || 'Links'}
        </h3>
        <ul className="list-none p-0 m-0">
          {items.map((item) => {
            const rawUrl = (item.url || (item as any).href || '#') as string;
            const label = item.title || rawUrl;
            const external = isExternalHref(rawUrl);
            const href = external ? rawUrl : localizePath(locale, rawUrl);
            return (
              <li key={item.id} className="mb-2">
                {external ? (
                  <a href={href} target={/^https?:\/\//i.test(rawUrl) ? '_blank' : undefined}
                     rel={/^https?:\/\//i.test(rawUrl) ? 'noopener noreferrer' : undefined}
                     className="text-text-muted no-underline text-[0.85rem] hover:text-brand-primary transition-colors">
                    {label}
                  </a>
                ) : (
                  <Link href={href} className="text-text-muted no-underline text-[0.85rem] hover:text-brand-primary transition-colors">
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <footer className="border-t border-border-light" style={{ padding: '3.5rem 4% 2rem' }}>
      <div className="max-w-[1300px] mx-auto">
        {/* Top */}
        <div className="flex justify-between items-start flex-wrap gap-8 mb-12">
          {/* Brand */}
          <div className="max-w-[320px]">
            <Link href={homeHref} aria-label={brandName} className="no-underline inline-block mb-3">
              <SiteLogo
                variant="light"
                alt={brandName || 'Logo'}
                priority={false}
                wrapperClassName="w-28! h-28! max-w-28!"
                className="w-28! h-28! max-w-28! rounded-full object-cover border-[1.5px] border-brand-primary"
              />
            </Link>
            <div className="font-serif text-[1.1rem] tracking-[0.15em] text-brand-primary uppercase mb-3">
              {brandName}
            </div>
            <p className="text-text-muted text-[0.85rem] max-w-[300px] leading-[1.6]">
              {ui('ui_footer_tagline',
                locale === 'de' ? 'Professionelle energetische Massage — mobil, persoenlich und direkt bei Ihnen zu Hause.'
                : locale === 'tr' ? 'Profesyonel enerjetik masaj — mobil, kisisel ve dogrudan evinizde.'
                : 'Professional energetic massage — mobile, personal and directly at your home.'
              )}
            </p>
          </div>

          {/* Link Columns */}
          <div className="flex gap-12 flex-wrap">
            {sections.slice(0, 3).map((sec) => (
              <React.Fragment key={sec.id}>
                {renderSectionColumn(sec)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex justify-between items-center flex-wrap gap-4 pt-8 border-t border-border-light text-[0.75rem] text-text-muted tracking-[0.05em]">
          <span>
            &copy; {new Date().getFullYear()} {brandName}. {ui('ui_footer_copyright_suffix', 'Alle Rechte vorbehalten.')}
          </span>
          <span>
            {locale === 'de' ? 'Gestaltung' : locale === 'tr' ? 'Tasarim' : 'Design'}:{' '}
            <a href="https://guezelwebdesign.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-hover transition-colors">
              guezelwebdesign.com
            </a>
          </span>
          <div className="flex gap-4">
            <SocialLinks socials={socials} size="sm" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
