"use client";

import * as React from "react";

import { Check, Eye, FileText, RefreshCcw, Send, UserCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  type ConsultantApplicationAdmin,
  type ConsultantApplicationStatus,
  useApproveConsultantApplicationAdminMutation,
  useListConsultantApplicationsAdminQuery,
  useRejectConsultantApplicationAdminMutation,
} from "@/integrations/hooks";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ label: string; value?: ConsultantApplicationStatus }> = [
  { label: "Tümü" },
  { label: "Bekleyen", value: "pending" },
  { label: "Onaylanan", value: "approved" },
  { label: "Reddedilen", value: "rejected" },
];

const SKELETON_ROWS = ["one", "two", "three", "four", "five"];

const STATUS_COPY: Record<ConsultantApplicationStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR");
}

function statusClass(status: ConsultantApplicationStatus) {
  if (status === "approved") return "border-gm-success/25 bg-gm-success/10 text-gm-success";
  if (status === "rejected") return "border-gm-error/25 bg-gm-error/10 text-gm-error";
  return "border-gm-gold/25 bg-gm-gold/10 text-gm-gold";
}

function Chips({ items }: { items?: string[] | null }) {
  if (!items?.length) return <span className="text-gm-muted">-</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className="rounded-full border-gm-border-soft text-[10px] uppercase tracking-widest"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">{label}</div>
      <div className="min-h-10 rounded-2xl border border-gm-border-soft bg-gm-bg-deep/40 px-4 py-3 text-sm text-gm-text">
        {value || <span className="text-gm-muted">-</span>}
      </div>
    </div>
  );
}

