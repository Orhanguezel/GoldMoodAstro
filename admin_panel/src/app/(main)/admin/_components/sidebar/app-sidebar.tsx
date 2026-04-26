'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/sidebar/app-sidebar.tsx
// FINAL — RTK/Redux uyumlu (zustand yok)
// - NavMain: NavGroup[] alır (senin nav-main.tsx böyle)
// =============================================================

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { buildAdminSidebarItems } from '@/navigation/sidebar/sidebar-items';
import type { NavGroup } from '@/navigation/sidebar/sidebar-items';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import type { TranslateFn } from '@/i18n';

import { useMemo } from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { useAdminSettings } from '../admin-settings-provider';
import { useStatusQuery, useGetMyProfileQuery } from '@/integrations/hooks';

type Role = 'admin' | string;

type SidebarMe = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  roles?: Role[];
};

function hasRole(me: SidebarMe, role: Role) {
  if (me.role === role) return true;
  const rs = Array.isArray(me.roles) ? me.roles : [];
  return rs.includes(role);
}

export function AppSidebar({
  me,
  appName,
  variant,
  collapsible,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  me: SidebarMe;
  appName?: string;
}) {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();
  const label = (copy.app_name || appName || '').trim();

  // Admin settings override for page titles
  const { pageMeta } = useAdminSettings();

  // ✅ Get real user data
  const { data: statusData } = useStatusQuery();
  const { data: profileData } = useGetMyProfileQuery();

  const currentUser = useMemo(() => {
    const s = statusData?.user;
    return {
      id: s?.id || me?.id || 'me',
      name: profileData?.full_name || s?.email?.split('@')[0] || me?.name || 'Admin',
      email: s?.email || me?.email || 'admin',
      role: s?.role || me?.role || 'admin',
      avatar: profileData?.avatar_url || me?.avatar || '',
      roles: me?.roles || [s?.role || 'admin'],
    };
  }, [statusData, profileData, me]);

  const wrappedT: TranslateFn = (key, params, fallback) => {
    // Check pageMeta override for sidebar items: admin.dashboard.items.{key}
    if (typeof key === 'string' && key.startsWith('admin.dashboard.items.')) {
      const itemKey = key.replace('admin.dashboard.items.', '');
      // Check if pageMeta has this key and a title
      if (pageMeta?.[itemKey]?.title) {
        return pageMeta[itemKey].title;
      }
    }
    return t(key, params, fallback);
  };

  // ✅ admin ise tüm menu, değilse sadece dashboard
  const groupsForMe: NavGroup[] = hasRole(currentUser as any, 'admin')
    ? buildAdminSidebarItems(copy.nav, wrappedT)
    : [
        {
          id: 1,
          label: '',
          items: [
            {
              title: copy.nav?.items?.dashboard || '',
              url: '/admin/dashboard',
              icon: LayoutDashboard,
            },
          ],
        },
      ];

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <Link prefetch={false} href="/admin/dashboard" className="flex items-center gap-3 px-3 py-4 hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-lg tracking-tight">KÖNİG</span>
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ✅ NavMain NavGroup[] bekliyor */}
        <NavMain items={groupsForMe} showQuickCreate={false} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }} />
      </SidebarFooter>
    </Sidebar>
  );
}
