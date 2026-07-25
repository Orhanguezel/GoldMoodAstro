import { getTenantSecret, getTenantValue } from "../../core/tenant-settings";

export async function fetchMetaDiagnostics(tenantKey: string) {
  const enabled = await getTenantValue<boolean | string | null>(tenantKey, "meta", "enabled");
  const pixelId = String((await getTenantValue<string>(tenantKey, "meta", "pixel_id")) ?? "").trim();
  const capiToken = (await getTenantSecret(tenantKey, "meta", "capi_token"))?.trim() || "";
  const testEventCode = String((await getTenantValue<string>(tenantKey, "meta", "test_event_code")) ?? "").trim();
  const enabledValue =
    enabled === null || enabled === undefined
      ? Boolean(pixelId || capiToken)
      : typeof enabled === "boolean"
        ? enabled
        : !["false", "0", "off", "no"].includes(enabled.trim().toLowerCase());

  const checks = [
    {
      key: "pixel_id",
      label: "Pixel ID",
      ok: Boolean(pixelId),
      message: pixelId ? "Pixel ID tanimli" : "Pixel ID eksik",
    },
    {
      key: "capi_token",
      label: "CAPI Token",
      ok: Boolean(capiToken),
      message: capiToken ? "CAPI token tanimli" : "CAPI token eksik",
    },
    {
      key: "test_event_code",
      label: "Test Event Code",
      ok: Boolean(testEventCode),
      message: testEventCode ? "Test Event Code tanimli" : "Test event debug icin opsiyonel kod eksik",
    },
    {
      key: "enabled",
      label: "Aktiflik",
      ok: enabledValue,
      message: enabledValue ? "Meta CAPI aktif" : "Meta CAPI pasif",
    },
  ];

  return {
    configured: Boolean(pixelId && capiToken),
    enabled: enabledValue,
    pixelId: pixelId ? `${pixelId.slice(0, 4)}…${pixelId.slice(-3)}` : "",
    hasCapiToken: Boolean(capiToken),
    hasTestEventCode: Boolean(testEventCode),
    checks,
    recommendations: checks
      .filter((check) => !check.ok)
      .map((check) => ({
        key: check.key,
        title: `${check.label} kontrolu`,
        message: check.message,
      })),
  };
}
