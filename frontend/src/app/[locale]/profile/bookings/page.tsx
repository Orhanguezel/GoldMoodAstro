'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { useListMyOrdersQuery } from '@/integrations/rtk/public/orders.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { localizePath } from '@/integrations/shared';
import type { OrderView } from '@/integrations/shared';

const STATUS_LABELS: Record<string, Record<string, string>> = {
  tr: { new: 'Yeni', confirmed: 'Onaylı', completed: 'Tamamlandı', cancelled: 'İptal', pending: 'Bekliyor' },
  en: { new: 'New', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', pending: 'Pending' },
};

const PAY_LABELS: Record<string, Record<string, string>> = {
  tr: { unpaid: 'Ödenmedi', paid: 'Ödendi', failed: 'Başarısız', refunded: 'İade' },
  en: { unpaid: 'Unpaid', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' },
};

function money(v: string | number, currency = 'TRY') {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY', minimumFractionDigits: 0 }).format(n);
}

function OrderCard({ order, locale }: { order: OrderView; locale: string }) {
  const statusLabel = STATUS_LABELS[locale]?.[order.status] ?? order.status;
  const payLabel = PAY_LABELS[locale]?.[order.payment_status] ?? order.payment_status;
  const isPaid = order.payment_status === 'paid';

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-brand-primary/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-text-muted">#{order.order_number}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            {payLabel}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-surface text-text-muted">
            {statusLabel}
          </span>
        </div>
        <p className="text-text font-medium text-sm truncate">
          {money(order.total_amount, order.currency)}
        </p>
        {order.created_at && (
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(order.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB')}
          </p>
        )}
      </div>
      {!isPaid && (
        <Link
          href={localizePath(locale, `/checkout/${order.id}`)}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-brand-primary text-white text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          {locale === 'tr' ? 'Öde' : 'Pay'}
          <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

export default function ProfileBookingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { isAuthenticated } = useAuthStore();

  const { data: orders = [], isLoading, isError } = useListMyOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  const t = {
    tr: {
      title: 'Randevularım',
      desc: 'Geçmiş ve bekleyen randevularınız',
      empty: 'Henüz randevunuz yok.',
      cta: 'Danışman Bul',
      loading: 'Yükleniyor...',
      loginRequired: 'Randevuları görmek için giriş yapın.',
      login: 'Giriş Yap',
    },
    en: {
      title: 'My Bookings',
      desc: 'Your past and upcoming sessions',
      empty: 'You have no bookings yet.',
      cta: 'Find a Consultant',
      loading: 'Loading...',
      loginRequired: 'Log in to see your bookings.',
      login: 'Log In',
    },
  };

  const copy = t[locale as keyof typeof t] ?? t.tr;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-sm">
          <User size={48} className="mx-auto mb-4 text-text-muted" strokeWidth={1} />
          <p className="text-text-muted mb-6">{copy.loginRequired}</p>
          <Link
            href={localizePath(locale, '/login')}
            className="inline-block px-6 py-3 rounded-full bg-brand-primary text-white font-medium hover:opacity-90 transition-opacity"
          >
            {copy.login}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-20 px-4" style={{ padding: '5rem 4%' }}>
      <div className="max-w-[640px] mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-text mb-1">{copy.title}</h1>
          <p className="text-text-muted text-sm">{copy.desc}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-card border border-border rounded-2xl p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-text-muted">
            {locale === 'tr' ? 'Randevular yüklenemedi.' : 'Could not load bookings.'}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto mb-4 text-text-muted" strokeWidth={1} />
            <p className="text-text-muted mb-6">{copy.empty}</p>
            <Link
              href={localizePath(locale, '/consultants')}
              className="inline-block px-6 py-3 rounded-full bg-brand-primary text-white font-medium hover:opacity-90 transition-opacity"
            >
              {copy.cta}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
