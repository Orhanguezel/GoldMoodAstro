'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  TrendingUp,
  TrendingDown,
  Timer,
  Bell,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath } from '@/integrations/shared';
import AvatarUpload from '@/components/common/AvatarUpload';
import {
  type ConsultantSelfProfile,
  type ConsultantSelfStats,
  useGetMyConsultantProfileQuery,
  useUpdateMyConsultantProfileMutation,
  useGetMyConsultantStatsQuery,
  useGetMyConsultantBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useCancelMyConsultantBookingMutation,
  useUpdateMyConsultantBookingNotesMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import ServicesPanel from './ServicesPanel';
import MessagesPanel from './MessagesPanel';
import WalletPanel from './WalletPanel';
import ReviewsPanel from './ReviewsPanel';
import AvailabilityPanel from './AvailabilityPanel';
import BookingMessageButton from '@/components/common/BookingMessageButton';

type TabKey = 'overview' | 'profile' | 'services' | 'availability' | 'bookings' | 'messages' | 'wallet' | 'reviews';

const TABS: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
  { key: 'profile', label: 'Profil', icon: User },
  { key: 'services', label: 'Hizmetler', icon: Package },
  { key: 'availability', label: 'Müsaitlik', icon: Calendar },
  { key: 'bookings', label: 'Randevular', icon: CheckCircle2 },
  { key: 'messages', label: 'Mesajlar', icon: MessageCircle },
  { key: 'wallet', label: 'Cüzdan', icon: Wallet },
  { key: 'reviews', label: 'Yorumlar', icon: Star },
];

interface Props {
  locale: string;
}

