'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { localizePath } from '@/integrations/shared';
import { normalizeError } from '@/integrations/shared';
import { useLocaleShort } from '@/i18n';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCancelAccountDeletionMutation,
  useExportMyDataMutation,
  useGetAccountDeletionStatusQuery,
  useRequestAccountDeletionMutation,
} from '@/integrations/rtk/hooks';

function formatDate(v: string | undefined, locale: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

import PageContainer from '@/components/common/PageContainer';

export default function ProfilePrivacyPage() {
  const locale = useLocaleShort();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [reason, setReason] = useState('');

  const [getExportData, exportState] = useExportMyDataMutation();
  const [requestDeletion, requestState] = useRequestAccountDeletionMutation();
  const [cancelDeletion, cancelState] = useCancelAccountDeletionMutation();

  const {
    data: deletionStatus,
    isLoading: statusLoading,
    refetch,
  } = useGetAccountDeletionStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const pending = deletionStatus?.status === 'pending';
  const pendingDate = formatDate(deletionStatus?.scheduled_for, locale);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(localizePath(locale, '/login'));
    }
  }, [isAuthenticated, locale, router]);

  async function onExportData() {
    try {
      const payload = await getExportData().unwrap();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const fileName = `goldmoodastro-export-${Date.now()}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Veri dosyanız indirildi.');
    } catch (err) {
      toast.error(normalizeError(err).message || 'Veri dışa aktarma başarısız.');
    }
  }

  async function onRequestDelete(e: React.FormEvent) {
    e.preventDefault();

    if (pending) {
      toast.error('Zaten aktif bir hesap silme talebiniz var.');
      return;
    }

    try {
      await requestDeletion({ reason: reason.trim() || undefined }).unwrap();
      toast.success('Hesap silme talebiniz oluşturuldu. 7 gün içinde iptal edebilirsiniz.');
      setReason('');
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || 'Hesap silme talebi alınamadı.');
    }
  }

  async function onCancelDelete() {
    try {
      await cancelDeletion().unwrap();
      toast.success('Hesap silme talebiniz iptal edildi.');
      await refetch();
    } catch (err) {
      toast.error(normalizeError(err).message || 'Talep iptal edilemedi.');
    }
  }

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl text-(--gm-text) font-serif mb-2">Gizlilik ve Hesap</h1>
        <p className="mb-8 text-(--gm-text-dim)">
          KVKK kapsamında kişisel verileriniz ve hesap güvenliği için işlemler.
        </p>

        <section className="rounded-xl border border-(--gm-border-soft) bg-(--gm-surface) p-5 md:p-8 shadow-(--gm-shadow-soft) space-y-4">
          <h2 className="text-xl font-serif text-(--gm-text)">Verilerimi İndir</h2>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            Hesabınıza ait tüm verilerin JSON halinde hazırlanıp indirilmesini sağlayabilirsiniz.
          </p>
          <button
            onClick={onExportData}
            disabled={exportState.isLoading}
            className="rounded-full bg-(--gm-gold) px-6 py-2.5 text-sm font-bold tracking-widest uppercase text-(--gm-bg-deep) hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {exportState.isLoading ? 'Hazırlanıyor...' : 'Verilerimi İndir'}
          </button>
        </section>

        <section className="mt-8 rounded-xl border border-(--gm-error)/30 bg-(--gm-error)/5 p-5 md:p-8 shadow-(--gm-shadow-soft) space-y-4">
          <h2 className="text-xl font-serif text-(--gm-text)">Hesabımı Sil</h2>
          <p className="text-sm text-(--gm-text-dim) leading-relaxed">
            Hesap silme talebini onayladığınızda 7 gün içinde kalıcı silme gerçekleştirilecektir.
            Bu süre içinde istediğiniz zaman talebinizi iptal edebilirsiniz.
          </p>

          {statusLoading ? (
            <p className="text-sm text-(--gm-text-dim)">Durum kontrol ediliyor...</p>
          ) : pending ? (
            <div className="rounded-xl bg-(--gm-surface) border border-(--gm-error)/30 p-6 space-y-4">
              <p className="text-sm text-(--gm-error) font-bold">
                Aktif hesap silme talebi bulundu.
              </p>
              <p className="text-sm text-(--gm-text-dim)">
                Silme tarihi: <span className="text-(--gm-text) font-medium">{pendingDate}</span>
              </p>
              {deletionStatus?.cooling_off_days ? (
                <p className="text-sm text-(--gm-text-dim)">
                  Soğuma süresi: <strong>{deletionStatus?.cooling_off_days} gün</strong>
                </p>
              ) : null}
              <button
                onClick={onCancelDelete}
                disabled={cancelState.isLoading}
                className="rounded-full bg-(--gm-bg-deep) text-xs px-6 py-2.5 font-bold uppercase tracking-widest text-(--gm-text) border border-(--gm-border-soft) hover:bg-(--gm-surface-high) transition-all disabled:opacity-50"
              >
                {cancelState.isLoading ? 'İptal ediliyor...' : 'Hesap Silme Talebini İptal Et'}
              </button>
            </div>
          ) : (
            <form onSubmit={onRequestDelete} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-(--gm-text)">Silme nedeni (opsiyonel)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-(--gm-border-soft) bg-(--gm-bg-deep) px-4 py-3 text-sm text-(--gm-text) focus:border-(--gm-error)/50 outline-none transition-colors font-serif italic"
                  placeholder="Örn: Hizmetten memnun kalmadım, hesabımı kapatmak istiyorum..."
                  maxLength={500}
                />
              </label>
              <div className="text-[10px] font-bold text-(--gm-muted) tracking-widest uppercase">Maksimum 500 karakter.</div>

              <button
                type="submit"
                disabled={requestState.isLoading}
                className="rounded-full bg-(--gm-error) px-8 py-3 text-sm font-bold tracking-widest uppercase text-(--gm-text) hover:shadow-(--gm-shadow-soft) transition-all disabled:opacity-50"
              >
                {requestState.isLoading ? 'İşleniyor...' : 'Hesabı Silme Talebi Oluştur'}
              </button>
            </form>
          )}
        </section>

        <div className="mt-12 flex justify-center">
          <Link href={localizePath(locale, '/dashboard')} className="text-xs font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim) hover:text-(--gm-gold) transition-colors">
            Paneline Geri Dön
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
