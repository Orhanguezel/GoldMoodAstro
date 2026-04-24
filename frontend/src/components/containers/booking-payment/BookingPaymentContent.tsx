'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocaleShort } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useGetBookingPaymentInfoQuery,
  usePayBookingMutation,
  useCaptureBookingPaypalMutation,
  useGetMyWalletQuery,
  useCheckGutscheinCodeMutation,
} from '@/integrations/rtk/hooks';
import type { CheckGutscheinResp } from '@/integrations/shared';

type Props = { bookingId: string };

const t = (locale: string | null, de: string, tr: string, en: string) => {
  if (locale === 'de') return de;
  if (locale === 'tr') return tr;
  return en;
};

export default function BookingPaymentContent({ bookingId }: Props) {
  const locale = useLocaleShort();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const {
    data: info,
    isLoading,
    error: infoError,
    refetch,
  } = useGetBookingPaymentInfoQuery({ id: bookingId });

  const { data: wallet } = useGetMyWalletQuery(undefined, { skip: !isAuthenticated });

  const [payBooking, { isLoading: isPaying }] = usePayBookingMutation();
  const [capturePaypal, { isLoading: isCapturing }] = useCaptureBookingPaypalMutation();
  const [checkGutschein, { isLoading: isChecking }] = useCheckGutscheinCodeMutation();

  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'capturing'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Gutschein state
  const [gutscheinInput, setGutscheinInput] = useState('');
  const [appliedGutschein, setAppliedGutschein] = useState<CheckGutscheinResp | null>(null);
  const [gutscheinError, setGutscheinError] = useState('');

  // Handle PayPal return
  useEffect(() => {
    const paypalFlag = searchParams.get('paypal');
    const token = searchParams.get('token');

    if (paypalFlag === 'capture' && token && isAuthenticated && status === 'idle') {
      setStatus('capturing');
      capturePaypal({ id: bookingId, paypal_order_id: token })
        .unwrap()
        .then(() => {
          setStatus('success');
          refetch();
        })
        .catch((err) => {
          setStatus('error');
          setErrorMsg(err?.data?.error || 'paypal_capture_failed');
        });
    }

    if (paypalFlag === 'cancel') {
      setStatus('error');
      setErrorMsg(
        t(locale, 'PayPal-Zahlung abgebrochen.', 'PayPal ödemesi iptal edildi.', 'PayPal payment cancelled.')
      );
    }
  }, [searchParams, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckGutschein = useCallback(async () => {
    const code = gutscheinInput.trim().toUpperCase();
    if (!code) return;
    setGutscheinError('');
    try {
      const resp = await checkGutschein({ code }).unwrap();
      if (resp.status !== 'active') {
        setGutscheinError(
          t(locale, 'Gutschein ist nicht einlösbar.', 'Bu hediye çeki kullanılamaz.', 'This gift card is not redeemable.')
        );
        return;
      }
      setAppliedGutschein(resp);
    } catch (err: any) {
      const reason = err?.data?.error;
      if (reason === 'gutschein_not_found') {
        setGutscheinError(t(locale, 'Gutschein nicht gefunden.', 'Hediye çeki bulunamadı.', 'Gift card not found.'));
      } else {
        setGutscheinError(t(locale, 'Ungültiger Code.', 'Geçersiz kod.', 'Invalid code.'));
      }
    }
  }, [gutscheinInput, locale, checkGutschein]);

  const removeGutschein = useCallback(() => {
    setAppliedGutschein(null);
    setGutscheinInput('');
    setGutscheinError('');
  }, []);

  const gutscheinValue = appliedGutschein ? Number(appliedGutschein.value) : 0;
  const originalPrice = info?.price ?? 0;
  const discountedPrice = Math.max(0, originalPrice - gutscheinValue);
  const gutscheinCoversAll = gutscheinValue >= originalPrice;

  const handlePay = useCallback(async (method: 'wallet' | 'paypal' | 'gutschein') => {
    try {
      setErrorMsg('');
      const resp = await payBooking({
        id: bookingId,
        payment_method: method,
        gutschein_code: appliedGutschein?.code || undefined,
      }).unwrap();

      if (method === 'paypal' && resp.paypal?.approve_url) {
        window.location.href = resp.paypal.approve_url;
        return;
      }

      setStatus('success');
      refetch();
    } catch (err: any) {
      setStatus('error');
      const reason = err?.data?.error;
      if (reason === 'insufficient_balance') {
        setErrorMsg(t(locale, 'Unzureichendes Guthaben.', 'Yetersiz bakiye.', 'Insufficient balance.'));
      } else if (reason === 'gutschein_not_found') {
        setErrorMsg(t(locale, 'Gutschein nicht gefunden.', 'Hediye çeki bulunamadı.', 'Gift card not found.'));
      } else if (reason === 'gutschein_not_redeemable') {
        setErrorMsg(t(locale, 'Gutschein nicht einlösbar.', 'Hediye çeki kullanılamaz.', 'Gift card not redeemable.'));
      } else if (reason === 'gutschein_expired') {
        setErrorMsg(t(locale, 'Gutschein abgelaufen.', 'Hediye çeki süresi dolmuş.', 'Gift card expired.'));
      } else if (reason === 'gutschein_insufficient') {
        setErrorMsg(t(locale, 'Gutschein deckt nicht den gesamten Betrag.', 'Hediye çeki tutarı yetersiz.', 'Gift card does not cover the full amount.'));
      } else {
        setErrorMsg(reason || 'payment_failed');
      }
    }
  }, [bookingId, locale, payBooking, refetch, appliedGutschein]);

  const busy = isPaying || isCapturing || status === 'capturing';
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const canPayWallet = discountedPrice > 0 ? walletBalance >= discountedPrice : false;

  // Loading / capturing state
  if (isLoading || status === 'capturing') {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-bg-card-hover rounded w-3/4 mx-auto" />
            <div className="h-4 bg-bg-card-hover rounded w-1/2 mx-auto" />
          </div>
          <p className="mt-4 text-sm text-text-muted">
            {status === 'capturing'
              ? t(locale, 'Zahlung wird verarbeitet...', 'Ödeme işleniyor...', 'Processing payment...')
              : t(locale, 'Laden...', 'Yükleniyor...', 'Loading...')}
          </p>
        </div>
      </section>
    );
  }

  const errCode = (infoError as any)?.data?.error;
  if (errCode === 'already_paid' || info?.payment_status === 'paid' || status === 'success') {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="border border-green-200 bg-green-50 p-8">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-green-800">
              {t(locale, 'Zahlung erfolgreich!', 'Ödeme başarılı!', 'Payment successful!')}
            </h2>
            <p className="mt-2 text-sm text-green-700">
              {t(locale, 'Ihre Buchung wurde bezahlt. Vielen Dank!', 'Randevunuz ödendi. Teşekkür ederiz!', 'Your booking has been paid. Thank you!')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (errCode === 'booking_payment_disabled') {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <p className="text-text-secondary">
            {t(locale, 'Online-Zahlung ist derzeit deaktiviert.', 'Online ödeme şu anda devre dışı.', 'Online payment is currently disabled.')}
          </p>
        </div>
      </section>
    );
  }

  if (errCode || !info) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <p className="text-red-600">
            {errCode === 'booking_not_found'
              ? t(locale, 'Buchung nicht gefunden.', 'Randevu bulunamadı.', 'Booking not found.')
              : errCode === 'booking_not_confirmed'
                ? t(locale, 'Buchung ist noch nicht bestätigt.', 'Randevu henüz onaylanmadı.', 'Booking is not yet confirmed.')
                : t(locale, 'Ein Fehler ist aufgetreten.', 'Bir hata oluştu.', 'An error occurred.')}
          </p>
        </div>
      </section>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="border bg-bg-card p-8 shadow-sm space-y-4">
            <BookingDetails info={info} locale={locale} />
            <div className="border-t pt-4 text-center">
              <p className="text-sm text-text-secondary mb-4">
                {t(
                  locale,
                  'Bitte melden Sie sich an, um die Zahlung abzuschließen.',
                  'Ödemeyi tamamlamak için lütfen giriş yapın.',
                  'Please log in to complete the payment.'
                )}
              </p>
              <a
                href={`/${locale}/login`}
                className="inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
              >
                {t(locale, 'Anmelden', 'Giriş Yap', 'Log In')}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main payment UI
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="border bg-bg-card p-8 shadow-sm space-y-6">
          <BookingDetails info={info} locale={locale} />

          {/* Gutschein section */}
          {info.gutschein_applicable && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold">
                {t(locale, 'Gutschein einlösen', 'Hediye Çeki Kullan', 'Redeem Gift Card')}
              </h3>

              {appliedGutschein ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {appliedGutschein.code}
                    </p>
                    <p className="text-xs text-green-600">
                      -{Number(appliedGutschein.value).toFixed(2)} {appliedGutschein.currency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeGutschein}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t(locale, 'Entfernen', 'Kaldır', 'Remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gutscheinInput}
                    onChange={(e) => setGutscheinInput(e.target.value.toUpperCase())}
                    placeholder="KM-XXXX-XXXX"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm uppercase placeholder:normal-case"
                    disabled={busy || isChecking}
                  />
                  <button
                    type="button"
                    onClick={handleCheckGutschein}
                    disabled={busy || isChecking || !gutscheinInput.trim()}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    {isChecking
                      ? '...'
                      : t(locale, 'Einlösen', 'Uygula', 'Apply')}
                  </button>
                </div>
              )}

              {gutscheinError && (
                <p className="text-xs text-red-600">{gutscheinError}</p>
              )}

              {/* Show discounted price */}
              {appliedGutschein && (
                <div className="rounded-lg bg-bg-card p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t(locale, 'Preis', 'Fiyat', 'Price')}</span>
                    <span>{originalPrice.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t(locale, 'Gutschein', 'Hediye Çeki', 'Gift Card')}</span>
                    <span>-{gutscheinValue.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-1">
                    <span>{t(locale, 'Zu zahlen', 'Ödenecek', 'To pay')}</span>
                    <span>{discountedPrice.toFixed(2)} EUR</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-base font-semibold">
              {t(locale, 'Zahlungsmethode wählen', 'Ödeme yöntemi seçin', 'Choose payment method')}
            </h3>

            {/* Gutschein covers full amount */}
            {gutscheinCoversAll && appliedGutschein && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handlePay('gutschein')}
                className="w-full flex items-center justify-between rounded-lg border border-green-300 bg-green-50 p-4 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-800">
                      {t(locale, 'Mit Gutschein bezahlen', 'Hediye çeki ile öde', 'Pay with Gift Card')}
                    </p>
                    <p className="text-xs text-green-600">
                      {t(locale, 'Gutschein deckt den gesamten Betrag', 'Hediye çeki tutarın tamamını karşılıyor', 'Gift card covers the full amount')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  {isPaying
                    ? t(locale, 'Verarbeitung...', 'İşleniyor...', 'Processing...')
                    : t(locale, 'Kostenlos', 'Ücretsiz', 'Free')}
                </span>
              </button>
            )}

            {/* Wallet — show if not fully covered by gutschein, or if no gutschein */}
            {!gutscheinCoversAll && info.payment_methods.wallet && (
              <button
                type="button"
                disabled={busy || !canPayWallet}
                onClick={() => handlePay('wallet')}
                className="w-full flex items-center justify-between rounded-lg border p-4 hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v14.25m0-16.5A2.25 2.25 0 0018.75 1.5H5.25A2.25 2.25 0 003 3.75v16.5A2.25 2.25 0 005.25 22.5h13.5A2.25 2.25 0 0021 20.25V12z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {t(locale, 'Guthaben', 'Cüzdan', 'Wallet')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t(locale, 'Verfügbar', 'Bakiye', 'Balance')}: {walletBalance.toFixed(2)} EUR
                      {appliedGutschein && ` — ${t(locale, 'Zu zahlen', 'Ödenecek', 'To pay')}: ${discountedPrice.toFixed(2)} EUR`}
                    </p>
                  </div>
                </div>
                {canPayWallet ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {isPaying
                      ? t(locale, 'Verarbeitung...', 'İşleniyor...', 'Processing...')
                      : t(locale, 'Jetzt bezahlen', 'Şimdi Öde', 'Pay Now')}
                  </span>
                ) : (
                  <span className="text-xs text-red-500">
                    {t(locale, 'Unzureichend', 'Yetersiz', 'Insufficient')}
                  </span>
                )}
              </button>
            )}

            {/* PayPal — show if not fully covered by gutschein */}
            {!gutscheinCoversAll && info.payment_methods.paypal && (
              <button
                type="button"
                disabled={busy}
                onClick={() => handlePay('paypal')}
                className="w-full flex items-center justify-between rounded-lg border p-4 hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-[#003087]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.56A.766.766 0 015.7 1.92h6.845c2.278 0 3.96.58 4.997 1.726.485.538.808 1.127.962 1.751.16.651.202 1.431.126 2.322l-.01.117v.337l.263.149a3.39 3.39 0 01.783.578c.42.452.699 1.014.829 1.67.134.677.13 1.48-.011 2.389-.163 1.043-.43 1.952-.793 2.702-.336.694-.77 1.275-1.294 1.724-.498.427-1.087.749-1.752.958-.646.2-1.377.302-2.177.302h-.518a1.56 1.56 0 00-1.54 1.315l-.04.215-.666 4.218-.03.155a.766.766 0 01-.757.644H7.076z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium">PayPal</p>
                    <p className="text-xs text-text-muted">
                      {t(locale, 'Mit PayPal bezahlen', 'PayPal ile öde', 'Pay with PayPal')}
                      {appliedGutschein && ` — ${discountedPrice.toFixed(2)} EUR`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {isPaying
                    ? t(locale, 'Weiterleitung...', 'Yönlendiriliyor...', 'Redirecting...')
                    : t(locale, 'Bezahlen', 'Öde', 'Pay')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingDetails({
  info,
  locale,
}: {
  info: {
    service_name: string;
    appointment_date: string;
    appointment_time: string | null;
    price: number;
    price_display: string;
    currency: string;
    customer_name: string;
  };
  locale: string | null;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        {t(locale, 'Buchungsdetails', 'Randevu Detayları', 'Booking Details')}
      </h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-text-muted">{t(locale, 'Service', 'Hizmet', 'Service')}</span>
        <span className="font-medium">{info.service_name}</span>

        <span className="text-text-muted">{t(locale, 'Datum', 'Tarih', 'Date')}</span>
        <span className="font-medium">{info.appointment_date}</span>

        {info.appointment_time && (
          <>
            <span className="text-text-muted">{t(locale, 'Uhrzeit', 'Saat', 'Time')}</span>
            <span className="font-medium">{info.appointment_time}</span>
          </>
        )}

        <span className="text-text-muted">{t(locale, 'Kunde', 'Müşteri', 'Customer')}</span>
        <span className="font-medium">{info.customer_name}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-bg-card p-3">
        <span className="text-sm text-text-secondary">{t(locale, 'Gesamtbetrag', 'Toplam', 'Total')}</span>
        <span className="text-lg font-bold text-brand">
          {info.price_display || `${info.price.toFixed(2)} ${info.currency}`}
        </span>
      </div>
    </div>
  );
}
