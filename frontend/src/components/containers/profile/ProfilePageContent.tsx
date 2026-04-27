'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { localizePath, normalizeError } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCreateWalletDepositMutation,
  useGetMyProfileQuery,
  useGetMyWalletQuery,
  useGetWalletDepositMethodsQuery,
  useListMyWalletTransactionsQuery,
  useUpdateUserMutation,
  useUpsertMyProfileMutation,
  useSendEmailVerificationMutation,
  useListMyOrdersQuery,
} from '@/integrations/rtk/hooks';


type TabKey = 'profile' | 'password' | 'wallet' | 'orders';

function money(v: string | number, currency = 'EUR') {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

function fmtDate(v: string, locale: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(locale);
}

export default function ProfilePageContent() {
  const locale = useLocaleShort();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const { data: profile, isLoading: profileLoading } = useGetMyProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: wallet, isLoading: walletLoading } = useGetMyWalletQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: methods } = useGetWalletDepositMethodsQuery(undefined, { skip: !isAuthenticated });
  const {
    data: txsData,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useListMyWalletTransactionsQuery({ page: 1, limit: 10 }, { skip: !isAuthenticated });

  const [upsertProfile, upsertProfileState] = useUpsertMyProfileMutation();
  const [updateUser, updateUserState] = useUpdateUserMutation();
  const [createDeposit, createDepositState] = useCreateWalletDepositMutation();
  const [sendVerification, sendVerificationState] = useSendEmailVerificationMutation();

  const { data: myOrders, isLoading: ordersLoading } = useListMyOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [depositAmount, setDepositAmount] = useState('50');
  const [depositMethod, setDepositMethod] = useState<'paypal' | 'bank_transfer'>('paypal');
  const [bankTransferRef, setBankTransferRef] = useState('');

  React.useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setAddressLine1(profile.address_line1 ?? '');
    setAddressLine2(profile.address_line2 ?? '');
    setCity(profile.city ?? '');
    setCountry(profile.country ?? '');
    setPostalCode(profile.postal_code ?? '');
  }, [profile]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace(localizePath(locale, '/login'));
    }
  }, [isAuthenticated, locale, router]);

  const busy =
    profileLoading ||
    walletLoading ||
    txLoading ||
    ordersLoading ||
    upsertProfileState.isLoading ||
    updateUserState.isLoading ||
    createDepositState.isLoading;

  const walletCurrency = wallet?.currency || 'EUR';
  const txs = txsData?.data ?? [];
  const bankInfo = methods?.bank_transfer;

  const canUsePaypal = methods?.paypal?.enabled === true;
  const canUseBank = methods?.bank_transfer?.enabled === true;

  const depositHint = useMemo(() => {
    if (depositMethod === 'paypal' && !canUsePaypal) return 'PayPal şu an aktif değil.';
    if (depositMethod === 'bank_transfer' && !canUseBank) return 'Banka havalesi şu an aktif değil.';
    return '';
  }, [depositMethod, canUsePaypal, canUseBank]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertProfile({
        profile: {
          full_name: fullName || null,
          phone: phone || null,
          address_line1: addressLine1 || null,
          address_line2: addressLine2 || null,
          city: city || null,
          country: country || null,
          postal_code: postalCode || null,
        },
      }).unwrap();
      toast.success('Profil bilgileri güncellendi');
    } catch (err) {
      toast.error(normalizeError(err).message || 'Profil güncellenemedi');
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Lütfen tüm şifre alanlarını doldurun');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler uyuşmuyor');
      return;
    }
    if (!user?.email) {
      toast.error('Kullanıcı e-posta bilgisi bulunamadı');
      return;
    }

    try {
      // Backend current password doğrulamıyor; burada en azından kullanıcıdan old password alıyoruz.
      await updateUser({ email: user.email, password: newPassword }).unwrap();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Şifre güncellendi');
    } catch (err) {
      toast.error(normalizeError(err).message || 'Şifre güncellenemedi');
    }
  }

  async function onCreateDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    if (depositHint) {
      toast.error(depositHint);
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const profileUrl = localizePath(locale, '/profile');

    try {
      const res = await createDeposit({
        amount,
        currency: walletCurrency,
        payment_method: depositMethod,
        bank_transfer_reference: depositMethod === 'bank_transfer' ? bankTransferRef || undefined : undefined,
        return_url: origin ? `${origin}${profileUrl}?deposit=success` : undefined,
        cancel_url: origin ? `${origin}${profileUrl}?deposit=cancel` : undefined,
      }).unwrap();

      if (res.paypal?.approve_url) {
        window.location.href = res.paypal.approve_url;
        return;
      }

      toast.success('Yatırma talebi oluşturuldu');
      setBankTransferRef('');
      refetchTx();
    } catch (err) {
      toast.error(normalizeError(err).message || 'Yatırma işlemi başlatılamadı');
    }
  }

  if (!isAuthenticated) return null;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'profile', label: 'Profil' },
    { key: 'orders', label: 'Siparişler' },
    { key: 'password', label: 'Şifre Değiştir' },
    { key: 'wallet', label: 'Wallet' },
  ];

  return (
    <section className="bg-bg-primary py-20 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl border border-border-light bg-bg-card shadow-sm">
          <div className="grid lg:grid-cols-[260px_1fr]">
            <aside className="border-b lg:border-b-0 lg:border-r border-border-light p-4 lg:p-6">
              <h1 className="text-2xl font-serif font-light text-text-primary">Hesabım</h1>
              <p className="mt-1 text-sm text-text-muted">{user?.email || ''}</p>

              <nav className="mt-6 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-brand-primary text-white'
                        : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="p-5 lg:p-8">
              {activeTab === 'profile' ? (
                <form onSubmit={onSaveProfile} className="space-y-5">
                  <h2 className="text-xl font-semibold text-text-primary">Profil Bilgileri</h2>

                  {/* E-posta doğrulama durumu */}
                  {user && (
                    <div
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        user.email_verified === true || user.email_verified === 1 || user.email_verified === '1'
                          ? 'border-green-200 bg-green-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {user.email_verified === true || user.email_verified === 1 || user.email_verified === '1' ? (
                          <>
                            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">E-posta doğrulandı</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-amber-800">E-posta doğrulanmadı</span>
                          </>
                        )}
                      </div>
                      {!(user.email_verified === true || user.email_verified === 1 || user.email_verified === '1') && (
                        <button
                          type="button"
                          disabled={sendVerificationState.isLoading}
                          onClick={async () => {
                            try {
                              await sendVerification().unwrap();
                              toast.success('Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.');
                            } catch {
                              toast.error('Doğrulama e-postası gönderilemedi');
                            }
                          }}
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                        >
                          {sendVerificationState.isLoading ? 'Gönderiliyor...' : 'Doğrulama E-postası Gönder'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Ad Soyad</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Telefon</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Adres Satırı 1</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Adres Satırı 2</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Şehir</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Ülke</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Posta Kodu</label>
                      <input
                        className="w-full rounded border border-border-light px-3 py-2"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    disabled={busy}
                    className="rounded bg-brand-primary px-4 py-2 text-white font-semibold hover:bg-brand-hover disabled:opacity-70"
                  >
                    Kaydet
                  </button>
                </form>
              ) : null}

              {activeTab === 'password' ? (
                <form onSubmit={onChangePassword} className="space-y-5">
                  <h2 className="text-xl font-semibold text-text-primary">Şifre Değiştir</h2>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Mevcut Şifre</label>
                    <input
                      type="password"
                      className="w-full rounded border border-border-light px-3 py-2"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Yeni Şifre</label>
                    <input
                      type="password"
                      className="w-full rounded border border-border-light px-3 py-2"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      className="w-full rounded border border-border-light px-3 py-2"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <p className="text-xs text-text-muted">
                    Not: Bu backend sürümünde mevcut şifre backend tarafından doğrulanmıyor.
                  </p>

                  <button
                    disabled={busy}
                    className="rounded bg-brand-primary px-4 py-2 text-white font-semibold hover:bg-brand-hover disabled:opacity-70"
                  >
                    Şifreyi Güncelle
                  </button>
                </form>
              ) : null}

              {activeTab === 'wallet' ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-text-primary">Wallet</h2>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-bg-card p-4 border border-border-light">
                      <p className="text-sm text-text-muted">Bakiye</p>
                      <p className="mt-1 text-lg font-bold">
                        {money(wallet?.balance ?? profile?.wallet_balance ?? 0, walletCurrency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-bg-card p-4 border border-border-light">
                      <p className="text-sm text-text-muted">Toplam Giriş</p>
                      <p className="mt-1 text-lg font-bold">{money(wallet?.total_earnings ?? 0, walletCurrency)}</p>
                    </div>
                    <div className="rounded-lg bg-bg-card p-4 border border-border-light">
                      <p className="text-sm text-text-muted">Toplam Çıkış</p>
                      <p className="mt-1 text-lg font-bold">{money(wallet?.total_withdrawn ?? 0, walletCurrency)}</p>
                    </div>
                  </div>

                  <form onSubmit={onCreateDeposit} className="rounded-lg border border-border-light p-4 space-y-3">
                    <h3 className="font-semibold">Para Yatır</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium">Tutar ({walletCurrency})</label>
                        <input
                          type="number"
                          min={1}
                          step="0.01"
                          className="w-full rounded border border-border-light px-3 py-2"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium">Yöntem</label>
                        <select
                          className="w-full rounded border border-border-light px-3 py-2"
                          value={depositMethod}
                          onChange={(e) => setDepositMethod(e.target.value as 'paypal' | 'bank_transfer')}
                        >
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Banka Havalesi</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-sm font-medium">Referans (Opsiyonel)</label>
                        <input
                          className="w-full rounded border border-border-light px-3 py-2"
                          value={bankTransferRef}
                          onChange={(e) => setBankTransferRef(e.target.value)}
                          disabled={depositMethod !== 'bank_transfer'}
                        />
                      </div>
                    </div>

                    {depositHint ? <p className="text-sm text-red-600">{depositHint}</p> : null}

                    {depositMethod === 'bank_transfer' && bankInfo?.enabled ? (
                      <div className="rounded bg-bg-card border border-border-light p-3 text-sm">
                        <p><strong>Hesap:</strong> {bankInfo.account_name || '-'}</p>
                        <p><strong>IBAN:</strong> {bankInfo.iban || '-'}</p>
                        <p><strong>Banka:</strong> {bankInfo.bank_name || '-'}</p>
                        <p><strong>Şube:</strong> {bankInfo.branch || '-'}</p>
                        <p><strong>SWIFT:</strong> {bankInfo.swift || '-'}</p>
                      </div>
                    ) : null}

                    <button
                      disabled={busy}
                      className="rounded bg-brand-primary px-4 py-2 text-white font-semibold hover:bg-brand-hover disabled:opacity-70"
                    >
                      Yatırma Talebi Oluştur
                    </button>
                  </form>

                  <div className="rounded-lg border border-border-light p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">İşlem Geçmişi</h3>
                      <button onClick={() => refetchTx()} className="text-sm font-medium text-brand-primary hover:underline">
                        Yenile
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-light text-left">
                            <th className="py-2 pr-2">Tarih</th>
                            <th className="py-2 pr-2">Tür</th>
                            <th className="py-2 pr-2">Yöntem</th>
                            <th className="py-2 pr-2">Durum</th>
                            <th className="py-2 pr-2">Tutar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txs.length === 0 ? (
                            <tr>
                              <td className="py-4 text-text-muted" colSpan={5}>
                                Henüz işlem yok.
                              </td>
                            </tr>
                          ) : (
                            txs.map((tx) => (
                              <tr key={tx.id} className="border-b border-border-light">
                                <td className="py-2 pr-2">{fmtDate(tx.created_at, locale)}</td>
                                <td className="py-2 pr-2">{tx.type}</td>
                                <td className="py-2 pr-2">{tx.payment_method}</td>
                                <td className="py-2 pr-2">{tx.payment_status}</td>
                                <td className="py-2 pr-2 font-medium">{money(tx.amount, tx.currency)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'orders' ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-text-primary">Siparişlerim</h2>

                  {ordersLoading ? (
                    <p className="text-text-muted">Yükleniyor…</p>
                  ) : !myOrders || myOrders.length === 0 ? (
                    <p className="text-text-muted">Henüz siparişiniz yok.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-light text-left">
                            <th className="py-2 pr-2">Sipariş No</th>
                            <th className="py-2 pr-2">Tarih</th>
                            <th className="py-2 pr-2">Toplam</th>
                            <th className="py-2 pr-2">Durum</th>
                            <th className="py-2 pr-2">Ödeme</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myOrders.map((order) => (
                            <tr key={order.id} className="border-b border-border-light">
                              <td className="py-2 pr-2 font-mono text-xs">{order.order_number}</td>
                              <td className="py-2 pr-2">{order.created_at ? fmtDate(order.created_at, locale) : '-'}</td>
                              <td className="py-2 pr-2 font-medium">{money(order.total_amount, order.currency)}</td>
                              <td className="py-2 pr-2">
                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-100 text-red-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  'bg-bg-card-hover text-text-secondary'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                  order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-bg-card-hover text-text-secondary'
                                }`}>
                                  {order.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="mt-8 space-y-3">
                <Link
                  href={localizePath(locale, '/profile/privacy')}
                  className="inline-flex text-sm text-amber-600 hover:text-amber-700"
                >
                  KVKK: Verilerimi İndir / Hesabı Sil
                </Link>

                <Link href={localizePath(locale, '/logout')} className="text-sm text-text-secondary hover:text-brand-primary">
                  Çıkış yap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
