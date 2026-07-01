'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Calendar,
  Sparkles,
  CreditCard,
  Heart,
  Star,
  Settings,
  ArrowRight,
  ShieldCheck,
  Lock,
  ShoppingBag,
  LayoutGrid,
  Coffee,
  Moon,
  Binary,
  Trash2,
  Eye,
  Clock,
  MessageCircle,
} from 'lucide-react';

import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath, normalizeError } from '@/integrations/shared';
import { useUiSection } from '@/i18n';
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
  useUpdateUserMutation,
  useListMyPendingOutcomesQuery,
  useGetUserHistoryQuery,
  useDeleteReadingMutation,
  useDeleteAllReadingsMutation,
  useListMyBookingsQuery,
} from '@/integrations/rtk/hooks';
import type { HistoryItem, ReadingType } from '@/integrations/rtk/public/history.public.endpoints';
import AvatarUpload from '@/components/common/AvatarUpload';
import CityAutocomplete from '@/components/common/CityAutocomplete';
import ReviewModal from '@/components/common/public/ReviewModal';
import BookingMessageButton from '@/components/common/BookingMessageButton';
import UserMessagesPanel from '@/components/containers/user-dashboard/UserMessagesPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type TabKey = 'overview' | 'profile' | 'bookings' | 'messages' | 'history' | 'security';
type HistoryFilter = 'all' | ReadingType;
const VALID_TABS: TabKey[] = ['overview', 'profile', 'bookings', 'messages', 'history', 'security'];

type DashCardProps = {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
};

function DashCard({ href, icon, eyebrow, title, description, cta }: DashCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 transition-all duration-400 hover:-translate-y-1 hover:border-(--gm-gold)/40 hover:shadow-card overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-(--gm-gold)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative">
        {/* icon: gold color guaranteed in both themes */}
        <div className="w-14 h-14 rounded-full bg-(--gm-gold)/15 border border-(--gm-gold)/40 flex items-center justify-center text-(--gm-gold) mb-6">
          {icon}
        </div>
        {/* eyebrow: use --gm-gold (brighter) instead of --gm-gold-deep (too dark in dark mode) */}
        <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
          {eyebrow}
        </span>
        {/* title: --gm-text is fine */}
        <h3 className="font-serif text-2xl text-(--gm-text) mt-1 mb-3">{title}</h3>
        {/* description: use --gm-text with opacity instead of --gm-text-dim which can be invisible */}
        <p className="text-sm text-(--gm-text) opacity-60 leading-relaxed mb-6">{description}</p>
        {/* CTA: gold, always visible */}
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold) group-hover:opacity-100 opacity-80 transition-all mt-auto">
          {cta}
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase mb-2 opacity-80">
      {children}
    </label>
  );
}

function fieldClasses() {
  // bg-(--gm-surface) instead of bg-deep: surface is lighter than bg-deep in dark mode, making text visible
  return 'w-full bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl px-5 py-3.5 text-sm text-(--gm-text) placeholder:text-(--gm-text)/40 focus:border-(--gm-gold)/50 outline-none transition-colors';
}

