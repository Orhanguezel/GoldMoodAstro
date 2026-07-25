export type MarketingJsonBacklinks = {
  rows: Array<{ url: string; sourceDomain?: string; title?: string }>;
  updatedAt?: string;
  source?: "manual" | "import";
};

export type MarketingJsonShape = {
  branding?: Record<string, unknown>;
  backlinks?: MarketingJsonBacklinks;
  notes?: string;
  backlinksEnriched?: {
    provider: "dataforseo";
    fetchedAt: string;
    data: unknown;
  };
};

export type MarketingPlatform = "google_ads" | "gtm" | "ga4" | "gsc" | "merchant" | "meta";
export type MarketingChangeSource = "manual" | "automation" | "ai" | "recommendation";
export type MarketingChangeStatus =
  | "draft"
  | "validated"
  | "validation_failed"
  | "applied"
  | "failed"
  | "cancelled";

export type MarketingChangeSet = {
  id: number;
  uuid: string;
  tenantKey: string;
  platform: MarketingPlatform;
  targetRef: string | null;
  title: string;
  description: string | null;
  status: MarketingChangeStatus;
  source: MarketingChangeSource;
  payload: unknown;
  validationResult: unknown;
  appliedResult: unknown;
};

export type PlatformChangeHandler = {
  validate: (
    tenantKey: string,
    changeSet: MarketingChangeSet,
  ) => Promise<{ ok: boolean; result: unknown }>;
  apply: (
    tenantKey: string,
    changeSet: MarketingChangeSet,
  ) => Promise<{ ok: boolean; result: unknown }>;
};
