import { createHash } from 'crypto';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { env } from '@/core/env';

export function makeChannelName(bookingId: string) {
  return `gma_${bookingId.replaceAll('-', '')}`;
}

export function makeAgoraUid(userId: string) {
  const hash = createHash('sha256').update(userId).digest();
  return hash.readUInt32BE(0) || 1;
}

export function buildRtcToken(params: {
  channelName: string;
  uid: number;
  expiresInSeconds: number;
}) {
  if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
    const error = new Error('agora_not_configured');
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  return RtcTokenBuilder.buildTokenWithUid(
    env.AGORA_APP_ID,
    env.AGORA_APP_CERTIFICATE,
    params.channelName,
    params.uid,
    RtcRole.PUBLISHER,
    params.expiresInSeconds,
    params.expiresInSeconds,
  );
}

export function getAgoraAppId() {
  return env.AGORA_APP_ID;
}
