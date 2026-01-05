import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

export type PlaceFullDetails = {
  photos: string[];
  phone?: string;
  website?: string;
  address?: string;
  rating?: number;
  openingHours?: string[];
  reviews?: { text: string; rating: number; authorName: string }[];
  description?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
};

// Cache for place details to avoid repeated API calls
const detailsCache = new Map<string, { data: PlaceFullDetails; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hour cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');
  const location = searchParams.get('location');
  const searchCacheKey = (!searchParams.get('placeId') && businessName && location)
    ? `search:${businessName}:${location}`
    : null;
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }
  
  // If no placeId but have name+location, search for the place first
  if (!placeId && businessName && location) {
    const cacheKey = `search:${businessName}:${location}`;
    const cached = detailsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cached.data, cached: true });
    }
    
    try {
      const searchQuery = `${businessName} ${location}`;
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,geometry&key=${apiKey}`;
      
      const findResponse = await fetch(findPlaceUrl);
      const findData = await findResponse.json();
      
      if (findData.status === 'OK' && findData.candidates?.length > 0) {
        placeId = findData.candidates[0].place_id;
      } else {
        return NextResponse.json({ 
          error: 'Place not found',
          status: findData.status,
          photos: []
        }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to search for place',
        photos: []
      }, { status: 500 });
    }
  }
  
  if (!placeId) {
    return NextResponse.json({ error: 'placeId or name+location parameters required', photos: [] }, { status: 400 });
  }
  
  // Check cache first
  const cached = detailsCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cached.data, cached: true });
  }
  
  try {
    // Fetch place details with all relevant fields including geometry for coordinates
    const fields = [
      'photos',
      'formatted_phone_number',
      'website',
      'formatted_address',
      'rating',
      'opening_hours',
      'reviews',
      'editorial_summary',
      'geometry'
    ].join(',');
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json({ 
        error: 'Failed to get place details',
        status: data.status 
      }, { status: 500 });
    }
    
    const place = data.result;
    
    const photos = (place?.photos || [])
      .slice(0, 10)
      .map((photo: { photo_reference: string }) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
      );
    
    // Extract reviews (up to 3)
    const reviews = (place?.reviews || [])
      .slice(0, 3)
      .map((review: { text: string; rating: number; author_name: string }) => ({
        text: review.text,
        rating: review.rating,
        authorName: review.author_name
      }));
    
    // Extract coordinates from geometry
    const coordinates = place?.geometry?.location ? {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    } : undefined;
    
    const result: PlaceFullDetails = {
      photos,
      phone: place?.formatted_phone_number,
      website: place?.website,
      address: place?.formatted_address,
      rating: place?.rating,
      openingHours: place?.opening_hours?.weekday_text,
      reviews,
      description: place?.editorial_summary?.overview,
      placeId: placeId || undefined,
      coordinates
    };
    
    // Cache the results under both placeId (when available) and search key
    // so subsequent name+location queries hit cache even after resolving placeId.
    if (placeId) {
      detailsCache.set(placeId, { data: result, timestamp: Date.now() });
    }
    if (searchCacheKey) {
      detailsCache.set(searchCacheKey, { data: result, timestamp: Date.now() });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    logError('Places Details API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch place details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
