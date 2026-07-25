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
      />

      {tenantKey && <GoogleAdsManagementPanel tenantKey={tenantKey} />}
    </div>
  );
}
