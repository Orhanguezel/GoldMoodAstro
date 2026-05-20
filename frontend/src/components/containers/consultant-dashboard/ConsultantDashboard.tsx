'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Package,
  Calendar,
  BarChart3,
  Star,
  CheckCircle2,
  XCircle,
  Power,
  PowerOff,
  Loader2,
  MessageCircle,
  Wallet,
  FileText,
  TrendingUp,
  TrendingDown,
  Timer,
  Bell,
  ArrowRight,
  Zap,
  Users,
  CreditCard,
  CheckCheck,
  AlertCircle,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath, extractApiError } from '@/integrations/shared';
import { useUiSection } from '@/i18n';
import AvatarUpload from '@/components/common/AvatarUpload';
import {
  type ConsultantSelfProfile,
  type ConsultantSelfStats,
  type ProfileCompletionItem,
  useGetMyConsultantProfileQuery,
  useUpdateMyConsultantProfileMutation,
  useGetMyConsultantStatsQuery,
  useGetMyConsultantBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useCancelMyConsultantBookingMutation,
  useUpdateMyConsultantBookingNotesMutation,
  useGetMyConsultantProfileCompletionQuery,
  useSubmitMyConsultantKycMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';
import { useListLanguagesPublicQuery } from '@/integrations/rtk/public/languages.public.endpoints';
import ServicesPanel from './ServicesPanel';
import MessagesPanel from './MessagesPanel';
import WalletPanel from './WalletPanel';
import ReviewsPanel from './ReviewsPanel';
import AvailabilityPanel from './AvailabilityPanel';
import BlogPanel from './BlogPanel';
import ClientsPanel from './ClientsPanel'; // C8
import ProfileViewsPanel from './ProfileViewsPanel'; // C7
import BookingMessageButton from '@/components/common/BookingMessageButton';
import RichContentEditor from '@/components/common/RichContentEditor';
import MultiSelectChip from '@/components/common/MultiSelectChip';
import ConsultantCardPreview from './ConsultantCardPreview';
import PageContainer from '@/components/common/PageContainer';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';

type TabKey = 'overview' | 'profile' | 'services' | 'availability' | 'bookings' | 'messages' | 'blog' | 'wallet' | 'reviews' | 'clients' | 'analytics';

const TABS: Array<{ key: TabKey; labelKey: string; fallback: string; icon: React.ElementType }> = [
  { key: 'overview', labelKey: 'ui_dashboard_tab_overview', fallback: 'Genel Bakış', icon: LayoutDashboard },
  { key: 'profile', labelKey: 'ui_dashboard_tab_profile', fallback: 'Profil', icon: User },
  { key: 'services', labelKey: 'ui_dashboard_tab_services', fallback: 'Hizmetler', icon: Package },
  { key: 'availability', labelKey: 'ui_dashboard_tab_availability', fallback: 'Müsaitlik', icon: Calendar },
  { key: 'bookings', labelKey: 'ui_dashboard_tab_bookings', fallback: 'Randevular', icon: CheckCircle2 },
  { key: 'clients', labelKey: 'ui_dashboard_tab_clients', fallback: 'Danışanlarım', icon: Users },
  { key: 'messages', labelKey: 'ui_dashboard_tab_messages', fallback: 'Mesajlar', icon: MessageCircle },
  { key: 'wallet', labelKey: 'ui_dashboard_tab_wallet', fallback: 'Cüzdan', icon: Wallet },
  { key: 'analytics', labelKey: 'ui_dashboard_tab_analytics', fallback: 'Analitik', icon: BarChart3 },
  { key: 'reviews', labelKey: 'ui_dashboard_tab_reviews', fallback: 'Yorumlar', icon: Star },
  { key: 'blog', labelKey: 'ui_dashboard_tab_blog', fallback: 'Blog', icon: FileText },
];

interface Props {
  locale: string;
}

export default function ConsultantDashboard({ locale }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'overview';
  const [tab, setTab] = useState<TabKey>(TABS.some(t => t.key === initialTab) ? initialTab : 'overview');

  // C10: sync tab to URL
  const handleTabChange = (key: TabKey) => {
    setTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const { isAuthenticated, isReady, isLoading: authLoading } = useAuthStore();
  const { ui } = useUiSection('ui_dashboard', locale as any);

  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetMyConsultantProfileQuery(undefined, {
    skip: !isReady || !isAuthenticated,
  });
  const { data: stats, isLoading: statsLoading } = useGetMyConsultantStatsQuery(undefined, { skip: !profile });

  if (!isReady || authLoading || profileLoading) {
    return (
      <PageContainer width="wide" className="bg-(--gm-bg)" verticalPadding="large" center>
        <div className="w-8 h-8 rounded-full border-2 border-(--gm-gold)/30 border-t-(--gm-gold) animate-spin" />
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(localizePath(locale, '/me/consultant'));
    return (
      <EmptyState
        title={ui('ui_dashboard_auth_required_title', 'Sign in to consultant dashboard')}
        description={ui('ui_dashboard_auth_required_desc', 'This area is only available to signed-in consultant accounts.')}
        primaryHref={`${localizePath(locale, '/login')}?next=${next}`}
        primaryLabel={ui('ui_dashboard_sign_in', 'Sign In')}
        secondaryHref={localizePath(locale, '/become-consultant')}
        secondaryLabel={ui('ui_dashboard_become_consultant', 'Become a Consultant')}
      />
    );
  }

  if (profileError || !profile) {
    return (
      <EmptyState
        title={ui('ui_dashboard_consultant_only_title', 'This page is only available to consultants')}
        description={ui('ui_dashboard_consultant_only_desc', 'If your account is not a consultant account yet, you can start the approval process with the application form.')}
        primaryHref={localizePath(locale, '/become-consultant')}
        primaryLabel={ui('ui_dashboard_become_consultant', 'Become a Consultant')}
        secondaryHref={localizePath(locale, '/')}
        secondaryLabel={ui('ui_dashboard_back_home', 'Back to Home')}
      />
    );
  }

  const serverAvatarUrl = profile.user?.avatar_url || '';
  const fullName = profile.user?.full_name || ui('ui_dashboard_consultant_fallback', 'Consultant');
  const initials = initialsFromName(fullName);

  return (
    <DashboardBody
      profile={profile}
      stats={stats}
      statsLoading={statsLoading}
      locale={locale}
      tab={tab}
      handleTabChange={handleTabChange}
      ui={ui}
      serverAvatarUrl={serverAvatarUrl}
      fullName={fullName}
      initials={initials}
    />
  );
}

type DashboardBodyProps = {
  profile: any;
  stats: any;
  statsLoading: boolean;
  locale: string;
  tab: string;
  handleTabChange: (key: any) => void;
  ui: any;
  serverAvatarUrl: string;
  fullName: string;
  initials: string;
};

function DashboardBody({ profile, stats, statsLoading, locale, tab, handleTabChange, ui, serverAvatarUrl, fullName, initials }: DashboardBodyProps) {
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string>(serverAvatarUrl);
  const [updateHeaderProfile] = useUpdateMyConsultantProfileMutation();

  useEffect(() => { setHeaderAvatarUrl(serverAvatarUrl); }, [serverAvatarUrl]);

  const handleHeaderAvatarUploaded = async (url: string) => {
    // Cache-bust: aynı publicId/URL'e yeni dosya yazıldıysa tarayıcı eski versiyonu
    // göstermesin diye URL'e ?v=<timestamp> ekle. Hem state hem DB'ye busted url'i yaz.
    const sep = url.includes('?') ? '&' : '?';
    const bustedUrl = `${url}${sep}v=${Date.now()}`;
    setHeaderAvatarUrl(bustedUrl);
    try {
      await updateHeaderProfile({ avatar_url: bustedUrl }).unwrap();
    } catch (err) {
      console.error('[ConsultantDashboard] avatar persist failed', err);
    }
  };

  const avatarUrl = headerAvatarUrl;

  return (
    <PageContainer width="wide" className="bg-(--gm-bg)" verticalPadding="large">
      <div className="w-full">
        {/* ─── Header card — matches user dashboard ─── */}
        <header className="mb-8 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10 shadow-(--gm-shadow-soft)">
          {/* Avatar — clickable for upload (consultant panel) */}
          <AvatarUpload
            src={avatarUrl}
            initials={initials}
            onUploaded={handleHeaderAvatarUploaded}
            size={80}
            bucket="consultant_avatars"
            folder={profile.id}
          />

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
              {ui('ui_dashboard_page_title', 'Consultant Panel')}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-(--gm-text) mt-1 leading-tight">
              {ui('ui_dashboard_greeting', 'Hello, {name}').replace('{name}', fullName.split(' ')[0])}
            </h1>
            <p className="text-(--gm-text) opacity-55 text-sm mt-2 truncate">{profile.user?.email || ''}</p>
            {/* Approval + online badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                profile.approval_status === 'approved'
                  ? 'bg-(--gm-success)/15 text-(--gm-success)'
                  : profile.approval_status === 'pending'
                  ? 'bg-(--gm-warning)/15 text-(--gm-warning)'
                  : 'bg-(--gm-error)/15 text-(--gm-error)'
              }`}>
                {profile.approval_status === 'approved'
                  ? ui('ui_dashboard_status_approved', 'Approved')
                  : profile.approval_status === 'pending'
                  ? ui('ui_dashboard_status_pending_review', 'In Review')
                  : ui('ui_dashboard_status_rejected', 'Rejected')}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                profile.is_available
                  ? 'bg-(--gm-success)/15 text-(--gm-success)'
                  : 'bg-(--gm-border-soft) text-(--gm-text) opacity-50'
              }`}>
                {profile.is_available
                  ? ui('ui_dashboard_online', 'Online')
                  : ui('ui_dashboard_offline', 'Offline')}
              </span>
            </div>
          </div>

          {/* Right: Online toggle + profile link */}
          <div className="flex flex-col gap-3 md:items-end shrink-0">
            <AvailabilityToggle isAvailable={profile.is_available === 1} />
            <Link
              href={localizePath(locale, `/consultants/${profile.id}`)}
              className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-(--gm-text) opacity-45 hover:opacity-70 transition-opacity"
            >
            {ui('ui_dashboard_view_profile', 'View Profile')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* ─── Tabs — matches user dashboard style ─── */}
        <nav className="mb-10 flex flex-wrap gap-1 border-b border-(--gm-border-soft) overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`relative inline-flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-all whitespace-nowrap ${
                  active
                    ? 'text-(--gm-gold)'
                    : 'text-(--gm-text) opacity-50 hover:opacity-80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {ui(t.labelKey, t.fallback)}
                {active && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-(--gm-gold)" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Tab content ─── */}
        {tab === 'overview' && <OverviewPanel locale={locale} stats={stats} profile={profile} isLoading={statsLoading} onTabChange={handleTabChange} />}
        {tab === 'profile' && <ProfilePanel locale={locale} profile={profile} />}
        {tab === 'services' && <ServicesPanel />}
        {tab === 'availability' && <AvailabilityPanel />}
        {tab === 'bookings' && <BookingsPanel locale={locale} />}
        {tab === 'clients' && <ClientsPanel />}
        {tab === 'messages' && <MessagesPanel />}
        {tab === 'blog' && <BlogPanel locale={locale} />}
        {tab === 'wallet' && <WalletPanel />}
        {tab === 'analytics' && <ProfileViewsPanel />}
        {tab === 'reviews' && <ReviewsPanel />}
      </div>
    </PageContainer>
  );
}

function EmptyState({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="font-serif text-2xl text-[var(--gm-text)]">{title}</h2>
      <p className="max-w-[var(--gm-w-form)] text-[var(--gm-text-dim)]">{description}</p>
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="px-6 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-xs font-bold uppercase tracking-widest"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="px-6 py-3 rounded-full border border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)] text-xs font-bold uppercase tracking-widest"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}

/* ────────── Overview (T30-9) ────────── */
function OverviewPanel({
  locale,
  stats,
  profile,
  isLoading,
  onTabChange,
}: {
  locale: string;
  stats?: ConsultantSelfStats;
  profile: ConsultantSelfProfile;
  isLoading?: boolean;
  onTabChange?: (k: TabKey) => void;
}) {
  const { ui } = useUiSection('ui_dashboard', locale as any);
  const { data: completion } = useGetMyConsultantProfileCompletionQuery();
  const days = stats?.last_7_days?.length ? stats.last_7_days : getEmptyLast7Days();
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const sessionDelta = stats?.session_delta_pct ?? 0;
  const earningsDelta = stats?.earnings_delta_pct ?? 0;
  const avgRespMin = stats?.avg_response_minutes ?? 0;
  const respLabel = avgRespMin > 0
    ? avgRespMin >= 60 ? ui('ui_dashboard_hours_short', '~{value}h').replace('{value}', String(Math.round(avgRespMin / 60))) : ui('ui_dashboard_minutes_short', '~{value}m').replace('{value}', String(avgRespMin))
    : '—';

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-4 text-[12px] text-[var(--gm-text-dim)]">
          {ui('ui_dashboard_stats_loading', 'Updating statistics...')}
        </div>
      )}

      {/* Üst metric kartları (delta ile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStatCard
          icon={Calendar}
          label={ui('ui_dashboard_stat_month_sessions', 'Sessions This Month')}
          value={stats?.this_month_session_count ?? 0}
          delta={sessionDelta}
          subLabel={ui('ui_dashboard_stat_last_month_count', 'Last month: {value}').replace('{value}', String(stats?.last_month_session_count ?? 0))}
        />
        <BigStatCard
          icon={BarChart3}
          label={ui('ui_dashboard_stat_month_earnings', 'Earnings This Month')}
          value={`₺${Math.round(stats?.this_month_earnings ?? 0)}`}
          delta={earningsDelta}
          subLabel={ui('ui_dashboard_stat_last_month_money', 'Last month: ₺{value}').replace('{value}', String(Math.round(stats?.last_month_earnings ?? 0)))}
        />
        <BigStatCard
          icon={Star}
          label={ui('ui_dashboard_stat_rating', 'Average Rating')}
          value={(stats?.rating_avg ?? 0).toFixed(2)}
          subLabel={ui('ui_dashboard_stat_reviews_count', '{value} reviews').replace('{value}', String(stats?.rating_count ?? 0))}
        />
        <BigStatCard
          icon={Timer}
          label={ui('ui_dashboard_stat_response_time', 'Response Time')}
          value={respLabel}
          subLabel={ui('ui_dashboard_stat_response_sub', 'average message reply time')}
        />
      </div>

      {/* Action items + 7 günlük grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        {/* 7-day chart */}
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{ui('ui_dashboard_last_7_days', 'Last 7 Days')}</h3>
              <p className="text-[12px] text-[var(--gm-text-dim)] mt-1">{ui('ui_dashboard_daily_sessions', 'Daily session count')}</p>
            </div>
            <div className="text-[10px] text-[var(--gm-muted)]">
              {ui('ui_dashboard_total_sessions_inline', 'Total {value} sessions').replace('{value}', String(days.reduce((s, d) => s + d.count, 0)))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-32 mt-6">
            {days.map((d) => {
              const heightPct = (d.count / maxCount) * 100;
              const dt = new Date(`${d.date}T12:00:00`);
              const dayLabel = dt.toLocaleDateString(locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'short' });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 group" title={ui('ui_dashboard_chart_bar_title', '{date}: {count} sessions - ₺{earnings}').replace('{date}', d.date).replace('{count}', String(d.count)).replace('{earnings}', String(d.earnings))}>
                  <span className="text-[10px] text-[var(--gm-muted)] font-bold">{d.count > 0 ? d.count : ''}</span>
                  <div
                    className="w-full rounded-t-md bg-[var(--gm-gold)] group-hover:bg-[var(--gm-gold-light)] transition-colors"
                    style={{ height: `${Math.max(2, heightPct)}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-[var(--gm-text-dim)] capitalize">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eylem gerektiren */}
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6 min-w-[260px]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-4">
            {ui('ui_dashboard_actions_needed', 'Needs Action')}
          </h3>
          <div className="space-y-2">
            {(stats?.requested_now_count ?? 0) > 0 && (
              <ActionRow
                icon={Zap}
                label={ui('ui_dashboard_action_instant_request', 'Instant Session Request')}
                count={stats?.requested_now_count ?? 0}
                onClick={() => onTabChange?.('bookings')}
                urgent
              />
            )}
            <ActionRow
              icon={Bell}
              label={ui('ui_dashboard_action_pending_booking', 'Pending Booking')}
              count={stats?.pending_bookings ?? 0}
              onClick={() => onTabChange?.('bookings')}
            />
            <ActionRow
              icon={MessageCircle}
              label={ui('ui_dashboard_action_unanswered_message', 'Unanswered Message')}
              count={stats?.pending_messages ?? 0}
              onClick={() => onTabChange?.('messages')}
            />
          </div>
        </div>
      </div>

      {/* Hızlı eylem butonları */}
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-4">
          {ui('ui_dashboard_quick_actions', 'Quick Actions')}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <QuickActionButton icon={Package} label={ui('ui_dashboard_quick_add_service', 'Add Service')} onClick={() => onTabChange?.('services')} />
          <QuickActionButton icon={Calendar} label={ui('ui_dashboard_quick_edit_availability', 'Edit Availability')} onClick={() => onTabChange?.('availability')} />
          <QuickActionButton icon={MessageCircle} label={ui('ui_dashboard_quick_view_messages', 'View Messages')} onClick={() => onTabChange?.('messages')} />
          <QuickActionButton icon={Wallet} label={ui('ui_dashboard_tab_wallet', 'Wallet')} onClick={() => onTabChange?.('wallet')} />
          <QuickActionButton icon={User} label={ui('ui_dashboard_quick_edit_profile', 'Edit Profile')} onClick={() => onTabChange?.('profile')} />
        </div>
      </div>

      {/* Onay durumu + toplam */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{ui('ui_dashboard_approval_status', 'Approval Status')}</span>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile.approval_status === 'approved'
                  ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]'
                  : profile.approval_status === 'pending'
                    ? 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]'
                    : 'bg-[var(--gm-error)]/15 text-[var(--gm-error)]'
              }`}
            >
              {profile.approval_status === 'approved' ? ui('ui_dashboard_status_approved', 'Approved') : profile.approval_status === 'pending' ? ui('ui_dashboard_status_pending_review', 'In Review') : ui('ui_dashboard_status_rejected', 'Rejected')}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile.is_available
                  ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]'
                  : 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]'
              }`}
            >
              {profile.is_available ? ui('ui_dashboard_online', 'Online') : ui('ui_dashboard_offline', 'Offline')}
            </span>
          </div>
        </div>
        <StatCardSmall icon={CheckCircle2} label={ui('ui_dashboard_total_sessions', 'Total Sessions')} value={stats?.total_sessions ?? 0} />
        <StatCardSmall icon={Star} label={ui('ui_dashboard_total_reviews', 'Total Reviews')} value={stats?.rating_count ?? 0} />
      </div>

      {/* C9: Profilinizi Güçlendirin (Completion Score) */}
      {completion && (
        <CompletionScoreWidget score={completion.score} items={completion.items} onTabChange={onTabChange} />
      )}
    </div>
  );
}

function getEmptyLast7Days(): ConsultantSelfStats['last_7_days'] {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date: date.toISOString().slice(0, 10), count: 0, earnings: 0 };
  });
}

function initialsFromName(name?: string | null) {
  return (name || 'GM')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function BigStatCard({ icon: Icon, label, value, delta, subLabel }: { icon: React.ElementType; label: string; value: React.ReactNode; delta?: number; subLabel?: string }) {
  const isPos = (delta ?? 0) >= 0;
  return (
    <div className="p-5 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-(--gm-shadow-soft)">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-80">{label}</span>
        <Icon className="w-4 h-4 text-(--gm-gold) opacity-60" />
      </div>
      <div className="font-serif text-3xl text-(--gm-text)">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {typeof delta === 'number' && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isPos ? 'text-(--gm-success)' : 'text-(--gm-error)'}`}>
            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPos ? '+' : ''}{delta}%
          </span>
        )}
        {subLabel && <span className="text-[10px] text-(--gm-text) opacity-40">{subLabel}</span>}
      </div>
    </div>
  );
}

