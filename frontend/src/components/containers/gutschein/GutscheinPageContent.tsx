'use client';

import React, { useState, useCallback } from 'react';
import {
  useListGutscheinProductsQuery,
  usePurchaseGutscheinMutation,
  useCheckGutscheinCodeMutation,
  useRedeemGutscheinMutation,
} from '@/integrations/rtk/hooks';
import type { GutscheinProductDto, CheckGutscheinResp } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';

// ── i18n ──────────────────────────────────────────────────────────────────────

function tl(locale: string, key: string): string {
  const dict: Record<string, Record<string, string>> = {
    de: {
      title: 'Gutscheine',
      subtitle: 'Verschenken Sie Entspannung und Wohlbefinden — für jeden Anlass.',
      validity: 'Gültig {n} Tage',
      buyBtn: 'Jetzt kaufen',
      formTitle: 'Gutschein bestellen',
      purchaserName: 'Ihr Name',
      purchaserEmail: 'Ihre E-Mail',
      recipientName: 'Name des Empfängers (optional)',
      recipientEmail: 'E-Mail des Empfängers (optional)',
      message: 'Persönliche Nachricht (optional)',
      submitBtn: 'Weiter zur Zahlung',
      cancel: 'Abbrechen',
      paypalHint: 'Sie werden zu PayPal weitergeleitet, um die Zahlung abzuschließen.',
      errorRequired: 'Pflichtfeld',
      errorEmail: 'Ungültige E-Mail-Adresse',
      errorAmount: 'Betrag zwischen 5 und 5.000 €',
      noProducts: 'Derzeit sind keine Gutscheine verfügbar.',
      purchaseError: 'Der Kauf konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut.',
      purchasePaypalRestricted: 'Die Zahlung ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns.',
      purchasePaypalFailed: 'Die Verbindung zum Zahlungsanbieter konnte nicht hergestellt werden. Bitte versuchen Sie es erneut.',
      purchaseProductNotFound: 'Der gewählte Gutschein ist nicht mehr verfügbar.',
      purchaseValidation: 'Bitte überprüfen Sie Ihre Eingaben.',
      customTitle: 'Wunschbetrag',
      customDesc: 'Geben Sie Ihren gewünschten Betrag ein (5 – 5.000 €).',
      customAmountLabel: 'Betrag (€)',
      customAmountPh: 'z.B. 75',
      redeemTitle: 'Gutschein einlösen',
      redeemSubtitle: 'Haben Sie einen Gutschein-Code? Geben Sie ihn hier ein, um Ihr Guthaben zu aktivieren.',
      redeemCode: 'Gutschein-Code',
      redeemCodePh: 'KM-XXXX-XXXX',
      redeemCheck: 'Prüfen',
      redeemBtn: 'Jetzt einlösen',
      redeemSuccess: 'Gutschein erfolgreich eingelöst!',
      redeemValue: 'Wert: {v}',
      redeemStatus: 'Status',
      redeemExpires: 'Gültig bis',
      redeemRecipient: 'Empfänger',
      redeemNotFound: 'Gutschein nicht gefunden.',
      redeemInvalid: 'Ungültiger Code.',
      redeemNotActive: 'Dieser Gutschein ist nicht einlösbar.',
      redeemExpired: 'Dieser Gutschein ist abgelaufen.',
      redeemLoginHint: 'Bitte melden Sie sich an, um diesen Gutschein einzulösen.',
      redeemLogin: 'Anmelden',
      redeemReset: 'Neuen Code eingeben',
    },
    tr: {
      title: 'Hediye Çekleri',
      subtitle: 'Sevdiklerinize rahatlama ve huzur hediye edin — her özel gün için.',
      validity: '{n} gün geçerli',
      buyBtn: 'Satın Al',
      formTitle: 'Hediye Çeki Satın Al',
      purchaserName: 'Adınız',
      purchaserEmail: 'E-posta adresiniz',
      recipientName: 'Alıcı adı (isteğe bağlı)',
      recipientEmail: 'Alıcı e-postası (isteğe bağlı)',
      message: 'Kişisel mesaj (isteğe bağlı)',
      submitBtn: 'Ödemeye Devam Et',
      cancel: 'İptal',
      paypalHint: 'Ödemeyi tamamlamak için PayPal\'a yönlendirileceksiniz.',
      errorRequired: 'Bu alan zorunludur',
      errorEmail: 'Geçersiz e-posta adresi',
      errorAmount: 'Tutar 5 ile 5.000 € arasında olmalıdır',
      noProducts: 'Şu anda hediye çeki bulunmamaktadır.',
      purchaseError: 'Satın alma işlemi tamamlanamadı. Lütfen daha sonra tekrar deneyin.',
      purchasePaypalRestricted: 'Ödeme şu anda kullanılamamaktadır. Lütfen daha sonra tekrar deneyin veya bizimle iletişime geçin.',
      purchasePaypalFailed: 'Ödeme sağlayıcısına bağlanılamadı. Lütfen tekrar deneyin.',
      purchaseProductNotFound: 'Seçilen hediye çeki artık mevcut değil.',
      purchaseValidation: 'Lütfen bilgilerinizi kontrol edin.',
      customTitle: 'Özel Tutar',
      customDesc: 'İstediğiniz tutarı girin (5 – 5.000 €).',
      customAmountLabel: 'Tutar (€)',
      customAmountPh: 'örn. 75',
      redeemTitle: 'Hediye Çeki Kullan',
      redeemSubtitle: 'Hediye çeki kodunuz mu var? Bakiyenizi etkinleştirmek için buraya girin.',
      redeemCode: 'Hediye çeki kodu',
      redeemCodePh: 'KM-XXXX-XXXX',
      redeemCheck: 'Kontrol Et',
      redeemBtn: 'Şimdi Kullan',
      redeemSuccess: 'Hediye çeki başarıyla kullanıldı!',
      redeemValue: 'Değer: {v}',
      redeemStatus: 'Durum',
      redeemExpires: 'Son kullanma',
      redeemRecipient: 'Alıcı',
      redeemNotFound: 'Hediye çeki bulunamadı.',
      redeemInvalid: 'Geçersiz kod.',
      redeemNotActive: 'Bu hediye çeki kullanılamaz.',
      redeemExpired: 'Bu hediye çekinin süresi dolmuş.',
      redeemLoginHint: 'Bu hediye çekini kullanmak için lütfen giriş yapın.',
      redeemLogin: 'Giriş Yap',
      redeemReset: 'Yeni kod gir',
    },
    en: {
      title: 'Gift Vouchers',
      subtitle: 'Give the gift of relaxation and well-being — perfect for any occasion.',
      validity: 'Valid for {n} days',
      buyBtn: 'Buy Now',
      formTitle: 'Order Gift Voucher',
      purchaserName: 'Your name',
      purchaserEmail: 'Your e-mail',
      recipientName: 'Recipient name (optional)',
      recipientEmail: 'Recipient e-mail (optional)',
      message: 'Personal message (optional)',
      submitBtn: 'Proceed to Payment',
      cancel: 'Cancel',
      paypalHint: 'You will be redirected to PayPal to complete the payment.',
      errorRequired: 'Required field',
      errorEmail: 'Invalid e-mail address',
      errorAmount: 'Amount must be between 5 and 5,000 €',
      noProducts: 'No gift vouchers are currently available.',
      purchaseError: 'The purchase could not be completed. Please try again later.',
      purchasePaypalRestricted: 'Payment is currently unavailable. Please try again later or contact us.',
      purchasePaypalFailed: 'Could not connect to the payment provider. Please try again.',
      purchaseProductNotFound: 'The selected gift voucher is no longer available.',
      purchaseValidation: 'Please check your details.',
      customTitle: 'Custom Amount',
      customDesc: 'Enter your desired amount (5 – 5,000 €).',
      customAmountLabel: 'Amount (€)',
      customAmountPh: 'e.g. 75',
      redeemTitle: 'Redeem Gift Card',
      redeemSubtitle: 'Have a gift card code? Enter it here to activate your balance.',
      redeemCode: 'Gift card code',
      redeemCodePh: 'KM-XXXX-XXXX',
      redeemCheck: 'Check',
      redeemBtn: 'Redeem Now',
      redeemSuccess: 'Gift card redeemed successfully!',
      redeemValue: 'Value: {v}',
      redeemStatus: 'Status',
      redeemExpires: 'Expires',
      redeemRecipient: 'Recipient',
      redeemNotFound: 'Gift card not found.',
      redeemInvalid: 'Invalid code.',
      redeemNotActive: 'This gift card is not redeemable.',
      redeemExpired: 'This gift card has expired.',
      redeemLoginHint: 'Please log in to redeem this gift card.',
      redeemLogin: 'Log In',
      redeemReset: 'Enter new code',
    },
  };
  return (dict[locale] ?? dict['de'])[key] ?? key;
}

