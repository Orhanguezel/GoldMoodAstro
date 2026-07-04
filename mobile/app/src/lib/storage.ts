import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function secureGetItem(key: string): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue != null) return secureValue;
    }

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue != null && await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, legacyValue);
      await AsyncStorage.removeItem(key);
    }
    return legacyValue;
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function secureDeleteItem(key: string): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    }
  } finally {
    await AsyncStorage.removeItem(key);
  }
}

export const storage = {
  // --- Auth ---

  async getAuthToken(): Promise<string | null> {
    return secureGetItem(KEYS.authToken);
  },

  async setAuthToken(token: string): Promise<void> {
    await secureSetItem(KEYS.authToken, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureGetItem(KEYS.refreshToken);
  },

  async setRefreshToken(token: string): Promise<void> {
    await secureSetItem(KEYS.refreshToken, token);
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
    await secureSetItem(KEYS.authToken, data.token);
    if (data.refreshToken) await secureSetItem(KEYS.refreshToken, data.refreshToken);
    await AsyncStorage.multiSet([
      [KEYS.userId, data.userId],
      [KEYS.userRole, data.role],
    ]);
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      secureDeleteItem(KEYS.authToken),
      secureDeleteItem(KEYS.refreshToken),
      AsyncStorage.multiRemove([KEYS.userId, KEYS.userRole]),
    ]);
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
