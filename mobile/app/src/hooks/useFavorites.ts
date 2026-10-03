import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

const favoritesKey = (userId: string) => `gma.favorites.v2.${userId}`;

export function useFavorites() {
  const { user, authHydrating } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<{ userId: string; ids: string[] } | null>(null);
  const favorites = userId && result?.userId === userId ? result.ids : [];

  const loadFavorites = useCallback(async () => {
    if (!userId || authHydrating) return [];
    const key = favoritesKey(userId);
    try {
      const stored = await AsyncStorage.getItem(key);
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      const localIds = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : null;
      const remoteIds = await favoritesApi.ids();
      if (localIds) {
        await Promise.all([
          ...localIds.filter((id) => !remoteIds.includes(id)).map((id) => favoritesApi.add(id)),
          ...remoteIds.filter((id) => !localIds.includes(id)).map((id) => favoritesApi.remove(id)),
        ]);
        await AsyncStorage.removeItem(key);
      }
      const ids = localIds ?? remoteIds;
      setResult({ userId, ids });
      return ids;
    } catch (error) {
      logger.warn('Favorites unavailable; showing saved items:', error);
      try {
        const stored = await AsyncStorage.getItem(key);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const localIds = Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
          : [];
        setResult({ userId, ids: localIds });
        return localIds;
      } catch (storageError) {
        logger.error('Failed to load favorites:', storageError);
        setResult({ userId, ids: [] });
        return [];
      }
    }
  }, [userId, authHydrating]);

  useEffect(() => {
    void Promise.resolve().then(loadFavorites);
  }, [loadFavorites]);

  const toggleFavorite = async (id: string) => {
    if (!userId || authHydrating) return;
    const wasFavorite = favorites.includes(id);
    const next = wasFavorite ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];
    setResult({ userId, ids: next });
    try {
      await AsyncStorage.setItem(favoritesKey(userId), JSON.stringify(next));
      if (wasFavorite) await favoritesApi.remove(id);
      else await favoritesApi.add(id);
      await loadFavorites();
    } catch (error) {
      logger.warn('Favorites sync unavailable; saving items on device:', error);
      try {
        const saved = await AsyncStorage.getItem(favoritesKey(userId));
        if (saved === null) {
          logger.error('Failed to save favorites on device:', error);
          setResult({ userId, ids: favorites });
        }
      } catch (storageError) {
        logger.error('Failed to read saved favorites:', storageError);
        setResult({ userId, ids: favorites });
      }
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite, refresh: loadFavorites };
}