const LOCALE_MAP: Record<string, string> = { de: 'de-DE', tr: 'tr-TR', en: 'en-US' };

function fmt(value: string | number, currency: string, locale = 'de') {
  const intlLocale = LOCALE_MAP[locale] ?? 'de-DE';
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(Number(value));
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SelectedProduct =
  | { type: 'fixed'; product: GutscheinProductDto }
  | { type: 'custom' };

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  locale,
  onSelect,
}: {
  product: GutscheinProductDto;
  locale: string;
  onSelect: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border border-border-light bg-bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold leading-tight text-text-primary">{product.name}</h3>
        <span className="shrink-0 rounded-full bg-brand-primary px-3 py-1 text-sm font-bold text-white">
          {fmt(product.value, product.currency, locale)}
        </span>
      </div>
      {product.description && (
        <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>
      )}
      <p className="text-xs text-text-muted">
        {tl(locale, 'validity').replace('{n}', String(product.validity_days))}
      </p>
      <button
        type="button"
        onClick={onSelect}
        className="mt-auto rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:scale-95"
      >
        {tl(locale, 'buyBtn')}
      </button>
    </div>
  );
}

function CustomAmountCard({ locale, onSelect }: { locale: string; onSelect: () => void }) {
  return (
    <div className="flex flex-col gap-4 border border-dashed border-brand-primary/40 bg-bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold leading-tight text-text-primary">{tl(locale, 'customTitle')}</h3>
        <span className="shrink-0 rounded-full bg-brand-light border border-brand-primary/40 px-3 py-1 text-sm font-light text-text-primary">
          ✦
        </span>
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{tl(locale, 'customDesc')}</p>
      <p className="text-xs text-text-muted">
        {tl(locale, 'validity').replace('{n}', '365')}
      </p>
      <button
        type="button"
        onClick={onSelect}
        className="mt-auto rounded-lg border border-brand-primary bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white active:scale-95"
      >
        {tl(locale, 'buyBtn')}
      </button>
    </div>
  );
}

