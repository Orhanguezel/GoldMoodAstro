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
} from 'lucide-react';

import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath, normalizeError } from '@/integrations/shared';
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

type TabKey = 'overview' | 'profile' | 'bookings' | 'history' | 'security';
type HistoryFilter = 'all' | ReadingType;
const VALID_TABS: TabKey[] = ['overview', 'profile', 'bookings', 'history', 'security'];

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
        <div className="w-14 h-14 rounded-full bg-(--gm-gold)/10 border border-(--gm-gold)/30 flex items-center justify-center text-(--gm-gold-deep) mb-6">
          {icon}
        </div>
        <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase">
          {eyebrow}
        </span>
        <h3 className="font-serif text-2xl text-(--gm-text) mt-1 mb-3">{title}</h3>
        <p className="text-sm text-(--gm-text-dim) leading-relaxed mb-6">{description}</p>
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep) group-hover:text-(--gm-gold) transition-colors mt-auto">
          {cta}
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-(--gm-gold-deep) tracking-[0.2em] uppercase mb-2">
      {children}
    </label>
  );
}

function fieldClasses() {
  return 'w-full bg-(--gm-bg-deep) border border-(--gm-border-soft) rounded-xl px-5 py-3.5 text-sm text-(--gm-text) placeholder:text-(--gm-muted) focus:border-(--gm-gold)/50 outline-none transition-colors';
}

