"use client";

import { useEffect, useState } from "react";
import { marketingChangeSets } from "@/ekosistem/lib/api";
import { CheckCircle2, Play, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { DataTable, DataTableCell, DataTableRow } from "@/ekosistem/components/ui/DataTable";
import { EmptyState } from "@/ekosistem/components/ui/EmptyState";

const statusLabels: Record<string, string> = {
  draft: "Taslak",
  validated: "Doğrulandı",
  validation_failed: "Doğrulama Hatası",
  applied: "Uygulandı",
  failed: "Hata",
  cancelled: "İptal",
};

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "validated" || status === "applied"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "validation_failed" || status === "failed"
        ? "bg-rose-50 text-rose-700 border-rose-100"
        : "bg-brand-50 text-brand-700 border-brand-100";
  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${tone}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function ChangeSetPanel({
  tenantKey,
  platform,
}: {
  tenantKey: string;
  platform: "google_ads" | "gtm" | "ga4" | "gsc" | "merchant" | "meta";
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!tenantKey) return;
    setLoading(true);
    try {
      const data = await marketingChangeSets.list(tenantKey, platform);
      setItems(data.items || []);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantKey, platform]);

  async function validate(uuid: string) {
    setMessage("");
    try {
      const res = await marketingChangeSets.validate(platform, uuid);
      setMessage(res.ok ? "Change-set doğrulandı." : res.error || "Doğrulama başarısız.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  async function apply(uuid: string) {
    if (!confirm("Bu change-set canlı platforma uygulanacak. Devam edilsin mi?")) return;
    setMessage("");
    try {
      const res = await marketingChangeSets.apply(platform, uuid);
      setMessage(res.ok ? "Change-set uygulandı." : res.error || "Uygulama başarısız.");
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Change-set Taslakları</h2>
          <p className="text-sm font-medium text-slate-400">Taslak → validate/dry-run → kullanıcı onayı → apply akışı.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {message && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-300">{message}</p>}

      {items.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={24} />}
          title="Henüz change-set yok."
          description="Otomasyon veya kullanıcı aksiyonu taslak ürettiğinde burada validate/apply adımları görünecek."
        />
      ) : (
        <DataTable columns={["Başlık", "Kaynak", "Durum", "Hedef", "İşlem"]} className="shadow-none">
          {items.map((item) => (
            <DataTableRow key={item.uuid}>
              <DataTableCell>
                <div>
                  <p className="font-black text-slate-100">{item.title}</p>
                  {item.description && <p className="mt-1 text-xs font-medium text-slate-400">{item.description}</p>}
                </div>
              </DataTableCell>
              <DataTableCell className="text-xs font-bold uppercase text-slate-400">{item.source}</DataTableCell>
              <DataTableCell><StatusPill status={item.status} /></DataTableCell>
              <DataTableCell className="text-xs font-mono text-slate-400">{item.targetRef || "-"}</DataTableCell>
              <DataTableCell align="right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => validate(item.uuid)}
                    disabled={item.status === "applied"}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 disabled:opacity-40"
                  >
                    {item.status === "validation_failed" ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    Validate
                  </button>
                  <button
                    type="button"
                    onClick={() => apply(item.uuid)}
                    disabled={item.status !== "validated"}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 disabled:opacity-40"
                  >
                    <Play size={14} />
                    Uygula
                  </button>
                </div>
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </section>
  );
}
