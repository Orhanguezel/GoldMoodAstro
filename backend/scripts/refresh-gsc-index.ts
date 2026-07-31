import { refreshGscIndex } from "../src/social/modules/marketing/gsc";

const tenantKey = process.env.GSC_REFRESH_TENANT_KEY ?? "goldmoodastro";
const siteUrl = process.env.GSC_REFRESH_SITE_URL ?? "sc-domain:goldmoodastro.com";
const websiteUrl = process.env.GSC_REFRESH_WEBSITE_URL ?? "https://goldmoodastro.com";
const limit = Number(process.env.GSC_REFRESH_LIMIT ?? 500);
const force = process.env.GSC_REFRESH_FORCE === "1";

const result = await refreshGscIndex(tenantKey, siteUrl, {
  websiteUrl,
  limit: Number.isFinite(limit) && limit > 0 ? limit : 500,
  force,
});

console.log(
  JSON.stringify(
    {
      finishedAt: new Date().toISOString(),
      tenantKey,
      siteUrl,
      urlCount: result.urls?.length ?? 0,
      checked: result.checked?.length ?? 0,
      refreshed: result.refreshed ?? 0,
      errors: (result.checked ?? []).filter((item) => !item.ok).slice(0, 20),
    },
    null,
    2,
  ),
);