// ── Form fields ───────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-medium bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Purchase Modal ────────────────────────────────────────────────────────────

type FormState = {
  purchaser_name: string;
  purchaser_email: string;
  recipient_name: string;
  recipient_email: string;
  personal_message: string;
  custom_amount: string;
};

const EMPTY: FormState = {
  purchaser_name: '',
  purchaser_email: '',
  recipient_name: '',
  recipient_email: '',
  personal_message: '',
  custom_amount: '',
};

function PurchaseModal({
  selected,
  locale,
  onClose,
}: {
  selected: SelectedProduct;
  locale: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [purchase, { isLoading }] = usePurchaseGutscheinMutation();

  const isCustom = selected.type === 'custom';
  const fixedProduct = selected.type === 'fixed' ? selected.product : null;

  const displayLabel = fixedProduct
    ? `${fixedProduct.name} — ${fmt(fixedProduct.value, fixedProduct.currency, locale)}`
    : tl(locale, 'customTitle');

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.purchaser_name.trim()) e.purchaser_name = tl(locale, 'errorRequired');
    if (!form.purchaser_email.trim()) {
      e.purchaser_email = tl(locale, 'errorRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.purchaser_email)) {
      e.purchaser_email = tl(locale, 'errorEmail');
    }
    if (form.recipient_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipient_email)) {
      e.recipient_email = tl(locale, 'errorEmail');
    }
    if (isCustom) {
      const n = parseFloat(form.custom_amount.replace(',', '.'));
      if (isNaN(n) || n < 5 || n > 5000) e.custom_amount = tl(locale, 'errorAmount');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError('');

    try {
      const body = isCustom
        ? {
            custom_value: parseFloat(form.custom_amount.replace(',', '.')),
            custom_currency: 'EUR',
            purchaser_name: form.purchaser_name.trim(),
            purchaser_email: form.purchaser_email.trim(),
            recipient_name: form.recipient_name.trim() || null,
            recipient_email: form.recipient_email.trim() || null,
            personal_message: form.personal_message.trim() || null,
          }
        : {
            product_id: fixedProduct!.id,
            purchaser_name: form.purchaser_name.trim(),
            purchaser_email: form.purchaser_email.trim(),
            recipient_name: form.recipient_name.trim() || null,
            recipient_email: form.recipient_email.trim() || null,
            personal_message: form.personal_message.trim() || null,
          };

      const res = await purchase({ ...body, locale }).unwrap();

      if (res.paypal?.approve_url) {
        window.location.href = res.paypal.approve_url;
      } else {
        window.location.href = `/${locale}/gutschein/success?id=${res.gutschein_id}`;
      }
    } catch (err: any) {
      const code = err?.data?.error ?? err?.data?.error?.code ?? '';
      const msg = err?.data?.message ?? '';
      if (code === 'paypal_order_failed' && msg.includes('PAYEE_ACCOUNT_RESTRICTED')) {
        setSubmitError(tl(locale, 'purchasePaypalRestricted'));
      } else if (code === 'paypal_order_failed') {
        setSubmitError(tl(locale, 'purchasePaypalFailed'));
      } else if (code === 'product_not_found') {
        setSubmitError(tl(locale, 'purchaseProductNotFound'));
      } else if (code === 'validation_error') {
        setSubmitError(tl(locale, 'purchaseValidation'));
      } else {
        setSubmitError(tl(locale, 'purchaseError'));
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-bg-card p-6 shadow-medium max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{tl(locale, 'formTitle')}</h2>
            <p className="text-sm text-text-muted">{displayLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom amount input */}
          {isCustom && (
            <Field
              label={tl(locale, 'customAmountLabel')}
              value={form.custom_amount}
              onChange={(v) => set('custom_amount', v)}
              error={errors.custom_amount}
              placeholder={tl(locale, 'customAmountPh')}
              required
            />
          )}

          {/* Purchaser */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tl(locale, 'purchaserName')}
              value={form.purchaser_name}
              onChange={(v) => set('purchaser_name', v)}
              error={errors.purchaser_name}
              required
            />
            <Field
              label={tl(locale, 'purchaserEmail')}
              value={form.purchaser_email}
              type="email"
              onChange={(v) => set('purchaser_email', v)}
              error={errors.purchaser_email}
              required
            />
          </div>

          {/* Recipient */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tl(locale, 'recipientName')}
              value={form.recipient_name}
              onChange={(v) => set('recipient_name', v)}
            />
            <Field
              label={tl(locale, 'recipientEmail')}
              value={form.recipient_email}
              type="email"
              onChange={(v) => set('recipient_email', v)}
              error={errors.recipient_email}
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-primary">{tl(locale, 'message')}</label>
            <textarea
              value={form.personal_message}
              onChange={(e) => set('personal_message', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border-medium bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <p className="text-xs text-text-muted">{tl(locale, 'paypalHint')}</p>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-card-hover transition-colors"
            >
              {tl(locale, 'cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {isLoading ? '...' : tl(locale, 'submitBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Redeem Section ───────────────────────────────────────────────────────────

function GutscheinRedeemSection({ locale }: { locale: string }) {
  const { isAuthenticated } = useAuthStore();
  const [checkGutschein, { isLoading: isChecking }] = useCheckGutscheinCodeMutation();
  const [redeemGutschein, { isLoading: isRedeeming }] = useRedeemGutscheinMutation();

  const [code, setCode] = useState('');
  const [checked, setChecked] = useState<CheckGutscheinResp | null>(null);
  const [error, setError] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [redeemedValue, setRedeemedValue] = useState('');

  const handleCheck = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setError('');
    setChecked(null);
    setRedeemed(false);
    try {
      const resp = await checkGutschein({ code: c }).unwrap();
      setChecked(resp);
      if (resp.status !== 'active') {
        if (resp.status === 'redeemed') setError(tl(locale, 'redeemNotActive'));
        else if (resp.status === 'expired') setError(tl(locale, 'redeemExpired'));
        else setError(tl(locale, 'redeemNotActive'));
      }
    } catch (err: any) {
      const reason = err?.data?.error;
      if (reason === 'gutschein_not_found') setError(tl(locale, 'redeemNotFound'));
      else setError(tl(locale, 'redeemInvalid'));
    }
  }, [code, locale, checkGutschein]);

  const handleRedeem = useCallback(async () => {
    if (!checked || checked.status !== 'active') return;
    setError('');
    try {
      const resp = await redeemGutschein({ code: checked.code }).unwrap();
      setRedeemed(true);
      setRedeemedValue(`${resp.value} ${resp.currency}`);
    } catch (err: any) {
      const reason = err?.data?.error;
      if (reason === 'gutschein_expired') setError(tl(locale, 'redeemExpired'));
      else if (reason === 'gutschein_not_redeemable') setError(tl(locale, 'redeemNotActive'));
      else setError(tl(locale, 'redeemInvalid'));
    }
  }, [checked, locale, redeemGutschein]);

  const handleReset = useCallback(() => {
    setCode('');
    setChecked(null);
    setError('');
    setRedeemed(false);
    setRedeemedValue('');
  }, []);

  const busy = isChecking || isRedeeming;

  return (
    <section className="py-16 bg-brand-light/30">
      <div className="container mx-auto max-w-xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">{tl(locale, 'redeemTitle')}</h2>
          <p className="mt-2 text-sm text-text-muted">{tl(locale, 'redeemSubtitle')}</p>
        </div>

        <div className="border bg-bg-card p-6 shadow-sm space-y-4">
          {redeemed ? (
            <div className="text-center space-y-3">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold text-green-800">{tl(locale, 'redeemSuccess')}</p>
              <p className="text-sm text-green-600">
                {tl(locale, 'redeemValue').replace('{v}', redeemedValue)}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-sm text-brand-primary hover:underline"
              >
                {tl(locale, 'redeemReset')}
              </button>
            </div>
          ) : (
            <>
              {/* Code input */}
              {!checked && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={tl(locale, 'redeemCodePh')}
                    className="flex-1 rounded-lg border border-border-medium px-3 py-2.5 text-sm uppercase placeholder:normal-case focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    disabled={busy}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  />
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={busy || !code.trim()}
                    className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 transition disabled:opacity-50"
                  >
                    {isChecking ? '...' : tl(locale, 'redeemCheck')}
                  </button>
                </div>
              )}

              {/* Checked result */}
              {checked && checked.status === 'active' && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-800">{checked.code}</span>
                      <span className="text-lg font-bold text-green-700">
                        {fmt(checked.value, checked.currency, locale)}
                      </span>
                    </div>
                    {checked.expires_at && (
                      <p className="text-xs text-green-600">
                        {tl(locale, 'redeemExpires')}: {new Date(checked.expires_at).toLocaleDateString(LOCALE_MAP[locale] || 'de-DE')}
                      </p>
                    )}
                    {checked.recipient_name && (
                      <p className="text-xs text-green-600">
                        {tl(locale, 'redeemRecipient')}: {checked.recipient_name}
                      </p>
                    )}
                  </div>

                  {!isAuthenticated ? (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-text-secondary">{tl(locale, 'redeemLoginHint')}</p>
                      <a
                        href={`/${locale}/login`}
                        className="inline-block rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors"
                      >
                        {tl(locale, 'redeemLogin')}
                      </a>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-bg-card transition"
                      >
                        {tl(locale, 'cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleRedeem}
                        disabled={busy}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {isRedeeming ? '...' : tl(locale, 'redeemBtn')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Non-active checked result */}
              {checked && checked.status !== 'active' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-brand-primary hover:underline"
                  >
                    {tl(locale, 'redeemReset')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GutscheinPageContent() {
  const locale = useLocaleShort() || 'de';
  const { data: products, isLoading } = useListGutscheinProductsQuery();
  const [selected, setSelected] = useState<SelectedProduct | null>(null);

  return (
    <>
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold md:text-4xl text-text-primary">{tl(locale, 'title')}</h1>
            <p className="mt-3 text-text-muted">{tl(locale, 'subtitle')}</p>
          </div>

          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-bg-card-hover" />
              ))}
            </div>
          )}

          {!isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(products ?? []).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  locale={locale}
                  onSelect={() => setSelected({ type: 'fixed', product: p })}
                />
              ))}
              <CustomAmountCard
                locale={locale}
                onSelect={() => setSelected({ type: 'custom' })}
              />
            </div>
          )}
        </div>

        {selected && (
          <PurchaseModal
            selected={selected}
            locale={locale}
            onClose={() => setSelected(null)}
          />
        )}
      </section>

      <GutscheinRedeemSection locale={locale} />
    </>
  );
}