function fmtDate(v: string, locale: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const dateLocale = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US';
  return d.toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type UiLabel = { labelKey: string; fallback: string };

const HISTORY_TYPES: Array<{ key: HistoryFilter } & UiLabel> = [
  { key: 'all', labelKey: 'ui_extra_b0_dash_history_all', fallback: 'All' },
  { key: 'birth_chart', labelKey: 'ui_extra_b0_call_reading_birth_chart', fallback: 'Birth Chart' },
  { key: 'tarot', labelKey: 'ui_extra_b0_call_reading_tarot', fallback: 'Tarot' },
  { key: 'coffee', labelKey: 'ui_extra_b0_call_reading_coffee', fallback: 'Coffee reading' },
  { key: 'dream', labelKey: 'ui_extra_b0_call_reading_dream', fallback: 'Dream' },
  { key: 'synastry', labelKey: 'ui_extra_b0_call_reading_synastry', fallback: 'Synastry' },
  { key: 'yildizname', labelKey: 'ui_extra_b0_call_reading_yildizname', fallback: 'Yildizname' },
  { key: 'numerology', labelKey: 'ui_extra_b0_call_reading_numerology', fallback: 'Numerology' },
];

const HISTORY_META: Record<ReadingType, { icon: React.ReactNode; route: string } & UiLabel> = {
  tarot: { icon: <Star size={18} />, labelKey: 'ui_extra_b0_call_reading_tarot', fallback: 'Tarot', route: '/tarot/reading' },
  coffee: { icon: <Coffee size={18} />, labelKey: 'ui_extra_b0_call_reading_coffee', fallback: 'Coffee reading', route: '/kahve-fali/result' },
  dream: { icon: <Moon size={18} />, labelKey: 'ui_extra_b0_call_reading_dream', fallback: 'Dream', route: '/ruya-tabiri/result' },
  synastry: { icon: <Heart size={18} />, labelKey: 'ui_extra_b0_call_reading_synastry', fallback: 'Synastry', route: '/sinastri/result' },
  yildizname: { icon: <Sparkles size={18} />, labelKey: 'ui_extra_b0_call_reading_yildizname', fallback: 'Yildizname', route: '/yildizname/result' },
  numerology: { icon: <Binary size={18} />, labelKey: 'ui_extra_b0_call_reading_numerology', fallback: 'Numerology', route: '/numeroloji' },
  birth_chart: { icon: <Sparkles size={18} />, labelKey: 'ui_extra_b0_call_reading_birth_chart', fallback: 'Birth Chart', route: '/birth-chart' },
};

import PageContainer from '@/components/common/PageContainer';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';
  const { ui } = useUiSection('ui_extra' as any);

  const { isAuthenticated, isReady, user } = useAuthStore();
  const isConsultantUser = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const primaryRole =
      typeof user?.role === 'string'
        ? user.role
        : user?.role && typeof user.role === 'object'
          ? user.role.name
          : null;

    return roles.includes('consultant') || primaryRole === 'consultant';
  }, [user]);

  // Keep tab state synchronized with URL ?tab=.
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [tab, setTab] = useState<TabKey>(VALID_TABS.includes(initialTab) ? initialTab : 'overview');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null;
    if (t && VALID_TABS.includes(t) && t !== tab) {
      setTab(t);
    }
  }, [searchParams, tab]);

  function switchTab(next: TabKey) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'overview') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url.toString());
  }

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/dashboard`);
    }
  }, [isReady, isAuthenticated, locale, router]);

  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: pendingOutcomes } = useListMyPendingOutcomesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useGetUserHistoryQuery(
    { limit: 50 },
    { skip: !isAuthenticated },
  );
  const [deleteReading, deleteReadingState] = useDeleteReadingMutation();
  const [deleteAllReadings, deleteAllReadingsState] = useDeleteAllReadingsMutation();
  const pendingCount = pendingOutcomes?.length ?? 0;
  const [upsertProfile, upsertProfileState] = useUpsertMyProfileMutation();
  const [updateUser, updateUserState] = useUpdateUserMutation();
  const { data: myBookings, isLoading: bookingsLoading } = useListMyBookingsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    targetId: string;
    consultantName: string;
  }>({
    isOpen: false,
    targetId: '',
    consultantName: '',
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
  });
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  // Use native confirm to avoid AlertDialog body lock and event timing issues.

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address_line1 ?? '',
        city: profile.city ?? '',
      });
    }
  }, [profile]);

  if (!isReady || !user) {
    return (
      <PageContainer className="bg-(--gm-bg)" verticalPadding="large" center>
        <p className="text-(--gm-text-muted) text-sm">{ui('ui_extra_b0_dash_loading', 'Loading...')}</p>
      </PageContainer>
    );
  }

  const fullName = (profile?.full_name as string) || user.full_name || user.email || '';
  const firstName = fullName.split(' ')[0] || '';
  const initials =
    fullName
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const avatarUrl =
    (profile as any)?.avatar_url ||
    (user as any).avatar_url ||
    '';

  async function handleAvatarUploaded(newUrl: string) {
    try {
      await upsertProfile({
        profile: { avatar_url: newUrl },
      } as any).unwrap();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b0_dash_avatar_save_failed', 'Avatar could not be saved.'));
    }
  }
  const memberSince = (user as any).created_at
    ? new Date((user as any).created_at).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      })
    : '';

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertProfile({
        profile: {
          full_name: formData.fullName || null,
          phone: formData.phone || null,
          address_line1: formData.address || null,
          city: formData.city || null,
        },
      }).unwrap();
      toast.success(ui('ui_extra_b0_dash_profile_updated', 'Profile updated'));
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b0_dash_error_occurred', 'An error occurred'));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      toast.error(ui('ui_extra_b0_dash_passwords_mismatch', 'Passwords do not match'));
      return;
    }
    try {
      await updateUser({ email: user!.email, password: passData.new }).unwrap();
      setPassData({ old: '', new: '', confirm: '' });
      toast.success(ui('ui_extra_b0_dash_password_updated', 'Password updated'));
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b0_dash_error_occurred', 'An error occurred'));
    }
  }

  async function handleDeleteReading(item: HistoryItem) {
    const ok = window.confirm(
      ui('ui_extra_b0_dash_delete_record_confirm', 'Delete this record permanently?'),
    );
    if (!ok) return;
    try {
      await deleteReading({ type: item.type, id: item.id }).unwrap();
      toast.success(ui('ui_extra_b0_dash_record_deleted', 'Record deleted'));
      refetchHistory();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b0_dash_could_not_delete', 'Could not delete'));
    }
  }

  async function handleDeleteAllReadings() {
    const ok = window.confirm(
      ui('ui_extra_b0_dash_delete_all_confirm', 'ALL history records (tarot, coffee, dream, synastry, yildizname, numerology, birth chart) will be deleted. Are you sure?'),
    );
    if (!ok) return;
    try {
      await deleteAllReadings().unwrap();
      toast.success(ui('ui_extra_b0_dash_all_history_deleted', 'All history deleted'));
      refetchHistory();
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b0_dash_could_not_delete', 'Could not delete'));
    }
  }

  const filteredHistory =
    historyFilter === 'all'
      ? history ?? []
      : (history ?? []).filter((item) => item.type === historyFilter);

  const overviewCards: DashCardProps[] = [
    {
      href: `?tab=profile`,
      icon: <UserIcon size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_account', 'Account'),
      title: ui('ui_extra_b0_dash_card_my_profile', 'My Profile'),
      description: ui('ui_extra_b0_dash_card_profile_desc', 'Manage your personal details, birth data, and preferences.'),
      cta: ui('ui_extra_b0_dash_card_edit_profile', 'Edit profile'),
    },
    {
      href: `?tab=bookings`,
      icon: <Calendar size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_bookings', 'Bookings'),
      title: ui('ui_extra_b0_dash_card_my_sessions', 'My Sessions'),
      description: ui('ui_extra_b0_dash_card_sessions_desc', 'View your upcoming appointments and past sessions.'),
      cta: ui('ui_extra_b0_dash_card_view_bookings', 'View bookings'),
    },
    {
      href: `?tab=messages`,
      icon: <MessageCircle size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_chat', 'Chat'),
      title: ui('ui_extra_b0_dash_card_my_messages', 'My Messages'),
      description: ui('ui_extra_b0_dash_card_messages_desc', 'Read replies from your consultants and send new messages.'),
      cta: ui('ui_extra_b0_dash_card_view_messages', 'View messages'),
    },
    {
      href: localizePath(locale, '/birth-chart'),
      icon: <Sparkles size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_astrology', 'Astrology'),
      title: ui('ui_extra_b0_dash_card_my_birth_chart', 'My Birth Chart'),
      description: ui('ui_extra_b0_dash_card_birth_chart_desc', 'Create your detailed birth chart and read planetary interpretations.'),
      cta: ui('ui_extra_b0_dash_card_open_chart', 'Open my chart'),
    },
    {
      href: localizePath(locale, '/daily'),
      icon: <Star size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_daily', 'Daily'),
      title: ui('ui_extra_b0_dash_card_daily_reading', 'My Daily Reading'),
      description: ui('ui_extra_b0_dash_card_daily_desc', "Today's energy, personal transit reading, and suggestions."),
      cta: ui('ui_extra_b0_dash_card_read_today', 'Read today'),
    },
    {
      href: `?tab=history`,
      icon: <Clock size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_history', 'History'),
      title: ui('ui_extra_b0_dash_card_my_readings', 'My Readings'),
      description: ui('ui_extra_b0_dash_card_readings_desc', 'Open or delete your tarot, coffee, dream, and other saved readings in one place.'),
      cta: ui('ui_extra_b0_dash_card_view_history', 'View history'),
    },
    {
      href: localizePath(locale, '/pricing'),
      icon: <CreditCard size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_membership', 'Membership'),
      title: ui('ui_extra_b0_dash_card_my_subscription', 'My Subscription'),
      description: ui('ui_extra_b0_dash_card_subscription_desc', 'Manage your premium status, credit balance, and invoices.'),
      cta: ui('ui_extra_b0_dash_card_manage_plan', 'Manage plan'),
    },
    ...(isConsultantUser
      ? [
          {
            href: localizePath(locale, '/me/consultant'),
            icon: <Settings size={22} />,
            eyebrow: ui('ui_extra_b0_dash_card_consultant', 'Consultant'),
            title: ui('ui_extra_b0_dash_card_consultant_dashboard', 'Consultant Panel'),
            description: ui('ui_extra_b0_dash_card_consultant_desc', 'Manage your profile, services, availability, and earnings.'),
            cta: ui('ui_extra_b0_dash_card_open_panel', 'Open panel'),
          },
        ]
      : []),
    {
      href: localizePath(locale, '/consultants'),
      icon: <Heart size={22} />,
      eyebrow: ui('ui_extra_b0_dash_card_explore', 'Explore'),
      title: ui('ui_extra_b0_dash_card_find_consultant', 'Find a Consultant'),
      description: ui('ui_extra_b0_dash_card_explore_desc', 'Plan a new session with expert astrologers and consultants.'),
      cta: ui('ui_extra_b0_dash_card_browse_experts', 'View consultants'),
    },
  ];

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: ui('ui_extra_b0_dash_tab_overview', 'Overview'), icon: <LayoutGrid size={14} /> },
    { key: 'profile', label: ui('ui_extra_b0_dash_tab_profile', 'Profile'), icon: <UserIcon size={14} /> },
    { key: 'bookings', label: ui('ui_extra_b0_dash_tab_bookings', 'Bookings'), icon: <ShoppingBag size={14} /> },
    { key: 'messages', label: ui('ui_extra_b0_dash_tab_messages', 'Messages'), icon: <MessageCircle size={14} /> },
    { key: 'history', label: ui('ui_extra_b0_dash_tab_history', 'My Past Readings'), icon: <Sparkles size={14} /> },
    { key: 'security', label: ui('ui_extra_b0_dash_tab_security', 'Security'), icon: <Lock size={14} /> },
  ];

  return (
    <PageContainer width="wide" className="bg-(--gm-bg)" verticalPadding="large">
      <div className="w-full">
        {/* User card */}
        <header className="mb-8 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 shadow-(--gm-shadow-soft)">
          <AvatarUpload
            src={avatarUrl}
            initials={initials}
            size={96}
            onUploaded={handleAvatarUploaded}
          />

          <div className="flex-1 min-w-0">
            <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
              {ui('ui_extra_b0_dash_welcome', 'Welcome')}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-(--gm-text) mt-1 leading-tight">
              {firstName ? `${ui('ui_extra_b0_dash_hello', 'Hello')}, ${firstName}` : ui('ui_extra_b0_dash_my_panel', 'My Dashboard')}
            </h1>
            {/* email: text-dim can be too faint in dark — use text with explicit opacity */}
            <p className="text-(--gm-text) opacity-55 text-sm mt-2 truncate">{user.email}</p>
            {memberSince && (
              <p className="text-(--gm-text) opacity-40 text-xs mt-1">
                {`${ui('ui_extra_b0_dash_member_since', 'Member')}: ${memberSince}`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <button
              type="button"
              onClick={() => switchTab('profile')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold) hover:opacity-100 opacity-80 transition-all"
            >
              <Settings size={14} />
              {ui('ui_extra_b0_dash_account_settings', 'Account Settings')}
            </button>
            <Link
              href={localizePath(locale, '/logout')}
              className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-(--gm-text) opacity-45 hover:opacity-70 transition-opacity"
            >
              {ui('ui_extra_b0_dash_sign_out', 'Sign out')}
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <nav className="mb-10 flex flex-wrap gap-2 border-b border-(--gm-border-soft)">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`relative inline-flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                  active
                    ? 'text-(--gm-gold)'
                    : 'text-(--gm-text) opacity-50 hover:opacity-80'
                }`}
              >
                {t.icon}
                {t.label}
                {active && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-(--gm-gold)" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        {tab === 'overview' && (
          <>
            {pendingCount > 0 && (
              <Link
                href={localizePath(locale, '/karne')}
                className="group flex flex-col md:flex-row items-center gap-6 mb-8 p-6 md:p-7 rounded-2xl border-2 border-(--gm-gold)/40 bg-(--gm-gold)/5 hover:bg-(--gm-gold)/10 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-(--gm-gold)/15 border border-(--gm-gold)/40 flex items-center justify-center text-(--gm-gold-deep) shrink-0">
                  <Sparkles size={22} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase mb-1.5">
                    {ui('ui_extra_b0_dash_astrologer_report', 'Astrologer Report Card')}
                  </div>
                  <h3 className="font-serif text-xl text-(--gm-text)">
                    {`${pendingCount} ${ui('ui_extra_b0_dash_pending_report', 'pending report card questions')}`}
                  </h3>
                  <p className="text-sm text-(--gm-text-dim) mt-1">
                    {ui('ui_extra_b0_dash_report_desc', 'Did the readings you received 6 months ago come true? Your answers shape astrologers report cards.')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep) group-hover:text-(--gm-gold) transition-colors">
                  {ui('ui_extra_b0_dash_respond', 'Respond')}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            )}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {overviewCards.map((c) => (
                <DashCard key={c.title} {...c} />
              ))}
            </section>

            <section className="mt-12 flex flex-col md:flex-row items-center gap-6 p-8 border border-(--gm-gold)/20 bg-(--gm-gold)/5 rounded-2xl">
              <div className="shrink-0 text-(--gm-gold-deep)">
                <ShieldCheck size={36} strokeWidth={1.4} />
              </div>
              <div>
                <div className="font-display text-[11px] tracking-[0.2em] text-(--gm-gold-deep) uppercase mb-2">
                  {ui('ui_extra_b0_dash_privacy_promise', 'Privacy Promise')}
                </div>
                <p className="text-(--gm-text-dim) font-light leading-relaxed text-sm">
                  {ui('ui_extra_b0_dash_privacy_desc', 'Your birth data and session notes are stored encrypted in compliance with KVKK. You can delete your account or download your data at any time.')}
                </p>
              </div>
            </section>
          </>
        )}

        {tab === 'profile' && (
          <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 max-w-[var(--gm-w-narrow)] shadow-(--gm-shadow-soft)">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <UserIcon size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {ui('ui_extra_b0_dash_profile_info', 'Profile Information')}
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>{ui('ui_extra_b0_dash_full_name', 'Full Name')}</FieldLabel>
                  <input
                    className={fieldClasses()}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={ui('ui_extra_b0_dash_full_name_ph', 'Your full name')}
                  />
                </div>
                <div>
                  <FieldLabel>{ui('ui_extra_b0_dash_phone', 'Phone')}</FieldLabel>
                  <input
                    className={fieldClasses()}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 5xx xxx xx xx"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{ui('ui_extra_b0_dash_address', 'Address')}</FieldLabel>
                <input
                  className={fieldClasses()}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <FieldLabel>{ui('ui_extra_b0_dash_city', 'City')}</FieldLabel>
                <CityAutocomplete
                  value={formData.city}
                  onChange={(city) => setFormData({ ...formData, city })}
                  placeholder={ui('ui_extra_b0_dash_city_ph', 'Search city...')}
                  country={locale === 'de' ? 'de' : 'tr'}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={upsertProfileState.isLoading}
                  className="btn-premium px-10 py-3 text-xs disabled:opacity-50"
                >
                  {upsertProfileState.isLoading
                    ? ui('ui_extra_b0_dash_saving', 'SAVING...')
                    : ui('ui_extra_b0_dash_save_changes', 'SAVE CHANGES')}
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === 'bookings' && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <ShoppingBag size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {ui('ui_extra_b0_dash_my_bookings', 'My Bookings')}
              </h2>
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-(--gm-bg-deep) animate-pulse" />
                ))}
              </div>
            ) : !myBookings || myBookings.length === 0 ? (
              <div className="py-20 text-center space-y-6 rounded-2xl border border-dashed border-(--gm-border-soft)">
                <div className="w-16 h-16 rounded-full bg-(--gm-bg-deep) flex items-center justify-center mx-auto border border-(--gm-border-soft)">
                  <Calendar className="w-6 h-6 text-(--gm-text-muted)" />
                </div>
                <p className="text-(--gm-text-dim) font-serif italic">
                  {ui('ui_extra_b0_dash_no_bookings', 'No bookings yet.')}
                </p>
                <Link href={localizePath(locale, '/consultants')} className="btn-premium inline-flex py-3 px-8">
                  {ui('ui_extra_b0_dash_find_consultants', 'Find Consultants')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {myBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-(--gm-gold)/40 transition-all duration-300 group shadow-(--gm-shadow-soft)"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep) shrink-0 border border-(--gm-gold)/20 overflow-hidden">
                          {booking.consultant_avatar ? (
                            <img src={booking.consultant_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 opacity-40" />
                          )}
                        </div>
                        {booking.status === 'confirmed' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-(--gm-success) rounded-full border-2 border-(--gm-surface) animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-[10px] font-bold text-(--gm-gold-deep) tracking-[0.2em] uppercase">
                            {ui('ui_extra_b0_dash_consultation', 'Consultation')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase ${
                            booking.status === 'completed'
                              ? 'bg-(--gm-success)/10 text-(--gm-success)'
                              : booking.status === 'cancelled'
                              ? 'bg-(--gm-error)/10 text-(--gm-error)'
                              : 'bg-(--gm-gold)/10 text-(--gm-gold-deep)'
                          }`}>
                            {isTr ? booking.status_label_tr || booking.status : booking.status_label_en || booking.status}
                          </span>
                        </div>
                        <h4 className="text-(--gm-text) font-serif text-xl group-hover:text-(--gm-gold) transition-colors">
                          {booking.consultant_name || booking.resource_title || ui('ui_account_msg_consultant_fallback', 'Consultant')}
                        </h4>
                        {booking.service_title && (
                          <p className="text-[11px] text-(--gm-text-dim) mt-0.5">{booking.service_title}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-(--gm-text-muted) text-xs">
                           <span className="flex items-center gap-1.5"><Calendar size={13} /> {fmtDate(booking.appointment_date, locale)}</span>
                           <span className="flex items-center gap-1.5"><Clock size={13} /> {booking.appointment_time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {booking.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setReviewModal({
                            isOpen: true,
                            targetId: booking.consultant_id || booking.resource_id,
                            consultantName: booking.consultant_name || booking.resource_title || ''
                          })}
                          className="btn-outline-premium px-5 py-2.5 text-[10px]"
                        >
                          {ui('ui_extra_b0_dash_write_review', 'WRITE REVIEW')}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <Link
                          href={localizePath(locale, `/booking/${booking.id}/call`)}
                          className="btn-premium px-6 py-2.5 text-[10px] shadow-gold"
                        >
                          {ui('ui_extra_b0_dash_join_call', 'JOIN CALL')}
                        </Link>
                      )}

                      <BookingMessageButton bookingId={booking.id} variant="secondary" label={ui('ui_account_msg_button_label', 'MESSAGE')} />

                      <Link
                        href={localizePath(locale, `/booking/${booking.id}`)}
                        className="p-2.5 rounded-xl border border-(--gm-border-soft) text-(--gm-text-muted) hover:text-(--gm-gold) hover:border-(--gm-gold)/40 transition-all"
                        title={ui('ui_extra_b0_dash_details', 'Details')}
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'messages' && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <MessageCircle size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {ui('ui_extra_b0_dash_card_my_messages', 'My Messages')}
              </h2>
            </div>
            <UserMessagesPanel isTr={isTr} />
          </section>
        )}

        {tab === 'history' && (
          <section>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                  <Sparkles size={18} />
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                  {ui('ui_extra_b0_dash_tab_history', 'Reading History')}
                </h2>
              </div>

              {(history?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllReadings}
                  disabled={deleteAllReadingsState.isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--gm-error)/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-error) transition hover:bg-(--gm-error)/10 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {ui('ui_extra_b0_dash_delete_all', 'Delete All')}
                </button>
              )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {HISTORY_TYPES.map((item) => {
                const active = historyFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setHistoryFilter(item.key)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                      active
                        ? 'border-(--gm-gold)/60 bg-(--gm-gold)/15 text-(--gm-gold-deep)'
                        : 'border-(--gm-border-soft) text-(--gm-text-dim) hover:border-(--gm-gold)/40 hover:text-(--gm-text)'
                    }`}
                  >
                    {ui(item.labelKey, item.fallback)}
                  </button>
                );
              })}
            </div>

            {historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-(--gm-bg-deep) animate-pulse" />
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-20 text-center space-y-6 rounded-2xl border border-dashed border-(--gm-border-soft)">
                <div className="w-16 h-16 rounded-full bg-(--gm-bg-deep) flex items-center justify-center mx-auto border border-(--gm-border-soft)">
                  <Sparkles className="w-6 h-6 text-(--gm-text-muted)" />
                </div>
                <p className="text-(--gm-text-dim) font-serif italic">
                  {ui('ui_extra_b0_dash_no_saved_readings', 'No saved readings yet.')}
                </p>
                <Link href={localizePath(locale, '/tarot')} className="btn-premium inline-flex py-3 px-8">
                  {ui('ui_extra_b0_dash_get_reading', 'Get a reading')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredHistory.map((item) => {
                  const meta = HISTORY_META[item.type];
                  // Route to the index page for modules that do not expose detail pages.
                  const detailHref =
                    item.type === 'numerology' || item.type === 'birth_chart'
                      ? localizePath(locale, meta.route)
                      : localizePath(locale, `${meta.route}/${item.id}`);
                  return (
                    <article
                      key={`${item.type}:${item.id}`}
                      className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 md:p-6 transition hover:border-(--gm-gold)/40 shadow-(--gm-shadow-soft)"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-(--gm-gold)/20 bg-(--gm-gold)/10 text-(--gm-gold-deep)">
                            {meta.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep)">
                                {ui(meta.labelKey, meta.fallback)}
                              </span>
                              <span className="text-[10px] text-(--gm-text-muted)">
                                {fmtDate(item.created_at, locale)}
                              </span>
                            </div>
                            <h3 className="truncate font-serif text-lg text-(--gm-text)">
                              {item.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm text-(--gm-text-dim)">
                              {item.snippet || ui('ui_extra_b0_dash_no_preview', 'No preview available.')}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={detailHref}
                            className="inline-flex items-center gap-2 rounded-xl border border-(--gm-border-soft) px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-text-dim) transition hover:border-(--gm-gold)/40 hover:text-(--gm-gold)"
                          >
                            <Eye size={14} />
                            {ui('ui_extra_b0_dash_open', 'Open')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteReading(item)}
                            disabled={deleteReadingState.isLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-(--gm-error)/25 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-error) transition hover:bg-(--gm-error)/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {ui('ui_extra_b0_dash_delete', 'Delete')}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Security / Password */}
        {tab === 'security' && (
          <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 max-w-[var(--gm-w-narrow)] shadow-(--gm-shadow-soft)">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <Lock size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {ui('ui_extra_b0_dash_security_settings', 'Security Settings')}
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <FieldLabel>{ui('ui_extra_b0_dash_current_password', 'Current password')}</FieldLabel>
                <input
                  type="password"
                  className={fieldClasses()}
                  value={passData.old}
                  onChange={(e) => setPassData({ ...passData, old: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>{ui('ui_extra_b0_dash_new_password', 'New password')}</FieldLabel>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passData.new}
                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <FieldLabel>{ui('ui_extra_b0_dash_confirm_password', 'Confirm password')}</FieldLabel>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passData.confirm}
                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={updateUserState.isLoading}
                  className="btn-premium px-10 py-3 text-xs disabled:opacity-50"
                >
                  {updateUserState.isLoading
                    ? ui('ui_extra_b0_dash_updating', 'UPDATING...')
                    : ui('ui_extra_b0_dash_update_password', 'UPDATE PASSWORD')}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
        targetId={reviewModal.targetId}
        targetType="consultant"
        consultantName={reviewModal.consultantName}
        locale={locale}
      />
    </PageContainer>
  );
}
