// =============================================================================
// GSC izleme snapshot'ı — seo-i18n-url-migration checklist H bloğu (7/14/28. gün).
//
// Google performans + gsc_url_index verdict dağılımını tek JSON'a toplar.
// Mantık ortak modülde: src/social/modules/marketing/gsc-snapshot.ts
//
// Kullanım (prod):
//   cd backend && bun run scripts/gsc-snapshot.ts            # JSON stdout
//   cd backend && bun run scripts/gsc-snapshot.ts --append   # + var/gsc-history.ndjson
//
// Env: GSC_REFRESH_TENANT_KEY, GSC_REFRESH_SITE_URL (refresh-gsc-index.ts ile aynı).
// =============================================================================

import { buildGscSnapshot, appendGscSnapshot, GSC_HISTORY_PATH } from "../src/social/modules/marketing/gsc-snapshot";

const tenantKey = process.env.GSC_REFRESH_TENANT_KEY ?? "goldmoodastro";
const siteUrl = process.env.GSC_REFRESH_SITE_URL ?? "sc-domain:goldmoodastro.com";
const shouldAppend = process.argv.includes("--append");

const snapshot = await buildGscSnapshot(tenantKey, siteUrl);
console.log(JSON.stringify(snapshot, null, 2));

if (shouldAppend) {
  appendGscSnapshot(snapshot);
  console.error(`[gsc-snapshot] eklendi -> ${GSC_HISTORY_PATH}`);
}

process.exit(0);
