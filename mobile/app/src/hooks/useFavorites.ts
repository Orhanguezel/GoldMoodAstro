import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesApi } from '@/lib/api';

import { logger } from '@/lib/logger';
const FAVORITES_KEY = 'gma.favorites.v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const legacyIds = stored ? (JSON.parse(stored) as unknown) : null;
      const localIds = Array.isArray(legacyIds)
        ? legacyIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : [];

      try {
        if (localIds.length > 0) {
          await Promise.all(localIds.map((id) => favoritesApi.add(id).catch(() => null)));
          await AsyncStorage.removeItem(FAVORITES_KEY);
        }

        const remoteIds = await favoritesApi.ids();
        setFavorites(remoteIds);
        return remoteIds;
      } catch {
        setFavorites(localIds);
        return localIds;
      }
    } catch (err) {
      logger.error('Failed to load favorites:', err);
      return [];
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const wasFavorite = favorites.includes(id);
      const next = wasFavorite ? favorites.filter(fid => fid !== id) : [...favorites, id];
      setFavorites(next);

      try {
        if (wasFavorite) {
          await favoritesApi.remove(id);
        } else {
          await favoritesApi.add(id);
        }
        await AsyncStorage.removeItem(FAVORITES_KEY);
      } catch {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      }
    } catch (err) {
      logger.error('Failed to toggle favorite:', err);
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite, refresh: loadFavorites };
}
