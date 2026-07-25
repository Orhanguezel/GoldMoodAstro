"use client";

import { useEffect, useState } from "react";
import { tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { GoogleAdsManagementPanel } from "@/ekosistem/components/marketing/GoogleAdsManagementPanel";
import { GradientHero } from "@/ekosistem/components/ui/GradientHero";

export default function GoogleAdsPage() {
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);

  useEffect(() => {
    tenants
      .list()
      .then((data) => {
        setTenantItems(data.items);
        const nextTenantKey = resolveTenantKey(data.items, getStoredTenantKey());
        setTenantKey(nextTenantKey);
        if (nextTenantKey) setStoredTenantKey(nextTenantKey);
      })
      .catch(() => setTenantItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 animate-in fade-in duration-700">
      <GradientHero
        eyebrow="Ads"
        title="Google Ads"
        description="Kampanya, keyword ve asset analizlerini inceleyin; önerileri onaylı change-set taslaklarına dönüştürün."
        aside={
          <select
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white outline-none"
            value={tenantKey}
            onChange={(e) => {
              setTenantKey(e.target.value);
              setStoredTenantKey(e.target.value);
            }}
          >
            {tenantItems.map((tenant: any) => (
              <option key={tenant.key} value={tenant.key} className="text-slate-900">
                {tenant.name}
              </option>
            ))}
          </select>
        }
      />

      {tenantKey && <GoogleAdsManagementPanel tenantKey={tenantKey} />}
    </div>
  );
}
