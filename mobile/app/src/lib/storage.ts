import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createSecretStore } from './core/secretStore';
import { createSerialQueue } from './core/serialQueue';

const KEYS = {
  // Auth
  authToken:    'gma.auth.token.v1',
  refreshToken: 'gma.auth.refresh.v1',
  userId:       'gma.user.id.v1',
  userRole:     'gma.user.role.v1',

  // UX
  onboarded: 'gma.onboarded.v1',
  language:  'gma.lang.v1',

  // Data
  tempBirthData: 'gma.temp.birth.v1',
  pushToken: 'gma.push.token.v1',

  /** design_tokens → AppTheme önbelleği */
  themeCache: 'gma.theme.app.v1',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sessiz geç */
  }
}

const secrets = createSecretStore({
  available: SecureStore.isAvailableAsync,
  get: SecureStore.getItemAsync,
  set: SecureStore.setItemAsync,
  remove: SecureStore.deleteItemAsync,
}, {
  get: (key) => AsyncStorage.getItem(key),
  remove: (key) => AsyncStorage.removeItem(key),
}, Platform.OS === 'web');
const secureGetItem = secrets.get;
const secureSetItem = secrets.set;
const secureDeleteItem = secrets.remove;
const sessionWrite = createSerialQueue();

export const storage = {
  // --- Auth ---

  async getAuthToken(): Promise<string | null> {
    return secureGetItem(KEYS.authToken);
  },

  async setAuthToken(token: string): Promise<void> {
    await sessionWrite(() => secureSetItem(KEYS.authToken, token));
  },

  async getRefreshToken(): Promise<string | null> {
    return secureGetItem(KEYS.refreshToken);
  },

  async setRefreshToken(token: string): Promise<void> {
    await sessionWrite(() => secureSetItem(KEYS.refreshToken, token));
  },

  async getUserId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.userId);
  },

  async getUserRole(): Promise<'user' | 'consultant' | 'admin' | null> {
    const raw = await AsyncStorage.getItem(KEYS.userRole);
    if (raw === 'user' || raw === 'consultant' || raw === 'admin') return raw;
    return null;
  },

  async setUserSession(data: { token: string; refreshToken?: string; userId: string; role: string }): Promise<void> {
    await sessionWrite(async () => {
      // Remove the previous refresh token even when the new login returns none.
      await secureDeleteItem(KEYS.refreshToken);
      await secureDeleteItem(KEYS.authToken);
      try {
        if (data.refreshToken) await secureSetItem(KEYS.refreshToken, data.refreshToken);
        await secureSetItem(KEYS.authToken, data.token);
        await AsyncStorage.multiSet([[KEYS.userId, data.userId], [KEYS.userRole, data.role]]);
      } catch (error) {
        await Promise.allSettled([
          secureDeleteItem(KEYS.authToken), secureDeleteItem(KEYS.refreshToken),
          AsyncStorage.multiRemove([KEYS.userId, KEYS.userRole]),
        ]);
        throw error;
      }
    });
  },

  /** Serialize rotation with login/logout; an old account cannot overwrite a new one. */
  async rotateSession(expectedToken: string, accessToken: string, refreshToken?: string): Promise<boolean> {
    return sessionWrite(async () => {
      if (await secureGetItem(KEYS.authToken) !== expectedToken) return false;
      if (refreshToken) await secureSetItem(KEYS.refreshToken, refreshToken);
      await secureSetItem(KEYS.authToken, accessToken);
      return true;
    });
  },

  async clearSession(): Promise<void> {
    await sessionWrite(async () => {
      const results = await Promise.allSettled([
        secureDeleteItem(KEYS.authToken), secureDeleteItem(KEYS.refreshToken),
        AsyncStorage.multiRemove([KEYS.userId, KEYS.userRole]),
      ]);
      const failed = results.find((result) => result.status === 'rejected');
      if (failed?.status === 'rejected') throw failed.reason;
    });
  },

  // --- UX ---

  async isOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === '1';
  },

  async markOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.onboarded, '1');
  },

  async getLanguage(): Promise<'tr' | 'en' | 'de'> {
    const raw = await AsyncStorage.getItem(KEYS.language);
    if (raw === 'de') return 'de';
    return raw === 'en' ? 'en' : 'tr';
  },

  async setLanguage(lang: 'tr' | 'en' | 'de'): Promise<void> {
    await AsyncStorage.setItem(KEYS.language, lang);
  },

  // --- Push ---

  async getPushToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.pushToken);
  },

  async setPushToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.pushToken, token);
  },

  async clearPushToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.pushToken);
  },

  // --- Data ---

  async getTempBirthData(): Promise<any> {
    return readJson(KEYS.tempBirthData);
  },

  async setTempBirthData(data: any): Promise<void> {
    await writeJson(KEYS.tempBirthData, data);
  },

  async clearTempBirthData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.tempBirthData);
  },

  async getThemeCache(): Promise<unknown | null> {
    return readJson(KEYS.themeCache);
  },

  async setThemeCache(payload: unknown): Promise<void> {
    await writeJson(KEYS.themeCache, payload);
  },
};