export default function ConsultantApplicationsList() {
  const [status, setStatus] = React.useState<ConsultantApplicationStatus | undefined>("pending");
  const [selected, setSelected] = React.useState<ConsultantApplicationAdmin | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<ConsultantApplicationAdmin | null>(null);
  const [reason, setReason] = React.useState("");

  const query = useListConsultantApplicationsAdminQuery(status ? { status } : undefined);
  const [approve, approveState] = useApproveConsultantApplicationAdminMutation();
  const [reject, rejectState] = useRejectConsultantApplicationAdminMutation();

  async function handleApprove(item: ConsultantApplicationAdmin) {
    try {
      const updated = await approve(item.id).unwrap();
      toast.success("Başvuru onaylandı");
      setSelected(updated);
      query.refetch();
    } catch (error) {
      const message =
        (error as { data?: { error?: string } })?.data?.error === "user_required_for_approval"
          ? "Bu başvuruyu onaylamak için aynı e-postayla kayıtlı bir kullanıcı gerekiyor."
          : "Başvuru onaylanamadı";
      toast.error(message);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    if (reason.trim().length < 10) {
      toast.error("Red sebebi en az 10 karakter olmalı");
      return;
    }
    try {
      const updated = await reject({ id: rejectTarget.id, rejection_reason: reason.trim() }).unwrap();
      toast.success("Başvuru reddedildi");
      setSelected(updated);
      setRejectTarget(null);
      setReason("");
      query.refetch();
    } catch {
      toast.error("Başvuru reddedilemedi");
    }
  }

  const busy = query.isFetching || approveState.isLoading || rejectState.isLoading;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Danışman Onboarding</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Danışman Başvuruları</h1>
          <p className="text-sm italic text-gm-muted">Yeni danışman adaylarını incele, onayla veya gerekçeli reddet.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={busy}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCcw className={cn("mr-2 size-4", query.isFetching && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <div className="flex w-fit flex-wrap gap-2 rounded-full border border-gm-border-soft bg-gm-surface/20 p-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setStatus(item.value)}
            className={cn(
              "rounded-full px-7 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
              status === item.value
                ? "bg-gm-gold text-gm-bg shadow-lg shadow-gm-gold/20"
                : "text-gm-muted hover:bg-gm-surface/40 hover:text-gm-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  Aday
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  Uzmanlık
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  Durum
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  Tarih
                </TableHead>
                <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  İşlem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                SKELETON_ROWS.map((key) => (
                  <TableRow key={key} className="border-gm-border-soft">
                    <TableCell className="px-8 py-6">
                      <Skeleton className="h-12 w-56 rounded-full bg-gm-surface/20" />
                    </TableCell>
                    <TableCell className="py-6">
                      <Skeleton className="h-8 w-40 rounded-full bg-gm-surface/20" />
                    </TableCell>
                    <TableCell className="py-6">
                      <Skeleton className="h-8 w-28 rounded-full bg-gm-surface/20" />
                    </TableCell>
                    <TableCell className="py-6">
                      <Skeleton className="h-6 w-32 bg-gm-surface/20" />
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Skeleton className="ml-auto h-10 w-28 rounded-full bg-gm-surface/20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : query.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center text-gm-muted">
                    Bu filtrede başvuru yok.
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03]">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full border border-gm-border-soft bg-gm-surface font-serif text-xl text-gm-gold">
                          {item.full_name[0] || "D"}
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text">{item.full_name}</div>
                          <div className="font-mono text-[10px] text-gm-muted">{item.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Chips items={item.expertise} />
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-4 py-1.5 text-[10px] uppercase tracking-widest",
                          statusClass(item.status),
                        )}
                      >
                        {STATUS_COPY[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-sm text-gm-muted">{formatDate(item.created_at)}</TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setSelected(item)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full text-gm-success hover:bg-gm-success/10"
                          disabled={busy || item.status === "approved"}
                          onClick={() => handleApprove(item)}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full text-gm-error hover:bg-gm-error/10"
                          disabled={busy || item.status === "rejected"}
                          onClick={() => {
                            setRejectTarget(item);
                            setReason("");
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto border-gm-border-soft bg-gm-bg-deep text-gm-text">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Başvuru Detayı</DialogTitle>
            <DialogDescription className="text-gm-muted">Form alanları salt okunur görüntülenir.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock label="Ad Soyad" value={selected.full_name} />
                <DetailBlock label="E-posta" value={selected.email} />
                <DetailBlock label="Telefon" value={selected.phone} />
                <DetailBlock
                  label="Deneyim"
                  value={selected.experience_years != null ? `${selected.experience_years} yıl` : undefined}
                />
                <DetailBlock label="Uzmanlık" value={<Chips items={selected.expertise} />} />
                <DetailBlock label="Diller" value={<Chips items={selected.languages} />} />
              </div>
              <DetailBlock label="Biyografi" value={selected.bio} />
              <DetailBlock label="Sertifikalar" value={selected.certifications} />
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock
                  label="CV"
                  value={
                    selected.cv_url ? (
                      <a className="text-gm-gold underline" href={selected.cv_url} target="_blank" rel="noreferrer">
                        Dosyayı aç
                      </a>
                    ) : undefined
                  }
                />
                <DetailBlock
                  label="Örnek Harita"
                  value={
                    selected.sample_chart_url ? (
                      <a
                        className="text-gm-gold underline"
                        href={selected.sample_chart_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Dosyayı aç
                      </a>
                    ) : undefined
                  }
                />
              </div>
              {selected.rejection_reason && <DetailBlock label="Red Sebebi" value={selected.rejection_reason} />}
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-full border-gm-success/30 text-gm-success"
                  disabled={busy || selected.status === "approved"}
                  onClick={() => handleApprove(selected)}
                >
                  <UserCheck className="mr-2 size-4" /> Onayla
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-gm-error/30 text-gm-error"
                  disabled={busy || selected.status === "rejected"}
                  onClick={() => {
                    setRejectTarget(selected);
                    setReason("");
                  }}
                >
                  <FileText className="mr-2 size-4" /> Reddet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="border-gm-border-soft bg-gm-bg-deep text-gm-text">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Başvuruyu Reddet</DialogTitle>
            <DialogDescription className="text-gm-muted">Adaya gönderilecek red sebebini yazın.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={10}
            rows={5}
            className="border-gm-border-soft bg-gm-surface/40"
            placeholder="En az 10 karakter..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Vazgeç
            </Button>
            <Button onClick={handleReject} disabled={rejectState.isLoading || reason.trim().length < 10}>
              <Send className="mr-2 size-4" /> Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