export default function ConsultantDashboard({ locale }: Props) {
  const [tab, setTab] = useState<TabKey>('overview');
  const { isAuthenticated, isReady, isLoading: authLoading } = useAuthStore();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetMyConsultantProfileQuery(undefined, {
    skip: !isReady || !isAuthenticated,
  });
  const { data: stats, isLoading: statsLoading } = useGetMyConsultantStatsQuery(undefined, { skip: !profile });

  if (!isReady || authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gm-gold)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(localizePath(locale, '/me/consultant'));
    return (
      <EmptyState
        title="Danışman paneline giriş yap"
        description="Bu alan yalnızca giriş yapmış danışman hesapları için açıktır."
        primaryHref={`${localizePath(locale, '/login')}?next=${next}`}
        primaryLabel="Giriş Yap"
        secondaryHref={localizePath(locale, '/become-consultant')}
        secondaryLabel="Danışman Ol"
      />
    );
  }

  if (profileError || !profile) {
    return (
      <EmptyState
        title="Bu sayfa sadece danışmanlara açık"
        description="Hesabın henüz danışman değilse başvuru formunu doldurup onay sürecini başlatabilirsin."
        primaryHref={localizePath(locale, '/become-consultant')}
        primaryLabel="Danışman Ol"
        secondaryHref={localizePath(locale, '/')}
        secondaryLabel="Anasayfaya Dön"
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl pt-32">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--gm-text)]">Danışman Paneli</h1>
          <p className="text-[var(--gm-text-dim)] font-serif italic mt-1">
            {profile.user?.full_name || 'Danışman'} — kendi profilini, hizmetlerini ve randevularını yönet.
          </p>
        </div>
        <AvailabilityToggle isAvailable={profile.is_available === 1} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-[var(--gm-border-soft)] overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                active
                  ? 'border-[var(--gm-gold)] text-[var(--gm-gold)]'
                  : 'border-transparent text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'overview' && <OverviewPanel stats={stats} profile={profile} isLoading={statsLoading} onTabChange={setTab} />}
      {tab === 'profile' && <ProfilePanel profile={profile} />}
      {tab === 'services' && <ServicesPanel />}
      {tab === 'availability' && <AvailabilityPanel />}
      {tab === 'bookings' && <BookingsPanel locale={locale} />}
      {tab === 'messages' && <MessagesPanel />}
      {tab === 'wallet' && <WalletPanel />}
      {tab === 'reviews' && <ReviewsPanel />}
    </div>
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
      <p className="max-w-md text-[var(--gm-text-dim)]">{description}</p>
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
  stats,
  profile,
  isLoading,
  onTabChange,
}: {
  stats?: ConsultantSelfStats;
  profile: ConsultantSelfProfile;
  isLoading?: boolean;
  onTabChange?: (k: TabKey) => void;
}) {
  const days = stats?.last_7_days?.length ? stats.last_7_days : getEmptyLast7Days();
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const sessionDelta = stats?.session_delta_pct ?? 0;
  const earningsDelta = stats?.earnings_delta_pct ?? 0;
  const avgRespMin = stats?.avg_response_minutes ?? 0;
  const respLabel = avgRespMin > 0
    ? avgRespMin >= 60 ? `~${Math.round(avgRespMin / 60)}sa` : `~${avgRespMin}dk`
    : '—';

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-4 text-[12px] text-[var(--gm-text-dim)]">
          İstatistikler güncelleniyor...
        </div>
      )}

      {/* Üst metric kartları (delta ile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStatCard
          icon={Calendar}
          label="Bu Ay Seans"
          value={stats?.this_month_session_count ?? 0}
          delta={sessionDelta}
          subLabel={`Geçen ay: ${stats?.last_month_session_count ?? 0}`}
        />
        <BigStatCard
          icon={BarChart3}
          label="Bu Ay Kazanç"
          value={`₺${Math.round(stats?.this_month_earnings ?? 0)}`}
          delta={earningsDelta}
          subLabel={`Geçen ay: ₺${Math.round(stats?.last_month_earnings ?? 0)}`}
        />
        <BigStatCard
          icon={Star}
          label="Ortalama Puan"
          value={(stats?.rating_avg ?? 0).toFixed(2)}
          subLabel={`${stats?.rating_count ?? 0} yorum`}
        />
        <BigStatCard
          icon={Timer}
          label="Yanıt Süresi"
          value={respLabel}
          subLabel="ort. mesaj cevap süresi"
        />
      </div>

      {/* Action items + 7 günlük grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        {/* 7-day chart */}
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Son 7 Gün</h3>
              <p className="text-[12px] text-[var(--gm-text-dim)] mt-1">Günlük seans sayısı</p>
            </div>
            <div className="text-[10px] text-[var(--gm-muted)]">
              Toplam {days.reduce((s, d) => s + d.count, 0)} seans
            </div>
          </div>
          <div className="flex items-end gap-2 h-32 mt-6">
            {days.map((d) => {
              const heightPct = (d.count / maxCount) * 100;
              const dt = new Date(`${d.date}T12:00:00`);
              const dayLabel = dt.toLocaleDateString('tr-TR', { weekday: 'short' });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 group" title={`${d.date}: ${d.count} seans · ₺${d.earnings}`}>
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
            Eylem Gerekiyor
          </h3>
          <div className="space-y-2">
            {(stats?.requested_now_count ?? 0) > 0 && (
              <ActionRow
                icon={Zap}
                label="⚡ Anlık Görüşme Talebi"
                count={stats?.requested_now_count ?? 0}
                onClick={() => onTabChange?.('bookings')}
                urgent
              />
            )}
            <ActionRow
              icon={Bell}
              label="Bekleyen Randevu"
              count={stats?.pending_bookings ?? 0}
              onClick={() => onTabChange?.('bookings')}
            />
            <ActionRow
              icon={MessageCircle}
              label="Yanıtsız Mesaj"
              count={stats?.pending_messages ?? 0}
              onClick={() => onTabChange?.('messages')}
            />
          </div>
        </div>
      </div>

      {/* Hızlı eylem butonları */}
      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] mb-4">
          Hızlı Eylemler
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <QuickActionButton icon={Package} label="Hizmet Ekle" onClick={() => onTabChange?.('services')} />
          <QuickActionButton icon={Calendar} label="Müsaitlik Düzenle" onClick={() => onTabChange?.('availability')} />
          <QuickActionButton icon={MessageCircle} label="Mesajları Gör" onClick={() => onTabChange?.('messages')} />
          <QuickActionButton icon={Wallet} label="Cüzdan" onClick={() => onTabChange?.('wallet')} />
          <QuickActionButton icon={User} label="Profili Düzenle" onClick={() => onTabChange?.('profile')} />
        </div>
      </div>

      {/* Onay durumu + toplam */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">Onay Durumu</span>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile.approval_status === 'approved'
                  ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]'
                  : profile.approval_status === 'pending'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {profile.approval_status === 'approved' ? 'Onaylı' : profile.approval_status === 'pending' ? 'İnceleniyor' : 'Reddedildi'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile.is_available
                  ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]'
                  : 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]'
              }`}
            >
              {profile.is_available ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </div>
        </div>
        <StatCardSmall icon={CheckCircle2} label="Toplam Seans" value={stats?.total_sessions ?? 0} />
        <StatCardSmall icon={Star} label="Toplam Yorum" value={stats?.rating_count ?? 0} />
      </div>
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
    <div className="p-5 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{label}</span>
        <Icon className="w-4 h-4 text-[var(--gm-gold)]/70" />
      </div>
      <div className="font-serif text-3xl text-[var(--gm-text)]">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {typeof delta === 'number' && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isPos ? 'text-[var(--gm-success)]' : 'text-rose-400'}`}>
            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPos ? '+' : ''}{delta}%
          </span>
        )}
        {subLabel && <span className="text-[10px] text-[var(--gm-muted)]">{subLabel}</span>}
      </div>
    </div>
  );
}

