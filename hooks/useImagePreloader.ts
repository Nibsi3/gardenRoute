"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { BusinessPoint, getPhotoUrl } from '@/lib/businessData';
import { getFallbackImageUrl } from '@/lib/unsplashFallback';
import { logError, logWarn } from '@/lib/logger';

interface ImageCache {
  [key: string]: {
    photos: string[];
    timestamp: number;
  };
}

// Global image cache shared across components (memory)
let imageCache: ImageCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for persistent cache
const STORAGE_KEY = 'gardenRouteImageCache';

// Initialize cache from localStorage on load
const initializeCache = () => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out expired entries
        const now = Date.now();
        Object.keys(parsed).forEach(key => {
          if (now - parsed[key].timestamp < CACHE_DURATION) {
            imageCache[key] = parsed[key];
          }
        });
      }
    } catch (e) {
      logWarn('Failed to load image cache from localStorage');
    }
  }
};

// Save cache to localStorage
const persistCache = () => {
  if (typeof window !== 'undefined') {
    try {
      // Only persist entries with photos (not empty results)
      const toStore: ImageCache = {};
      Object.keys(imageCache).forEach(key => {
        if (imageCache[key].photos.length > 0) {
          toStore[key] = imageCache[key];
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      logWarn('Failed to persist image cache to localStorage');
    }
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeCache();
}

// Preload a single image
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
};

// Fetch photos for a business from Google Places API
export const fetchBusinessPhotos = async (
  businessName: string,
  townId: string
): Promise<string[]> => {
  const cacheKey = `${townId}:${businessName}`;
  
  // Check cache first
  const cached = imageCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.photos;
  }
  
  try {
    const townName = townId.charAt(0).toUpperCase() + townId.slice(1);
    const locationQuery = townName === 'Mossel' ? 'Mossel Bay' : 
                         townName === 'Plett' ? 'Plettenberg Bay' : 
                         townName + ', South Africa';
    
    const apiUrl = `/api/places/photos?name=${encodeURIComponent(businessName)}&location=${encodeURIComponent(locationQuery)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return [];
    
    const data = await response.json();
    const photos = data.photos || [];
    
    // Cache the result
    imageCache[cacheKey] = {
      photos,
      timestamp: Date.now()
    };
    
    // Persist to localStorage for future visits
    persistCache();
    
    return photos;
  } catch (error) {
    logError(`Failed to fetch photos for ${businessName}:`, error);
    return [];
  }
};

// Hook to preload images for a list of businesses
export const useImagePreloader = (
  businesses: BusinessPoint[],
  townId: string,
  enabled: boolean = true
) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const preloadBusinessImages = useCallback(async () => {
    if (!enabled || businesses.length === 0 || loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    
    const newLoadedImages: Record<string, string[]> = {};
    
    // Process businesses in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (business) => {
          const cacheKey = `${townId}:${business.name}`;
          
          // Check if already in local state
          if (loadedImages[cacheKey]) {
            newLoadedImages[cacheKey] = loadedImages[cacheKey];
            return;
          }
          
          // Use static photos if available
          if (business.photos && business.photos.length > 0) {
            newLoadedImages[cacheKey] = business.photos;
            // Preload the first image
            try {
              await preloadImage(getPhotoUrl(business.photos[0], 400));
            } catch {}
            return;
          }
          
          // Fetch from API
          const photos = await fetchBusinessPhotos(business.name, townId);
          if (photos.length > 0) {
            newLoadedImages[cacheKey] = photos;
            // Preload the first image
            try {
              await preloadImage(getPhotoUrl(photos[0], 400));
            } catch {}
          }
        })
      );
    }
    
    setLoadedImages(prev => ({ ...prev, ...newLoadedImages }));
    setIsLoading(false);
    loadingRef.current = false;
  }, [businesses, townId, enabled, loadedImages]);

  useEffect(() => {
    preloadBusinessImages();
  }, [preloadBusinessImages]);

  // Get photo URL for a specific business
  const getBusinessPhoto = useCallback((businessName: string): string | null => {
    const cacheKey = `${townId}:${businessName}`;
    const photos = loadedImages[cacheKey];
    if (photos && photos.length > 0) {
      return getPhotoUrl(photos[0], 400);
    }
    return null;
  }, [loadedImages, townId]);

  return {
    loadedImages,
    isLoading,
    getBusinessPhoto,
    preloadBusinessImages
  };
};

// Hook to fetch and cache a single business's photos with Unsplash fallback
export const useBusinessPhotos = (
  businessName: string | null,
  townId: string | null,
  category?: string,
  subcategory?: string
) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);

  useEffect(() => {
    if (!businessName || !townId) {
      setPhotos([]);
      setIsPlaceholder(false);
      return;
    }

    const cacheKey = `${townId}:${businessName}`;
    
    // Check cache first
    const cached = imageCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.photos.length > 0) {
        setPhotos(cached.photos);
        setIsPlaceholder(false);
      } else {
        // Use Unsplash fallback
        const fallback = getFallbackImageUrl(businessName, category, subcategory);
        setPhotos([fallback.url]);
        setIsPlaceholder(true);
      }
      return;
    }

    setIsLoading(true);
    
    fetchBusinessPhotos(businessName, townId)
      .then(fetchedPhotos => {
        if (fetchedPhotos.length > 0) {
          setPhotos(fetchedPhotos);
          setIsPlaceholder(false);
        } else {
          // Use Unsplash fallback when no photos found
          const fallback = getFallbackImageUrl(businessName, category, subcategory);
          setPhotos([fallback.url]);
          setIsPlaceholder(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [businessName, townId, category, subcategory]);

  return { photos, isLoading, isPlaceholder };
};

// Get cached photo for a business (for use in non-React contexts like popups)
export const getCachedBusinessPhoto = (businessName: string, townId: string): string | null => {
  const cacheKey = `${townId}:${businessName}`;
  const cached = imageCache[cacheKey];
  if (cached && cached.photos.length > 0 && Date.now() - cached.timestamp < CACHE_DURATION) {
    return getPhotoUrl(cached.photos[0], 300);
  }
  return null;
};

// Utility to preload town images on initial load
export const preloadTownImages = async (townId: string, businesses: BusinessPoint[]) => {
  // Preload first 10 businesses for the town
  const toPreload = businesses.slice(0, 10);
  
  for (const business of toPreload) {
    if (business.photos && business.photos.length > 0) {
      try {
        await preloadImage(getPhotoUrl(business.photos[0], 400));
      } catch {}
    }
  }
};

export default useImagePreloader;
