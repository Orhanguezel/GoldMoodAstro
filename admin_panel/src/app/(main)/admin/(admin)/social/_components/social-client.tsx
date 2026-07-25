"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Settings, XCircle } from "lucide-react";
import { platforms, posts, tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { SOCIAL_PLATFORMS } from "@/ekosistem/lib/social-platforms";
import { GradientHero } from "@/ekosistem/components/ui/GradientHero";
import { MetricCard } from "@/ekosistem/components/ui/MetricCard";

export default function SocialOverviewPage() {
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [postItems, setPostItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(tk = tenantKey) {
    if (!tk) return;
    setLoading(true);
    try {
      const [st, list, pl] = await Promise.all([
        platforms.status(tk).catch(() => null),
        platforms.list(tk).catch(() => ({ items: [] })),
        posts.list({ tenantKey: tk, limit: "100", sort: "created_at", order: "desc" }).catch(() => ({ items: [] })),
      ]);
      setStatus(st);
      setAccounts(list.items || []);
      setPostItems(pl.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    tenants.list().then((data) => {
      setTenantItems(data.items || []);
      const tk = resolveTenantKey(data.items || [], getStoredTenantKey());
      setTenantKey(tk);
      if (tk) {
        setStoredTenantKey(tk);
        load(tk);
      } else {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedCount = SOCIAL_PLATFORMS.filter((p) => status?.[p.key]?.connected).length;

  const postsByPlatform = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of postItems) acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, [postItems]);

  const scheduledCount = postItems.filter((p) => p.status === "scheduled").length;
  const draftCount = postItems.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <GradientHero
        eyebrow="Sosyal Medya"
        title="Sosyal Medya Merkezi"
        description="Tüm platform bağlantılarını ve içerik durumunu tek yerden görün. Bağlantı/token girişi Ayarlar → Sosyal Medya'dan yapılır."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white outline-none backdrop-blur"
              value={tenantKey}
              onChange={(e) => {
                setTenantKey(e.target.value);
                setStoredTenantKey(e.target.value);
                load(e.target.value);
              }}
            >
              {tenantItems.map((t: any) => (
                <option key={t.key} value={t.key} className="text-slate-900">{t.name}</option>
              ))}
            </select>
            <a href="/settings" className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/25">
              <Settings size={16} /> Bağlantı Ayarları
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Bağlı Platform" value={`${connectedCount}/${SOCIAL_PLATFORMS.length}`} />
        <MetricCard label="Toplam Gönderi" value={postItems.length} />
        <MetricCard label="Zamanlanmış" value={scheduledCount} />
        <MetricCard label="Taslak" value={draftCount} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <RefreshCw className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const connected = !!status?.[p.key]?.connected;
            const acc = accounts.find((a: any) => a.platform === p.key);
            const href = p.externalHref || `/admin/social/${p.key}`;
            const count = postsByPlatform[p.key] || 0;
            return (
              <a
                key={p.key}
                href={href}
                className="group flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ${p.accent}`}>
                    {p.icon(24)}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    {connected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {connected ? "Bağlı" : "Bağlı değil"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{p.label}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {acc?.accountName ? acc.accountName : connected ? "Hesap aktif" : "Ayarlar'dan bağlayın"}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3 text-xs font-black text-slate-500">
                  <span>{count} gönderi</span>
                  <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform">Yönet →</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
