'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Search, RefreshCcw, Settings, Globe, ShieldCheck, Palette, Code, Mail, Sliders, Database, Activity } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SiteSettingsList } from './site-settings-list';

// tabs (content sources)
import { GeneralSettingsTab } from '../tabs/general-settings-tab';
import { SeoSettingsTab } from '../tabs/seo-settings-tab';
import { SmtpSettingsTab } from '../tabs/smtp-settings-tab';
import { CloudinarySettingsTab } from '../tabs/cloudinary-settings-tab';
import { BrandMediaTab } from '../tabs/brand-media-tab';
import { ApiSettingsTab } from '../tabs/api-settings-tab';
import { LocalesSettingsTab } from '../tabs/locales-settings-tab';
import { BrandingSettingsTab } from '../tabs/branding-settings-tab';
import { DesignTokensTab } from '../tabs/design-tokens-tab';
import { CustomCssTab } from '../tabs/custom-css-tab';
import { LiveKitTab } from '../tabs/livekit-tab';

import type { SiteSetting } from '@/integrations/shared';
import {
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useListSiteSettingsAdminQuery,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

type SettingsTab =
  | 'list'
  | 'global_list'
  | 'general'
  | 'seo'
  | 'smtp'
  | 'cloudinary'
  | 'brand_media'
  | 'api'
  | 'locales'
  | 'branding'
  | 'design_tokens'
  | 'custom_css'
  | 'livekit';

type LocaleOption = { value: string; label: string; isDefault?: boolean; isActive?: boolean };

function safeStr(v: unknown) {
  return v === null || v === undefined ? '' : String(v);
}

function ListPanel({
  locale,
  search,
  onDeleteRow,
}: {
  locale: string;
  search: string;
  onDeleteRow: (row: SiteSetting) => void;
}) {
  const qArgs = React.useMemo(() => ({
    locale,
    q: search.trim() || undefined,
    sort: 'key' as const,
    order: 'asc' as const,
    limit: 200,
    offset: 0,
  }), [locale, search]);

  const listQ = useListSiteSettingsAdminQuery(qArgs, { skip: !locale, refetchOnMountOrArgChange: true });
  const loading = listQ.isLoading || listQ.isFetching;

  return (
    <SiteSettingsList
      settings={(listQ.data ?? []) as SiteSetting[]}
      loading={loading}
      selectedLocale={locale}
      onDelete={onDeleteRow}
      getEditHref={(s) => `/admin/site-settings/${encodeURIComponent(String(s.key || ''))}?locale=${encodeURIComponent(locale)}`}
    />
  );
}

export default function AdminSiteSettingsClient() {
  const localesQ = useGetAppLocalesAdminQuery();
  const defaultLocaleQ = useGetDefaultLocaleAdminQuery();

  const [tab, setTab] = React.useState<SettingsTab>('design_tokens');
  const [search, setSearch] = React.useState('');
  const [locale, setLocale] = React.useState<string>('tr');

  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const disabled = localesQ.isFetching || defaultLocaleQ.isFetching || isDeleting;

  const localeOptions = React.useMemo(() => {
    const items = Array.isArray(localesQ.data) ? localesQ.data : [];
    return items.map((x: any) => ({
      value: String(x.code),
      label: x.label ? `${x.label} (${x.code})` : x.code,
      isDefault: x.is_default === true,
      isActive: x.is_active !== false,
    }));
  }, [localesQ.data]);

  const handleDeleteRow = async (row: SiteSetting) => {
    const key = String(row?.key || '').trim();
    if (!key) return;
    if (!window.confirm(`${key} ayarını silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteSetting({ key, locale: row.locale ?? undefined }).unwrap();
      toast.success('Ayar silindi.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  const isGlobalTab = ['global_list', 'smtp', 'brand_media', 'locales', 'branding', 'design_tokens', 'custom_css', 'livekit'].includes(tab);

  const menuItems = [
    { value: 'design_tokens', label: 'Tasarım Tokenları', icon: Palette },
    { value: 'branding', label: 'Marka & Kimlik', icon: ShieldCheck },
    { value: 'general', label: 'Genel Ayarlar', icon: Settings },
    { value: 'seo', label: 'SEO & Meta', icon: Globe },
    { value: 'api', label: 'API & Entegrasyon', icon: Sliders },
    { value: 'smtp', label: 'E-posta (SMTP)', icon: Mail },
    { value: 'livekit', label: 'Görüntülü Altyapı', icon: Activity },
    { value: 'custom_css', label: 'Özel CSS', icon: Code },
    { value: 'list', label: 'Tüm Kayıtlar', icon: Database },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Sistem Yapılandırması</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Site Ayarları</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Platform kimliğini, teknik altyapıyı ve kozmik görünümü buradan yönetin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-full md:w-64 space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Dil Seçimi</label>
            <Select value={locale} onValueChange={setLocale} disabled={disabled || isGlobalTab}>
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-11 focus:ring-0 focus:border-[#C9A961]/50">
                <SelectValue placeholder="Dil Seçin" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                {localeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-12 items-start">
        {/* Navigation Sidebar */}
        <aside className="space-y-6">
          <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden p-6">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setTab(item.value as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
                    tab === item.value 
                      ? 'bg-[#C9A961] text-[#1A1715]' 
                      : 'text-muted-foreground hover:bg-muted/20'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </nav>
          </Card>

          <Card className="bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-[32px] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto text-[#C9A961]">
              <Database size={20} />
            </div>
            <h4 className="font-serif text-lg text-foreground">Global Ayarlar</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wider">
              Bazı ayarlar tüm diller için ortaktır ve "Global" olarak işaretlenmiştir.
            </p>
          </Card>
        </aside>

        {/* Content Area */}
        <Card className="bg-card border-border/40 rounded-[40px] overflow-hidden min-h-[700px] relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
            <Settings className="w-64 h-64" />
          </div>
          
          <CardHeader className="p-10 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-3xl">
                  {menuItems.find(m => m.value === tab)?.label}
                </CardTitle>
                <CardDescription className="font-serif italic text-lg opacity-70 pt-2">
                  Yapılandırma detaylarını güncelleyin.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isGlobalTab && <Badge className="bg-[#C9A961] text-[#1A1715] hover:bg-[#C9A961]">GLOBAL</Badge>}
                {!isGlobalTab && <Badge variant="outline" className="border-[#C9A961] text-[#C9A961] uppercase tracking-widest">{locale}</Badge>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-10">
            <div className="relative z-10">
              {tab === 'design_tokens' && <DesignTokensTab />}
              {tab === 'branding' && <BrandingSettingsTab />}
              {tab === 'general' && <GeneralSettingsTab locale={locale} />}
              {tab === 'seo' && <SeoSettingsTab locale={locale} />}
              {tab === 'api' && <ApiSettingsTab locale={locale} />}
              {tab === 'smtp' && <SmtpSettingsTab locale={locale} />}
              {tab === 'livekit' && <LiveKitTab />}
              {tab === 'custom_css' && <CustomCssTab />}
              {tab === 'list' && (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Ayar anahtarı ara..." 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                      className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12"
                    />
                  </div>
                  <ListPanel locale={locale} search={search} onDeleteRow={handleDeleteRow} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
