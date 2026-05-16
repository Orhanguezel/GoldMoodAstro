import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MixGains, ZodiacSignKey } from './types';

const PREFIX = 'relaxmix:v1:';

export async function loadPersistedMix(sign: ZodiacSignKey): Promise<MixGains | null> {
  const raw = await AsyncStorage.getItem(`${PREFIX}${sign}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MixGains;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export async function savePersistedMix(sign: ZodiacSignKey, gains: MixGains): Promise<void> {
  await AsyncStorage.setItem(`${PREFIX}${sign}`, JSON.stringify(gains));
}
