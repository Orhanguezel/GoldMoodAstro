// =============================================================
// FILE: commission-change-client.tsx
// Komisyon orani degisikligi bildirim mailer paneli.
// =============================================================
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  MailCheck,
  RefreshCcw,
  Send,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';

import {
  useSendCommissionNoticeAdminMutation,
  type CommissionNoticeResult,
} from '@/integrations/endpoints/admin/commission_change_admin.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const CONFIRM_PHRASE = 'ONAYLA';

function percent(value: number | null | undefined) {
  return value == null ? '-' : `%${value}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function toastError(prefix: string, err: unknown) {
  const message =
    (err as any)?.data?.error?.message ||
    (err as any)?.error?.message ||
    (err instanceof Error ? err.message : '');
  toast.error(message ? `${prefix}: ${message}` : prefix);
}

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
      toast.success(`Onizleme tamam: ${res.total_candidates} aday bulundu.`);
    } catch (err) {
      toastError('Onizleme hatasi', err);
    }
  }

  async function runRealSend() {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      toast.error(`Onaylamak icin "${CONFIRM_PHRASE}" yazin.`);
      return;
    }

    try {
      const res = await sendNotice({ dry_run: false, force: forceResend }).unwrap();
      setLastResult(res);
      setConfirmOpen(false);
      setConfirmText('');
      toast.success(`Gonderim tamam: ${res.sent}/${res.total_candidates} basarili.`);
    } catch (err) {
      toastError('Gonderim hatasi', err);
    }
  }

  const commission = preview?.commission ?? lastResult?.commission ?? null;
  const showResult = lastResult ?? preview;
  const canSend = Boolean(preview && preview.total_candidates > 0);

  return (
    <div className="animate-in space-y-10 pb-12 duration-700 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              Finans
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Komisyon Bildirimi</h1>
          <p className="max-w-3xl font-serif text-sm italic leading-relaxed text-gm-muted opacity-75">
            Onayli danismanlara komisyon orani degisikligi e-postasini gondermeden once aday
            listesini onizleyin. Gercek gonderim icin ayrica onay gerekir.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={runDryRun}
            disabled={isLoading}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted shadow-lg backdrop-blur-sm transition-all hover:bg-gm-primary/5 hover:text-gm-text"
          >
            <Eye className={cn('mr-2 size-4', isLoading && 'animate-pulse')} />
            Onizleme
          </Button>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isLoading || !canSend}
            className="h-12 rounded-full bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-gm-bg-deep shadow-lg hover:bg-gm-gold/90"
          >
            <Send className="mr-2 size-4" />
            Bildirim Gonder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <div className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <MailCheck className="size-5 text-gm-gold" />
                    <h2 className="font-serif text-2xl text-gm-text">Gonderim Akisi</h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-gm-muted">
                    Onizleme mail gondermez. Aday listesini kontrol ettikten sonra gercek
                    gonderimi baslatin.
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-gm-border-soft bg-gm-bg-deep/50 px-5 py-4">
                  <div>
                    <Label
                      htmlFor="force-resend"
                      className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted"
                    >
                      Tekrar gonder
                    </Label>
                    <p className="mt-1 text-xs text-gm-muted/70">
                      Daha once bildirilenlere de gonderir.
                    </p>
                  </div>
                  <Switch
                    id="force-resend"
                    checked={forceResend}
                    onCheckedChange={setForceResend}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-gm-gold"
                  />
                </div>
              </div>
            </div>

            <CardContent className="space-y-8 p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Metric
                  icon={Users}
                  label="Toplam aday"
                  value={showResult?.total_candidates ?? 0}
                />
                <Metric
                  icon={CheckCircle2}
                  label="Gonderildi"
                  value={showResult?.sent ?? 0}
                  tone="success"
                />
                <Metric
                  icon={RefreshCcw}
                  label="Atlandi"
                  value={showResult?.skipped ?? 0}
                />
                <Metric
                  icon={XCircle}
                  label="Hata"
                  value={showResult?.errors.length ?? 0}
                  tone={(showResult?.errors.length ?? 0) > 0 ? 'danger' : 'neutral'}
                />
              </div>

              {!showResult ? (
                <div className="rounded-[28px] border-2 border-dashed border-gm-border-soft p-12 text-center">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gm-gold/10 text-gm-gold">
                    <Eye className="size-6" />
                  </div>
                  <p className="font-serif text-lg italic text-gm-muted">
                    Once onizleme calistirin; adaylar ve komisyon bilgileri burada gorunur.
                  </p>
                </div>
              ) : (
                <ResultPanel result={showResult} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/40 shadow-xl backdrop-blur-md">
            <div className="border-b border-gm-border-soft bg-gm-surface/30 p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5 text-gm-gold" />
                <h2 className="font-serif text-xl text-gm-text">Mevcut Ayar</h2>
              </div>
            </div>
            <CardContent className="space-y-5 p-6">
              {commission ? (
                <>
                  <InfoRow label="Onceki oran" value={percent(commission.previous_percent)} />
                  <InfoRow label="Yeni oran" value={percent(commission.new_percent)} highlight />
                  <InfoRow label="Yururluk" value={formatDate(commission.effective_from)} />
                  <InfoRow label="Bildirim suresi" value={`${commission.notice_days} gun`} />
                </>
              ) : (
                <p className="font-serif text-sm italic leading-relaxed text-gm-muted">
                  Komisyon bilgisi onizleme sonucuyla birlikte yuklenir.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="rounded-[32px] border border-gm-warning/20 bg-gm-warning/5 p-8">
            <div className="mb-3 flex items-center gap-3">
              <ShieldAlert className="size-5 text-gm-warning" />
              <h3 className="font-serif text-lg text-gm-warning">Dikkat</h3>
            </div>
            <p className="text-sm leading-relaxed text-gm-muted">
              Gercek gonderim danismanlara e-posta yollar ve geri alinamaz. Bu yuzden sistem
              onizleme ve "{CONFIRM_PHRASE}" onayi ister.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[32px] border-gm-border-soft bg-gm-bg-deep p-0 text-gm-text shadow-2xl sm:max-w-xl">
          <DialogHeader className="border-b border-gm-border-soft bg-gm-surface/40 p-8">
            <DialogTitle className="flex items-center gap-3 font-serif text-2xl">
              <AlertTriangle className="size-6 text-gm-warning" />
              Bildirim Gonderimini Onayla
            </DialogTitle>
            <DialogDescription className="font-serif text-sm italic text-gm-muted">
              Onayli danismanlara gercek e-posta gonderilecek.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-8">
            {preview && commission ? (
              <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-5 text-sm text-gm-muted">
                <p>
                  <strong className="text-gm-text">{preview.total_candidates}</strong> danismana
                  gonderilecek.
                </p>
                <p className="mt-2">
                  Oran: {percent(commission.previous_percent)} -&gt;{' '}
                  <strong className="text-gm-gold">{percent(commission.new_percent)}</strong>
                </p>
                <p className="mt-2">Yururluk: {formatDate(commission.effective_from)}</p>
                {forceResend ? (
                  <p className="mt-3 text-gm-warning">
                    Tekrar gonderim aktif: daha once bildirilen danismanlara da gonderilecek.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label
                htmlFor="confirm-input"
                className="ml-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted"
              >
                Onaylamak icin "{CONFIRM_PHRASE}" yazin
              </Label>
              <Input
                id="confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/50 font-mono text-gm-text focus:border-gm-gold/50 focus:ring-gm-gold/40"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gm-border-soft bg-gm-surface/20 p-6">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText('');
              }}
              disabled={isLoading}
              className="rounded-full border-gm-border-soft px-6"
            >
              Vazgec
            </Button>
            <Button
              onClick={runRealSend}
              disabled={isLoading || confirmText.trim() !== CONFIRM_PHRASE}
              className="rounded-full bg-gm-gold px-8 font-bold text-gm-bg-deep hover:bg-gm-gold/90"
            >
              {isLoading ? 'Gonderiliyor...' : 'Onayla ve Gonder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-gm-border-soft bg-gm-bg-deep/45 p-6">
      <Icon
        className={cn(
          'absolute -right-3 -top-3 size-20 opacity-5',
          tone === 'success' && 'text-gm-success',
          tone === 'danger' && 'text-gm-error',
          tone === 'neutral' && 'text-gm-gold',
        )}
      />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">{label}</p>
      <div
        className={cn(
          'mt-3 font-serif text-4xl text-gm-text',
          tone === 'success' && 'text-gm-success',
          tone === 'danger' && 'text-gm-error',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/25 px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gm-muted">
        {label}
      </span>
      <span className={cn('font-mono text-sm text-gm-text', highlight && 'text-gm-gold')}>
        {value}
      </span>
    </div>
  );
}

function ResultPanel({ result }: { result: CommissionNoticeResult }) {
  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-[28px] border p-6',
          result.dry_run
            ? 'border-gm-gold/20 bg-gm-gold/5'
            : 'border-gm-success/20 bg-gm-success/5',
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              result.dry_run ? 'bg-gm-gold/10 text-gm-gold' : 'bg-gm-success/10 text-gm-success',
            )}
          >
            {result.dry_run ? <Eye className="size-5" /> : <MailCheck className="size-5" />}
          </div>
          <div>
            <h3 className="font-serif text-xl text-gm-text">
              {result.dry_run ? 'Onizleme Sonucu' : 'Gercek Gonderim Sonucu'}
            </h3>
            <p className="mt-1 text-sm text-gm-muted">
              {result.dry_run
                ? 'Mail gonderilmedi; sadece adaylar listelendi.'
                : 'Bildirim gonderimi tamamlandi.'}
            </p>
          </div>
        </div>
      </div>

      {result.errors.length > 0 ? (
        <div className="rounded-[28px] border border-gm-error/30 bg-gm-error/5 p-6">
          <p className="mb-3 font-serif text-lg text-gm-error">Hatalar</p>
          <ul className="max-h-44 space-y-2 overflow-auto text-xs text-gm-error">
            {result.errors.slice(0, 30).map((error) => (
              <li key={`${error.consultant_id}:${error.error}`} className="break-all">
                <span className="font-mono">{error.email ?? error.user_id}</span> - {error.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.candidates_preview && result.candidates_preview.length > 0 ? (
        <div className="overflow-hidden rounded-[28px] border border-gm-border-soft">
          <div className="border-b border-gm-border-soft bg-gm-surface/40 px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">
              Aday Onizleme - ilk 50
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gm-surface/30">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    Ad
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    E-posta
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    Dil
                  </TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                    Onceki Bildirim
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.candidates_preview.map((candidate) => (
                  <TableRow key={candidate.consultant_id} className="border-gm-border-soft hover:bg-gm-primary/[0.03]">
                    <TableCell className="px-6 py-4 font-serif text-base text-gm-text">
                      {candidate.full_name ?? '-'}
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs text-gm-muted">
                      {candidate.email ?? '-'}
                    </TableCell>
                    <TableCell className="py-4 text-xs uppercase tracking-widest text-gm-muted">
                      {candidate.locale}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-mono text-xs text-gm-muted">
                      {candidate.already_sent_at
                        ? new Date(candidate.already_sent_at).toLocaleString('tr-TR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
