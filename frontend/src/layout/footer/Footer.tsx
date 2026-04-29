'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

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

// Backend boş dönerse (seed yüklenmemişse) gösterilecek varsayılan footer.
// API'den gelen veri her zaman önceliklidir.
const FALLBACK_SECTIONS: Array<{
  id: string;
  title: Record<string, string>;
  items: Array<{ id: string; url: string; label: Record<string, string> }>;
}> = [
  {
    id: 'fb-astrology',
    title: { tr: 'Astroloji', en: 'Astrology', de: 'Astrologie' },
    items: [
      { id: 'fb-astro-birth',    url: '/birth-chart',  label: { tr: 'Doğum Haritası', en: 'Birth Chart', de: 'Geburtshoroskop' } },
      { id: 'fb-astro-syn',      url: '/sinastri',     label: { tr: 'Sinastri',       en: 'Synastry',    de: 'Synastrie' } },
      { id: 'fb-astro-yld',      url: '/yildizname',   label: { tr: 'Yıldızname',     en: 'Yildizname',  de: 'Yildizname' } },
      { id: 'fb-astro-burclar',  url: '/burclar',      label: { tr: 'Burçlar',        en: 'Zodiac',      de: 'Sternzeichen' } },
    ],
  },
  {
    id: 'fb-fal',
    title: { tr: 'Fal & Tarot', en: 'Divination', de: 'Wahrsagung' },
    items: [
      { id: 'fb-fal-tarot',  url: '/tarot',        label: { tr: 'Tarot',       en: 'Tarot',               de: 'Tarot' } },
      { id: 'fb-fal-coffee', url: '/kahve-fali',   label: { tr: 'Kahve Falı',  en: 'Coffee Reading',      de: 'Kaffeesatzlesen' } },
      { id: 'fb-fal-dream',  url: '/ruya-tabiri',  label: { tr: 'Rüya Tabiri', en: 'Dream Interpretation', de: 'Traumdeutung' } },
      { id: 'fb-fal-num',    url: '/numeroloji',   label: { tr: 'Numeroloji',  en: 'Numerology',          de: 'Numerologie' } },
    ],
  },
  {
    id: 'fb-company',
    title: { tr: 'Şirket', en: 'Company', de: 'Unternehmen' },
    items: [
      { id: 'fb-comp-about', url: '/about',       label: { tr: 'Hakkımızda',  en: 'About',       de: 'Über uns' } },
      { id: 'fb-comp-cons',  url: '/consultants', label: { tr: 'Danışmanlar', en: 'Consultants', de: 'Berater' } },
      { id: 'fb-comp-blog',  url: '/blog',        label: { tr: 'Blog',        en: 'Blog',        de: 'Blog' } },
      { id: 'fb-comp-cont',  url: '/contact',     label: { tr: 'İletişim',    en: 'Contact',     de: 'Kontakt' } },
    ],
  },
  {
    id: 'fb-legal',
    title: { tr: 'Yasal', en: 'Legal', de: 'Rechtliches' },
    items: [
      { id: 'fb-leg-kvkk',   url: '/kvkk',                label: { tr: 'KVKK',                en: 'GDPR',          de: 'DSGVO' } },
      { id: 'fb-leg-priv',   url: '/gizlilik',            label: { tr: 'Gizlilik Politikası', en: 'Privacy Policy', de: 'Datenschutz' } },
      { id: 'fb-leg-terms',  url: '/kullanim-sartlari',   label: { tr: 'Kullanım Şartları',   en: 'Terms of Use',  de: 'Nutzungsbedingungen' } },
      { id: 'fb-leg-cookie', url: '/cerez-politikasi',    label: { tr: 'Çerez Politikası',    en: 'Cookie Policy', de: 'Cookie-Richtlinie' } },
    ],
  },
];

type FooterRenderSection = {
  id: string;
  title: string;
  items: Array<{ id: string; url: string; title: string }>;
};

const Footer: React.FC<{ locale?: string }> = ({ locale: localeProp }) => {
  const fallbackLocale = useLocaleShort();
  const locale = localeProp || fallbackLocale;
  const { ui } = useUiSection('ui_footer', locale);


  const { data: companyBrandSetting } = useGetSiteSettingByKeyQuery({ key: 'company_brand', locale });
  const { data: socialsSetting } = useGetSiteSettingByKeyQuery({ key: 'socials', locale });

  const { socials } = useMemo(() => {
    const brandVal = (companyBrandSetting?.value ?? {}) as any;
    const socialsVal = (socialsSetting?.value ?? {}) as Record<string, string>;
    const mergedSocials: Record<string, string> = { ...(brandVal.socials as Record<string, string> | undefined), ...socialsVal };
    return { socials: mergedSocials };
  }, [companyBrandSetting?.value, socialsSetting?.value]);

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
    return m;
  }, [footerMenuItems]);

  // Backend boş döndüyse fallback'e düş
  const renderSections: FooterRenderSection[] = useMemo(() => {
    const fromApi = sections
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

    if (fromApi.length > 0) return fromApi;

    return FALLBACK_SECTIONS.map<FooterRenderSection>((sec) => ({
      id: sec.id,
      title: sec.title[locale] || sec.title.tr,
      items: sec.items.map((it) => ({
        id: it.id,
        url: it.url,
        title: it.label[locale] || it.label.tr,
      })),
    }));
  }, [sections, itemsBySectionId, locale]);

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
              {ui('ui_footer_tagline', 'Doğum haritanızdan beslenen kişisel rehberlik ve modern astroloji deneyimi.')}
            </p>
            <SocialLinks socials={socials} size="sm" />
          </div>

          {/* Columns */}
          {renderSections.map((sec) => (
            <div key={sec.id}>
              <h4 className="font-display text-[11px] tracking-[0.32em] text-[var(--gm-gold-deep)] uppercase mb-8">
                {sec.title}
              </h4>
              <ul className="list-none p-0 m-0 space-y-4">
                {sec.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={isExternalHref(item.url) ? item.url : localizePath(locale, item.url)}
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

        <div className="pt-12 border-t border-[var(--gm-border-soft)] flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] tracking-[0.1em] text-[var(--gm-muted)] uppercase">
          <p>
            &copy; {new Date().getFullYear()} GOLD MOOD ASTROLOGY. {ui('ui_footer_rights', 'TÜM HAKLARI SAKLIDIR.')}
          </p>
          <div className="flex gap-6">
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
