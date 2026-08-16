'use client';
// =============================================================
// FILE: src/app/(main)/admin/(admin)/payment-settings/page.tsx
// Ödeme Ayarları — aktif sağlayıcı Stripe (kart) + PayPal.
//
// NEDEN ANAHTAR ALANI YOK: Stripe secret'ı ve webhook secret'ı YALNIZ env'de
// tutulur (fail-closed kural). Panelden yazılabilseydi secret DB'ye düşerdi.
// Bu sayfa bu yüzden "durum göstergesi"dir: neyin tanımlı olduğunu söyler,
// değerini asla göstermez.
//
// Iyzico kaldırıldı (2026-08-16): gateway satırı pasif, kod yolu ölü.
// =============================================================

import * as React from 'react';
import { RefreshCcw, CreditCard, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useGetPaymentProviderStatusAdminQuery } from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gm-border-soft/60 last:border-0">
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <div className="text-sm text-gm-text">{label}</div>
        {hint ? <div className="text-[11px] text-gm-muted mt-0.5 break-all">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function PaymentSettingsPage() {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const { data, isLoading, isFetching, refetch } = useGetPaymentProviderStatusAdminQuery();
  const busy = isLoading || isFetching;

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gm-gold" />
              {t('admin.siteSettings.api.paymentSection', null, 'Ödeme Ayarları (Stripe + PayPal)')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t(
                'admin.siteSettings.api.paymentDesc',
                null,
                'Anahtarlar sunucu ortam değişkenlerinde tutulur; panelden düzenlenmez. Burada yalnız durum görünür.',
              )}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={busy}
            className="shrink-0 rounded-2xl border-gm-border-soft text-gm-muted hover:text-gm-text"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {busy && !data ? (
          <div className="text-sm text-gm-muted">{t('admin.common.loading', null, 'Yükleniyor…')}</div>
        ) : null}

        {data ? (
          <>
            <section>
              <h3 className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase mb-2">Stripe</h3>
              <StatusRow
                ok={data.stripe.secret_key_configured}
                label={
                  data.stripe.secret_key_configured
                    ? 'STRIPE_SECRET_KEY tanımlı — ödeme başlatılabilir'
                    : 'STRIPE_SECRET_KEY TANIMLI DEĞİL — ödeme başlatılamaz'
                }
              />
              <StatusRow
                ok={data.stripe.webhook_secret_configured}
                label={
                  data.stripe.webhook_secret_configured
                    ? 'STRIPE_WEBHOOK_SECRET tanımlı — ödeme onayı işlenebilir'
                    : 'STRIPE_WEBHOOK_SECRET TANIMLI DEĞİL — ödeme onayı işlenemez'
                }
                hint={data.stripe.webhook_url}
              />
              <StatusRow ok label="Ödeme bildirimi e-postası" hint={data.stripe.notify_email} />
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase mb-2">PayPal</h3>
              <div className="flex items-start gap-3 py-3">
                <Info className="w-5 h-5 text-gm-gold shrink-0 mt-0.5" />
                <div className="text-sm text-gm-text">
                  PayPal ayrı bir entegrasyon değildir; Stripe ödeme sayfasında bir ödeme yöntemi olarak çıkar.
                  <div className="text-[11px] text-gm-muted mt-1">{data.paypal.note}</div>
                  <div className="text-[11px] text-gm-muted mt-1">
                    Geçerli para birimi: <span className="font-mono">{data.paypal.current_currency}</span> ·{' '}
                    {data.paypal.currency_eligible ? 'PayPal sunulabilir' : 'PayPal sunulamaz'}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase mb-2">
                {t('admin.siteSettings.api.gatewaysTitle', null, 'Kayıtlı sağlayıcılar')}
              </h3>
              <div className="space-y-2">
                {data.gateways.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-2xl border border-gm-border-soft px-4 py-3"
                  >
                    <div className="text-sm text-gm-text">
                      {g.name} <span className="text-gm-muted font-mono text-[11px]">({g.slug})</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                        g.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gm-muted/10 text-gm-muted'
                      }`}
                    >
                      {g.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
