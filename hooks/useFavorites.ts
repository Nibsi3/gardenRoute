"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logError } from '@/lib/logger';

// Favorite ID format: "townId:businessName"
export type FavoriteId = string;

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteId[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (typeof window === 'undefined') return;

      let localFavorites: FavoriteId[] = [];
      const stored = localStorage.getItem('gardenroute_favorites');
      if (stored) {
        try {
          localFavorites = JSON.parse(stored);
        } catch {
          localFavorites = [];
        }
      }

      if (session?.user) {
        try {
          // Fetch from Supabase
          const response = await fetch('/api/user/favorites');
          if (response.ok) {
            const { favorites: dbFavorites } = await response.json();
            const dbIds = dbFavorites.map((f: any) => `${f.town_id}:${f.business_name}`);
            
            // Merge local and db favorites
            const merged = Array.from(new Set([...localFavorites, ...dbIds]));
            setFavorites(merged);
            
            // If we have local favorites, sync them to DB
            if (localFavorites.length > 0) {
              await fetch('/api/user/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'sync', 
                  favorites: merged.map(id => {
                    const [townId, ...nameParts] = id.split(':');
                    return { townId, businessName: nameParts.join(':') };
                  })
                }),
              });
              // Clear local after sync
              localStorage.removeItem('gardenroute_favorites');
            }
          }
        } catch (error) {
          logError('Failed to sync favorites with database:', error);
          setFavorites(localFavorites);
        }
      } else {
        setFavorites(localFavorites);
      }
      setIsLoaded(true);
    };

    loadFavorites();
  }, [session]);

  const toggleFavorite = useCallback(async (townId: string, businessName: string) => {
    const favoriteId = `${townId}:${businessName}`;
    
    setFavorites(prev => {
      const isRemoving = prev.includes(favoriteId);
      const newFavorites = isRemoving
        ? prev.filter((id) => id !== favoriteId)
        : [...prev, favoriteId];

      if (typeof window !== 'undefined') {
        if (session?.user) {
          // Update Supabase
          fetch('/api/user/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              townId, 
              businessName, 
              action: isRemoving ? 'remove' : 'add' 
            }),
          }).catch(err => logError('Failed to update favorite in DB:', err));
        } else {
          // Update local storage
          localStorage.setItem('gardenroute_favorites', JSON.stringify(newFavorites));
        }
      }
      
      return newFavorites;
    });
  }, [session]);

  const isFavorite = useCallback((townId: string, businessName: string) => {
    return favorites.includes(`${townId}:${businessName}`);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gardenroute_favorites');
    }
  }, []);

  // Parse favorite ID back to town and business name
  const parseFavoriteId = useCallback((favoriteId: FavoriteId) => {
    const [townId, ...nameParts] = favoriteId.split(':');
    return {
      townId,
      businessName: nameParts.join(':') // Handle business names that might contain colons
    };
  }, []);

  return { 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    clearFavorites, 
    parseFavoriteId,
    isLoaded 
  };
}
