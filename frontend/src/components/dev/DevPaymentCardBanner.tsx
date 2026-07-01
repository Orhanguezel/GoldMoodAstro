// =============================================================
// DEV ONLY — Iyzipay sandbox test card details.
// Renders only in NODE_ENV=development. Production builds tree-shake it away.
// Removal: delete this file plus the import and usage lines in ClientLayout.tsx.
// =============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, CreditCard, Copy, Check } from 'lucide-react';

const TEST_CARD = {
  number: '5528790000000008',
  cvc: '123',
  expiry: '12/30',
  holder: 'Test User',
};

// Show on payment-flow pages before the user is redirected to Iyzipay.
// The widget is not visible on Iyzipay's third-party page.
const PAYMENT_PATH_RE = /\/(booking|checkout|odeme|pricing|me\/credits|profile\/bookings)(?:\/|$|\?)/i;

export default function DevPaymentCardBanner() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Client-only render; pathname is empty during SSR, so avoid mismatches.
  useEffect(() => setMounted(true), []);

  // Keep all hooks above this point to preserve hook order.
  if (!mounted) return null;
  if (process.env.NODE_ENV !== 'development') return null;
  if (!PAYMENT_PATH_RE.test(pathname)) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Show test card details"
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-[var(--gm-warning)] hover:bg-[var(--gm-gold-dim)] text-[var(--gm-bg)] shadow-2xl flex items-center justify-center transition-colors"
      >
        <CreditCard size={20} />
      </button>
    );
  }

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--gm-gold-light)]/80 font-mono">{label}</span>
      <button
        type="button"
        onClick={() => copy(label, value)}
        className="flex items-center gap-1.5 font-mono text-[var(--gm-text)] hover:text-[var(--gm-gold-light)] transition-colors"
        title={`Copy ${label}`}
      >
        <span>{value}</span>
        {copied === label ? (
          <Check className="w-3 h-3 text-[var(--gm-success)]" />
        ) : (
          <Copy className="w-3 h-3 opacity-50" />
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-72 rounded-2xl border-2 border-[var(--gm-warning)]/60 bg-gradient-to-br from-[var(--gm-bg-deep)] to-[var(--gm-surface)] shadow-2xl backdrop-blur p-4 text-[var(--gm-text)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-[var(--gm-gold-light)]" />
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--gm-gold-light)]">
            Iyzipay Sandbox · DEV
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[var(--gm-gold-light)]/70 hover:text-[var(--gm-text)] transition-colors"
          title="Hide"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <Row label="Card" value={TEST_CARD.number} />
        <Row label="CVC" value={TEST_CARD.cvc} />
        <Row label="Expiry" value={TEST_CARD.expiry} />
        <Row label="Holder" value={TEST_CARD.holder} />
      </div>

      <p className="mt-3 pt-3 border-t border-[var(--gm-warning)]/30 text-[10px] text-[var(--gm-gold-light)]/70 leading-relaxed">
        Visible only in dev builds. Remove this component before production.
      </p>
    </div>
  );
}