function StatCardSmall({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-(--gm-shadow-soft)">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-80">{label}</span>
        <Icon className="w-4 h-4 text-(--gm-gold) opacity-60" />
      </div>
      <div className="font-serif text-2xl text-(--gm-text)">{value}</div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, count, onClick, urgent }: { icon: React.ElementType; label: string; count: number; onClick?: () => void; urgent?: boolean }) {
  const has = count > 0;
  const cls = urgent && has
    ? 'bg-[var(--gm-error)]/15 hover:bg-[var(--gm-error)]/25 border border-[var(--gm-error)]/50 animate-pulse'
    : has
      ? 'bg-[var(--gm-gold)]/10 hover:bg-[var(--gm-gold)]/15 border border-[var(--gm-gold)]/30'
      : 'bg-[var(--gm-bg-deep)]/30 hover:bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)]';
  const accent = urgent && has ? 'text-[var(--gm-error)]' : has ? 'text-[var(--gm-gold)]' : 'text-[var(--gm-muted)]';
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${cls}`}>
      <Icon className={`w-4 h-4 ${accent}`} />
      <span className="flex-1 text-[12px] text-[var(--gm-text)]">{label}</span>
      <span className={`text-[14px] font-bold ${accent}`}>{count}</span>
      {has && <ArrowRight className={`w-3.5 h-3.5 ${accent}`} />}
    </button>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/40 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text)] hover:border-[var(--gm-gold)]/40 hover:text-[var(--gm-gold)] transition-all"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/* ────────── Availability Toggle ────────── */
function AvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const { ui } = useUiSection('ui_dashboard');
  const [updateProfile, { isLoading }] = useUpdateMyConsultantProfileMutation();
  const handleToggle = async () => {
    try {
      await updateProfile({ is_available: isAvailable ? 0 : 1 }).unwrap();
      toast.success(isAvailable ? ui('ui_dashboard_toast_offline', 'You are offline') : ui('ui_dashboard_toast_online', 'You are online'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_toast_update_failed', 'Could not update')));
    }
  };
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-[0.18em] transition-all ${
        isAvailable
          ? 'border-(--gm-success)/40 bg-(--gm-success)/10 text-(--gm-success) hover:bg-(--gm-success)/20'
          : 'border-(--gm-border-soft) bg-(--gm-surface) text-(--gm-text) opacity-60 hover:opacity-100'
      }`}
    >
      {isAvailable ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
      {isAvailable ? ui('ui_dashboard_online', 'Online') : ui('ui_dashboard_offline', 'Offline')}
    </button>
  );
}

