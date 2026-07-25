import { env } from "../../core/env";

export interface LinkedInPostResult {
  id: string;
}

export type LinkedInTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

const LINKEDIN_API = "https://api.linkedin.com";

function restHeaders(accessToken: string, contentType = "application/json") {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": contentType,
    "LinkedIn-Version": env.LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

function linkedinError(data: Record<string, unknown>, fallback: string) {
  return String(data.message ?? data.error_description ?? data.error ?? fallback);
}

export function buildLinkedInAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}) {
  const scope = params.scope || "openid profile email w_member_social";
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    scope,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${q.toString()}`;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<LinkedInTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await responseBody(res);
  if (!res.ok) throw new Error(linkedinError(data, "LinkedIn token exchange failed"));
  return data as LinkedInTokenResponse;
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
}): Promise<LinkedInTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await responseBody(res);
  if (!res.ok) throw new Error(linkedinError(data, "LinkedIn token refresh failed"));
  return data as LinkedInTokenResponse;
}

function postPayload(authorUrn: string, text: string, imageUrn?: string) {
  return {
    author: authorUrn,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    ...(imageUrn ? { content: { media: { id: imageUrn } } } : {}),
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
}

async function createPost(
  accessToken: string,
  authorUrn: string,
  text: string,
  imageUrn?: string,
): Promise<LinkedInPostResult> {
  const res = await fetch(`${LINKEDIN_API}/rest/posts`, {
    method: "POST",
    headers: restHeaders(accessToken),
    body: JSON.stringify(postPayload(authorUrn, text, imageUrn)),
  });
  const data = await responseBody(res);
  if (!res.ok) throw new Error(linkedinError(data, "LinkedIn publish failed"));
  const id = res.headers.get("x-restli-id") || (typeof data.id === "string" ? data.id : "");
  if (!id) throw new Error("LinkedIn post olusturuldu ancak x-restli-id donmedi");
  return { id };
}

export function publishTextPost(accessToken: string, authorUrn: string, text: string) {
  return createPost(accessToken, authorUrn, text);
}

async function initializeImageUpload(accessToken: string, ownerUrn: string) {
  const res = await fetch(`${LINKEDIN_API}/rest/images?action=initializeUpload`, {
    method: "POST",
    headers: restHeaders(accessToken),
    body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
  });
  const data = await responseBody(res) as {
    value?: { uploadUrl?: string; image?: string };
    message?: unknown;
  };
  if (!res.ok) throw new Error(linkedinError(data, "LinkedIn image initialize failed"));
  if (!data.value?.uploadUrl || !data.value.image) {
    throw new Error("LinkedIn image initialize yaniti uploadUrl/image icermiyor");
  }
  return { uploadUrl: data.value.uploadUrl, imageUrn: data.value.image };
}

async function uploadImageBinary(accessToken: string, uploadUrl: string, imageUrl: string) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error(`LinkedIn gorseli indirilemedi: HTTP ${imageResponse.status}`);
  const binary = await imageResponse.arrayBuffer();
  if (binary.byteLength === 0) throw new Error("LinkedIn gorseli bos");
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": imageResponse.headers.get("content-type") || "application/octet-stream",
    },
    body: binary,
  });
  if (!upload.ok) {
    const data = await responseBody(upload);
    throw new Error(linkedinError(data, `LinkedIn image upload HTTP ${upload.status}`));
  }
}

/**
 * Tek gorsel bugunku kapsamdir. Dizi imzasi coklu gorsel API'sine gecisi
 * geriye uyumlu tutar; simdilik ilk URL kullanilir.
 */
export async function publishImagePost(
  accessToken: string,
  authorUrn: string,
  text: string,
  imageUrls: string[],
): Promise<LinkedInPostResult> {
  const imageUrl = imageUrls.find((url) => url.trim());
  if (!imageUrl) throw new Error("LinkedIn gorsel URL'si gerekli");
  const initialized = await initializeImageUpload(accessToken, authorUrn);
  await uploadImageBinary(accessToken, initialized.uploadUrl, imageUrl);
  return createPost(accessToken, authorUrn, text, initialized.imageUrn);
}

export async function getAccountInfo(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(String((data as any).message ?? "LinkedIn info failed"));
  return data;
}

export async function getLinkedInUserIdentity(accessToken: string): Promise<{ urn: string; name: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { sub?: string; name?: string };
  if (!res.ok) throw new Error(String((data as { message?: string }).message ?? "LinkedIn userinfo failed"));
  const sub = (data.sub ?? "").trim();
  if (!sub) throw new Error("LinkedIn userinfo sub eksik");
  const urn = sub.startsWith("urn:") ? sub : `urn:li:person:${sub}`;
  return { urn, name: data.name ?? "LinkedIn" };
}
