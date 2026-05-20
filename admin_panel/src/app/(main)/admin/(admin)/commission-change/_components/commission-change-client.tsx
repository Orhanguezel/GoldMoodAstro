// =============================================================
// FILE: commission-change-client.tsx
// Komisyon orani degisikligi bildirim mailer paneli.
// - Onizleme (dry-run): aday listesini ve sayilari gosterir, mail gondermez.
// - Bildirim Gonder (gercek): "ONAYLA" yazimi gerektirir.
// =============================================================
'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  useSendCommissionNoticeAdminMutation,
  type CommissionNoticeResult,
} from '@/integrations/endpoints/admin/commission_change_admin.endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CONFIRM_PHRASE = 'ONAYLA';

export default function CommissionChangeClient() {
  const [sendNotice, { isLoading }] = useSendCommissionNoticeAdminMutation();
  const [preview, setPreview] = React.useState<CommissionNoticeResult | null>(null);
  const [lastResult, setLastResult] = React.useState<CommissionNoticeResult | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [forceResend, setForceResend] = React.useState(false);

  async function runDryRun() {
    try {
      const res = await sendNotice({ dry_run: true, force: forceResend }).unwrap();
      setPreview(res);
      setLastResult(null);
      toast.success(`Onizleme tamam: ${res.total_candidates} aday`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'preview_failed';
      toast.error(`Onizleme hatasi: ${message}`);
    }
  }

  async function runRealSend() {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      toast.error(`Onaylamak icin "${CONFIRM_PHRASE}" yaziniz.`);
      return;
    }
    try {
      const res = await sendNotice({ dry_run: false, force: forceResend }).unwrap();
      setLastResult(res);
      setConfirmOpen(false);
      setConfirmText('');
      toast.success(
        `Gonderim tamam: ${res.sent}/${res.total_candidates} basarili, ${res.errors.length} hata`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'send_failed';
      toast.error(`Gonderim hatasi: ${message}`);
    }
  }

  const commission = preview?.commission ?? lastResult?.commission ?? null;
  const showResult = lastResult ?? preview;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Komisyon Orani Degisikligi Bildirimi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Onayli danismanlara komisyon orani degisikligini bildiren e-postayi gonderir.
          Once <strong>Onizleme (dry-run)</strong> ile aday listesini kontrol edin, ardindan
          gercek gonderimi onaylayin. Aktif kullanicilara (is_active=1) ve daha once bildirim
          gonderilmemis kayitlara gonderilir.
        </p>
      </div>

      {/* Komisyon durumu */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium mb-2">Mevcut Komisyon Ayarlari</h2>
        {commission ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Yeni Oran</dt>
              <dd className="font-semibold">%{commission.new_percent}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Onceki Oran</dt>
              <dd className="font-semibold">
                {commission.previous_percent != null ? `%${commission.previous_percent}` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Yururluk</dt>
              <dd className="font-semibold">{commission.effective_from ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bildirim Suresi</dt>
              <dd className="font-semibold">{commission.notice_days} gun</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Onizleme calistirmaniz halinde komisyon durumu burada gozukur.
          </p>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runDryRun} disabled={isLoading} variant="outline">
          Onizleme (dry-run)
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={isLoading || !preview || preview.total_candidates === 0}
        >
          Bildirim Gonder (gercek)
        </Button>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={forceResend}
            onChange={(e) => setForceResend(e.target.checked)}
          />
          <span>Force: zaten gonderilmis olanlara tekrar gonder</span>
        </label>
      </div>

      {/* Sonuc ozeti */}
      {showResult && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-medium">
            {showResult.dry_run ? 'Onizleme Sonucu (mail GONDERILMEDI)' : 'Gercek Gonderim Sonucu'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Toplam aday" value={showResult.total_candidates} />
            <Stat label="Gonderildi" value={showResult.sent} />
            <Stat label="Atlandi" value={showResult.skipped} />
            <Stat label="Hata" value={showResult.errors.length} tone={showResult.errors.length ? 'danger' : 'neutral'} />
          </div>

          {showResult.errors.length > 0 && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-3">
              <p className="font-medium text-destructive mb-2">Hatalar</p>
              <ul className="text-xs text-destructive space-y-1 max-h-40 overflow-auto">
                {showResult.errors.slice(0, 30).map((e) => (
                  <li key={`${e.consultant_id}:${e.error}`}>
                    <span className="font-mono">{e.email ?? e.user_id}</span> — {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showResult.candidates_preview && showResult.candidates_preview.length > 0 && (
            <div>
              <p className="font-medium mb-2 text-sm">Aday Onizleme (ilk 50)</p>
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Ad</th>
                      <th className="text-left p-2">E-posta</th>
                      <th className="text-left p-2">Locale</th>
                      <th className="text-left p-2">Daha Once Gonderildi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showResult.candidates_preview.map((c) => (
                      <tr key={c.consultant_id} className="border-t">
                        <td className="p-2">{c.full_name ?? '-'}</td>
                        <td className="p-2 font-mono">{c.email ?? '-'}</td>
                        <td className="p-2">{c.locale}</td>
                        <td className="p-2">{c.already_sent_at ? new Date(c.already_sent_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bildirim Gonderimini Onayla</DialogTitle>
            <DialogDescription>
              Onayli danismanlara <strong>gercek</strong> e-posta gonderilecek. Bu islem geri
              alinamaz.
            </DialogDescription>
          </DialogHeader>

          {preview && commission && (
            <div className="text-sm space-y-2">
              <p>
                <strong>{preview.total_candidates}</strong> danismana gonderilecek.
              </p>
              <p>
                Oran: {commission.previous_percent != null ? `%${commission.previous_percent}` : '-'} -&gt; %{commission.new_percent}
              </p>
              <p>
                Yururluk: <strong>{commission.effective_from ?? '-'}</strong>
              </p>
              {forceResend && (
                <p className="text-amber-700 dark:text-amber-400">
                  Force aktif: daha once bildirim gonderilen danismanlara da yeniden gonderilecek.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="confirm-input" className="text-sm font-medium">
              Onaylamak icin "{CONFIRM_PHRASE}" yazin
            </label>
            <Input
              id="confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText('');
              }}
              disabled={isLoading}
            >
              Vazgec
            </Button>
            <Button
              onClick={runRealSend}
              disabled={isLoading || confirmText.trim() !== CONFIRM_PHRASE}
            >
              {isLoading ? 'Gonderiliyor...' : 'Onayla ve Gonder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div className="rounded border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-lg font-semibold ${tone === 'danger' ? 'text-destructive' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
