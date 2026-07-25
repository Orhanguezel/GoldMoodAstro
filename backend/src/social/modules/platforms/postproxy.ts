import { env } from "../../core/env";
import { getTenantSecret } from "../../core/tenant-settings";
import type { PublishResult } from "./publisher";

type PostproxyPlatform = "facebook" | "instagram" | "twitter" | "linkedin" | "youtube";

export interface PostproxyProfileTarget {
  profile: string;
  platform?: PostproxyPlatform;
}

export interface PostproxyPublishInput {
  tenantKey: string;
  body: string;
  profiles: Array<string | PostproxyProfileTarget>;
  media?: string[];
  scheduledAt?: string | null;
}

export interface PostproxyPublishResult extends PublishResult {
  postproxyPostId?: string;
}

interface PostproxyResultItem {
  profile?: string;
  platform?: string;
  status?: string;
  post_id?: string;
  id?: string;
  error?: string;
}

interface PostproxyPostResponse {
  id?: string;
  post?: { id?: string };
  status?: string;
  results?: PostproxyResultItem[];
  error?: string;
  message?: string;
}

function baseUrl() {
  return env.POSTPROXY_BASE_URL.replace(/\/+$/, "") || "https://api.postproxy.dev";
}

export async function resolvePostproxyAuth(tenantKey: string): Promise<string> {
  const apiKey = await getTenantSecret(tenantKey, "postproxy", "api_key");
  if (!apiKey) {
    throw new Error(`Tenant (${tenantKey}) icin Postproxy API key tanimli degil`);
  }
  return apiKey;
}

function normalizeTarget(target: string | PostproxyProfileTarget): PostproxyProfileTarget {
  if (typeof target === "string") {
    return { profile: target, platform: target === "x" ? "twitter" : (target as PostproxyPlatform) };
  }
  return target;
}

function platformFromProfile(profile: string | undefined, targetMap: Map<string, PostproxyPlatform | undefined>) {
  if (!profile) return null;
  const mapped = targetMap.get(profile);
  const normalized = (mapped || profile).toLowerCase();
  if (normalized === "facebook") return "facebook";
  if (normalized === "instagram") return "instagram";
  if (normalized === "twitter" || normalized === "x") return "twitter";
  if (normalized === "linkedin") return "linkedin";
  if (normalized === "youtube") return "youtube";
  return null;
}

function applyExternalId(result: PublishResult, platform: string | null, externalId: string | undefined) {
  if (!platform || !externalId) return;
  if (platform === "facebook") result.fbPostId = externalId;
  if (platform === "instagram") result.igMediaId = externalId;
  if (platform === "twitter") result.xTweetId = externalId;
  if (platform === "linkedin") result.linkedinPostId = externalId;
  if (platform === "youtube") result.youtubeVideoId = externalId;
}

export async function publishToPostproxy(input: PostproxyPublishInput): Promise<PostproxyPublishResult> {
  const apiKey = await resolvePostproxyAuth(input.tenantKey);
  const targets = input.profiles.map(normalizeTarget);
  const profiles = targets.map((target) => target.profile);
  const targetMap = new Map(targets.map((target) => [target.profile, target.platform]));

  if (profiles.length === 0) {
    throw new Error("Postproxy icin hedef profil bulunamadi");
  }

  const payload: Record<string, unknown> = {
    post: { body: input.body },
    profiles,
  };
  const media = (input.media || []).filter(Boolean);
  if (media.length > 0) payload.media = media;
  if (input.scheduledAt) payload.scheduled_at = input.scheduledAt;

  const res = await fetch(`${baseUrl()}/api/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as PostproxyPostResponse;
  if (!res.ok) {
    throw new Error(`Postproxy API hatasi: ${data.error || data.message || res.statusText}`);
  }

  const result: PostproxyPublishResult = {
    success: true,
    errors: [],
    postproxyPostId: data.id || data.post?.id,
  };

  for (const item of data.results || []) {
    const profile = item.profile || item.platform;
    const platform = platformFromProfile(profile, targetMap);
    const externalId = item.post_id || item.id;
    if (item.status === "failed") {
      result.success = false;
      result.errors.push(`${profile || "profile"}: ${item.error || "Postproxy publish failed"}`);
      continue;
    }
    applyExternalId(result, platform, externalId);
  }

  if (data.status === "failed" && result.errors.length === 0) {
    result.success = false;
    result.errors.push(data.error || data.message || "Postproxy publish failed");
  }

  return result;
}

export async function listConnectedProfiles(_profileGroupId: string): Promise<PostproxyProfileTarget[]> {
  // TODO Faz 3: Postproxy profile group / connected profiles endpoint'i netlesince doldurulacak.
  throw new Error("Postproxy listConnectedProfiles Faz 3");
}

export async function connectAccountUrl(_tenantKey: string, _platform: string): Promise<string> {
  // TODO Faz 3: Hosted connect endpoint'i netlesince doldurulacak.
  throw new Error("Postproxy connectAccountUrl Faz 3");
}
