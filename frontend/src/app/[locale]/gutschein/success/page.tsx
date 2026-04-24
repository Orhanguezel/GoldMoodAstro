'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCaptureGutscheinPaypalMutation } from '@/integrations/rtk/hooks';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import { BASE_URL } from '@/integrations/rtk/constants';

function tl(locale: string, key: string): string {
  const dict: Record<string, Record<string, string>> = {
    de: {
      processing: 'Zahlung wird verarbeitet…',
      successTitle: 'Gutschein erfolgreich aktiviert!',
      successBody: 'Ihr Gutschein ist jetzt aktiv. Der Code wurde an Ihre E-Mail-Adresse gesendet.',
      code: 'Gutschein-Code',
      backHome: 'Zur Startseite',
      buyMore: 'Weiteren Gutschein kaufen',
      print: 'Gutschein drucken / als PDF speichern',
      errorTitle: 'Zahlung fehlgeschlagen',
      errorBody: 'Die Zahlung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
      retry: 'Erneut versuchen',
    },
    tr: {
      processing: 'Ödeme işleniyor…',
      successTitle: 'Hediye çeki başarıyla etkinleştirildi!',
      successBody: 'Hediye çekiniz artık aktif. Kod e-posta adresinize gönderildi.',
      code: 'Hediye Çeki Kodu',
      backHome: 'Ana Sayfaya Dön',
      buyMore: 'Başka Bir Çek Al',
      print: 'Hediye çekini yazdır / PDF olarak kaydet',
      errorTitle: 'Ödeme Başarısız',
      errorBody: 'Ödeme tamamlanamadı. Lütfen tekrar deneyin.',
      retry: 'Tekrar Dene',
    },
    en: {
      processing: 'Processing payment…',
      successTitle: 'Gift voucher activated!',
      successBody: 'Your gift voucher is now active. The code has been sent to your e-mail.',
      code: 'Voucher Code',
      backHome: 'Back to Home',
      buyMore: 'Buy Another Voucher',
      print: 'Print voucher / Save as PDF',
      errorTitle: 'Payment Failed',
      errorBody: 'The payment could not be completed. Please try again.',
      retry: 'Try Again',
    },
  };
  return (dict[locale] ?? dict['de'])[key] ?? key;
}

export default function GutscheinSuccessPage() {
  const locale = useLocaleShort() || 'de';
  const params = useSearchParams();
  const id = params.get('id');
  const orderId = params.get('token'); // PayPal returns ?token=ORDER_ID

  const [capture, { isLoading }] = useCaptureGutscheinPaypalMutation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [code, setCode] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!id || !orderId || calledRef.current) return;
    calledRef.current = true;

    capture({ id, order_id: orderId })
      .unwrap()
      .then((res) => {
        setCode(res.code);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [id, orderId, capture]);

  const gutscheinPath = localizePath(locale, '/gutschein');
  const homePath = localizePath(locale, '/');

  if (!id || !orderId) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-24">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 text-5xl">📬</div>
          <h1 className="mb-3 text-2xl font-bold text-text-primary">{tl(locale, 'successTitle')}</h1>
          <p className="mb-8 text-text-muted">{tl(locale, 'successBody')}</p>
          <Link
            href={homePath}
            className="inline-block rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            {tl(locale, 'backHome')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-24">
      <div className="mx-auto max-w-md text-center">
        {(status === 'processing' || isLoading) && (
          <>
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto" />
            <p className="text-text-muted">{tl(locale, 'processing')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-5xl">🎁</div>
            <h1 className="mb-3 text-2xl font-bold text-text-primary">{tl(locale, 'successTitle')}</h1>
            <p className="mb-4 text-text-muted">{tl(locale, 'successBody')}</p>
            {code && (
              <div className="mb-8 border border-border-light bg-bg-card-hover px-6 py-4">
                <p className="text-xs text-text-muted mb-1">{tl(locale, 'code')}</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-brand-primary">{code}</p>
              </div>
            )}
            {id && (
              <button
                type="button"
                onClick={() => {
                  const printUrl = `${BASE_URL}/gutscheins/${encodeURIComponent(id)}/print`;
                  window.open(printUrl, '_blank', 'width=700,height=900');
                }}
                className="mb-4 w-full rounded-lg border-2 border-dashed border-brand-primary/30 px-5 py-3 text-sm font-medium text-brand-primary hover:bg-brand-primary/5 transition-colors"
              >
                🖨️ {tl(locale, 'print')}
              </button>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={homePath}
                className="rounded-lg border border-border-light px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-card-hover transition-colors"
              >
                {tl(locale, 'backHome')}
              </Link>
              <Link
                href={gutscheinPath}
                className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
              >
                {tl(locale, 'buyMore')}
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-5xl">❌</div>
            <h1 className="mb-3 text-2xl font-bold text-text-primary">{tl(locale, 'errorTitle')}</h1>
            <p className="mb-8 text-text-muted">{tl(locale, 'errorBody')}</p>
            <Link
              href={gutscheinPath}
              className="inline-block rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
            >
              {tl(locale, 'retry')}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
