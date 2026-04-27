'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { useGetMyOrderQuery, useInitIyzicoPaymentMutation } from '@/integrations/rtk/hooks';
import { useAuthStore } from '@/features/auth/auth.store';
import Banner from '@/layout/banner/Breadcrum';

const TEXTS: Record<string, Record<string, string>> = {
  de: {
    banner: 'Bezahlung',
    loading: 'Bestellung wird geladen…',
    notFound: 'Bestellung nicht gefunden.',
    backHome: 'Zurück zur Startseite',
    orderNumber: 'Bestellnr.',
    total: 'Gesamtbetrag',
    status: 'Status',
    paymentStatus: 'Zahlungsstatus',
    items: 'Positionen',
    payNow: 'Jetzt bezahlen',
    redirecting: 'Weiterleitung zur Zahlungsseite…',
    paymentError: 'Zahlung konnte nicht gestartet werden. Bitte versuchen Sie es erneut.',
    alreadyPaid: 'Diese Bestellung ist bereits bezahlt.',
    loginRequired: 'Bitte melden Sie sich an, um fortzufahren.',
    login: 'Anmelden',
  },
  tr: {
    banner: 'Odeme',
    loading: 'Siparis yukleniyor…',
    notFound: 'Siparis bulunamadi.',
    backHome: 'Ana Sayfaya Don',
    orderNumber: 'Siparis No',
    total: 'Toplam',
    status: 'Durum',
    paymentStatus: 'Odeme Durumu',
    items: 'Kalemler',
    payNow: 'Simdi Ode',
    redirecting: 'Odeme sayfasina yonlendiriliyor…',
    paymentError: 'Odeme baslatılamadı. Lutfen tekrar deneyin.',
    alreadyPaid: 'Bu siparis zaten odenmis.',
    loginRequired: 'Devam etmek icin giris yapin.',
    login: 'Giris Yap',
  },
  en: {
    banner: 'Checkout',
    loading: 'Loading order…',
    notFound: 'Order not found.',
    backHome: 'Back to Home',
    orderNumber: 'Order No.',
    total: 'Total',
    status: 'Status',
    paymentStatus: 'Payment Status',
    items: 'Items',
    payNow: 'Pay Now',
    redirecting: 'Redirecting to payment page…',
    paymentError: 'Payment could not be initiated. Please try again.',
    alreadyPaid: 'This order has already been paid.',
    loginRequired: 'Please log in to continue.',
    login: 'Log In',
  },
};

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

export default function CheckoutPage() {
  const locale = useLocaleShort() || 'de';
  const t = TEXTS[locale] ?? TEXTS['de'];
  const params = useParams();
  const orderId = params.orderId as string;
  const { isAuthenticated } = useAuthStore();

  const { data: order, isLoading, isError } = useGetMyOrderQuery(
    { id: orderId },
    { skip: !orderId || !isAuthenticated },
  );

  const [initIyzico] = useInitIyzicoPaymentMutation();
  const [payState, setPayState] = useState<'idle' | 'redirecting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handlePay() {
    if (!order) return;
    setPayState('redirecting');
    try {
      const res = await initIyzico({ orderId: order.id, locale }).unwrap();
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        setPayState('error');
        setErrorMsg(t.paymentError);
      }
    } catch (err: any) {
      setPayState('error');
      setErrorMsg(err?.data?.error || t.paymentError);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Banner title={t.banner} />
        <section className="flex min-h-[50vh] items-center justify-center px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-text-muted">{t.loginRequired}</p>
            <Link
              href={localizePath(locale, '/login')}
              className="inline-block rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-text-on-dark hover:bg-brand-hover transition-colors"
            >
              {t.login}
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Banner title={t.banner} />
        <section className="flex min-h-[50vh] items-center justify-center px-4 py-20">
          <p className="text-text-muted">{t.loading}</p>
        </section>
      </>
    );
  }

  if (isError || !order) {
    return (
      <>
        <Banner title={t.banner} />
        <section className="flex min-h-[50vh] items-center justify-center px-4 py-20">
          <div className="text-center">
            <p className="mb-4 text-text-muted">{t.notFound}</p>
            <Link
              href={localizePath(locale, '/')}
              className="inline-block rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-text-on-dark hover:bg-brand-hover transition-colors"
            >
              {t.backHome}
            </Link>
          </div>
        </section>
      </>
    );
  }

  const isPaid = order.payment_status === 'paid';

  return (
    <>
      <Banner title={t.banner} />
      <section className="bg-bg-primary py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="border border-border-light bg-bg-card p-6 shadow-sm space-y-6">
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.orderNumber}</span>
                <span className="font-mono">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.status}</span>
                <span>{order.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.paymentStatus}</span>
                <span className={isPaid ? 'text-success font-medium' : ''}>{order.payment_status}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{t.total}</span>
                <span>{money(order.total_amount, order.currency)}</span>
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text-secondary">{t.items}</h3>
                <div className="divide-y divide-sand-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 text-sm">
                      <span>
                        {item.title}
                        {item.quantity > 1 && <span className="text-text-muted"> x{item.quantity}</span>}
                      </span>
                      <span className="font-medium">
                        {money(Number(item.price) * item.quantity, item.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pay Button or Already Paid */}
            {isPaid ? (
              <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center text-success font-medium">
                {t.alreadyPaid}
              </div>
            ) : (
              <div className="space-y-3">
                {payState === 'error' && (
                  <div className="rounded-lg bg-error/5 border border-error/30 p-3 text-center text-error text-sm">
                    {errorMsg}
                  </div>
                )}

                {payState === 'redirecting' ? (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                    <span className="text-text-muted">{t.redirecting}</span>
                  </div>
                ) : (
                  <button
                    onClick={handlePay}
                    className="w-full rounded-lg bg-brand-primary px-6 py-3 text-center font-semibold text-text-on-dark hover:bg-brand-hover transition-colors"
                  >
                    {t.payNow}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
