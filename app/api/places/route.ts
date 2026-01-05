import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

// Rate limiting: Track requests per minute
const requestLog: { timestamp: number }[] = [];
const MAX_REQUESTS_PER_MINUTE = 10; // Conservative limit to avoid charges

function isRateLimited(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old entries
  while (requestLog.length > 0 && requestLog[0].timestamp < oneMinuteAgo) {
    requestLog.shift();
  }
  
  return requestLog.length >= MAX_REQUESTS_PER_MINUTE;
}

function logRequest(): void {
  requestLog.push({ timestamp: Date.now() });
}

export type PlaceDetails = {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string[];
  instagram?: string;
  facebook?: string;
  placeId?: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const location = searchParams.get('location'); // e.g., "George, South Africa"
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  // Check rate limit
  if (isRateLimited()) {
    return NextResponse.json({ 
      error: 'Rate limit exceeded. Please try again in a minute.',
      rateLimited: true 
    }, { status: 429 });
  }
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }
  
  try {
    logRequest();
    
    // Step 1: Find Place from Text
    const searchQuery = location ? `${query} ${location}` : query;
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`;
    
    const findResponse = await fetch(findPlaceUrl);
    const findData = await findResponse.json();
    
    if (findData.status !== 'OK' || !findData.candidates?.length) {
      return NextResponse.json({ 
        error: 'Place not found',
        status: findData.status 
      }, { status: 404 });
    }
    
    const placeId = findData.candidates[0].place_id;
    
    // Step 2: Get Place Details
    logRequest();
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_phone_number,formatted_address,rating,user_ratings_total,opening_hours,url&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    if (detailsData.status !== 'OK') {
      return NextResponse.json({ 
        error: 'Failed to get place details',
        status: detailsData.status 
      }, { status: 500 });
    }
    
    const place = detailsData.result;
    
    // Extract Instagram from website if present
    let instagram: string | undefined;
    let facebook: string | undefined;
    
    if (place.website) {
      // Check if website contains Instagram link
      const instaMatch = place.website.match(/instagram\.com\/([^\/\?]+)/i);
      if (instaMatch) {
        instagram = instaMatch[1];
      }
      
      // Check for Facebook
      const fbMatch = place.website.match(/facebook\.com\/([^\/\?]+)/i);
      if (fbMatch) {
        facebook = fbMatch[1];
      }
    }
    
    const result: PlaceDetails = {
      name: place.name,
      website: place.website,
      phone: place.formatted_phone_number,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      openingHours: place.opening_hours?.weekday_text,
      instagram,
      facebook,
      placeId,
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    logError('Places API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch place details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Batch endpoint to get multiple places
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { businesses, location } = body as { businesses: string[]; location: string };
  
  if (!businesses || !Array.isArray(businesses)) {
    return NextResponse.json({ error: 'businesses array is required' }, { status: 400 });
  }
  
  // Check rate limit - need 2 requests per business
  const requiredRequests = businesses.length * 2;
  if (requestLog.length + requiredRequests > MAX_REQUESTS_PER_MINUTE) {
    return NextResponse.json({ 
      error: `Rate limit would be exceeded. Can process ${Math.floor((MAX_REQUESTS_PER_MINUTE - requestLog.length) / 2)} businesses now.`,
      rateLimited: true,
      canProcess: Math.floor((MAX_REQUESTS_PER_MINUTE - requestLog.length) / 2)
    }, { status: 429 });
  }
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
  }
  
  const results: Record<string, PlaceDetails | { error: string }> = {};
  
  for (const businessName of businesses) {
    try {
      logRequest();
      
      const searchQuery = location ? `${businessName} ${location}` : businessName;
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${apiKey}`;
      
      const findResponse = await fetch(findPlaceUrl);
      const findData = await findResponse.json();
      
      if (findData.status !== 'OK' || !findData.candidates?.length) {
        results[businessName] = { error: 'Place not found' };
        continue;
      }
      
      const placeId = findData.candidates[0].place_id;
      
      logRequest();
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_phone_number,formatted_address,rating,user_ratings_total,opening_hours&key=${apiKey}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status !== 'OK') {
        results[businessName] = { error: 'Failed to get details' };
        continue;
      }
      
      const place = detailsData.result;
      
      let instagram: string | undefined;
      if (place.website) {
        const instaMatch = place.website.match(/instagram\.com\/([^\/\?]+)/i);
        if (instaMatch) {
          instagram = instaMatch[1];
        }
      }
      
      results[businessName] = {
        name: place.name,
        website: place.website,
        phone: place.formatted_phone_number,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        openingHours: place.opening_hours?.weekday_text,
        instagram,
        placeId,
      };
      
      // Small delay between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results[businessName] = { error: 'Request failed' };
    }
  }
  
  return NextResponse.json({ results });
}
