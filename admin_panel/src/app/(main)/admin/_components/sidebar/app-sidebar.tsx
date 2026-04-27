'use client';

import Link from 'next/link';
import { LayoutDashboard, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

import { buildAdminSidebarItems } from '@/navigation/sidebar/sidebar-items';
import type { NavGroup } from '@/navigation/sidebar/sidebar-items';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import type { TranslateFn } from '@/i18n';

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
  const { pageMeta } = useAdminSettings();

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
    if (typeof key === 'string' && key.startsWith('admin.dashboard.items.')) {
      const itemKey = key.replace('admin.dashboard.items.', '');
      if (pageMeta?.[itemKey]?.title) return pageMeta[itemKey].title;
    }
    return t(key, params, fallback);
  };

  const groupsForMe: NavGroup[] = hasRole(currentUser as any, 'admin')
    ? buildAdminSidebarItems(copy.nav, wrappedT)
    : [
        {
          id: 1,
          label: '',
          items: [
            {
              title: 'Panel',
              url: '/admin/dashboard',
              icon: LayoutDashboard,
            },
          ],
        },
      ];

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible} className="bg-[#1A1715] border-r border-[#C9A961]/10">
      <SidebarHeader className="p-0">
        <Link 
          prefetch={false} 
          href="/admin/dashboard" 
          className="flex items-center gap-4 px-8 py-10 border-b border-[#C9A961]/5 hover:bg-[#C9A961]/5 transition-all group"
        >
          <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-[#C9A961] text-[#1A1715] shadow-[0_0_20px_rgba(201,169,97,0.3)] group-hover:scale-105 transition-transform">
            <Sparkles className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">GOLDMOOD</span>
            <span className="text-[9px] font-bold tracking-[0.3em] text-[#C9A961] uppercase opacity-70">Astro Admin</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 py-8">
        <NavMain items={groupsForMe} showQuickCreate={false} />
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-[#C9A961]/5">
        <NavUser user={{ name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }} />
      </SidebarFooter>
    </Sidebar>
  );
}
