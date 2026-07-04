// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// FINAL — GuezelWebDesign — Sidebar items (labels are dynamic via site_settings.ui_admin)
// - Dashboard base: /admin/dashboard
// - Admin pages: /admin/...  (route group "(admin)" URL'e dahil olmaz)
// =============================================================

import {
  BarChart,
  Bell,
  BookOpen,
  Newspaper,
  Bot,
  Calendar,
  Image as ImageIcon,
  Tag,
  Clock,
  CreditCard,
  Database,
  FileSearch,
  Gauge,
  HardDrive,
  LayoutDashboard,
  Mail,
  Megaphone,
  Mic,
  MessageCircle,
  MessageSquare,
  Package,
  Receipt,
  Send,
  Settings,
  Trash2,
  Star,
  Users,
  Menu as MenuIcon,
  Layers,
  FolderTree,
  type LucideIcon,
} from 'lucide-react';
import type { TranslateFn } from '@/i18n';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  /** Optional dynamic badge (e.g. unread count) */
  badgeKey?: string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export type AdminNavItemKey =
  | 'dashboard'
  | 'consultants'
  | 'consultant_applications'
  | 'site_settings'
  | 'reviews'
  | 'bookings'
  | 'mail'
  | 'users'
  | 'account_deletions'
  | 'email_templates'
  | 'notifications'
  | 'storage'
  | 'db'
  | 'audit'
  | 'seo_quality'
  | 'availability'
  | 'support'
  | 'contacts'
  | 'media_messages'
  | 'chat'
  | 'wallet'
  | 'orders'
  | 'payment_settings'
  | 'announcements'
  | 'subscriptions'
  | 'subscription_plans'
  | 'credit_packages'
  | 'cache'
  | 'llm_prompts'
  | 'astrology_kb'
  | 'banners'
  | 'campaigns'
  | 'navigation'
  | 'home_layout'
  | 'service_categories'
  | 'service_templates'
  | 'blog'
  | 'landing'
  | 'pages'
  | 'commission_change';

export type AdminNavGroupKey = 'general' | 'content' | 'marketing' | 'communication' | 'system';

export type AdminNavConfigItem = {
  key: AdminNavItemKey;
  url: string;
  icon?: LucideIcon;
  badgeKey?: string;
};

export type AdminNavConfigGroup = {
  id: number;
  key: AdminNavGroupKey;
  items: AdminNavConfigItem[];
};