function StatCardSmall({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{label}</span>
        <Icon className="w-4 h-4 text-[var(--gm-gold)]/70" />
      </div>
      <div className="font-serif text-2xl text-[var(--gm-text)]">{value}</div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, count, onClick, urgent }: { icon: React.ElementType; label: string; count: number; onClick?: () => void; urgent?: boolean }) {
  const has = count > 0;
  const cls = urgent && has
    ? 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/50 animate-pulse'
    : has
      ? 'bg-[var(--gm-gold)]/10 hover:bg-[var(--gm-gold)]/15 border border-[var(--gm-gold)]/30'
      : 'bg-[var(--gm-bg-deep)]/30 hover:bg-[var(--gm-bg-deep)]/50 border border-[var(--gm-border-soft)]';
  const accent = urgent && has ? 'text-rose-300' : has ? 'text-[var(--gm-gold)]' : 'text-[var(--gm-muted)]';
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
  const [updateProfile, { isLoading }] = useUpdateMyConsultantProfileMutation();
  const handleToggle = async () => {
    try {
      await updateProfile({ is_available: isAvailable ? 0 : 1 }).unwrap();
      toast.success(isAvailable ? 'Çevrimdışı oldun' : 'Çevrimiçi oldun');
    } catch {
      toast.error('Güncellenemedi');
    }
  };
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
        isAvailable
          ? 'border-[var(--gm-success)]/40 bg-[var(--gm-success)]/10 text-[var(--gm-success)]'
          : 'border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 text-[var(--gm-muted)] hover:text-[var(--gm-text)]'
      }`}
    >
      {isAvailable ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
      {isAvailable ? 'Çevrimiçi' : 'Çevrimdışı'}
    </button>
  );
}

/* ────────── Profile ────────── */
const PLATFORM_OPTIONS = ['WhatsApp', 'Skype', 'Zoom', 'Google Meet', 'Microsoft Teams'];

function ProfilePanel({ profile }: { profile: ConsultantSelfProfile }) {
  const [updateProfile, { isLoading }] = useUpdateMyConsultantProfileMutation();
  const [bio, setBio] = useState<string>(profile.bio || '');
  const [expertise, setExpertise] = useState<string>((profile.expertise || []).join(', '));
  const [languages, setLanguages] = useState<string>((profile.languages || []).join(', '));
  const [meetingPlatforms, setMeetingPlatforms] = useState<string[]>(profile.meeting_platforms || []);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(profile.social_links || {});
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.user?.avatar_url || '');
  const [supportsVideo, setSupportsVideo] = useState<boolean>(profile.supports_video === 1);

  const expertiseList = expertise.split(',').map((s) => s.trim()).filter(Boolean);
  const languageList = languages.split(',').map((s) => s.trim()).filter(Boolean);

  const togglePlatform = (platform: string) => {
    setMeetingPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  };

  const updateSocial = (key: string, value: string) => {
    setSocialLinks((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const cleanSocials = Object.fromEntries(
        Object.entries(socialLinks)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => Boolean(value)),
      );
      await updateProfile({
        bio: bio.trim() || null,
        expertise: expertiseList,
        languages: languageList,
        meeting_platforms: meetingPlatforms,
        social_links: cleanSocials,
        avatar_url: avatarUrl || null,
        supports_video: supportsVideo ? 1 : 0,
      }).unwrap();
      toast.success('Profil güncellendi');
    } catch {
      toast.error('Kaydedilemedi');
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
            <h3 className="font-serif text-lg text-[var(--gm-text)]">{profile.user?.full_name || 'Danışman'}</h3>
            <p className="text-[12px] text-[var(--gm-text-dim)]">Profil fotoğrafın public danışman kartlarında kullanılır.</p>
          </div>
        </div>

        <Field label="Hakkımda (Bio)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={6}
            className="w-full bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-2xl p-4 text-sm text-[var(--gm-text)] focus:ring-2 focus:ring-[var(--gm-gold)]/30 focus:border-[var(--gm-gold)]/40 outline-none transition-all"
            placeholder="Kendinizi tanıtın..."
          />
        </Field>
        <Field label="Uzmanlık Alanları (virgülle)">
          <input
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            className="w-full h-12 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-2xl px-4 text-sm text-[var(--gm-text)] focus:ring-2 focus:ring-[var(--gm-gold)]/30 outline-none"
            placeholder="astrology, birth_chart, relationship"
          />
        </Field>
        <Field label="Diller (virgülle)">
          <input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full h-12 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-2xl px-4 text-sm text-[var(--gm-text)] focus:ring-2 focus:ring-[var(--gm-gold)]/30 outline-none"
            placeholder="tr, en"
          />
        </Field>

        <Field label="Görüşme Platformları">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((platform) => {
              const active = meetingPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    active
                      ? 'border-[var(--gm-gold)] bg-[var(--gm-gold)] text-[var(--gm-bg-deep)]'
                      : 'border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
                  }`}
                >
                  {platform}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Sosyal Linkler">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['instagram', 'linkedin', 'website'].map((key) => (
              <input
                key={key}
                value={socialLinks[key] || ''}
                onChange={(e) => updateSocial(key, e.target.value)}
                className="h-12 bg-[var(--gm-bg-deep)] border border-[var(--gm-border-soft)] rounded-2xl px-4 text-sm text-[var(--gm-text)] focus:ring-2 focus:ring-[var(--gm-gold)]/30 outline-none"
                placeholder={key === 'website' ? 'https://...' : `${key} URL`}
              />
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={supportsVideo}
            onChange={(e) => setSupportsVideo(e.target.checked)}
            className="w-5 h-5 accent-[var(--gm-gold)]"
          />
          <span className="text-sm text-[var(--gm-text)]">Video görüşme destekliyorum</span>
        </label>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-8 py-3 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {isLoading ? 'Kaydediliyor...' : 'Profili Kaydet'}
        </button>
      </div>

      <div className="h-fit rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 p-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
          Müşteri Önizlemesi
        </span>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-full border border-[var(--gm-gold)]/30 bg-[var(--gm-bg-deep)] flex items-center justify-center text-[var(--gm-gold)] font-serif">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initialsFromName(profile.user?.full_name)}
          </div>
          <div>
            <h3 className="font-serif text-lg text-[var(--gm-text)]">{profile.user?.full_name || 'Danışman'}</h3>
            <p className="text-[11px] text-[var(--gm-text-dim)]">{languageList.join(' / ') || 'tr'}</p>
          </div>
        </div>
        <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-[var(--gm-text-dim)]">
          {bio || 'Profil açıklaman burada görünecek.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {expertiseList.slice(0, 4).map((item) => (
            <span key={item} className="rounded-full bg-[var(--gm-gold)]/10 px-3 py-1 text-[10px] text-[var(--gm-gold)]">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">{label}</label>
      {children}
    </div>
  );
}

