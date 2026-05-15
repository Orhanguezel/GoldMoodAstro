import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'gma.favorites.v1';

async function readFavoriteIds(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (err) {
    console.error('Failed to load favorites:', err);
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const refresh = useCallback(async (): Promise<string[]> => {
    const ids = await readFavoriteIds();
    setFavorites(ids);
    return ids;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFavorite = async (id: string) => {
    try {
      let next: string[];
      if (favorites.includes(id)) {
        next = favorites.filter(fid => fid !== id);
      } else {
        next = [...favorites, id];
      }
      setFavorites(next);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite, refresh };
}