export const adminNavConfig: AdminNavConfigGroup[] = [
  {
    id: 1,
    key: 'general',
    items: [
      { key: 'dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
      { key: 'consultants', url: '/admin/consultants', icon: Star },
      { key: 'users', url: '/admin/users', icon: Users },
      { key: 'account_deletions', url: '/admin/account-deletions', icon: Trash2 },
      { key: 'bookings', url: '/admin/bookings', icon: Calendar },
      { key: 'orders', url: '/admin/orders', icon: Package },
      { key: 'subscriptions', url: '/admin/subscriptions', icon: CreditCard },
      { key: 'subscription_plans', url: '/admin/subscription-plans', icon: Receipt },
      { key: 'credit_packages', url: '/admin/credit-packages', icon: Receipt },
    ],
  },
  {
    id: 2,
    key: 'communication',
    items: [
      { key: 'reviews', url: '/admin/reviews', icon: MessageSquare },
      { key: 'support', url: '/admin/support', icon: MessageCircle },
      { key: 'contacts', url: '/admin/contacts', icon: Mail },
      { key: 'media_messages', url: '/admin/media-messages', icon: Mic },
      { key: 'announcements', url: '/admin/announcements', icon: Megaphone },
      { key: 'notifications', url: '/admin/notifications', icon: Bell, badgeKey: 'notifications_unread' },
      { key: 'email_templates', url: '/admin/email-templates', icon: Mail },
      { key: 'chat', url: '/admin/chat', icon: Bot },
    ],
  },
  {
    id: 3,
    key: 'marketing',
    items: [
      { key: 'banners', url: '/admin/banners', icon: ImageIcon },
      { key: 'blog', url: '/admin/blog', icon: Newspaper },
      { key: 'landing', url: '/admin/landing', icon: Layers },
      { key: 'pages', url: '/admin/pages', icon: BookOpen },
      { key: 'campaigns', url: '/admin/campaigns', icon: Tag },
    ],
  },
  {
    id: 4,
    key: 'system',
    items: [
      { key: 'site_settings', url: '/admin/site-settings', icon: Settings },
      { key: 'service_categories', url: '/admin/service-categories', icon: FolderTree },
      { key: 'service_templates', url: '/admin/service-templates', icon: Layers },
      { key: 'navigation', url: '/admin/navigation', icon: MenuIcon },
      { key: 'home_layout', url: '/admin/home-layout', icon: LayoutDashboard },
      { key: 'cache', url: '/admin/cache', icon: Trash2 },
      { key: 'availability', url: '/admin/availability', icon: Clock },
      { key: 'wallet', url: '/admin/wallet', icon: Receipt },
      { key: 'payment_settings', url: '/admin/payment-settings', icon: CreditCard },
      { key: 'commission_change', url: '/admin/commission-change', icon: Send },
      { key: 'mail', url: '/admin/mail', icon: Send },
      { key: 'storage', url: '/admin/storage', icon: HardDrive },
      { key: 'db', url: '/admin/db', icon: Database },
      { key: 'audit', url: '/admin/audit', icon: FileSearch },
      { key: 'seo_quality', url: '/admin/seo-quality', icon: Gauge },
      { key: 'llm_prompts', url: '/admin/llm-prompts', icon: Bot },
      { key: 'astrology_kb', url: '/admin/astrology-kb', icon: BookOpen },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

// Fallback titles for when translations are missing
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard: 'Panel',
  consultants: 'Danışmanlar',
  consultant_applications: 'Danışman Başvuruları',
  site_settings: 'Ayarlar',
  reviews: 'Yorumlar',
  bookings: 'Randevular',
  mail: 'E-Posta',
  users: 'Kullanıcılar',
  account_deletions: 'Hesap Silme Talepleri',
  email_templates: 'E-posta Şablonları',
  notifications: 'Bildirimler',
  storage: 'Dosya Yöneticisi',
  db: 'Veritabanı',
  audit: 'Denetim Kayıtları',
  seo_quality: 'SEO Genel Bakış',
  availability: 'Rezervasyon Saatleri',
  support: 'Destek',
  contacts: 'İletişim',
  media_messages: 'Medya Mesajları',
  chat: 'Chat & AI',
  orders: 'Siparişler',
  wallet: 'Cüzdan',
  payment_settings: 'Ödeme Ayarları',
  announcements: 'Duyurular',
  subscriptions: 'Abonelikler',
  subscription_plans: 'Abonelik Planları',
  credit_packages: 'Kredi Paketleri',
  cache: 'Cache Yönetimi',
  llm_prompts: 'AI Promptları',
  astrology_kb: 'Astroloji Bilgi Bankası',
  banners: 'Banner Yönetimi',
  campaigns: 'Kampanyalar',
  service_categories: 'Hizmet Kategorileri',
  service_templates: 'Hizmet Şablonları',
  navigation: 'Menü & Footer',
  home_layout: 'Anasayfa Düzeni',
  blog: 'Blog',
  landing: 'Landing Sayfaları',
  pages: 'İçerik/Hukuki Sayfalar',
  commission_change: 'Komisyon Bildirimi',
};

export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
): NavGroup[] {
  const labels = copy?.labels ?? ({} as AdminNavCopy['labels']);
  const items = copy?.items ?? ({} as AdminNavCopy['items']);

  return adminNavConfig.map((group) => {
    // 1. Try copy.labels[group.key]
    // 2. Try t(`admin.sidebar.groups.${group.key}`)
    // 3. Fallback to empty (or key)
    const tGroup = t ? t(`admin.sidebar.groups.${group.key}` as any) : '';
    const label =
      labels[group.key] || (tGroup && !tGroup.includes('admin.sidebar') ? tGroup : '') || '';

    return {
      id: group.id,
      label,
      items: group.items.map((item) => {
        // 1. Try copy.items[item.key]
        // 2. Try t(`admin.dashboard.items.${item.key}`)
        // 3. Fallback to FALLBACK_TITLES
        // 4. Fallback to key
        const tItem = t ? t(`admin.dashboard.items.${item.key}` as any) : '';
        const title =
          items[item.key] ||
          (tItem && !tItem.includes('admin.dashboard') ? tItem : '') ||
          FALLBACK_TITLES[item.key] ||
          item.key;

        return {
          title,
          url: item.url,
          icon: item.icon,
          badgeKey: item.badgeKey,
        };
      }),
    };
  });
}
