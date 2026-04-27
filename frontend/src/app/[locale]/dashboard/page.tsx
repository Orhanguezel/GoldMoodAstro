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
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';

import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath, normalizeError } from '@/integrations/shared';
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
  useUpdateUserMutation,
  useListMyOrdersQuery,
} from '@/integrations/rtk/hooks';
import AvatarUpload from '@/components/common/AvatarUpload';
import CityAutocomplete from '@/components/common/CityAutocomplete';

type TabKey = 'overview' | 'profile' | 'bookings' | 'security';

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

function money(v: string | number, currency = 'TRY') {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(n);
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

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';

  const { isAuthenticated, isReady, user } = useAuthStore();

  // Tab state — URL ?tab= ile senkronize
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
  const [tab, setTab] = useState<TabKey>(
    ['overview', 'profile', 'bookings', 'security'].includes(initialTab) ? initialTab : 'overview',
  );

  useEffect(() => {
    const t = searchParams.get('tab') as TabKey | null;
    if (t && ['overview', 'profile', 'bookings', 'security'].includes(t) && t !== tab) {
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
  const { data: myOrders, isLoading: ordersLoading } = useListMyOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [upsertProfile, upsertProfileState] = useUpsertMyProfileMutation();
  const [updateUser, updateUserState] = useUpdateUserMutation();

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
      href: localizePath(locale, '/pricing'),
      icon: <CreditCard size={22} />,
      eyebrow: isTr ? 'Üyelik' : 'Membership',
      title: isTr ? 'Aboneliğim' : 'My Subscription',
      description: isTr
        ? 'Premium üyelik durumunuzu, kredi bakiyenizi ve faturaları yönetin.'
        : 'Manage your premium status, credit balance and invoices.',
      cta: isTr ? 'Aboneliği yönet' : 'Manage plan',
    },
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

            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-(--gm-bg-deep) animate-pulse" />
                ))}
              </div>
            ) : !myOrders || myOrders.length === 0 ? (
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
                {myOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-(--gm-gold)/40 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep) shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-bold text-(--gm-gold-deep) tracking-widest uppercase">
                            #{order.order_number}
                          </span>
                          {order.payment_status === 'paid' && (
                            <span className="flex items-center gap-1 text-(--gm-success) text-[9px] font-bold uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" /> {isTr ? 'ÖDENDİ' : 'PAID'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-(--gm-text) font-serif text-base">
                          {fmtDate(order.created_at, locale)}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-(--gm-muted) text-[10px] font-bold tracking-widest uppercase mb-1">
                          {isTr ? 'Tutar' : 'Amount'}
                        </p>
                        <p className="text-(--gm-text) font-serif text-lg">
                          {money(order.total_amount, order.currency)}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                          order.status === 'completed'
                            ? 'bg-(--gm-success)/10 text-(--gm-success)'
                            : 'bg-(--gm-gold)/10 text-(--gm-gold-deep)'
                        }`}
                      >
                        {order.status === 'completed'
                          ? isTr
                            ? 'TAMAMLANDI'
                            : 'COMPLETED'
                          : isTr
                          ? 'BEKLEMEDE'
                          : 'PENDING'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'security' && (
          <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-8 md:p-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-(--gm-gold)/10 flex items-center justify-center text-(--gm-gold-deep)">
                <Lock size={18} />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-(--gm-text)">
                {isTr ? 'Güvenlik Ayarları' : 'Security'}
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <FieldLabel>{isTr ? 'Mevcut Şifre' : 'Current Password'}</FieldLabel>
                <input
                  type="password"
                  className={fieldClasses()}
                  value={passData.old}
                  onChange={(e) => setPassData({ ...passData, old: e.target.value })}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>{isTr ? 'Yeni Şifre' : 'New Password'}</FieldLabel>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passData.new}
                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <FieldLabel>{isTr ? 'Yeni Şifre (Tekrar)' : 'Confirm Password'}</FieldLabel>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passData.confirm}
                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                    autoComplete="new-password"
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
    </main>
  );
}