function fmtDate(v: string, locale: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const HISTORY_TYPES: Array<{ key: HistoryFilter; tr: string; en: string }> = [
  { key: 'all', tr: 'Tümü', en: 'All' },
  { key: 'tarot', tr: 'Tarot', en: 'Tarot' },
  { key: 'coffee', tr: 'Kahve', en: 'Coffee' },
  { key: 'dream', tr: 'Rüya', en: 'Dream' },
  { key: 'synastry', tr: 'Sinastri', en: 'Synastry' },
  { key: 'yildizname', tr: 'Yıldızname', en: 'Yildizname' },
  { key: 'numerology', tr: 'Numeroloji', en: 'Numerology' },
];

const HISTORY_META: Record<ReadingType, { icon: React.ReactNode; tr: string; en: string; route: string }> = {
  tarot: { icon: <Star size={18} />, tr: 'Tarot', en: 'Tarot', route: '/tarot/reading' },
  coffee: { icon: <Coffee size={18} />, tr: 'Kahve', en: 'Coffee', route: '/kahve-fali/result' },
  dream: { icon: <Moon size={18} />, tr: 'Rüya', en: 'Dream', route: '/ruya-tabiri/result' },
  synastry: { icon: <Heart size={18} />, tr: 'Sinastri', en: 'Synastry', route: '/sinastri/result' },
  yildizname: { icon: <Sparkles size={18} />, tr: 'Yıldızname', en: 'Yildizname', route: '/yildizname/result' },
  numerology: { icon: <Binary size={18} />, tr: 'Numeroloji', en: 'Numerology', route: '/numeroloji' },
};

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';

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

  // Tab state — URL ?tab= ile senkronize
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

  // Auth guard
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/dashboard`);
    }
  }, [isReady, isAuthenticated, locale, router]);

  // Profile data
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: pendingOutcomes } = useListMyPendingOutcomesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: history, isLoading: historyLoading } = useGetUserHistoryQuery(
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
      <main className="min-h-screen flex items-center justify-center bg-(--gm-bg)">
        <p className="text-(--gm-muted) text-sm">{isTr ? 'Yükleniyor…' : 'Loading…'}</p>
      </main>
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
      toast.error(normalizeError(err).message || 'Avatar kaydedilemedi.');
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
      toast.success(isTr ? 'Profil güncellendi' : 'Profile updated');
    } catch (err) {
      toast.error(normalizeError(err).message || (isTr ? 'Hata oluştu' : 'An error occurred'));
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      toast.error(isTr ? 'Şifreler uyuşmuyor' : 'Passwords do not match');
      return;
    }
    try {
      await updateUser({ email: user!.email, password: passData.new }).unwrap();
      setPassData({ old: '', new: '', confirm: '' });
      toast.success(isTr ? 'Şifre güncellendi' : 'Password updated');
    } catch (err) {
      toast.error(normalizeError(err).message || (isTr ? 'Hata oluştu' : 'An error occurred'));
    }
  }

  async function handleDeleteReading(item: HistoryItem) {
    try {
      await deleteReading({ type: item.type, id: item.id }).unwrap();
      toast.success(isTr ? 'Yorum silindi' : 'Reading deleted');
    } catch (err) {
      toast.error(normalizeError(err).message || (isTr ? 'Silinemedi' : 'Could not delete'));
    }
  }

  async function handleDeleteAllReadings() {
    try {
      await deleteAllReadings().unwrap();
      toast.success(isTr ? 'Tüm yorum geçmişi silindi' : 'All reading history deleted');
    } catch (err) {
      toast.error(normalizeError(err).message || (isTr ? 'Silinemedi' : 'Could not delete'));
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
      eyebrow: isTr ? 'Hesap' : 'Account',
      title: isTr ? 'Profilim' : 'My Profile',
      description: isTr
        ? 'Kişisel bilgilerinizi, doğum verilerinizi ve tercihlerinizi yönetin.'
        : 'Manage your personal info, birth data and preferences.',
      cta: isTr ? 'Profili düzenle' : 'Edit profile',
    },
    {
      href: `?tab=bookings`,
      icon: <Calendar size={22} />,
      eyebrow: isTr ? 'Randevular' : 'Bookings',
      title: isTr ? 'Seanslarım' : 'My Sessions',
      description: isTr
        ? 'Yaklaşan randevularınızı ve geçmiş görüşmelerinizi görüntüleyin.'
        : 'View upcoming appointments and past sessions.',
      cta: isTr ? 'Randevuları gör' : 'View bookings',
    },
    {
      href: localizePath(locale, '/birth-chart'),
      icon: <Sparkles size={22} />,
      eyebrow: isTr ? 'Astroloji' : 'Astrology',
      title: isTr ? 'Doğum Haritam' : 'My Birth Chart',
      description: isTr
        ? 'Detaylı doğum haritanızı oluşturun, gezegen yorumlarını okuyun.'
        : 'Build your detailed birth chart, read planet interpretations.',
      cta: isTr ? 'Haritamı aç' : 'Open chart',
    },
    {
      href: localizePath(locale, '/daily'),
      icon: <Star size={22} />,
      eyebrow: isTr ? 'Günlük' : 'Daily',
      title: isTr ? 'Günlük Yorumum' : 'Daily Reading',
      description: isTr
        ? 'Bugünün enerjisi, kişisel transit yorumu ve önerileri.'
        : "Today's energy, your personal transit and recommendations.",
      cta: isTr ? 'Bugünü oku' : 'Read today',
    },
    {
      href: `?tab=history`,
      icon: <Clock size={22} />,
      eyebrow: isTr ? 'Geçmiş' : 'History',
      title: isTr ? 'Yorumlarım' : 'My Readings',
      description: isTr
        ? 'Tarot, kahve, rüya ve diğer kayıtlı yorumlarınızı tek yerden açın veya silin.'
        : 'Open or delete your saved tarot, coffee, dream and other readings in one place.',
      cta: isTr ? 'Geçmişi gör' : 'View history',
    },
    {
      href: localizePath(locale, '/pricing'),
      icon: <CreditCard size={22} />,
      eyebrow: isTr ? 'Üyelik' : 'Membership',
      title: isTr ? 'Aboneliğim' : 'My Subscription',
      description: isTr
        ? 'Premium üyelik durumunuzu, kredi bakiyenizi ve faturaları yönetin.'
        : 'Manage your premium status, credit balance and invoices.',
      cta: isTr ? 'Aboneliği yönet' : 'Manage plan',
    },
    ...(isConsultantUser
      ? [
          {
            href: localizePath(locale, '/me/consultant'),
            icon: <Settings size={22} />,
            eyebrow: isTr ? 'Danışman' : 'Consultant',
            title: isTr ? 'Danışman Paneli' : 'Consultant Dashboard',
            description: isTr
              ? 'Profilinizi, hizmetlerinizi, müsaitliklerinizi ve kazançlarınızı yönetin.'
              : 'Manage your profile, services, availability and earnings.',
            cta: isTr ? 'Panele git' : 'Open panel',
          },
        ]
      : []),
    {
      href: localizePath(locale, '/consultants'),
      icon: <Heart size={22} />,
      eyebrow: isTr ? 'Keşfet' : 'Explore',
      title: isTr ? 'Danışman Bul' : 'Find a Consultant',
      description: isTr
        ? 'Uzman astrolog ve danışmanlarla yeni bir görüşme planlayın.'
        : 'Schedule a new session with our expert astrologers.',
      cta: isTr ? 'Danışmanları gör' : 'Browse experts',
    },
  ];

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: isTr ? 'Genel Bakış' : 'Overview', icon: <LayoutGrid size={14} /> },
    { key: 'profile', label: isTr ? 'Profil' : 'Profile', icon: <UserIcon size={14} /> },
    { key: 'bookings', label: isTr ? 'Randevular' : 'Bookings', icon: <ShoppingBag size={14} /> },
    { key: 'history', label: isTr ? 'Geçmiş Yorumlarım' : 'Reading History', icon: <Sparkles size={14} /> },
    { key: 'security', label: isTr ? 'Güvenlik' : 'Security', icon: <Lock size={14} /> },
  ];

  return (
    <main className="min-h-screen bg-(--gm-bg) pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* User card */}
        <header className="mb-8 rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <AvatarUpload
            src={avatarUrl}
            initials={initials}
            size={96}
            onUploaded={handleAvatarUploaded}
          />

          <div className="flex-1 min-w-0">
            <span className="font-display text-[10px] tracking-[0.32em] text-(--gm-gold-deep) uppercase">
              {isTr ? 'Hoş geldin' : 'Welcome'}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-(--gm-text) mt-1 leading-tight">
              {firstName ? (isTr ? `Merhaba, ${firstName}` : `Hello, ${firstName}`) : isTr ? 'Panelim' : 'Dashboard'}
            </h1>
            <p className="text-(--gm-text-dim) text-sm mt-2 truncate">{user.email}</p>
            {memberSince && (
              <p className="text-(--gm-muted) text-xs mt-1">
                {isTr ? `Üye: ${memberSince}` : `Member since ${memberSince}`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <button
              type="button"
              onClick={() => switchTab('profile')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep) hover:text-(--gm-gold) transition-colors"
            >
              <Settings size={14} />
              {isTr ? 'Hesap Ayarları' : 'Account Settings'}
            </button>
            <Link
              href={localizePath(locale, '/logout')}
              className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-(--gm-muted) hover:text-(--gm-text-dim) transition-colors"
            >
              {isTr ? 'Çıkış yap' : 'Sign out'}
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
                className={`relative inline-flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? 'text-(--gm-gold-deep)'
                    : 'text-(--gm-text-dim) hover:text-(--gm-text)'
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
                    {isTr ? 'Astrolog Karnesi' : 'Astrologer Report Card'}
                  </div>
                  <h3 className="font-serif text-xl text-(--gm-text)">
                    {isTr
                      ? `${pendingCount} bekleyen karne sorun var`
                      : `${pendingCount} pending feedback ${pendingCount === 1 ? 'item' : 'items'}`}
                  </h3>
                  <p className="text-sm text-(--gm-text-dim) mt-1">
                    {isTr
                      ? '6 ay önce aldığın yorumlar gerçekleşti mi? Cevapların astrologların karnesini şekillendiriyor.'
                      : 'Did the predictions from 6 months ago come true? Your responses shape the astrologer report card.'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep) group-hover:text-(--gm-gold) transition-colors">
                  {isTr ? 'Cevapla' : 'Respond'}
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
                  {isTr ? 'Gizlilik Sözü' : 'Privacy Promise'}
                </div>
                <p className="text-(--gm-text-dim) font-light leading-relaxed text-sm">
                  {isTr
                    ? 'Doğum bilgileri ve seans notlarınız KVKK uyumlu olarak şifreli saklanır. Hesabını dilediğin an silebilir, verilerini indirebilirsin.'
                    : 'Your birth data and session notes are stored encrypted, KVKK-compliant. You can delete your account or export your data at any time.'}
                </p>
              </div>
            </section>
          </>
        )}

        {tab === 'profile' && (
          <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <UserIcon size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {isTr ? 'Profil Bilgileri' : 'Profile Info'}
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>{isTr ? 'Ad Soyad' : 'Full name'}</FieldLabel>
                  <input
                    className={fieldClasses()}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={isTr ? 'Adınız ve soyadınız' : 'Your full name'}
                  />
                </div>
                <div>
                  <FieldLabel>{isTr ? 'Telefon' : 'Phone'}</FieldLabel>
                  <input
                    className={fieldClasses()}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 5xx xxx xx xx"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{isTr ? 'Adres' : 'Address'}</FieldLabel>
                <input
                  className={fieldClasses()}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <FieldLabel>{isTr ? 'Şehir' : 'City'}</FieldLabel>
                <CityAutocomplete
                  value={formData.city}
                  onChange={(city) => setFormData({ ...formData, city })}
                  placeholder={isTr ? 'Şehir ara…' : 'Search city…'}
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
                    ? isTr
                      ? 'KAYDEDİLİYOR...'
                      : 'SAVING...'
                    : isTr
                    ? 'DEĞİŞİKLİKLERİ KAYDET'
                    : 'SAVE CHANGES'}
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
                {isTr ? 'Randevularım' : 'My Bookings'}
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
                  <Calendar className="w-6 h-6 text-(--gm-muted)" />
                </div>
                <p className="text-(--gm-text-dim) font-serif italic">
                  {isTr ? 'Henüz bir randevunuz bulunmuyor.' : 'No bookings yet.'}
                </p>
                <Link href={localizePath(locale, '/consultants')} className="btn-premium inline-flex py-3 px-8">
                  {isTr ? 'Danışmanları Keşfet' : 'Find Consultants'}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {myBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-(--gm-gold)/40 transition-all duration-300 group"
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
                            {isTr ? 'Danışmanlık' : 'Consultation'}
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
                          {booking.resource_title || (isTr ? 'Danışman' : 'Consultant')}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-(--gm-muted) text-xs">
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
                            consultantName: booking.resource_title || ''
                          })}
                          className="btn-outline-premium px-5 py-2.5 text-[10px]"
                        >
                          {isTr ? 'YORUM YAP' : 'WRITE REVIEW'}
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <Link
                          href={localizePath(locale, `/booking/${booking.id}/call`)}
                          className="btn-premium px-6 py-2.5 text-[10px] shadow-gold"
                        >
                          {isTr ? 'GÖRÜŞMEYE KATIL' : 'JOIN CALL'}
                        </Link>
                      )}

                      <BookingMessageButton bookingId={booking.id} variant="secondary" label={isTr ? 'MESAJ' : 'MESSAGE'} />

                      <Link
                        href={localizePath(locale, `/booking/${booking.id}`)}
                        className="p-2.5 rounded-xl border border-(--gm-border-soft) text-(--gm-muted) hover:text-(--gm-gold) hover:border-(--gm-gold)/40 transition-all"
                        title={isTr ? 'Detaylar' : 'Details'}
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

        {tab === 'history' && (
          <section>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                  <Sparkles size={18} />
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                  {isTr ? 'Geçmiş Yorumlarım' : 'Reading History'}
                </h2>
              </div>

              {(history?.length ?? 0) > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--gm-error)/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-error) transition hover:bg-(--gm-error)/10"
                    >
                      <Trash2 size={14} />
                      {isTr ? 'Tümünü Sil' : 'Delete All'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isTr ? 'Tüm yorum geçmişi silinsin mi?' : 'Delete all reading history?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {isTr
                          ? 'Bu işlem tarot, kahve, rüya, sinastri, yıldızname ve numeroloji kayıtlarınızı anında siler.'
                          : 'This immediately deletes your tarot, coffee, dream, synastry, yildizname and numerology records.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{isTr ? 'Vazgeç' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllReadings}
                        disabled={deleteAllReadingsState.isLoading}
                      >
                        {isTr ? 'Tümünü Sil' : 'Delete All'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                    {isTr ? item.tr : item.en}
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
                  <Sparkles className="w-6 h-6 text-(--gm-muted)" />
                </div>
                <p className="text-(--gm-text-dim) font-serif italic">
                  {isTr ? 'Henüz kayıtlı yorumun yok.' : 'No saved readings yet.'}
                </p>
                <Link href={localizePath(locale, '/tarot')} className="btn-premium inline-flex py-3 px-8">
                  {isTr ? 'İlk yorumu al' : 'Get a reading'}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredHistory.map((item) => {
                  const meta = HISTORY_META[item.type];
                  const detailHref =
                    item.type === 'numerology'
                      ? localizePath(locale, meta.route)
                      : localizePath(locale, `${meta.route}/${item.id}`);
                  return (
                    <article
                      key={`${item.type}:${item.id}`}
                      className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 md:p-6 transition hover:border-(--gm-gold)/40"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-(--gm-gold)/20 bg-(--gm-gold)/10 text-(--gm-gold-deep)">
                            {meta.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-deep)">
                                {isTr ? meta.tr : meta.en}
                              </span>
                              <span className="text-[10px] text-(--gm-muted)">
                                {fmtDate(item.created_at, locale)}
                              </span>
                            </div>
                            <h3 className="truncate font-serif text-lg text-(--gm-text)">
                              {item.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm text-(--gm-text-dim)">
                              {item.snippet || (isTr ? 'Önizleme metni yok.' : 'No preview available.')}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={detailHref}
                            className="inline-flex items-center gap-2 rounded-xl border border-(--gm-border-soft) px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-text-dim) transition hover:border-(--gm-gold)/40 hover:text-(--gm-gold)"
                          >
                            <Eye size={14} />
                            {isTr ? 'Aç' : 'Open'}
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-(--gm-error)/25 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-(--gm-error) transition hover:bg-(--gm-error)/10"
                              >
                                <Trash2 size={14} />
                                {isTr ? 'Sil' : 'Delete'}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isTr ? 'Bu yorum silinsin mi?' : 'Delete this reading?'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isTr
                                    ? 'Bu kayıt hesabınızdan kalıcı olarak kaldırılır.'
                                    : 'This record will be permanently removed from your account.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{isTr ? 'Vazgeç' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReading(item)}
                                  disabled={deleteReadingState.isLoading}
                                >
                                  {isTr ? 'Sil' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
          <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <Lock size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {isTr ? 'Güvenlik Ayarları' : 'Security Settings'}
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <FieldLabel>{isTr ? 'Mevcut Şifre' : 'Current password'}</FieldLabel>
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
                  <FieldLabel>{isTr ? 'Yeni Şifre' : 'New password'}</FieldLabel>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passData.new}
                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <FieldLabel>{isTr ? 'Şifre Tekrar' : 'Confirm password'}</FieldLabel>
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
                    ? isTr
                      ? 'GÜNCELLENİYOR...'
                      : 'UPDATING...'
                    : isTr
                    ? 'ŞİFREYİ GÜNCELLE'
                    : 'UPDATE PASSWORD'}
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
    </main>
  );
}
