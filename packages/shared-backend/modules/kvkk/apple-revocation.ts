import { importPKCS8, SignJWT, createRemoteJWKSet, jwtVerify } from 'jose';
import { createHash } from 'crypto';

const APPLE_ORIGIN = 'https://appleid.apple.com';
const appleKeys = createRemoteJWKSet(new URL(`${APPLE_ORIGIN}/auth/keys`));

export type AppleRevocationResult = 'revoked' | 'not_requested' | 'unavailable' | 'failed';

function appleConfig() {
  const clientId = process.env.APPLE_MOBILE_CLIENT_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!clientId || !teamId || !keyId || !privateKey) return null;
  const allowed = (process.env.APPLE_CLIENT_ID ?? '').split(',').map((value) => value.trim());
  if (!allowed.includes(clientId)) return null;
  return { clientId, teamId, keyId, privateKey };
}

async function appleClientSecret(config: NonNullable<ReturnType<typeof appleConfig>>) {
  const key = await importPKCS8(config.privateKey, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
    .setIssuer(config.teamId)
    .setAudience(APPLE_ORIGIN)
    .setSubject(config.clientId)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(key);
}

async function verifyIdentity(token: string, clientId: string) {
  const { payload } = await jwtVerify(token, appleKeys, { issuer: APPLE_ORIGIN, audience: clientId });
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!sub || !email || !emailVerified) throw new Error('apple_identity_incomplete');
  return { sub, email, nonce: typeof payload.nonce === 'string' ? payload.nonce : '' };
}

/** Uses a fresh, one-use native authorization code. No Apple credential is persisted. */
export async function revokeAppleAuthorizationForDeletion(params: {
  userEmail: string;
  identityToken?: string;
  authorizationCode?: string;
  nonce?: string;
}): Promise<AppleRevocationResult> {
  const { identityToken, authorizationCode, nonce } = params;
  if (!identityToken && !authorizationCode) return 'not_requested';
  if (!identityToken || !authorizationCode || !nonce || identityToken.length > 8192 || authorizationCode.length > 2048 || nonce.length > 128) return 'failed';
  const config = appleConfig();
  if (!config) return 'unavailable';

  try {
    const identity = await verifyIdentity(identityToken, config.clientId);
    if (identity.email !== params.userEmail.trim().toLowerCase()) return 'failed';
    const nonceHash = createHash('sha256').update(nonce).digest('hex');
    if (identity.nonce !== nonce && identity.nonce !== nonceHash) return 'failed';
    const clientSecret = await appleClientSecret(config);
    const exchange = await fetch(`${APPLE_ORIGIN}/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!exchange.ok) return 'failed';
    const tokens = await exchange.json() as { id_token?: string; refresh_token?: string; access_token?: string };
    if (!tokens.id_token || !tokens.refresh_token) return 'failed';
    const exchangedIdentity = await verifyIdentity(tokens.id_token, config.clientId);
    if (identity.sub !== exchangedIdentity.sub || identity.email !== exchangedIdentity.email) return 'failed';

    const revoke = await fetch(`${APPLE_ORIGIN}/auth/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        token: tokens.refresh_token,
        token_type_hint: 'refresh_token',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return revoke.ok ? 'revoked' : 'failed';
  } catch {
    return 'failed';
  }
}
