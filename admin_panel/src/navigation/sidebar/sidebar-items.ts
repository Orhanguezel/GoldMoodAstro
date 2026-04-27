// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// FINAL — GuezelWebDesign — Sidebar items (labels are dynamic via site_settings.ui_admin)
// - Dashboard base: /admin/dashboard
// - Admin pages: /admin/...  (route group "(admin)" URL'e dahil olmaz)
// =============================================================

import {
  BarChart,
  Bell,
  Bot,
  Calendar,
  Clock,
  CreditCard,
  Database,
  FileSearch,
  HardDrive,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Package,
  Receipt,
  Send,
  Settings,
  Star,
  Users,
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
  | 'site_settings'
  | 'reviews'
  | 'bookings'
  | 'mail'
  | 'users'
  | 'email_templates'
  | 'notifications'
  | 'storage'
  | 'db'
  | 'audit'
  | 'availability'
  | 'support'
  | 'chat'
  | 'wallet'
  | 'orders'
  | 'payment_settings'
  | 'announcements'
  | 'subscriptions'
  | 'subscription_plans';

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
      { key: 'bookings', url: '/admin/bookings', icon: Calendar },
      { key: 'orders', url: '/admin/orders', icon: Package },
      { key: 'subscriptions', url: '/admin/subscriptions', icon: CreditCard },
      { key: 'subscription_plans', url: '/admin/subscription-plans', icon: Receipt },
    ],
  },
  {
    id: 2,
    key: 'communication',
    items: [
      { key: 'reviews', url: '/admin/reviews', icon: MessageSquare },
      { key: 'support', url: '/admin/support', icon: MessageCircle },
      { key: 'announcements', url: '/admin/announcements', icon: Megaphone },
      { key: 'notifications', url: '/admin/notifications', icon: Bell, badgeKey: 'notifications_unread' },
      { key: 'email_templates', url: '/admin/email-templates', icon: Mail },
      { key: 'chat', url: '/admin/chat', icon: Bot },
    ],
  },
  {
    id: 3,
    key: 'system',
    items: [
      { key: 'site_settings', url: '/admin/site-settings', icon: Settings },
      { key: 'availability', url: '/admin/availability', icon: Clock },
      { key: 'wallet', url: '/admin/wallet', icon: Receipt },
      { key: 'payment_settings', url: '/admin/payment-settings', icon: CreditCard },
      { key: 'mail', url: '/admin/mail', icon: Send },
      { key: 'storage', url: '/admin/storage', icon: HardDrive },
      { key: 'db', url: '/admin/db', icon: Database },
      { key: 'audit', url: '/admin/audit', icon: FileSearch },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

// Fallback titles for when translations are missing
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard: 'Dashboard',
  consultants: 'Consultants',
  site_settings: 'Site Settings',
  reviews: 'Reviews',
  bookings: 'Bookings',
  mail: 'Mail',
  users: 'Users',
  email_templates: 'Email Templates',
  notifications: 'Notifications',
  storage: 'Storage',
  db: 'Database',
  audit: 'Audit',
  availability: 'Availability',
  support: 'Support',
  chat: 'Chat & AI',
  orders: 'Orders',
  wallet: 'Wallet',
  payment_settings: 'Payment Settings',
  announcements: 'Announcements',
  subscriptions: 'Subscriptions',
  subscription_plans: 'Subscription Plans',
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
    const label =
      labels[group.key] || (t ? t(`admin.sidebar.groups.${group.key}` as any) : '') || '';

    return {
      id: group.id,
      label,
      items: group.items.map((item) => {
        // 1. Try copy.items[item.key]
        // 2. Try t(`admin.dashboard.items.${item.key}`)
        // 3. Fallback to FALLBACK_TITLES
        // 4. Fallback to key
        const title =
          items[item.key] ||
          (t ? t(`admin.dashboard.items.${item.key}` as any) : '') ||
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
