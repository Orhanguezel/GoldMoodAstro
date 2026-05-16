import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'gma.favorites.v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

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

  return { favorites, toggleFavorite, isFavorite, refresh: loadFavorites };
}