/* ────────── Bookings ────────── */
type BookingActionModal =
  | { kind: 'reject' | 'cancel' | 'notes'; bookingId: string; title: string; value: string }
  | null;

function BookingsPanel({ locale }: { locale: string }) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionModal, setActionModal] = useState<BookingActionModal>(null);
  const { data: bookings = [], isLoading } = useGetMyConsultantBookingsQuery(statusFilter ? { status: statusFilter } : undefined);
  const [approve] = useApproveBookingMutation();
  const [reject] = useRejectBookingMutation();
  const [cancelBooking] = useCancelMyConsultantBookingMutation();
  const [updateNotes] = useUpdateMyConsultantBookingNotesMutation();

  const FILTERS = [
    { key: '', label: 'Tümü' },
    { key: 'requested_now', label: '⚡ Anlık Talepler' },
    { key: 'pending_payment', label: 'Ödeme Bekleyen' },
    { key: 'confirmed', label: 'Onaylı' },
    { key: 'completed', label: 'Tamamlanan' },
    { key: 'rejected', label: 'Reddedilen' },
    { key: 'cancelled', label: 'İptal' },
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
      toast.success('Onaylandı');
    } catch {
      toast.error('Onaylanamadı');
    }
  };

  const submitActionModal = async () => {
    if (!actionModal) return;
    const value = actionModal.value.trim();

    if (actionModal.kind === 'reject' && value.length < 2) {
      toast.error('Red sebebi en az 2 karakter olmalı.');
      return;
    }
    if (actionModal.kind === 'cancel' && value.length < 5) {
      toast.error('İptal sebebi en az 5 karakter olmalı.');
      return;
    }

    try {
      if (actionModal.kind === 'reject') {
        await reject({ id: actionModal.bookingId, reason: value }).unwrap();
        toast.success('Reddedildi');
      } else if (actionModal.kind === 'cancel') {
        await cancelBooking({ id: actionModal.bookingId, reason: value }).unwrap();
        toast.success('İptal edildi');
      } else {
        await updateNotes({ id: actionModal.bookingId, notes: value || null }).unwrap();
        toast.success('Not kaydedildi');
      }
      setActionModal(null);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || 'İşlem tamamlanamadı');
    }
  };

  return (
    <div className="space-y-4">
      {/* T29-4: Anlık görüşme alarm bandı */}
      {activeRequestedNow.length > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center gap-3 animate-pulse">
          <Zap className="w-6 h-6 text-rose-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-rose-200">
              {activeRequestedNow.length} anlık görüşme talebi bekliyor
            </div>
            <div className="text-[11px] text-rose-100/80 mt-0.5">
              5 dakika içinde yanıtlamazsan otomatik iptal olur. Müşteri aktif bekliyor.
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('requested_now')}
            className="shrink-0 px-3 py-1.5 rounded-full bg-rose-500/30 hover:bg-rose-500/50 text-[10px] font-bold uppercase tracking-widest text-white"
          >
            Göster
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
                    ? 'border-rose-400/50 bg-rose-500/10 text-rose-300 animate-pulse'
                    : 'border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
              }`}
            >
              {f.label}
              {showAlert && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] px-1">
                  {activeRequestedNow.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">Yükleniyor...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-[var(--gm-muted)]">Bu filtrede randevu yok.</div>
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
                    ? 'border-rose-400/60 bg-rose-500/10 shadow-[0_0_24px_rgba(244,63,94,0.15)] ring-1 ring-rose-400/30'
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
                      <span className="font-bold text-[var(--gm-gold-dim)]">Seans notu:</span> {b.admin_note}
                    </div>
                  )}
                  {b.decision_note && ['rejected', 'cancelled'].includes(b.status) && (
                    <div className="mt-2 text-[12px] text-rose-300/90 border-l-2 border-rose-400/40 pl-3">
                      <span className="font-bold">Sebep:</span> {b.decision_note}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BookingMessageButton bookingId={b.id} variant="secondary" label="Mesaj" />
                  {b.status === 'confirmed' && (
                    <Link
                      href={localizePath(locale, `/booking/${b.id}/call`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Görüşmeyi Başlat
                    </Link>
                  )}
                  {b.status === 'completed' && (
                    <button
                      onClick={() => setActionModal({ kind: 'notes', bookingId: b.id, title: 'Seans Notu', value: b.admin_note || '' })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:text-[var(--gm-text)] text-[10px] font-bold uppercase tracking-widest"
                    >
                      Notlar
                    </button>
                  )}
                  {(b.status === 'pending_payment' || b.status === 'pending' || isActiveRequestNow) && (
                    <>
                      <button
                        onClick={() => handleApprove(b.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[10px] font-bold uppercase tracking-widest ${
                          isActiveRequestNow
                            ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.5)]'
                            : 'bg-[var(--gm-success)]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isActiveRequestNow ? 'Hemen Kabul Et' : 'Onayla'}
                      </button>
                      <button
                        onClick={() => setActionModal({ kind: 'reject', bookingId: b.id, title: 'Randevuyu Reddet', value: '' })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reddet
                      </button>
                    </>
                  )}
                  {canCancel && b.status !== 'requested_now' && (
                    <button
                      onClick={() => setActionModal({ kind: 'cancel', bookingId: b.id, title: 'Randevuyu İptal Et', value: '' })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest"
                    >
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)] p-6 shadow-2xl">
            <h3 className="font-serif text-xl text-[var(--gm-text)]">{actionModal.title}</h3>
            <p className="mt-2 text-sm text-[var(--gm-text-dim)]">
              {actionModal.kind === 'notes'
                ? 'Bu not yalnızca danışman panelinde görünür.'
                : actionModal.kind === 'cancel'
                  ? 'İptal sebebi müşteriye bildirim olarak gönderilir.'
                  : 'Red sebebi müşteriye bildirim olarak gönderilir.'}
            </p>
            <textarea
              value={actionModal.value}
              onChange={(e) => setActionModal({ ...actionModal, value: e.target.value })}
              rows={5}
              className="mt-4 w-full rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)] p-4 text-sm text-[var(--gm-text)] outline-none focus:border-[var(--gm-gold)]/50"
              placeholder={actionModal.kind === 'notes' ? 'Seans sonrası özel not...' : 'Sebep yaz...'}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-5 py-2.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] font-bold uppercase tracking-widest text-[var(--gm-text-dim)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={submitActionModal}
                className="px-5 py-2.5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Onaylı', cls: 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' },
    completed: { label: 'Tamamlandı', cls: 'bg-[var(--gm-gold)]/15 text-[var(--gm-gold)]' },
    pending_payment: { label: 'Ödeme Bekliyor', cls: 'bg-amber-500/15 text-amber-400' },
    pending: { label: 'Bekliyor', cls: 'bg-amber-500/15 text-amber-400' },
    requested_now: { label: '⚡ Anlık Talep', cls: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40 animate-pulse' },
    rejected: { label: 'Reddedildi', cls: 'bg-rose-500/15 text-rose-400' },
    cancelled: { label: 'İptal', cls: 'bg-[var(--gm-muted)]/15 text-[var(--gm-muted)]' },
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
          ? 'bg-rose-500/20 text-rose-300 animate-pulse'
          : 'bg-amber-500/15 text-amber-400'
    }`}>
      <Timer className="w-3 h-3" />
      {expired ? 'Süre Doldu' : `${mm}:${ss}`}
    </span>
  );
}