/* ────────── Profile ────────── */
// C1: Platformlar sadece site-içi sesli/görüntülü (dış platform yok)
const PLATFORM_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: 'audio', label: 'Sesli Görüşme' },
  { slug: 'video', label: 'Görüntülü Görüşme' },
];

function ProfilePanel({ locale, profile }: { locale: string; profile: ConsultantSelfProfile }) {
  const { ui } = useUiSection('ui_dashboard', locale as any);
  const { data: serviceCategories = [], isLoading: isLoadingCategories } = useListServiceCategoriesPublicQuery();
  const { data: dbLanguages = [], isLoading: isLoadingLanguages } = useListLanguagesPublicQuery();
  const [updateProfile, { isLoading }] = useUpdateMyConsultantProfileMutation();
  const [bio, setBio] = useState<string>(profile.bio || '');
  const [expertise, setExpertise] = useState<string[]>(profile.expertise || []);
  const [languages, setLanguages] = useState<string[]>(profile.languages || []);
  const [meetingPlatforms, setMeetingPlatforms] = useState<string[]>(profile.meeting_platforms || []);
  // C1: socialLinks state kaldırıldı (Danışan kaçırma yasağı)
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.user?.avatar_url || '');
  // C4: Banka bilgileri
  const [bankIban, setBankIban] = useState<string>(profile.bank_iban || '');
  const [bankHolder, setBankHolder] = useState<string>(profile.bank_account_holder || '');
  const [bankName, setBankName] = useState<string>(profile.bank_name || '');
  
  // C3: KYC bilgileri
  const [accountType, setAccountType] = useState<'individual' | 'company'>(profile.account_type || 'individual');
  const [identityNumber, setIdentityNumber] = useState(profile.identity_number || '');
  const [taxNumber, setTaxNumber] = useState(profile.tax_number || '');
  const [taxOffice, setTaxOffice] = useState(profile.tax_office || '');
  const [companyName, setCompanyName] = useState(profile.company_name || '');
  const [billingAddress, setBillingAddress] = useState(profile.billing_address || '');
  const [kycDocuments, setKycDocuments] = useState<Array<{type: string, url: string}>>(profile.kyc_documents || []);
  const [submitKyc, { isLoading: isSubmittingKyc }] = useSubmitMyConsultantKycMutation();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const expertiseOptions = serviceCategories.map((category) => ({ value: category.slug, label: category.name }));

  const getLanguageLabel = (lang: any, localeStr: string) => {
    if (localeStr === 'tr') return lang.name_tr || lang.slug;
    if (localeStr === 'en') return lang.name_en || lang.slug;
    if (localeStr === 'de') return lang.name_de || lang.slug;
    return lang.name_en || lang.slug;
  };

  const languageOptions = dbLanguages.map((lang) => ({ value: lang.slug, label: getLanguageLabel(lang, locale) }));
  const expertiseLabels = useMemo(
    () => Object.fromEntries(serviceCategories.map((category) => [category.slug, category.name])),
    [serviceCategories],
  );

  const togglePlatform = (slug: string) => {
    setMeetingPlatforms((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (bio.length > 5000) newErrors.bio = ui('ui_dashboard_error_bio_max', 'Bio can be up to 5000 characters.');
    if (expertise.length > 20) newErrors.expertise = ui('ui_dashboard_error_expertise_max', 'You can add up to 20 expertise areas.');
    if (languages.length > 10) newErrors.languages = ui('ui_dashboard_error_languages_max', 'You can add up to 10 languages.');
    // C4: IBAN validation (TR + 24 rakam, toplam 26 karakter)
    const cleanIban = bankIban.replace(/\s/g, '').toUpperCase();
    if (cleanIban && !/^TR\d{24}$/.test(cleanIban)) {
      newErrors.bankIban = 'Geçerli bir TR IBAN girin (TR + 24 rakam, toplam 26 karakter)';
    }

    // C3: KYC validation
    if (accountType === 'individual' && identityNumber && identityNumber.length !== 11) {
      newErrors.identityNumber = 'TC Kimlik numarası 11 haneli olmalıdır.';
    }
    if (accountType === 'company' && taxNumber && (taxNumber.length < 10 || taxNumber.length > 11)) {
      newErrors.taxNumber = 'Vergi numarası 10 veya 11 haneli olmalıdır.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error(ui('ui_dashboard_error_fix_fields', 'Please fix the highlighted errors.'));
      return;
    }
    try {
      const cleanIban = bankIban.replace(/\s/g, '').toUpperCase();
      await updateProfile({
        bio: bio.trim() || null,
        expertise: expertise,
        languages: languages,
        meeting_platforms: meetingPlatforms,
        // C1: social_links artık gönderilmiyor (UI kaldırıldı)
        avatar_url: avatarUrl || null,
        // C4: Banka bilgileri
        bank_iban: cleanIban || null,
        bank_account_holder: bankHolder.trim() || null,
        bank_name: bankName.trim() || null,
        // C3: KYC bilgileri
        account_type: accountType,
        identity_number: identityNumber.trim() || null,
        tax_number: taxNumber.trim() || null,
        tax_office: taxOffice.trim() || null,
        company_name: companyName.trim() || null,
        billing_address: billingAddress.trim() || null,
        kyc_documents: kycDocuments.length > 0 ? kycDocuments : null,
      }).unwrap();
      toast.success(ui('ui_dashboard_profile_saved', 'Profile updated'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_profile_save_failed', 'Profile could not be updated')));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
          <AvatarUpload
            src={avatarUrl}
            initials={initialsFromName(profile.user?.full_name)}
            onUploaded={setAvatarUrl}
            bucket="consultant_avatars"
            folder={profile.id}
          />
          <div>
            <h3 className="font-serif text-lg text-[var(--gm-text)]">{profile.user?.full_name || ui('ui_dashboard_consultant_fallback', 'Consultant')}</h3>
            <div className="mt-2 space-y-1.5 border-l-2 border-[var(--gm-gold)]/20 pl-4">
              <p className="text-[11px] text-[var(--gm-text-dim)] flex items-start gap-1.5">
                <span className="text-[var(--gm-gold)] mt-0.5">•</span>
                <span>{ui('ui_dashboard_avatar_rule_face', 'Upload a clear face photo where your face is visible.')}</span>
              </p>
              <p className="text-[11px] text-[var(--gm-text-dim)] flex items-start gap-1.5">
                <span className="text-[var(--gm-gold)] mt-0.5">•</span>
                <span>{ui('ui_dashboard_avatar_rule_ai', 'AI-generated portraits are accepted if they are face-focused.')}</span>
              </p>
              <p className="text-[11px] text-[var(--gm-text-dim)] flex items-start gap-1.5">
                <span className="text-[var(--gm-gold)] mt-0.5">•</span>
                <span>{ui('ui_dashboard_avatar_rule_reject', 'Images containing landscapes, logos, objects or text are not accepted.')}</span>
              </p>
              <p className="text-[11px] text-[var(--gm-text-dim)] flex items-start gap-1.5">
                <span className="text-[var(--gm-gold)] mt-0.5">•</span>
                <span>{ui('ui_dashboard_avatar_rule_single', 'Use a single-person photo; group, blurry or heavily filtered photos are not approved.')}</span>
              </p>
              <p className="text-[11px] text-[var(--gm-text-dim)] flex items-start gap-1.5">
                <span className="text-[var(--gm-gold)] mt-0.5">•</span>
                <span>{ui('ui_dashboard_avatar_rule_tip', 'Tip: shoulder-level portrait, simple background, good light. Square (1:1), min ~400x400 px.')}</span>
              </p>
              <p className="text-[11px] text-[var(--gm-gold-dim)] italic font-serif mt-2">
                &quot;{ui('ui_dashboard_avatar_approval_note', 'Your photo is reviewed by the team; unsuitable images are rejected.')}&quot;
              </p>
            </div>
          </div>
        </div>

        <Field 
          label={ui('ui_dashboard_profile_bio_label', 'About Me (Rich Text)')}
          hint={ui('ui_dashboard_profile_bio_hint', 'Describe yourself, your approach and what you offer. Do not add contact details or external links here.')}
          error={errors.bio}
        >
          <div className="rich-editor-container">
            <RichContentEditor
              value={bio}
              onChange={setBio}
              height="300px"
              label=""
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className={`text-[10px] ${bio.length >= 5000 ? 'text-[var(--gm-error)]' : 'text-[var(--gm-muted)]'}`}>
              {ui('ui_dashboard_character_count', '{count} / 5000 characters').replace('{count}', String(bio.length))}
            </span>
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field 
            label={ui('ui_dashboard_expertise_label', 'Expertise Areas')}
            hint={ui('ui_dashboard_expertise_hint', 'Select only the areas where you actually provide guidance.')}
            error={errors.expertise}
          >
            {isLoadingCategories ? (
              <div className="text-[12px] text-(--gm-text-dim) py-2">{ui('ui_dashboard_loading', 'Yükleniyor...')}</div>
            ) : (
              <MultiSelectChip
                label=""
                selected={expertise}
                onSelectionChange={setExpertise}
                options={expertiseOptions}
                placeholder={ui('ui_dashboard_add_placeholder', 'Type to add...')}
              />
            )}
          </Field>
          <Field 
            label={ui('ui_dashboard_languages_label', 'Languages')}
            hint={ui('ui_dashboard_languages_hint', 'Select the languages you can use fluently in sessions.')}
            error={errors.languages}
          >
            {isLoadingLanguages ? (
              <div className="text-[12px] text-(--gm-text-dim) py-2">{ui('ui_dashboard_loading', 'Yükleniyor...')}</div>
            ) : (
              <MultiSelectChip
                label=""
                selected={languages}
                onSelectionChange={setLanguages}
                options={languageOptions}
                placeholder={ui('ui_dashboard_add_placeholder', 'Type to add...')}
              />
            )}
          </Field>
        </div>

        <Field
          label={ui('ui_dashboard_platforms_label', 'Seans Tipi')}
          hint={ui('ui_dashboard_platforms_hint', 'Hangi seans tiplerini sunuyorsunuz?')}
        >
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((opt) => {
              const active = meetingPlatforms.includes(opt.slug);
              return (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => togglePlatform(opt.slug)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    active
                      ? 'border-(--gm-gold) bg-(--gm-gold) text-(--gm-bg-deep)'
                      : 'border-(--gm-border-soft) text-(--gm-text) opacity-60 hover:opacity-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
        {/* C1: Sosyal Medya bölümü kaldırıldı */}

        {/* C4: Banka Hesap Bilgileri */}
        <div className="rounded-2xl border border-(--gm-gold)/20 bg-(--gm-gold)/5 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-(--gm-gold)" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold)">Banka Hesap Bilgileri</span>
          </div>
          <p className="text-[11px] text-(--gm-text) opacity-50 italic">
            Para çekme taleplerinde kullanılır. Sadece siz görebilirsiniz.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">IBAN</label>
              <input
                type="text"
                value={bankIban}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\s/g, '').toUpperCase();
                  if (raw.length > 26) return;
                  const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                  setBankIban(formatted);
                  if (errors.bankIban) setErrors((prev) => { const n = { ...prev }; delete n.bankIban; return n; });
                }}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className={`w-full h-11 bg-(--gm-surface) border rounded-xl px-4 text-sm font-mono text-(--gm-text) outline-none transition-colors ${
                  errors.bankIban ? 'border-(--gm-error)/60 focus:border-(--gm-error)' : 'border-(--gm-border-soft) focus:border-(--gm-gold)/50'
                }`}
              />
              {errors.bankIban && <p className="mt-1.5 text-[10px] font-bold text-(--gm-error) uppercase tracking-widest">{errors.bankIban}</p>}
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Hesap Sahibi</label>
              <input
                type="text"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                placeholder="Ad Soyad"
                maxLength={160}
                className="w-full h-11 bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl px-4 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Banka Adı</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="ör. Ziraat Bankası"
                maxLength={120}
                className="w-full h-11 bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl px-4 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* C3: KYC / Kimlik Doğrulama */}
        <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface)/30 p-6 space-y-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-(--gm-gold)" />
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-(--gm-gold)">KYC / Kimlik Doğrulama</span>
            </div>
            {profile.kyc_status && profile.kyc_status !== 'none' && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile.kyc_status === 'approved' ? 'bg-(--gm-success)/15 text-(--gm-success)' :
                profile.kyc_status === 'pending' ? 'bg-(--gm-warning)/15 text-(--gm-warning)' :
                'bg-(--gm-error)/15 text-(--gm-error)'
              }`}>
                {profile.kyc_status === 'approved' ? 'Onaylandı' :
                 profile.kyc_status === 'pending' ? 'Doğrulama Bekleniyor' : 'Reddedildi'}
              </span>
            )}
          </div>
          
          {profile.kyc_status === 'rejected' && profile.kyc_rejection_reason && (
            <div className="p-3 rounded-xl bg-(--gm-error)/10 border border-(--gm-error)/30 text-[11px] text-(--gm-error)">
              <span className="font-bold block mb-1">Reddedilme Sebebi:</span>
              {profile.kyc_rejection_reason}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-(--gm-text) cursor-pointer">
                <input type="radio" name="account_type" value="individual" checked={accountType === 'individual'} onChange={() => setAccountType('individual')} className="accent-(--gm-gold)" />
                Bireysel
              </label>
              <label className="flex items-center gap-2 text-sm text-(--gm-text) cursor-pointer">
                <input type="radio" name="account_type" value="company" checked={accountType === 'company'} onChange={() => setAccountType('company')} className="accent-(--gm-gold)" />
                Şirket
              </label>
            </div>

            <div className="p-4 rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 text-[11px] text-(--gm-text-dim) leading-relaxed">
              {accountType === 'individual' ? (
                <>
                  <strong className="text-(--gm-gold) block mb-1">Gelir Vergisi Beyanı (Bireysel):</strong>
                  Bireysel hesaba sahip danışmanlarımız için platform herhangi bir vergi kesintisi (stopaj) <strong>yapmamaktadır</strong>. Elde ettiğiniz gelirin vergi beyanı tamamen kendi yükümlülüğünüzdedir.
                </>
              ) : (
                <>
                  <strong className="text-(--gm-gold) block mb-1">E-Fatura / Makbuz (Şirket):</strong>
                  Şirket (veya şahıs firması) hesabına sahip danışmanlarımız, elde ettikleri hizmet gelirleri için fatura veya e-SMM düzenlemekle yükümlüdür. E-fatura otomatik kesim akışı altyapısı yakında devreye alınacaktır.
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accountType === 'individual' ? (
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">TC Kimlik No *</label>
                  <input type="text" value={identityNumber} onChange={e => setIdentityNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="11 haneli TC No" className={`w-full h-11 bg-(--gm-surface) border rounded-xl px-4 text-sm text-(--gm-text) outline-none transition-colors ${errors.identityNumber ? 'border-(--gm-error)/60 focus:border-(--gm-error)' : 'border-(--gm-border-soft) focus:border-(--gm-gold)/50'}`} />
                  {errors.identityNumber && <p className="mt-1.5 text-[10px] font-bold text-(--gm-error) uppercase tracking-widest">{errors.identityNumber}</p>}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Vergi No *</label>
                    <input type="text" value={taxNumber} onChange={e => setTaxNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="10 veya 11 haneli" className={`w-full h-11 bg-(--gm-surface) border rounded-xl px-4 text-sm text-(--gm-text) outline-none transition-colors ${errors.taxNumber ? 'border-(--gm-error)/60 focus:border-(--gm-error)' : 'border-(--gm-border-soft) focus:border-(--gm-gold)/50'}`} />
                    {errors.taxNumber && <p className="mt-1.5 text-[10px] font-bold text-(--gm-error) uppercase tracking-widest">{errors.taxNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Vergi Dairesi *</label>
                    <input type="text" value={taxOffice} onChange={e => setTaxOffice(e.target.value)} placeholder="Vergi Dairesi" className="w-full h-11 bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl px-4 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)/50 transition-colors" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Şirket Unvanı *</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Tam Şirket Unvanı" className="w-full h-11 bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl px-4 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)/50 transition-colors" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-2">Fatura Adresi *</label>
                <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Açık Adres" rows={3} className="w-full bg-(--gm-surface) border border-(--gm-border-soft) rounded-xl p-4 text-sm text-(--gm-text) outline-none focus:border-(--gm-gold)/50 transition-colors resize-none" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-(--gm-gold) opacity-80 mb-3">Belge Yükleme</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KycUploadBox 
                  label="Kimlik Ön Yüzü" 
                  onUpload={(url) => setKycDocuments(prev => [...prev.filter(d => d.type !== 'id_front'), { type: 'id_front', url }])} 
                  uploaded={kycDocuments.some(d => d.type === 'id_front')}
                />
                <KycUploadBox 
                  label="Kimlik Arka Yüzü" 
                  onUpload={(url) => setKycDocuments(prev => [...prev.filter(d => d.type !== 'id_back'), { type: 'id_back', url }])} 
                  uploaded={kycDocuments.some(d => d.type === 'id_back')}
                />
                {accountType === 'company' && (
                  <div className="sm:col-span-2">
                    <KycUploadBox 
                      label="Vergi Levhası" 
                      onUpload={(url) => setKycDocuments(prev => [...prev.filter(d => d.type !== 'tax_certificate'), { type: 'tax_certificate', url }])} 
                      uploaded={kycDocuments.some(d => d.type === 'tax_certificate')}
                    />
                  </div>
                )}
              </div>
            </div>

            {(!profile.kyc_status || profile.kyc_status === 'none' || profile.kyc_status === 'rejected') && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    await handleSave(); // save profile info first
                    try {
                      await submitKyc().unwrap();
                      toast.success('KYC Başvurusu gönderildi.');
                    } catch(e) {
                      toast.error('KYC gönderilirken hata oluştu.');
                    }
                  }}
                  disabled={isSubmittingKyc || isLoading}
                  className="w-full px-6 py-3 rounded-full bg-(--gm-surface) border border-(--gm-gold)/40 text-(--gm-gold) text-xs font-bold uppercase tracking-widest hover:bg-(--gm-gold)/10 transition-colors"
                >
                  {isSubmittingKyc ? 'Gönderiliyor...' : 'KYC Onayına Gönder'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-(--gm-border-soft)">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:shadow-glow transition-all"
          >
            {isLoading ? ui('ui_dashboard_saving', 'Saving...') : ui('ui_dashboard_save_profile', 'Save Profile')}
          </button>
        </div>
      </div>

      {/* Sidebar: Live Preview */}
      <div className="space-y-6">
        <div className="sticky top-32">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-4 ml-1">
            {ui('ui_dashboard_live_preview', 'Live Preview')}
          </h3>
          <ConsultantCardPreview
            fullName={profile.user?.full_name || ''}
            avatarUrl={avatarUrl}
            expertise={expertise}
            expertiseLabels={expertiseLabels}
            ratingAvg={profile.rating_avg}
            ratingCount={profile.rating_count}
            sessionPrice={Number(profile.session_price)}
            sessionDuration={profile.session_duration}
            isAvailable={profile.is_available === 1}
          />
          <div className="mt-6 p-4 rounded-2xl bg-[var(--gm-gold)]/5 border border-[var(--gm-gold)]/20">
            <p className="text-[11px] text-[var(--gm-text-dim)] font-serif italic leading-relaxed text-center">
              &quot;{ui('ui_dashboard_preview_note', 'After saving changes, your profile card will appear like this in all lists.')}&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-(--gm-gold) opacity-80">{label}</label>
      {hint && <p className="text-[11px] text-(--gm-text) opacity-50 italic leading-relaxed">{hint}</p>}
      {children}
      {error && <p className="text-[10px] font-bold text-(--gm-error) uppercase tracking-widest pl-1">{error}</p>}
    </div>
  );
}

/* ────────── Bookings ────────── */
type BookingActionModal =
  | { kind: 'reject' | 'cancel' | 'notes'; bookingId: string; title: string; value: string }
  | null;

function BookingsPanel({ locale }: { locale: string }) {
  const { ui } = useUiSection('ui_dashboard', locale as any);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionModal, setActionModal] = useState<BookingActionModal>(null);
  const { data: bookings = [], isLoading } = useGetMyConsultantBookingsQuery(statusFilter ? { status: statusFilter } : undefined);
  const [approve] = useApproveBookingMutation();
  const [reject] = useRejectBookingMutation();
  const [cancelBooking] = useCancelMyConsultantBookingMutation();
  const [updateNotes] = useUpdateMyConsultantBookingNotesMutation();

  const FILTERS = [
    { key: '', label: ui('ui_dashboard_filter_all', 'All') },
    { key: 'requested_now', label: ui('ui_dashboard_filter_instant', 'Instant Requests') },
    { key: 'pending_payment', label: ui('ui_dashboard_filter_pending_payment', 'Pending Payment') },
    { key: 'confirmed', label: ui('ui_dashboard_filter_confirmed', 'Confirmed') },
    { key: 'completed', label: ui('ui_dashboard_filter_completed', 'Completed') },
    { key: 'rejected', label: ui('ui_dashboard_filter_rejected', 'Rejected') },
    { key: 'cancelled', label: ui('ui_dashboard_filter_cancelled', 'Cancelled') },
  ];

  // T29-4: Aktif anlık talepler — süresi dolmamış olanlar
  const activeRequestedNow = bookings.filter((b) => {
    if (b.status !== 'requested_now') return false;
    const elapsed = Date.now() - new Date(b.created_at).getTime();
    return elapsed < REQUEST_NOW_TIMEOUT_MS;
  });

  const handleApprove = async (id: string) => {
    try {
      await approve(id).unwrap();
      toast.success(ui('ui_dashboard_toast_approved', 'Approved'));
    } catch (e) {
      toast.error(extractApiError(e, ui('ui_dashboard_toast_approve_failed', 'Could not approve')));
    }
  };

  const submitActionModal = async () => {
    if (!actionModal) return;
    const value = actionModal.value.trim();

    if (actionModal.kind === 'reject' && value.length < 2) {
      toast.error(ui('ui_dashboard_reject_reason_min', 'Rejection reason must be at least 2 characters.'));
      return;
    }
    if (actionModal.kind === 'cancel' && value.length < 5) {
      toast.error(ui('ui_dashboard_cancel_reason_min', 'Cancellation reason must be at least 5 characters.'));
      return;
    }

    try {
      if (actionModal.kind === 'reject') {
        await reject({ id: actionModal.bookingId, reason: value }).unwrap();
        toast.success(ui('ui_dashboard_toast_rejected', 'Rejected'));
      } else if (actionModal.kind === 'cancel') {
        await cancelBooking({ id: actionModal.bookingId, reason: value }).unwrap();
        toast.success(ui('ui_dashboard_toast_cancelled', 'Cancelled'));
      } else {
        await updateNotes({ id: actionModal.bookingId, notes: value || null }).unwrap();
        toast.success(ui('ui_dashboard_toast_note_saved', 'Note saved'));
      }
      setActionModal(null);
    } catch (e: any) {
      toast.error(extractApiError(e, ui('ui_dashboard_toast_action_failed', 'Action could not be completed')));
    }
  };

  return (
    <div className="space-y-4">
      {/* T29-4: Anlık görüşme alarm bandı */}
      {activeRequestedNow.length > 0 && (
        <div className="rounded-2xl border border-[var(--gm-error)]/40 bg-[var(--gm-error)]/10 p-4 flex items-center gap-3 animate-pulse">
          <Zap className="w-6 h-6 text-[var(--gm-error)] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--gm-error)]">
              {ui('ui_dashboard_instant_alert_title', '{count} instant session requests waiting').replace('{count}', String(activeRequestedNow.length))}
            </div>
            <div className="text-[11px] text-[var(--gm-error)]/80 mt-0.5">
              {ui('ui_dashboard_instant_alert_desc', 'If you do not respond within 5 minutes, it is cancelled automatically. The client is waiting.')}
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('requested_now')}
            className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--gm-error)]/30 hover:bg-[var(--gm-error)]/50 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text)]"
          >
            {ui('ui_dashboard_show', 'Show')}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const showAlert = f.key === 'requested_now' && activeRequestedNow.length > 0;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`relative px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                statusFilter === f.key
                  ? 'border-[var(--gm-gold)] bg-[var(--gm-gold)]/10 text-[var(--gm-gold)]'
                  : showAlert
                    ? 'border-[var(--gm-error)]/50 bg-[var(--gm-error)]/10 text-[var(--gm-error)] animate-pulse'
                    : 'border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
              }`}
            >
              {f.label}
              {showAlert && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--gm-error)] text-[var(--gm-text)] text-[10px] px-1">
                  {activeRequestedNow.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">{ui('ui_dashboard_loading', 'Loading...')}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">{ui('ui_dashboard_no_bookings_filter', 'No bookings in this filter.')}</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const isRequestNow = b.status === 'requested_now';
            const isActiveRequestNow = isRequestNow && (Date.now() - new Date(b.created_at).getTime()) < REQUEST_NOW_TIMEOUT_MS;
            const canCancel = ['requested_now', 'pending_payment', 'pending', 'booked', 'confirmed'].includes(b.status);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border flex items-center gap-4 flex-wrap transition-all ${
                  isActiveRequestNow
                    ? 'border-[var(--gm-error)]/60 bg-[var(--gm-error)]/10 shadow-[0_0_24px_var(--gm-error)] ring-1 ring-[var(--gm-error)]/30'
                    : 'border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30'
                }`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] flex items-center justify-center text-[var(--gm-gold)] font-serif text-sm">
                  {b.customer_avatar_url ? (
                    <img src={b.customer_avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsFromName(b.name || b.email)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-serif text-base text-[var(--gm-text)]">{b.name || b.email}</span>
                    <StatusBadge status={b.status} />
                    {isRequestNow && <RequestNowCountdown createdAt={b.created_at} />}
                  </div>
                  <div className="text-[11px] text-[var(--gm-text-dim)] flex items-center gap-3 flex-wrap">
                    <span>{b.appointment_date} {b.appointment_time?.slice(0, 5)}</span>
                    <span>•</span>
                    <span>{b.session_duration} dk</span>
                    <span>•</span>
                    <span className="text-[var(--gm-gold)] font-bold">₺{Math.round(Number(b.session_price))}</span>
                    <span>•</span>
                    <span>{b.media_type}</span>
                    {b.service_title && (
                      <>
                        <span>•</span>
                        <span>{b.service_title}</span>
                      </>
                    )}
                  </div>
                  {b.customer_message && (
                    <div className="mt-2 text-[12px] text-[var(--gm-text-dim)] italic font-serif border-l-2 border-[var(--gm-gold)]/30 pl-3">
                      “{b.customer_message}”
                    </div>
                  )}
                  {b.admin_note && (
                    <div className="mt-2 text-[12px] text-[var(--gm-text-dim)] border-l-2 border-[var(--gm-border)]/60 pl-3">
                      <span className="font-bold text-[var(--gm-gold-dim)]">{ui('ui_dashboard_session_note_label', 'Session note:')}</span> {b.admin_note}
                    </div>
                  )}
                  {b.decision_note && ['rejected', 'cancelled'].includes(b.status) && (
                    <div className="mt-2 text-[12px] text-[var(--gm-error)]/90 border-l-2 border-[var(--gm-error)]/40 pl-3">
                      <span className="font-bold">{ui('ui_dashboard_reason_label', 'Reason:')}</span> {b.decision_note}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BookingMessageButton bookingId={b.id} variant="secondary" label={ui('ui_dashboard_message', 'Message')} />
                  {b.status === 'confirmed' && (
                    <Link
                      href={localizePath(locale, `/booking/${b.id}/call`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {ui('ui_dashboard_start_call', 'Start Session')}
                    </Link>
                  )}
                  {b.status === 'completed' && (
                    <button
                      onClick={() => setActionModal({ kind: 'notes', bookingId: b.id, title: ui('ui_dashboard_session_note_title', 'Session Note'), value: b.admin_note || '' })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest"
                    >
                      {ui('ui_dashboard_notes', 'Notes')}
                    </button>
                  )}
                  {(b.status === 'pending_payment' || b.status === 'pending' || isActiveRequestNow) && (
                    <>
                      <button
                        onClick={() => handleApprove(b.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest ${
                          isActiveRequestNow
                            ? 'bg-[var(--gm-error)] hover:bg-[var(--gm-error)]/80 shadow-[0_0_18px_var(--gm-error)]'
                            : 'bg-[var(--gm-success)]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isActiveRequestNow ? ui('ui_dashboard_accept_now', 'Accept Now') : ui('ui_dashboard_approve', 'Approve')}
                      </button>
                      <button
                        onClick={() => setActionModal({ kind: 'reject', bookingId: b.id, title: ui('ui_dashboard_reject_booking_title', 'Reject Booking'), value: '' })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--gm-error)]/40 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 text-[10px] font-bold uppercase tracking-widest"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {ui('ui_dashboard_reject', 'Reject')}
                      </button>
                    </>
                  )}
                  {canCancel && b.status !== 'requested_now' && (
                    <button
                      onClick={() => setActionModal({ kind: 'cancel', bookingId: b.id, title: ui('ui_dashboard_cancel_booking_title', 'Cancel Booking'), value: '' })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--gm-error)]/30 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {ui('ui_dashboard_cancel', 'Cancel')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--gm-bg-deep)]/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6 shadow-2xl">
            <h3 className="font-serif text-xl text-[var(--gm-text)]">{actionModal.title}</h3>
            <p className="mt-2 text-sm text-[var(--gm-text-dim)]">
              {actionModal.kind === 'notes'
                ? ui('ui_dashboard_modal_notes_desc', 'This note is visible only in the consultant panel.')
                : actionModal.kind === 'cancel'
                  ? ui('ui_dashboard_modal_cancel_desc', 'The cancellation reason is sent to the client as a notification.')
                  : ui('ui_dashboard_modal_reject_desc', 'The rejection reason is sent to the client as a notification.')}
            </p>
            <textarea
              value={actionModal.value}
              onChange={(e) => setActionModal({ ...actionModal, value: e.target.value })}
              rows={5}
              className="mt-4 w-full rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] p-4 text-sm text-[var(--gm-text)] outline-none focus:border-[var(--gm-gold)]/50"
              placeholder={actionModal.kind === 'notes' ? ui('ui_dashboard_notes_placeholder', 'Private note after the session...') : ui('ui_dashboard_reason_placeholder', 'Write a reason...')}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text-dim)]"
              >
                {ui('ui_dashboard_discard', 'Discard')}
              </button>
              <button
                type="button"
                onClick={submitActionModal}
                className="px-5 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
              >
                {ui('ui_dashboard_save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { ui } = useUiSection('ui_dashboard');
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: ui('ui_dashboard_status_confirmed', 'Confirmed'), cls: 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' },
    completed: { label: ui('ui_dashboard_status_completed', 'Completed'), cls: 'bg-[var(--gm-gold)]/15 text-[var(--gm-gold)]' },
    pending_payment: { label: ui('ui_dashboard_status_pending_payment', 'Payment Pending'), cls: 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]' },
    pending: { label: ui('ui_dashboard_status_pending', 'Pending'), cls: 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]' },
    requested_now: { label: ui('ui_dashboard_status_requested_now', 'Instant Request'), cls: 'bg-[var(--gm-error)]/20 text-[var(--gm-error)] ring-1 ring-[var(--gm-error)]/40 animate-pulse' },
    rejected: { label: ui('ui_dashboard_status_rejected', 'Rejected'), cls: 'bg-[var(--gm-error)]/15 text-[var(--gm-error)]' },
    cancelled: { label: ui('ui_dashboard_status_cancelled', 'Cancelled'), cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' },
  };
  const m = map[status] || { label: status, cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${m.cls}`}>
      {m.label}
    </span>
  );
}

/* ────────── Requested-Now Countdown (T29-4) ────────── */
const REQUEST_NOW_TIMEOUT_MS = 5 * 60_000;

function RequestNowCountdown({ createdAt }: { createdAt: string }) {
  const { ui } = useUiSection('ui_dashboard');
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = now - new Date(createdAt).getTime();
  const remaining = Math.max(0, REQUEST_NOW_TIMEOUT_MS - elapsed);
  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, '0');
  const expired = remaining <= 0;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tabular-nums tracking-widest ${
      expired
        ? 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]'
        : remaining < 60_000
          ? 'bg-[var(--gm-error)]/20 text-[var(--gm-error)] animate-pulse'
          : 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]'
    }`}>
      <Timer className="w-3 h-3" />
      {expired ? ui('ui_dashboard_time_expired', 'Expired') : `${mm}:${ss}`}
    </span>
  );
}

/* ────────── C9: Profile Completion Score Widget ────────── */

function CompletionScoreWidget({
  score,
  items,
  onTabChange,
}: {
  score: number;
  items: ProfileCompletionItem[];
  onTabChange?: (k: TabKey) => void;
}) {
  const tier =
    score >= 90
      ? { label: 'Mükemmel', color: 'text-(--gm-success)', bg: 'bg-(--gm-success)' }
      : score >= 70
      ? { label: 'Geliştirilebilir', color: 'text-(--gm-warning)', bg: 'bg-(--gm-warning)' }
      : { label: 'Eksik', color: 'text-(--gm-error)', bg: 'bg-(--gm-error)' };

  const incomplete = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <div className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold) uppercase opacity-80">
            Profilinizi Güçlendirin
          </span>
          <h3 className="font-serif text-xl text-(--gm-text) mt-0.5">Profil Tamamlama Skoru</h3>
        </div>
        {/* Score circle */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-(--gm-border-soft)" />
              <circle
                cx="32" cy="32" r="28" fill="none" strokeWidth="6"
                strokeDasharray={`${(score / 100) * 175.9} 175.9`}
                strokeLinecap="round"
                className={`${tier.bg} opacity-80 transition-all duration-700`}
                style={{ stroke: 'currentColor' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-(--gm-text)">
              {score}%
            </span>
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-(--gm-border-soft) rounded-full mb-6">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tier.bg} opacity-70`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Incomplete items */}
      {incomplete.length > 0 && (
        <div className="space-y-2 mb-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-(--gm-text) opacity-40">
            Eksik ({incomplete.length})
          </span>
          {incomplete.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-(--gm-border-soft) hover:border-(--gm-gold)/30 hover:bg-(--gm-gold)/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-(--gm-warning) shrink-0" />
                <span className="text-sm text-(--gm-text) opacity-70">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-bold text-(--gm-warning) opacity-70">+{item.weight}p</span>
                {item.tab && onTabChange && (
                  <button
                    onClick={() => onTabChange(item.tab as TabKey)}
                    className="text-[9px] font-bold uppercase tracking-widest text-(--gm-gold) hover:opacity-100 opacity-70 transition-opacity"
                  >
                    Gide →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed items (collapsed summary) */}
      {done.length > 0 && (
        <details className="group">
          <summary className="text-[9px] font-bold uppercase tracking-widest text-(--gm-text) opacity-40 cursor-pointer hover:opacity-60 transition-opacity list-none flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-(--gm-success)" />
            Tamamlanan ({done.length})
          </summary>
          <div className="mt-2 space-y-1.5">
            {done.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 px-3">
                <CheckCheck className="w-3.5 h-3.5 text-(--gm-success) shrink-0" />
                <span className="text-sm text-(--gm-text) opacity-40 line-through">{item.label}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/* ────────── C3: KycUploadBox ────────── */
function KycUploadBox({ label, onUpload, uploaded }: { label: string, onUpload: (url: string) => void, uploaded: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [upload, { isLoading }] = useUploadToBucketMutation();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB altında olmalıdır.');
      return;
    }

    try {
      const res = await upload({ bucket: 'uploads', files: file, path: 'kyc' }).unwrap();
      const url = res.items?.[0]?.url || '';
      onUpload(url);
      toast.success(`${label} yüklendi.`);
    } catch {
      toast.error('Yükleme başarısız oldu.');
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${
        uploaded 
          ? 'border-(--gm-success)/40 bg-(--gm-success)/[0.03]' 
          : 'border-(--gm-border-soft) bg-(--gm-bg-deep)/30 hover:border-(--gm-gold)/40'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploaded ? 'bg-(--gm-success)/10 text-(--gm-success)' : 'bg-(--gm-gold)/10 text-(--gm-gold)'}`}>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : uploaded ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-(--gm-text)">{label}</div>
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        onChange={handleUpload}
        accept=".pdf,.jpg,.jpeg,.png"
      />
    </div>
  );
}
