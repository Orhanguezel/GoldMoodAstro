import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  // Auth
  authToken:    'gma.auth.token.v1',
  refreshToken: 'gma.auth.refresh.v1',
  userId:       'gma.user.id.v1',
  userRole:     'gma.user.role.v1',

  // UX
  onboarded: 'gma.onboarded.v1',
  language:  'gma.lang.v1',

  // Push
  pushToken: 'gma.pushToken.v1',
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

export const storage = {
  // --- Auth ---

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.authToken);
  },

  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.authToken, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.refreshToken);
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.refreshToken, token);
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
    await AsyncStorage.multiSet([
      [KEYS.authToken, data.token],
      [KEYS.userId, data.userId],
      [KEYS.userRole, data.role],
      ...(data.refreshToken ? [[KEYS.refreshToken, data.refreshToken] as [string, string]] : []),
    ]);
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.authToken, KEYS.refreshToken, KEYS.userId, KEYS.userRole,
    ]);
  },

  // --- UX ---

  async isOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === '1';
  },

  async markOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.onboarded, '1');
  },

  async getLanguage(): Promise<'tr' | 'en'> {
    const raw = await AsyncStorage.getItem(KEYS.language);
    return raw === 'en' ? 'en' : 'tr';
  },

  async setLanguage(lang: 'tr' | 'en'): Promise<void> {
    await AsyncStorage.setItem(KEYS.language, lang);
  },

  // --- Push ---

  async getPushToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.pushToken);
  },

  async setPushToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.pushToken, token);
  },
};
