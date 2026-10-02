export interface SecretStoreAdapter {
  available(): Promise<boolean>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
export interface LegacyStoreAdapter {
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

/** Native fails closed; web stores secrets in memory only (reload requires login). */
export function createSecretStore(secure: SecretStoreAdapter, legacy: LegacyStoreAdapter, web = false) {
  const memory = new Map<string, string>();
  const requireSecure = async () => {
    if (!await secure.available()) throw new Error('Secure credential storage unavailable');
  };
  return {
    async get(key: string): Promise<string | null> {
      if (web) { await legacy.remove(key); return memory.get(key) ?? null; }
      await requireSecure();
      const current = await secure.get(key);
      if (current !== null) { await legacy.remove(key); return current; }
      const old = await legacy.get(key);
      if (old !== null) {
        await secure.set(key, old);
        await legacy.remove(key);
      }
      return old;
    },
    async set(key: string, value: string): Promise<void> {
      if (web) memory.set(key, value);
      else { await requireSecure(); await secure.set(key, value); }
      await legacy.remove(key);
    },
    async remove(key: string): Promise<void> {
      memory.delete(key);
      try { if (!web) { await requireSecure(); await secure.remove(key); } }
      finally { await legacy.remove(key); }
    },
  };
}
